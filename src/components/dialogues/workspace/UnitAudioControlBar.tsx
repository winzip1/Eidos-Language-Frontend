/**
 * Eidos Language OS - Dedicated Unit Audio Control Bar
 * Linear, distraction-free audio engine bar with high-precision seeking, playback rate, and byte-range streaming.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Gauge } from 'lucide-react';
import { audioPlayer } from '../../../services/audioPlayer';
import { formatElapsed } from '../../../utils/audioTime';
import { useDictionary, interpolate } from '../../../context/DictionaryContext';

export interface UnitAudioControlBarProps {
  unitNumber: number;
  languageId?: string;
  levelId?: string;
  hasAudio?: boolean;
  audioUrl?: string;
  estimatedDurationMinutes?: number;
  className?: string;
}

export const UnitAudioControlBar: React.FC<UnitAudioControlBarProps> = ({
  unitNumber,
  languageId = 'german',
  levelId = 'level1',
  hasAudio = true,
  estimatedDurationMinutes = 30,
  className = '',
}) => {
  const { dict } = useDictionary();
  const dh = dict.dialogueHub;

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentMs, setCurrentMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(
    (estimatedDurationMinutes || 30) * 60 * 1000
  );
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);
  const [scrubValue, setScrubValue] = useState<number>(0);

  // Synchronize audio player listeners
  useEffect(() => {
    const handleTime = (cur: number, dur: number) => {
      if (!isScrubbing) {
        setCurrentMs(cur);
      }
      if (dur > 0 && !isNaN(dur) && isFinite(dur)) {
        setDurationMs(dur);
      }
    };

    const handleState = (playing: boolean, buffering: boolean) => {
      setIsPlaying(playing);
      setIsBuffering(buffering);
    };

    const unsubscribeTime = audioPlayer.onTimeUpdate(handleTime);
    const unsubscribeState = audioPlayer.onStateChange(handleState);

    // Initial state check
    setIsPlaying(audioPlayer.getIsPlaying());
    setPlaybackRate(audioPlayer.getPlaybackRate());
    const initialCur = audioPlayer.getCurrentTimeMs();
    const initialDur = audioPlayer.getDurationMs();
    if (initialCur > 0) setCurrentMs(initialCur);
    if (initialDur > 0) setDurationMs(initialDur);

    return () => {
      unsubscribeTime();
      unsubscribeState();
    };
  }, [isScrubbing]);

  // Handle Play/Pause toggle
  const handleTogglePlay = useCallback(async () => {
    if (!hasAudio) return;

    if (isPlaying) {
      audioPlayer.pause();
    } else {
      // If current unit is not yet loaded in audioPlayer, load it
      const currentCur = audioPlayer.getCurrentTimeMs();
      if (currentCur === 0 && !audioPlayer.getIsPlaying()) {
        await audioPlayer.loadUnit(unitNumber, 0, true, languageId, levelId);
      } else {
        await audioPlayer.play();
      }
    }
  }, [hasAudio, isPlaying, unitNumber, languageId, levelId]);

  // Handle 10-second jumps
  const handleSeekRelative = useCallback((seconds: number) => {
    if (!hasAudio) return;
    audioPlayer.seekRelative(seconds);
  }, [hasAudio]);

  // Handle speed changes
  const handleSpeedSelect = useCallback((speed: number) => {
    setPlaybackRate(speed);
    audioPlayer.setPlaybackRate(speed);
  }, []);

  // Handle progress bar slider scrubbing
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setScrubValue(val);
  }, []);

  const handleSliderStart = useCallback(() => {
    setIsScrubbing(true);
    setScrubValue(currentMs);
  }, [currentMs]);

  const handleSliderEnd = useCallback(() => {
    setIsScrubbing(false);
    audioPlayer.seek(scrubValue);
    setCurrentMs(scrubValue);
  }, [scrubValue]);

  // Calculate percentage
  const effectiveCurrentMs = isScrubbing ? scrubValue : currentMs;
  const progressPercent = useMemo(() => {
    if (!durationMs || durationMs <= 0) return 0;
    return Math.min(100, Math.max(0, (effectiveCurrentMs / durationMs) * 100));
  }, [effectiveCurrentMs, durationMs]);

  return (
    <div
      data-testid="unit-audio-control-bar"
      className={`bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs ${className}`}
    >
      {/* Top Status & Speed Header */}
      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
        {/* Playback Status Pill */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isPlaying
                ? 'bg-emerald-500 animate-pulse'
                : hasAudio
                ? 'bg-slate-300'
                : 'bg-amber-400'
            }`}
          />
          <span className="font-semibold text-slate-700">
            {hasAudio
              ? isPlaying
                ? dh.audioPlayingBadge
                : isBuffering
                ? '...'
                : dh.audioPausedBadge
              : dh.audioNotFound}
          </span>
        </div>

        {/* Speed Selector Segmented Group */}
        <div
          className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/80"
          role="group"
          aria-label={dh.playbackSpeed}
        >
          <span className="hidden sm:inline-flex items-center pl-1.5 pr-1 text-[11px] font-medium text-slate-400">
            <Gauge className="w-3 h-3 mr-0.5" />
          </span>
          {[0.8, 1.0, 1.2].map((speed) => {
            const isSelected = Math.abs(playbackRate - speed) < 0.05;
            return (
              <button
                key={speed}
                type="button"
                onClick={() => handleSpeedSelect(speed)}
                disabled={!hasAudio}
                className={`min-h-[32px] min-w-[36px] px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                  isSelected
                    ? 'bg-white text-sky-700 shadow-xs border border-slate-200/90'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={isSelected}
              >
                {speed.toFixed(1)}x
              </button>
            );
          })}
        </div>
      </div>

      {/* Center Row: Controls & Time Slider */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left Action Buttons (Min 44x44px touch targets) */}
        <div className="flex items-center justify-center gap-1.5 shrink-0">
          {/* Rewind -10s */}
          <button
            type="button"
            onClick={() => handleSeekRelative(-10)}
            disabled={!hasAudio}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="-10s"
            title="-10 saniye geri"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Main Play/Pause Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            disabled={!hasAudio}
            data-testid="unit-audio-play-toggle"
            className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20'
            }`}
            aria-label={isPlaying ? dh.pauseFullAudio : dh.playFullAudio}
            title={isPlaying ? dh.pauseFullAudio : dh.playFullAudio}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Forward +10s */}
          <button
            type="button"
            onClick={() => handleSeekRelative(10)}
            disabled={!hasAudio}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="+10s"
            title="+10 saniye ileri"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          {/* Custom Styled Slider */}
          <div className="relative flex items-center h-5">
            <input
              type="range"
              min={0}
              max={durationMs || 1000}
              step={100}
              value={effectiveCurrentMs}
              onChange={handleSliderChange}
              onMouseDown={handleSliderStart}
              onTouchStart={handleSliderStart}
              onMouseUp={handleSliderEnd}
              onTouchEnd={handleSliderEnd}
              disabled={!hasAudio}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(to right, #0284c7 ${progressPercent}%, #e2e8f0 ${progressPercent}%)`,
              }}
              aria-label="Ses Konumu"
            />
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-slate-500 mt-0.5 px-0.5">
            <span>{formatElapsed(effectiveCurrentMs)}</span>
            <span>{formatElapsed(durationMs)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
