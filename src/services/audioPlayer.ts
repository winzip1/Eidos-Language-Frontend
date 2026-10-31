/**
 * Eidos Language OS - Millisecond Audio & Streaming Engine
 * High-precision HTML5 Audio wrapper for byte-range streaming & karaoke sync.
 */
import { getApiBaseUrl, getStoredAuthToken } from './apiClient';
import { audioCacheService } from './audioCacheService';

export type TimeUpdateListener = (currentMs: number, durationMs: number) => void;
export type StateChangeListener = (isPlaying: boolean, isBuffering: boolean) => void;
export type VolumeChangeListener = (volume: number, isMuted: boolean) => void;
export type EndListener = () => void;
export interface AudioPlaybackError extends Error {
  statusCode?: number;
  streamUrl?: string;
}

export type ErrorListener = (error: AudioPlaybackError) => void;

export interface AudioLoopRange {
  startMs: number;
  endMs: number;
  itemId?: string;
}

export type LoopChangeListener = (activeLoop: AudioLoopRange | null) => void;

class AudioPlayerService {
  private audio: HTMLAudioElement | null = null;
  private currentUnitNumber: number | null = null;
  private timeListeners: Set<TimeUpdateListener> = new Set();
  private stateListeners: Set<StateChangeListener> = new Set();
  private volumeListeners: Set<VolumeChangeListener> = new Set();
  private endListeners: Set<EndListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private loopListeners: Set<LoopChangeListener> = new Set();
  private isBuffering: boolean = false;
  private isPlaying: boolean = false;
  private currentBlobUrl: string | null = null;
  private currentCourseId: string | null = null;
  private animationFrameId: number | null = null;
  private snippetTimerId: ReturnType<typeof setTimeout> | null = null;
  private activeLoop: AudioLoopRange | null = null;
  private activeSnippet: AudioLoopRange | null = null;

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

        // High precision loop check
        if (this.activeLoop) {
          if (curMs >= this.activeLoop.endMs) {
            this.audio.currentTime = this.activeLoop.startMs / 1000;
          }
        } else if (this.activeSnippet) {
          if (curMs >= this.activeSnippet.endMs) {
            this.pause();
            this.activeSnippet = null;
          }
        }

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

  public getActiveLoop(): AudioLoopRange | null {
    return this.activeLoop;
  }

  public isLooping(): boolean {
    return this.activeLoop !== null;
  }

  public isLoopingItem(itemId: string): boolean {
    return this.activeLoop?.itemId === itemId;
  }

  public onLoopChange(fn: LoopChangeListener): () => void {
    this.loopListeners.add(fn);
    return () => this.loopListeners.delete(fn);
  }

  private notifyLoop(): void {
    this.loopListeners.forEach((fn) => fn(this.activeLoop));
  }

  public async setLoop(
    startMs: number,
    endMs: number,
    itemId?: string,
    unitNumber?: number,
    languageId: string = 'german',
    levelId: string = 'level1'
  ): Promise<void> {
    this.activeSnippet = null;
    this.activeLoop = { startMs, endMs, itemId };
    this.notifyLoop();

    if (typeof unitNumber === 'number' && this.currentUnitNumber !== unitNumber) {
      await this.loadUnit(unitNumber, startMs, true, languageId, levelId);
      return;
    }

    this.seek(startMs);
    await this.play();
  }

  public stopLoop(): void {
    if (this.activeLoop !== null) {
      this.activeLoop = null;
      this.notifyLoop();
    }
  }

  public async playSnippet(
    unitNumber: number,
    startMs: number,
    endMs: number,
    itemId?: string,
    languageId: string = 'german',
    levelId: string = 'level1'
  ): Promise<void> {
    this.stopLoop();

    if (this.snippetTimerId) {
      clearTimeout(this.snippetTimerId);
      this.snippetTimerId = null;
    }

    this.activeSnippet = { startMs, endMs, itemId };

    if (this.currentUnitNumber !== unitNumber) {
      await this.loadUnit(unitNumber, startMs, true, languageId, levelId);
      return;
    }

    this.seek(startMs);
    await this.play();
  }

  public stopSnippet(): void {
    if (this.activeSnippet !== null) {
      this.activeSnippet = null;
      this.pause();
    }
  }

  public async loadUnit(
    unitNumber: number,
    startPositionMs: number = 0,
    autoPlay: boolean = false,
    languageId: string = 'german',
    levelId: string = 'level1',
    explicitCourseId?: string,
    autoCacheOnPlay: boolean = true
  ): Promise<void> {
    if (!this.audio) this.initAudio();
    if (!this.audio) return;

    this.stopLoop();
    this.activeSnippet = null;

    if (this.snippetTimerId) {
      clearTimeout(this.snippetTimerId);
      this.snippetTimerId = null;
    }

    this.currentUnitNumber = unitNumber;
    const courseId = explicitCourseId || `eidos-${languageId}-${levelId}`;
    this.currentCourseId = courseId;
    const token = getStoredAuthToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    const streamUrl = `${getApiBaseUrl()}/api/v1/audio/${languageId}/${levelId}/${unitNumber}${tokenParam}`;

    // Cache-first inspection
    let targetUrl = streamUrl;
    let isFromCache = false;
    try {
      const cachedUrl = await audioCacheService.getCachedAudioUrl(courseId, unitNumber);
      if (cachedUrl) {
        targetUrl = cachedUrl;
        isFromCache = true;
      }
    } catch {
      targetUrl = streamUrl;
    }

    if (this.audio.src !== targetUrl) {
      // Release previous blob URL to avoid memory leak
      if (this.currentBlobUrl && this.currentBlobUrl !== targetUrl) {
        URL.revokeObjectURL(this.currentBlobUrl);
        this.currentBlobUrl = null;
      }

      if (isFromCache) {
        this.currentBlobUrl = targetUrl;
      }

      this.audio.src = targetUrl;
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

    // Auto-cache in background if not already cached and stream URL is valid
    if (!isFromCache && autoCacheOnPlay && streamUrl.startsWith('http')) {
      audioCacheService.cacheUnitAudio(courseId, unitNumber, streamUrl).catch((err) => {
        console.warn(`[AUDIO_CACHE_AUTO_FETCH] Background caching notice for ${courseId} u${unitNumber}:`, err?.message || err);
      });
    }
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

    // If seeking outside active loop, stop loop to avoid unexpected snapping back
    if (this.activeLoop) {
      if (curMs < this.activeLoop.startMs - 500 || curMs > this.activeLoop.endMs + 500) {
        this.stopLoop();
      }
    }
    if (this.activeSnippet) {
      if (curMs < this.activeSnippet.startMs - 500 || curMs > this.activeSnippet.endMs + 500) {
        this.activeSnippet = null;
      }
    }

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

  public getIsPlaying(): boolean {
    return this.isPlaying;
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
    this.stopLoop();
    this.activeSnippet = null;
    this.loopListeners.clear();
    if (this.snippetTimerId) {
      clearTimeout(this.snippetTimerId);
      this.snippetTimerId = null;
    }
    if (this.currentBlobUrl) {
      URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
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
