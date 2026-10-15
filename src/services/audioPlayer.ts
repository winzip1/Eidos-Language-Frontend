/**
 * Eidos Language OS - Millisecond Audio & Streaming Engine
 * High-precision HTML5 Audio wrapper for byte-range streaming & karaoke sync.
 */
import { getApiBaseUrl } from './apiClient';

export type TimeUpdateListener = (currentMs: number, durationMs: number) => void;
export type StateChangeListener = (isPlaying: boolean, isBuffering: boolean) => void;
export type VolumeChangeListener = (volume: number, isMuted: boolean) => void;
export type EndListener = () => void;
export interface AudioPlaybackError extends Error {
  statusCode?: number;
  streamUrl?: string;
}

export type ErrorListener = (error: AudioPlaybackError) => void;

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

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio) {
        const curMs = Math.floor((this.audio.currentTime || 0) * 1000);
        const durMs = Math.floor((this.audio.duration || 0) * 1000);
        this.timeListeners.forEach((fn) => fn(curMs, durMs));
      }
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio) {
        const curMs = Math.floor((this.audio.currentTime || 0) * 1000);
        const durMs = Math.floor((this.audio.duration || 0) * 1000);
        this.timeListeners.forEach((fn) => fn(curMs, durMs));
      }
    });

    this.audio.addEventListener('canplay', () => {
      if (this.audio) {
        const curMs = Math.floor((this.audio.currentTime || 0) * 1000);
        const durMs = Math.floor((this.audio.duration || 0) * 1000);
        this.timeListeners.forEach((fn) => fn(curMs, durMs));
      }
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.isBuffering = false;
      this.notifyState();
      this.stopSyncLoop();
      this.endListeners.forEach((fn) => fn());
    });

    this.audio.addEventListener('error', async () => {
      this.isPlaying = false;
      this.isBuffering = false;
      this.notifyState();
      this.stopSyncLoop();

      const streamUrl = this.audio?.src || '';
      const mediaError = this.audio?.error;
      let statusCode: number | undefined;
      let detailedMessage = mediaError?.message || 'Audio playback error occurred.';

      if (streamUrl && streamUrl.startsWith('http')) {
        try {
          let probe = await fetch(streamUrl, {
            method: 'HEAD',
            headers: { Range: 'bytes=0-1' },
          });
          if (probe.status === 405) {
            probe = await fetch(streamUrl, {
              method: 'GET',
              headers: { Range: 'bytes=0-1' },
            });
          }
          statusCode = probe.status;
          if (probe.status === 404) {
            detailedMessage = `Audio file not found on server (HTTP 404)`;
          } else if (probe.status === 416) {
            detailedMessage = `Requested audio range not satisfiable (HTTP 416)`;
          } else if (probe.status >= 500) {
            detailedMessage = `Audio server streaming error (HTTP ${probe.status})`;
          } else if (!probe.ok) {
            detailedMessage = `Audio request failed (HTTP ${probe.status})`;
          }
        } catch (probeErr: any) {
          detailedMessage = `Network connection error while streaming audio (${probeErr?.message || 'Offline'})`;
          statusCode = 0;
        }
      } else if (mediaError) {
        switch (mediaError.code) {
          case 1:
            detailedMessage = 'Audio fetching was aborted by user or network.';
            break;
          case 2:
            detailedMessage = 'Network error caused audio download to fail.';
            break;
          case 3:
            detailedMessage = 'Audio decoding error: file may be corrupted.';
            break;
          case 4:
            detailedMessage = 'Audio format not supported or file not found.';
            break;
        }
      }

      const err: AudioPlaybackError = new Error(detailedMessage);
      err.name = 'AudioPlaybackError';
      err.statusCode = statusCode;
      err.streamUrl = streamUrl;

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
      const targetSec = Math.max(0, startPositionMs / 1000);
      if (targetSec > 0) {
        const handleInitialSeek = () => {
          if (this.audio) {
            this.audio.currentTime = targetSec;
          }
        };
        this.audio.addEventListener('loadedmetadata', handleInitialSeek, { once: true });
      } else {
        this.audio.currentTime = 0;
      }
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
    return this.audio.play().catch((err: any) => {
      console.warn('[AUDIO_AUTOPLAY_BLOCKED]', err);
      if (err?.name === 'NotAllowedError') {
        const autoplayErr: AudioPlaybackError = new Error('Otomatik ses çalma tarayıcı tarafından engellendi. Lütfen oynatmak için tıklayın.');
        autoplayErr.name = 'AutoplayBlockedError';
        this.errorListeners.forEach((fn) => fn(autoplayErr));
      }
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
    const dur = this.audio.duration && !isNaN(this.audio.duration) ? this.audio.duration : 0;
    const current = this.audio.currentTime && !isNaN(this.audio.currentTime) ? this.audio.currentTime : 0;
    const desired = current + deltaSeconds;
    const target = dur > 0 ? Math.max(0, Math.min(dur, desired)) : Math.max(0, desired);
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

  public getDuration(): number {
    return this.audio?.duration || 0;
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

  public destroy(): void {
    this.stopSyncLoop();
    if (this.snippetTimerId) {
      clearTimeout(this.snippetTimerId);
      this.snippetTimerId = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
    this.timeListeners.clear();
    this.stateListeners.clear();
    this.volumeListeners.clear();
    this.endListeners.clear();
    this.errorListeners.clear();
  }
}

export const audioPlayer = new AudioPlayerService();
