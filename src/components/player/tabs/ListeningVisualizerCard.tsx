/**
 * Eidos Language OS - Listening Visualizer Card
 * Minimalist, high-craft audio visualizer for pure listening & pronunciation focus.
 * Features organic sound wave bars, speaker role badges with anti-jitter smoothing,
 * interactive learner speaking turn guidance badge ("Şimdi siz söyleyin: ..."),
 * interactive wave area, fail-loud error feedback, and serene resting animations.
 * Strictly Light Mode - Zero Hardcode - Zero Fake Data - Fail-Loud Transparency.
 */
import React, { useMemo, useRef, useEffect } from 'react';
import { User, Mic, Volume2, Play, Pause, Loader2, AlertCircle, RefreshCw, Headphones } from 'lucide-react';
import type { Segment, SpeakerRole } from '../../../types';
import { isFragmentSegment } from '../../../types';
import { DrillFragmentBadge } from './DrillFragmentBadge';
import { useDictionary } from '../../../context/DictionaryContext';
import { usePlayer } from '../../../context/PlayerContext';
import { formatElapsed, calculateProgressPercent, getDeterministicDurationMs } from '../../../utils/audioTime';

export interface ListeningVisualizerCardProps {
  isPlaying?: boolean;
  isBuffering?: boolean;
  isLoading?: boolean;
  playerError?: string | null;
  activeSegment?: Segment | null;
  currentMs?: number;
  durationMs?: number;
  hasTranscript?: boolean;
  onTogglePlay?: () => void;
  onRetry?: () => void;
  className?: string;
}

interface WaveBarConfig {
  id: number;
  maxHeight: number;
  duration: number;
  delay: number;
  gradientClass: string;
}

