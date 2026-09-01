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
  loadAndPlayUnit: (unitNum: number, startPositionMs?: number, autoPlay?: boolean) => Promise<void>;
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
  const { activeCourse } = useCourse();

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
  const [showTranslation, setShowTranslationState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('eidos_show_translation');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [loopSegmentId, setLoopSegmentId] = useState<string | null>(null);
  const [isLoadingUnit, setIsLoadingUnit] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const loopRef = useRef<string | null>(null);
  loopRef.current = loopSegmentId;

  const lastSavedPositionRef = useRef<number>(0);
  const lastSaveTimeRef = useRef<number>(Date.now());

  // Active Segment calculation (with 50ms smooth lead-time)
  const activeSegment = React.useMemo<Segment | null>(() => {
    if (!currentUnit || !currentUnit.segments || currentUnit.segments.length === 0) return null;
    const time = currentMs + 50;
    const found = currentUnit.segments.find((s) => s.startMs <= time && s.endMs >= time);
    return found || null;
  }, [currentUnit, currentMs]);

  const activeSegmentId = activeSegment?.id || null;

  // Periodic Progress Persistence (Every 10 seconds of active playback)
  const handlePeriodicSave = useCallback(
    (curMs: number) => {
      if (!unitNumber || !isPlaying) return;
      const now = Date.now();
      if (now - lastSaveTimeRef.current > 10000 && Math.abs(curMs - lastSavedPositionRef.current) > 3000) {
        lastSaveTimeRef.current = now;
        lastSavedPositionRef.current = curMs;
        const isCompleted = Boolean(progress?.units[unitNumber]?.completed);
        saveUnitProgress(unitNumber, isCompleted, curMs, 10000);
      }
    },
    [unitNumber, isPlaying, progress, saveUnitProgress]
  );

  // Subscribe to audio engine events
  useEffect(() => {
    const unsubTime = audioPlayer.onTimeUpdate((cur, dur) => {
      setCurrentMs(cur);
      if (dur > 0) setDurationMs(dur);

      // Loop check
      if (loopRef.current && currentUnit) {
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
      // Save on pause
      if (!playing && unitNumber && currentMs > 0) {
        const isCompleted = Boolean(progress?.units[unitNumber]?.completed);
        saveUnitProgress(unitNumber, isCompleted, currentMs, 0);
      }
    });

    const unsubVolume = audioPlayer.onVolumeChange((vol, muted) => {
      setVolumeState(vol);
      setIsMutedState(muted);
    });

    const unsubEnded = audioPlayer.onEnded(() => {
      if (loopRef.current && currentUnit) {
        const seg = currentUnit.segments.find((s) => s.id === loopRef.current);
        if (seg) {
          audioPlayer.seek(seg.startMs);
          audioPlayer.play();
        }
      }
    });

    const unsubError = audioPlayer.onError((err) => {
      setPlayerError(err.message || 'Audio playback error occurred.');
    });

    return () => {
      unsubTime();
      unsubState();
      unsubVolume();
      unsubEnded();
      unsubError();
    };
  }, [currentUnit, unitNumber, currentMs, handlePeriodicSave, progress, saveUnitProgress]);

  const clearPlayerError = useCallback(() => {
    setPlayerError(null);
  }, []);

  const loadAndPlayUnit = useCallback(
    async (unitNum: number, startPositionMs: number = 0, autoPlay: boolean = true) => {
      setIsLoadingUnit(true);
      setPlayerError(null);
      setLoopSegmentId(null);

      const langId = activeCourse?.languageId || 'german';
      const lvlId = activeCourse?.levelId || 'level1';

      try {
        const data = await apiRequest<UnitDetail>(`/api/v1/courses/${langId}/levels/${lvlId}/units/${unitNum}`);
        setCurrentUnit(data);
        setUnitNumber(unitNum);
        if (data.audioDurationMs) {
          setDurationMs(data.audioDurationMs);
        }

        audioPlayer.loadUnit(unitNum, startPositionMs, autoPlay, langId, lvlId);
      } catch (err: any) {
        console.error('[LOAD_UNIT_FAILED]', err);
        setPlayerError(err?.message || `Failed to load Unit ${unitNum} (${langId} - ${lvlId})`);
      } finally {
        setIsLoadingUnit(false);
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
      if (loopRef.current && currentUnit) {
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

  const playNextUnit = useCallback(() => {
    const totalUnits = progress?.totalUnits || 30;
    if (unitNumber !== null && unitNumber < totalUnits) {
      loadAndPlayUnit(unitNumber + 1, 0, true);
    }
  }, [unitNumber, progress, loadAndPlayUnit]);

  const playPreviousUnit = useCallback(() => {
    if (unitNumber !== null && unitNumber > 1) {
      loadAndPlayUnit(unitNumber - 1, 0, true);
    }
  }, [unitNumber, loadAndPlayUnit]);

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
