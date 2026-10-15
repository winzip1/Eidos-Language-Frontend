/**
 * Eidos Language OS - Central Player & Karaoke State Context
 * Orchestrates Millisecond-accurate audio playback, segment tracking, volume control, and A-B loop drills.
 */
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { UnitDetail, Segment } from '../types';
import { audioPlayer } from '../services/audioPlayer';
import { apiRequest } from '../services/apiClient';
import { useAuth } from './AuthContext';
import { useCourse } from './CourseContext';
import { toast } from 'sonner';

interface PlayerContextType {
  currentUnit: UnitDetail | null;
  unitNumber: number | null;
  currentMs: number;
  durationMs: number;
  isPlaying: boolean;
  isBuffering: boolean;
  speed: number;
  volume: number;
  isMuted: boolean;
  autoScroll: boolean;
  showTranslation: boolean;
  activeSegment: Segment | null;
  activeSegmentId: string | null;
  loopSegmentId: string | null;
  isLoadingUnit: boolean;
  playerError: string | null;
  clearPlayerError: () => void;
  retryLoadUnit: () => void;
  loadAndPlayUnit: (
    unitNum: number,
    startPositionMs?: number,
    autoPlay?: boolean,
    overrideLangId?: string,
    overrideLevelId?: string
  ) => Promise<void>;
  playSnippet: (unitNum: number, startPositionMs: number, endPositionMs: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (ms: number) => void;
  seekRelative: (sec: number) => void;
  setSpeed: (rate: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setAutoScroll: (val: boolean) => void;
  setShowTranslation: (val: boolean) => void;
  setLoopSegmentId: (id: string | null) => void;
  playNextUnit: () => void;
  playPreviousUnit: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { saveUnitProgress, progress } = useAuth();
  const { activeCourse, activeLevel } = useCourse();

  const [currentUnit, setCurrentUnit] = useState<UnitDetail | null>(null);
  const [unitNumber, setUnitNumber] = useState<number | null>(null);
  const [currentMs, setCurrentMs] = useState<number>(0);
  const [durationMs, setDurationMs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [speed, setSpeedState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('eidos_playback_speed');
      return saved ? Number(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });
  const [volume, setVolumeState] = useState<number>(audioPlayer.getVolume());
  const [isMuted, setIsMutedState] = useState<boolean>(audioPlayer.isMuted());
  const [autoScroll, setAutoScrollState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('eidos_auto_scroll');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  // Show Translation: Always default to true for dual-language learning visibility
  const [showTranslation, setShowTranslationState] = useState<boolean>(true);
  const [loopSegmentId, setLoopSegmentId] = useState<string | null>(null);
  const [isLoadingUnit, setIsLoadingUnit] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const loopRef = useRef<string | null>(null);
  loopRef.current = loopSegmentId;

  const lastSavedPositionRef = useRef<number>(0);
  const lastSaveTimeRef = useRef<number>(Date.now());
  const loadRequestIdRef = useRef<number>(0);

  // Unload / Unmount Persistence: Save exact audio progress when tab or browser closes
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (unitNumber && currentMs > 0) {
        const isCompleted = Boolean(progress?.units[unitNumber]?.completed);
        const targetCourseId = activeCourse?.courseId || 'eidos-german-level1';
        saveUnitProgress(unitNumber, isCompleted, currentMs, 0, targetCourseId);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unitNumber, currentMs, progress, saveUnitProgress, activeCourse]);

  // Active Segment calculation (with 50ms smooth lead-time, safely returns null on unparsed units)
  const activeSegment = React.useMemo<Segment | null>(() => {
    if (!currentUnit || !Array.isArray(currentUnit.segments) || currentUnit.segments.length === 0) {
      return null;
    }
    const time = currentMs + 50;
    const found = currentUnit.segments.find((s) => s.startMs <= time && s.endMs >= time);
    return found || null;
  }, [currentUnit, currentMs]);

  const activeSegmentId = activeSegment?.id || null;

  // Periodic Progress Persistence (Every 10 seconds of active playback, course-scoped)
  const handlePeriodicSave = useCallback(
    (curMs: number) => {
      if (!unitNumber || !isPlaying) return;
      const now = Date.now();
      if (now - lastSaveTimeRef.current > 10000 && Math.abs(curMs - lastSavedPositionRef.current) > 3000) {
        lastSaveTimeRef.current = now;
        lastSavedPositionRef.current = curMs;
        const isCompleted = Boolean(progress?.units[unitNumber]?.completed);
        const targetCourseId = activeCourse?.courseId || 'eidos-german-level1';
        saveUnitProgress(unitNumber, isCompleted, curMs, 10000, targetCourseId);
      }
    },
    [unitNumber, isPlaying, progress, saveUnitProgress, activeCourse]
  );

  // Subscribe to audio engine events
  useEffect(() => {
    const unsubTime = audioPlayer.onTimeUpdate((cur, dur) => {
      setCurrentMs(cur);
      if (dur > 0) {
        setDurationMs(dur);
      }

      // Loop check (only if unit has segments)
      if (loopRef.current && currentUnit?.segments && currentUnit.segments.length > 0) {
        const seg = currentUnit.segments.find((s) => s.id === loopRef.current);
        if (seg && cur >= seg.endMs) {
          audioPlayer.seek(seg.startMs);
        }
      }

      handlePeriodicSave(cur);
    });

    const unsubState = audioPlayer.onStateChange((playing, buffering) => {
      setIsPlaying(playing);
      setIsBuffering(buffering);
      // Save on pause (course-scoped)
      if (!playing && unitNumber && currentMs > 0) {
        const isCompleted = Boolean(progress?.units[unitNumber]?.completed);
        const targetCourseId = activeCourse?.courseId || 'eidos-german-level1';
        saveUnitProgress(unitNumber, isCompleted, currentMs, 0, targetCourseId);
      }
    });

    const unsubVolume = audioPlayer.onVolumeChange((vol, muted) => {
      setVolumeState(vol);
      setIsMutedState(muted);
    });

    const unsubEnded = audioPlayer.onEnded(() => {
      if (loopRef.current && currentUnit?.segments && currentUnit.segments.length > 0) {
        const seg = currentUnit.segments.find((s) => s.id === loopRef.current);
        if (seg) {
          audioPlayer.seek(seg.startMs);
          audioPlayer.play();
        }
      }
    });

    const unsubError = audioPlayer.onError((err) => {
      const msg = err.message || 'Ses oynatma hatası oluştu.';
      setPlayerError(msg);
      toast.error(msg, {
        description: err.statusCode ? `HTTP ${err.statusCode}` : 'Ağ / Oynatma Hatası',
      });
    });

    return () => {
      unsubTime();
      unsubState();
      unsubVolume();
      unsubEnded();
      unsubError();
    };
  }, [currentUnit, unitNumber, currentMs, handlePeriodicSave, progress, saveUnitProgress, activeCourse]);

  const clearPlayerError = useCallback(() => {
    setPlayerError(null);
  }, []);

  const loadAndPlayUnit = useCallback(
    async (
      unitNum: number,
      startPositionMs: number = 0,
      autoPlay: boolean = true,
      overrideLangId?: string,
      overrideLevelId?: string
    ) => {
      const requestId = ++loadRequestIdRef.current;
      setIsLoadingUnit(true);
      setPlayerError(null);
      setLoopSegmentId(null);
      setShowTranslationState(true);

      const langId = overrideLangId || activeCourse?.languageId || 'german';
      const lvlId = overrideLevelId || activeCourse?.levelId || 'level1';

      try {
        const data = await apiRequest<UnitDetail>(`/api/v1/courses/${langId}/levels/${lvlId}/units/${unitNum}`);
        if (requestId !== loadRequestIdRef.current) return;

        // Ensure segments array is always safely defined (even on unparsed audio-only lessons)
        const safeUnitDetail: UnitDetail = {
          ...data,
          segments: Array.isArray(data.segments) ? data.segments : [],
        };
        setCurrentUnit(safeUnitDetail);
        setUnitNumber(unitNum);

        // Dynamic Duration Sync:
        // Transcribed unit: explicit audioDurationMs > 0.
        // Unparsed unit: audioDurationMs is 0; check live audioPlayer or fallback to estimated duration
        if (data.audioDurationMs && data.audioDurationMs > 0) {
          setDurationMs(data.audioDurationMs);
        } else {
          const liveDurationMs = audioPlayer.getDurationMs();
          if (liveDurationMs > 0) {
            setDurationMs(liveDurationMs);
          } else if (data.estimatedDurationMinutes && data.estimatedDurationMinutes > 0) {
            setDurationMs(data.estimatedDurationMinutes * 60 * 1000);
          } else {
            setDurationMs(0);
          }
        }

        audioPlayer.loadUnit(unitNum, startPositionMs, autoPlay, langId, lvlId);
      } catch (err: any) {
        if (requestId !== loadRequestIdRef.current) return;
        console.error('[LOAD_UNIT_FAILED]', err);
        const errMsg = err?.message || `Ünite ${unitNum} yüklenemedi.`;
        const code = err?.statusCode ? `HTTP ${err.statusCode}` : 'Ağ Hatası';
        setPlayerError(`${errMsg} (${code})`);
        toast.error(errMsg, {
          description: code,
        });
      } finally {
        if (requestId === loadRequestIdRef.current) {
          setIsLoadingUnit(false);
        }
      }
    },
    [activeCourse]
  );

  const playSnippet = useCallback((unitNum: number, startPositionMs: number, endPositionMs: number) => {
    setLoopSegmentId(null);
    audioPlayer.playSnippet(unitNum, startPositionMs, endPositionMs);
  }, []);

  const play = useCallback(() => {
    audioPlayer.play();
  }, []);

  const pause = useCallback(() => {
    audioPlayer.pause();
  }, []);

  const togglePlay = useCallback(() => {
    audioPlayer.toggle();
  }, []);

  const seek = useCallback(
    (ms: number) => {
      audioPlayer.seek(ms);
      // If user seeks outside looped segment, clear loop
      if (loopRef.current && currentUnit?.segments && currentUnit.segments.length > 0) {
        const seg = currentUnit.segments.find((s) => s.id === loopRef.current);
        if (seg && (ms < seg.startMs - 500 || ms > seg.endMs + 500)) {
          setLoopSegmentId(null);
        }
      }
    },
    [currentUnit]
  );

  const seekRelative = useCallback((sec: number) => {
    audioPlayer.seekRelative(sec);
  }, []);

  const setSpeed = useCallback((rate: number) => {
    audioPlayer.setPlaybackRate(rate);
    setSpeedState(rate);
    try {
      localStorage.setItem('eidos_playback_speed', String(rate));
    } catch {
      // ignore
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    audioPlayer.setVolume(vol);
  }, []);

  const toggleMute = useCallback(() => {
    audioPlayer.toggleMute();
  }, []);

  const setAutoScroll = useCallback((val: boolean) => {
    setAutoScrollState(val);
    try {
      localStorage.setItem('eidos_auto_scroll', String(val));
    } catch {
      // ignore
    }
  }, []);

  const setShowTranslation = useCallback((val: boolean) => {
    setShowTranslationState(val);
    try {
      localStorage.setItem('eidos_show_translation', String(val));
    } catch {
      // ignore
    }
  }, []);

  const retryLoadUnit = useCallback(() => {
    if (unitNumber) {
      loadAndPlayUnit(unitNumber, currentMs, true);
    }
  }, [unitNumber, currentMs, loadAndPlayUnit]);

  const playNextUnit = useCallback(() => {
    if (isLoadingUnit) return;
    const maxUnits = activeLevel?.totalUnits || activeCourse?.totalUnits || progress?.totalUnits || 30;
    if (unitNumber !== null && unitNumber < maxUnits) {
      loadAndPlayUnit(unitNumber + 1, 0, true);
    }
  }, [unitNumber, activeLevel, activeCourse, progress, isLoadingUnit, loadAndPlayUnit]);

  const playPreviousUnit = useCallback(() => {
    if (isLoadingUnit) return;
    if (unitNumber !== null && unitNumber > 1) {
      loadAndPlayUnit(unitNumber - 1, 0, true);
    }
  }, [unitNumber, isLoadingUnit, loadAndPlayUnit]);

  return (
    <PlayerContext.Provider
      value={{
        currentUnit,
        unitNumber,
        currentMs,
        durationMs,
        isPlaying,
        isBuffering,
        speed,
        volume,
        isMuted,
        autoScroll,
        showTranslation,
        activeSegment,
        activeSegmentId,
        loopSegmentId,
        isLoadingUnit,
        playerError,
        clearPlayerError,
        retryLoadUnit,
        loadAndPlayUnit,
        playSnippet,
        play,
        pause,
        togglePlay,
        seek,
        seekRelative,
        setSpeed,
        setVolume,
        toggleMute,
        setAutoScroll,
        setShowTranslation,
        setLoopSegmentId,
        playNextUnit,
        playPreviousUnit,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