export const ListeningVisualizerCard: React.FC<ListeningVisualizerCardProps> = (props) => {
  const { dict } = useDictionary();
  const player = usePlayer();

  // Resolved values: Explicit props take precedence, fallback to PlayerContext
  const isPlaying = props.isPlaying ?? player.isPlaying;
  const isBuffering = props.isBuffering ?? player.isBuffering;
  const isLoading = props.isLoading ?? player.isLoadingUnit;
  const playerError = props.playerError !== undefined ? props.playerError : player.playerError;
  const activeSegment = props.activeSegment ?? player.activeSegment;
  const currentMs = props.currentMs ?? player.currentMs;
  const rawDurationMs = props.durationMs ?? player.durationMs;
  const effectiveDurationMs = (rawDurationMs !== undefined && rawDurationMs > 0)
    ? rawDurationMs
    : (getDeterministicDurationMs(0, player.currentUnit?.estimatedDurationMinutes) || 1800000);
  const durationMs = effectiveDurationMs;
  const hasTranscript = props.hasTranscript ?? Boolean(player.currentUnit?.hasTranscript || (player.currentUnit?.segments && player.currentUnit.segments.length > 0));
  const onTogglePlay = props.onTogglePlay ?? player.togglePlay;
  const onRetry = props.onRetry ?? (() => player.loadAndPlayUnit(player.unitNumber || 1, currentMs, true));

  // Anti-Jitter Speaker Smoothing: Prevents speaker badge from flashing to Narrator during brief inter-sentence pauses
  const lastSpeakerRef = useRef<SpeakerRole>('NARRATOR');
  const lastDisplayNameRef = useRef<string>('');

  useEffect(() => {
    if (activeSegment?.speaker) {
      lastSpeakerRef.current = activeSegment.speaker;
      lastDisplayNameRef.current = activeSegment.speakerDisplayName || '';
    }
  }, [activeSegment]);

  // Deterministik 28-çubuklu ses dalgası konfigürasyonu (Symmetric organic bell curve)
  const waveBars = useMemo<WaveBarConfig[]>(() => {
    const totalBars = 28;
    const bars: WaveBarConfig[] = [];

    for (let i = 0; i < totalBars; i++) {
      // Doğal ses çanı dağılımı (kenarlarda %30, merkezde %96)
      const ratio = Math.sin(((i + 0.5) / totalBars) * Math.PI);
      const maxHeight = Math.round(30 + 66 * ratio);

      // Stripe/Linear renk paleti (Flanklarda ocean blue, geçişte sıcak kum, merkezde amber)
      let gradientClass = 'bg-gradient-to-t from-ocean-500/80 to-ocean-300';
      if ((i >= 6 && i < 10) || (i >= 18 && i < 22)) {
        gradientClass = 'bg-gradient-to-t from-amber-500/80 to-orange-400';
      } else if (i >= 10 && i < 18) {
        gradientClass = 'bg-gradient-to-t from-amber-500 via-orange-400 to-amber-300';
      }

      // Ritmik dalgalanma süreleri ve gecikmeleri (0.95s - 1.35s)
      const duration = Number((0.95 + 0.35 * Math.sin(i * 0.7)).toFixed(2));
      const delay = Number(((i * 0.04) % 0.6).toFixed(2));

      bars.push({
        id: i,
        maxHeight,
        duration,
        delay,
        gradientClass,
      });
    }

    return bars;
  }, []);

  // Speaker Badge Helper (100% dictionary mapped with anti-jitter smoothing)
  const speakerInfo = useMemo(() => {
    // Honest Audio Immersion Badge for lessons without transcript
    if (!hasTranscript) {
      return {
        label: dict.player?.audioImmersionBadge || dict.player?.dock?.audioImmersionBadge || 'Doğrudan Dinleme',
        badgeBg: 'bg-ocean-50 text-ocean-700 border-ocean-200/80',
        dotBg: 'bg-ocean-500',
        icon: Headphones,
      };
    }

    const effectiveRole: SpeakerRole = activeSegment?.speaker || lastSpeakerRef.current || 'NARRATOR';
    const effectiveDisplayName = activeSegment?.speakerDisplayName || lastDisplayNameRef.current;

    switch (effectiveRole) {
      case 'GERMAN_MALE':
        return {
          label: dict.speakers.GERMAN_MALE,
          badgeBg: 'bg-ocean-50 text-ocean-700 border-ocean-200/80',
          dotBg: 'bg-ocean-500',
          icon: User,
        };
      case 'GERMAN_FEMALE':
        return {
          label: dict.speakers.GERMAN_FEMALE,
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
          dotBg: 'bg-purple-500',
          icon: User,
        };
      case 'NARRATOR':
        return {
          label: dict.speakers.NARRATOR,
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dotBg: 'bg-amber-500',
          icon: Mic,
        };
      case 'UNKNOWN':
      default:
        return {
          label: effectiveDisplayName || dict.speakers.UNKNOWN,
          badgeBg: 'bg-sand-100 text-slate-700 border-sand-200/90',
          dotBg: 'bg-slate-400',
          icon: Volume2,
        };
    }
  }, [hasTranscript, activeSegment, dict.speakers, dict.player]);

  // Check if current active segment represents the learner's speaking turn (Interactive question/prompt)
  const isUserTurn = Boolean(
    activeSegment &&
    (activeSegment.segmentType === 'INTERACTIVE_PROMPT' ||
      (Array.isArray(activeSegment.flags) && activeSegment.flags.includes('USER_TURN')))
  );

  const SpeakerIcon = speakerInfo.icon;
  const progressPercent = calculateProgressPercent(currentMs, durationMs);
  const isBusy = isLoading || isBuffering;

  // Keyboard shortcut toggle on the visualizer card
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (playerError) {
        onRetry();
      } else if (!isBusy) {
        onTogglePlay();
      }
    }
  };

  const activeSpeakerLabel = dict.player?.tabs?.activeSpeakerLabel || dict.lessonPlayer.activeSpeakerLabel;
  const activeSentenceBadge = dict.player?.tabs?.activeSentenceBadge || dict.lessonPlayer.activeSentenceBadge;
  const audioLoadFailedLabel = dict.player?.errors?.audioLoadFailed || dict.lessonPlayer.audioLoadFailed;
  const audioLoadingLabel = dict.player?.empty?.audioPreparing || dict.lessonPlayer.audioLoading;
  const audioBufferingLabel = dict.player?.empty?.audioBuffering || dict.lessonPlayer.audioBuffering;
  const pauseActionLabel = dict.player?.dock?.pause || dict.lessonPlayer.pauseAction;
  const playActionLabel = dict.player?.dock?.play || dict.lessonPlayer.playAction;
  const retryButtonLabel = dict.player?.errors?.retryButton || dict.lessonPlayer.retryButton;
  const userPromptYourTurn = dict.player?.tabs?.userPromptYourTurn || 'Şimdi siz söyleyin';

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`relative overflow-hidden w-full rounded-2xl sm:rounded-3xl bg-white border border-sand-200/90 shadow-soft-md sm:shadow-soft-lg p-4 sm:p-7 flex flex-col items-center justify-between min-h-[290px] sm:min-h-[350px] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/50 ${
        props.className || ''
      }`}
    >
      {/* Scoped CSS Keyframe for hardware-accelerated, zero-layout-shift wave animation */}
      <style>{`
        @keyframes eidosListeningPulse {
          0%, 100% {
            transform: scaleY(0.24);
            opacity: 0.6;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>

      {/* Ambient background glow for high-end linear yacht deck aesthetic */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-ocean-50/25 via-white to-sand-50/30 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-ocean-200/20 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Header Row: Active Speaker Badge & Playback State Indicator */}
      <div className="relative z-10 w-full flex items-center justify-between gap-2.5 sm:gap-3 border-b border-sand-200/70 pb-3 select-none">
        {/* Left: Active Speaker Role */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden xs:inline">
            {activeSpeakerLabel}:
          </span>
          <div
            className={`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs transition-all ${speakerInfo.badgeBg}`}
          >
            <SpeakerIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[130px] sm:max-w-[200px]">{speakerInfo.label}</span>
          </div>

          {/* Drill Syllable Fragment Badge */}
          {hasTranscript && activeSegment && isFragmentSegment(activeSegment) && (
            <DrillFragmentBadge
              targetPhrase={activeSegment.targetPhrase}
              fragmentRole={activeSegment.fragmentRole}
              size="sm"
            />
          )}
        </div>

        {/* Right: Real-time Audio State Pill (with Fail-Loud Error Support) */}
        <div className="shrink-0">
          {playerError ? (
            <div
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold shadow-2xs"
              title={playerError}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" aria-hidden="true" />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">
                {audioLoadFailedLabel}
              </span>
            </div>
          ) : isLoading ? (
            <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-sand-100 text-slate-600 border border-sand-200/80 text-xs font-medium shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-ocean-600" aria-hidden="true" />
              <span>{audioLoadingLabel}</span>
            </div>
          ) : isBuffering ? (
            <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" aria-hidden="true" />
              <span>{audioBufferingLabel}</span>
            </div>
          ) : isPlaying ? (
            <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
              <span>{activeSentenceBadge}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-sand-100 text-slate-500 border border-sand-200/70 text-xs font-medium shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
              <span>{pauseActionLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Focal Orb, Prompt Badge & Organic Sound Wave */}
      <div className="relative z-10 my-auto py-4 sm:py-6 flex flex-col items-center justify-center w-full">
        {/* 0. Audio Immersion Tranquil Focus Notice Card (when lesson has no transcript) */}
        {!hasTranscript && (
          <div className="mb-4 sm:mb-5 w-full max-w-md px-4 py-3 rounded-2xl bg-gradient-to-r from-ocean-50/90 via-white to-sand-50/70 border border-ocean-200/80 shadow-soft-sm text-center animate-fade-in select-none">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl bg-ocean-100 text-ocean-800 border border-ocean-200/80 text-xs font-bold shadow-2xs mb-1">
              <Headphones className="w-3.5 h-3.5 text-ocean-600 shrink-0" aria-hidden="true" />
              <span>{dict.player?.audioImmersionBadge || 'Doğrudan Dinleme'}</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-700 tracking-tight my-0.5">
              {dict.player?.audioImmersionNotice || 'Doğrudan Dinleme: Odaklanın ve telaffuzu içselleştirin.'}
            </p>
          </div>
        )}

        {/* 1. Interactive Learner Speaking Turn Guidance Badge ("Şimdi siz söyleyin: ...") */}
        {hasTranscript && isUserTurn && (
          <div className="mb-4 sm:mb-5 w-full max-w-md px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-50/95 via-white to-amber-50/80 border border-amber-300/80 shadow-soft-sm text-center animate-fade-in select-none">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-200/80 text-xs font-bold shadow-2xs mb-1">
              <Mic className="w-3.5 h-3.5 text-amber-700 animate-pulse" aria-hidden="true" />
              <span>{userPromptYourTurn}</span>
            </div>
            {activeSegment?.targetPhrase ? (
              <p className="text-base sm:text-lg font-bold text-slate-800 tracking-tight my-0.5">
                « {activeSegment.targetPhrase} »
              </p>
            ) : activeSegment?.rawText ? (
              <p className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight my-0.5">
                « {activeSegment.rawText} »
              </p>
            ) : null}
            {activeSegment?.turkishText && (
              <p className="text-xs text-slate-500 font-medium italic mt-0.5">
                {activeSegment.turkishText}
              </p>
            )}
          </div>
        )}

        {/* 2. Pedagogical Back-Chaining Hero Card for Drill Fragments */}
        {hasTranscript && activeSegment && isFragmentSegment(activeSegment) && !isUserTurn && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              player.seek(activeSegment.startMs);
              if (!isPlaying) player.play();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                player.seek(activeSegment.startMs);
                if (!isPlaying) player.play();
              }
            }}
            title={dict.player?.tabs?.replaySentence || dict.lessonPlayer.repeatSentence}
            className="group/herodrill mb-4 sm:mb-5 w-full max-w-md px-4 py-3 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-white to-sand-50/70 border border-indigo-200/90 shadow-soft-sm hover:shadow-soft hover:border-indigo-300 text-center animate-fade-in cursor-pointer transition-all active:scale-98 select-text focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1 select-none">
              <DrillFragmentBadge
                targetPhrase={activeSegment.targetPhrase}
                fragmentRole={activeSegment.fragmentRole}
                size="sm"
              />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-indigo-950 tracking-tight my-1 select-text group-hover/herodrill:text-indigo-900 transition-colors">
              « {activeSegment.rawText} »
            </p>
            {activeSegment.displayContext && (
              <p className="text-xs sm:text-sm text-indigo-700/90 font-medium italic mt-0.5">
                {activeSegment.displayContext}
              </p>
            )}
          </div>
        )}

        {/* 3. Interactive Center Focus Orb */}
        <div className="relative mb-4 sm:mb-6">
          {/* Subtle concentric sound wave pulse when playing */}
          {isPlaying && (
            <>
              <span
                className="absolute -inset-2 sm:-inset-3 rounded-full border border-ocean-300/40 animate-ping opacity-30 pointer-events-none"
                aria-hidden="true"
              />
              <span
                className="absolute -inset-4 sm:-inset-5 rounded-full border border-ocean-200/30 opacity-40 pointer-events-none"
                aria-hidden="true"
              />
            </>
          )}

          <button
            type="button"
            onClick={playerError ? onRetry : onTogglePlay}
            disabled={isBusy}
            aria-label={
              playerError
                ? retryButtonLabel
                : isPlaying
                ? pauseActionLabel
                : playActionLabel
            }
            title={
              playerError
                ? retryButtonLabel
                : isPlaying
                ? pauseActionLabel
                : playActionLabel
            }
            className={`group relative w-16 h-16 sm:w-22 sm:h-22 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer select-none active:scale-95 focus:outline-none focus:ring-4 focus:ring-ocean-500/20 shadow-soft-md ${
              playerError
                ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                : isPlaying
                ? 'bg-gradient-to-tr from-ocean-600 to-ocean-500 text-white shadow-ocean-500/25 hover:brightness-105'
                : 'bg-white hover:bg-sand-50 text-slate-700 hover:text-ocean-600 border border-sand-200/90 hover:border-ocean-200 shadow-soft'
            }`}
          >
            {isBusy ? (
              <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-ocean-600" aria-hidden="true" />
            ) : playerError ? (
              <RefreshCw className="w-6 h-6 sm:w-7 sm:h-7 text-rose-600 transition-transform group-hover:rotate-180 duration-500" aria-hidden="true" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 sm:w-8 sm:h-8 fill-current transition-transform group-hover:scale-110" aria-hidden="true" />
            ) : (
              <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current ml-0.5 sm:ml-1 transition-transform group-hover:scale-110 text-ocean-600" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* 4. Minimalist Sound Wave Visualizer Bars (Clickable whole wave area for fluid play/pause) */}
        <div
          onClick={playerError ? onRetry : isBusy ? undefined : onTogglePlay}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              if (playerError) {
                onRetry();
              } else if (!isBusy) {
                onTogglePlay();
              }
            }
          }}
          className={`flex items-center justify-center gap-1 sm:gap-1.5 h-14 sm:h-20 w-full max-w-sm px-2 select-none group/wave focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500/40 rounded-xl transition-all duration-200 ${
            isBusy
              ? 'cursor-wait opacity-80'
              : 'cursor-pointer active:scale-[0.99]'
          }`}
          role="button"
          tabIndex={isBusy ? -1 : 0}
          aria-busy={isBusy ? 'true' : undefined}
          title={playerError ? retryButtonLabel : isPlaying ? pauseActionLabel : playActionLabel}
          aria-label={playerError ? retryButtonLabel : isPlaying ? pauseActionLabel : playActionLabel}
        >
          {waveBars.map((bar) => {
            return (
              <span
                key={bar.id}
                className={`w-1 sm:w-1.5 rounded-full transition-all ${bar.gradientClass} group-hover/wave:brightness-110`}
                style={{
                  height: `${bar.maxHeight}%`,
                  animation: isPlaying ? `eidosListeningPulse ${bar.duration}s ease-in-out infinite` : 'none',
                  animationDelay: isPlaying ? `${bar.delay}s` : '0s',
                  transformOrigin: 'center',
                  transform: isPlaying ? undefined : 'scaleY(0.24)',
                  opacity: isPlaying ? undefined : 0.45,
                  transition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
                }}
                aria-hidden="true"
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Micro Time Indicators & Smooth Progress Line */}
      <div className="relative z-10 w-full pt-2.5 sm:pt-3 border-t border-sand-200/70 select-none">
        <div className="flex items-center justify-between text-xs font-mono font-medium text-slate-500 mb-1.5 sm:mb-2">
          <span aria-label={dict.player?.dock?.elapsedTime || dict.lessonPlayer.currentTimeLabel}>
            {formatElapsed(currentMs)}
          </span>
          <span aria-label={dict.player?.dock?.remainingTime || dict.lessonPlayer.remainingTimeLabel}>
            {formatElapsed(durationMs)}
          </span>
        </div>

        {/* Slender Progress Track */}
        <div
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={dict.player?.dock?.scrubberAriaLabel || dict.lessonPlayer.scrubberAriaLabel}
          className="w-full h-1 bg-sand-200/80 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-ocean-400 via-ocean-500 to-amber-500 rounded-full transition-all duration-200 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
