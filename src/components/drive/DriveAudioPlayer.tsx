/**
 * Eidos Language OS - Drive Mini Audio Player (HTTP 206 Cloud Streaming)
 * High-performance HTML5 audio player optimized for byte-range streaming from Google Drive.
 * STRICTLY LIGHT THEME & ZERO HARDCODE (Yacht-Deck Modern Aesthetic).
 * Touch-friendly (min-h-[44px], min-w-[44px]) & Fail-Loud error surfacing.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { getDriveStreamUrl } from '../../services/driveApiClient';

export interface DriveAudioPlayerProps {
  fileId: string;
  fileName: string;
  autoPlay?: boolean;
  className?: string;
  onError?: (err: Error) => void;
}

const PLAYBACK_SPEEDS = [0.75, 1.0, 1.25, 1.5] as const;

export const DriveAudioPlayer: React.FC<DriveAudioPlayerProps> = ({
  fileId,
  fileName,
  autoPlay = false,
  className = '',
  onError,
}) => {
  const { dict } = useDictionary();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isBuffering, setIsBuffering] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const streamUrl = getDriveStreamUrl(fileId);

  // Synchronize playback speed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Synchronize volume and mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      setStreamError(null);
      audio.play().catch((err) => {
        const errMsg = err?.message || dict.googleDrive.audioPlayerError;
        setStreamError(errMsg);
        if (onError) onError(err);
      });
    }
  }, [isPlaying, dict.googleDrive.audioPlayerError, onError]);

  // Seek jump
  const handleSeekDelta = (deltaSeconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const target = Math.max(0, Math.min(audio.currentTime + deltaSeconds, duration || 0));
    audio.currentTime = target;
    setCurrentTime(target);
  };

  // Slider change
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audio) {
      audio.currentTime = newTime;
    }
  };

  // Speed selection
  const handleNextSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackSpeed as any);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex]);
  };

  // Retry on error
  const handleRetryStream = () => {
    setStreamError(null);
    setIsBuffering(true);
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch((err) => {
        setStreamError(err?.message || dict.googleDrive.audioPlayerError);
      });
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`bg-white border border-sand-200/90 rounded-2xl p-4 sm:p-5 shadow-soft space-y-3 sm:space-y-4 ${className}`}
    >
      {/* Hidden HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="metadata"
        autoPlay={autoPlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration || 0);
          }
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onError={(e) => {
          setIsBuffering(false);
          setIsPlaying(false);
          const target = e.target as HTMLAudioElement;
          const code = target?.error?.code;
          const msg =
            code === 4
              ? dict.googleDrive.audioPlayerError
              : target?.error?.message || dict.googleDrive.audioPlayerError;
          setStreamError(msg);
          if (onError) onError(new Error(msg));
        }}
      />

      {/* Stream Failure Alert Banner */}
      {streamError && (
        <div className="flex items-center justify-between gap-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-medium">{streamError}</span>
          </div>
          <button
            type="button"
            onClick={handleRetryStream}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-lg shadow-2xs cursor-pointer min-h-[36px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tekrar Dene</span>
          </button>
        </div>
      )}

      {/* Seek Progress Bar */}
      <div className="space-y-1.5">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSliderChange}
            disabled={!duration || !!streamError}
            aria-label="Audio progress"
            className="w-full h-2 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-ocean-600 disabled:opacity-40"
            style={{
              background: `linear-gradient(to right, #0284c7 ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
            }}
          />
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-slate-500 font-mono">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-sans">
            {isBuffering && isPlaying && (
              <span className="inline-flex items-center gap-1 text-ocean-600">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{dict.googleDrive.audioPlayerBuffering}</span>
              </span>
            )}
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Primary Media Controls */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Left: Speed Controller */}
        <button
          type="button"
          onClick={handleNextSpeed}
          title={dict.googleDrive.audioPlayerSpeed}
          aria-label={dict.googleDrive.audioPlayerSpeed}
          className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-xl border border-sand-200 bg-sand-50/70 hover:bg-ocean-50 hover:border-ocean-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer min-h-[44px] min-w-[52px]"
        >
          {playbackSpeed}x
        </button>

        {/* Center: Play, Pause & Seek Skip Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Seek 10s Backward */}
          <button
            type="button"
            onClick={() => handleSeekDelta(-10)}
            title={dict.googleDrive.audioPlayerSeekBackward}
            aria-label={dict.googleDrive.audioPlayerSeekBackward}
            className="p-2.5 text-slate-600 hover:text-ocean-700 hover:bg-ocean-50 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Big Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={!!streamError}
            title={isPlaying ? dict.googleDrive.audioPlayerPause : dict.googleDrive.audioPlayerPlay}
            aria-label={isPlaying ? dict.googleDrive.audioPlayerPause : dict.googleDrive.audioPlayerPlay}
            className="w-12 h-12 rounded-2xl bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white flex items-center justify-center shadow-soft transition-all cursor-pointer disabled:opacity-50 min-h-[44px] min-w-[44px]"
          >
            {isBuffering && isPlaying ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          {/* Seek 10s Forward */}
          <button
            type="button"
            onClick={() => handleSeekDelta(10)}
            title={dict.googleDrive.audioPlayerSeekForward}
            aria-label={dict.googleDrive.audioPlayerSeekForward}
            className="p-2.5 text-slate-600 hover:text-ocean-700 hover:bg-ocean-50 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Volume & Mute */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? dict.googleDrive.audioPlayerUnmute : dict.googleDrive.audioPlayerMute}
            aria-label={isMuted ? dict.googleDrive.audioPlayerUnmute : dict.googleDrive.audioPlayerMute}
            className="p-2.5 text-slate-600 hover:text-ocean-700 hover:bg-ocean-50 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-500" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            aria-label={dict.googleDrive.audioPlayerVolume}
            className="hidden sm:block w-16 sm:w-20 h-1.5 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-ocean-600"
          />
        </div>
      </div>
    </div>
  );
};
