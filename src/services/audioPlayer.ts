/**
 * Eidos Language OS - Millisecond Audio & Streaming Engine
 * High-precision HTML5 Audio wrapper for byte-range streaming & karaoke sync.
 */
import { getApiBaseUrl } from './apiClient';

export type TimeUpdateListener = (currentMs: number, durationMs: number) => void;
export type StateChangeListener = (isPlaying: boolean, isBuffering: boolean) => void;
export type VolumeChangeListener = (volume: number, isMuted: boolean) => void;
export type EndListener = () => void;
export type ErrorListener = (error: Error) => void;

class AudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private currentUnitNumber: number | null = null;
  private timeListeners: Set<TimeUpdateListener> = new Set();
  private stateListeners: Set<StateChangeListener> = new Set();
  private volumeListeners: Set<VolumeChangeListener> = new Set();
  private endListeners: Set<EndListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private isBuffering: boolean = false;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private snippetTimerId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.initAudio();
  }

  private initAudio() {
    if (typeof window === 'undefined') return;

    this.audio = new Audio();
    this.audio.preload = 'auto';

    // Read initial volume from localStorage if available
    const savedVol = localStorage.getItem('eidos_audio_volume');
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        this.audio.volume = parsed;
      }
    }

    const savedMuted = localStorage.getItem('eidos_audio_muted');
    if (savedMuted !== null) {
      this.audio.muted = savedMuted === 'true';
    }

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.isBuffering = false;
      this.notifyState();
      this.startSyncLoop();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notifyState();
      this.stopSyncLoop();
    });

    this.audio.addEventListener('waiting', () => {
      this.isBuffering = true;
      this.notifyState();
    });

    this.audio.addEventListener('playing', () => {
      this.isBuffering = false;
      this.notifyState();
    });

    this.audio.addEventListener('volumechange', () => {
      if (this.audio) {
        this.notifyVolume();
        try {
          localStorage.setItem('eidos_audio_volume', String(this.audio.volume));
          localStorage.setItem('eidos_audio_muted', String(this.audio.muted));
        } catch {
          // ignore storage write errors
        }
      }
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.isBuffering = false;
      this.notifyState();
      this.stopSyncLoop();
      this.endListeners.forEach((fn) => fn());
    });

    this.audio.addEventListener('error', () => {
      this.isPlaying = false;
      this.isBuffering = false;
      this.notifyState();
      this.stopSyncLoop();
      const err = new Error(this.audio?.error?.message || 'Audio playback error occurred.');
      this.errorListeners.forEach((fn) => fn(err));
    });
  }

  private startSyncLoop() {
    this.stopSyncLoop();
    const tick = () => {
      if (this.audio && !this.audio.paused) {
        const curMs = Math.floor(this.audio.currentTime * 1000);
        const durMs = Math.floor((this.audio.duration || 0) * 1000);
        this.timeListeners.forEach((fn) => fn(curMs, durMs));
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  private stopSyncLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private notifyState() {
    this.stateListeners.forEach((fn) => fn(this.isPlaying, this.isBuffering));
  }

  private notifyVolume() {
    if (this.audio) {
      this.volumeListeners.forEach((fn) => fn(this.audio!.volume, this.audio!.muted));
    }
  }

  public loadUnit(
    unitNumber: number,
    startPositionMs: number = 0,
    autoPlay: boolean = false,
    languageId: string = 'german',
    levelId: string = 'level1'
  ): void {
    if (!this.audio) this.initAudio();
    if (!this.audio) return;

    if (this.snippetTimerId) {
      clearTimeout(this.snippetTimerId);
      this.snippetTimerId = null;
    }

    this.currentUnitNumber = unitNumber;
    const streamUrl = `${getApiBaseUrl()}/api/v1/audio/${languageId}/${levelId}/${unitNumber}`;

    if (this.audio.src !== streamUrl) {
      this.audio.src = streamUrl;
      this.audio.currentTime = Math.max(0, startPositionMs / 1000);
      this.audio.load();
    } else if (startPositionMs > 0) {
      this.audio.currentTime = startPositionMs / 1000;
    }

    if (autoPlay) {
      this.play();
    }
  }

  public playSnippet(unitNumber: number, startMs: number, endMs: number): void {
    if (this.snippetTimerId) {
      clearTimeout(this.snippetTimerId);
      this.snippetTimerId = null;
    }

    const duration = Math.max(1200, (endMs - startMs) + 400);
    this.loadUnit(unitNumber, startMs, true);

    this.snippetTimerId = setTimeout(() => {
      this.pause();
      this.snippetTimerId = null;
    }, duration);
  }

  public play(): Promise<void> {
    if (!this.audio) return Promise.resolve();
    return this.audio.play().catch((err) => {
      console.warn('[AUDIO_AUTOPLAY_BLOCKED]', err);
    });
  }

  public pause(): void {
    if (!this.audio) return;
    this.audio.pause();
  }

  public toggle(): void {
    if (!this.audio) return;
    if (this.audio.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  public seek(positionMs: number): void {
    if (!this.audio) return;
    const maxDur = this.audio.duration ? this.audio.duration * 1000 : Infinity;
    const targetMs = Math.max(0, Math.min(maxDur, positionMs));
    this.audio.currentTime = targetMs / 1000;
    const curMs = Math.floor(this.audio.currentTime * 1000);
    const durMs = Math.floor((this.audio.duration || 0) * 1000);
    this.timeListeners.forEach((fn) => fn(curMs, durMs));
  }

  public seekRelative(deltaSeconds: number): void {
    if (!this.audio) return;
    const dur = this.audio.duration || 0;
    const target = Math.max(0, Math.min(dur > 0 ? dur : 10000, this.audio.currentTime + deltaSeconds));
    this.seek(target * 1000);
  }

  public setPlaybackRate(rate: number): void {
    if (!this.audio) return;
    this.audio.playbackRate = Math.max(0.5, Math.min(3.0, rate));
  }

  public getPlaybackRate(): number {
    return this.audio?.playbackRate || 1.0;
  }

  public setVolume(val: number): void {
    if (!this.audio) return;
    this.audio.volume = Math.max(0, Math.min(1.0, val));
    if (this.audio.volume > 0 && this.audio.muted) {
      this.audio.muted = false;
    }
    this.notifyVolume();
  }

  public getVolume(): number {
    return this.audio?.volume ?? 1.0;
  }

  public setMuted(val: boolean): void {
    if (!this.audio) return;
    this.audio.muted = val;
    this.notifyVolume();
  }

  public isMuted(): boolean {
    return this.audio?.muted ?? false;
  }

  public toggleMute(): void {
    if (!this.audio) return;
    this.audio.muted = !this.audio.muted;
    this.notifyVolume();
  }

  public getCurrentTimeMs(): number {
    return Math.floor((this.audio?.currentTime || 0) * 1000);
  }

  public getDurationMs(): number {
    return Math.floor((this.audio?.duration || 0) * 1000);
  }

  public getCurrentUnitNumber(): number | null {
    return this.currentUnitNumber;
  }

  public onTimeUpdate(fn: TimeUpdateListener): () => void {
    this.timeListeners.add(fn);
    return () => this.timeListeners.delete(fn);
  }

  public onStateChange(fn: StateChangeListener): () => void {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  public onVolumeChange(fn: VolumeChangeListener): () => void {
    this.volumeListeners.add(fn);
    return () => this.volumeListeners.delete(fn);
  }

  public onEnded(fn: EndListener): () => void {
    this.endListeners.add(fn);
    return () => this.endListeners.delete(fn);
  }

  public onError(fn: ErrorListener): () => void {
    this.errorListeners.add(fn);
    return () => this.errorListeners.delete(fn);
  }
}

export const audioPlayer = new AudioPlayerService();
