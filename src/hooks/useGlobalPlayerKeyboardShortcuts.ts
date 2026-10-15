import { useEffect } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { useDictionary } from '../context/DictionaryContext';

interface UseGlobalPlayerKeyboardShortcutsOptions {
  enabled?: boolean;
}

export function useGlobalPlayerKeyboardShortcuts({
  enabled = true,
}: UseGlobalPlayerKeyboardShortcutsOptions = {}) {
  const {
    unitNumber,
    isPlaying,
    speed,
    loopSegmentId,
    activeSegmentId,
    togglePlay,
    seekRelative,
    setSpeed,
    toggleMute,
    setLoopSegmentId,
  } = usePlayer();

  const { remoteConfig } = useDictionary();
  const availableSpeeds = remoteConfig.playbackSpeeds || [0.75, 1.0, 1.25, 1.5];

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept keystrokes when user is typing in forms/inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 1. Space: Toggle Play/Pause
      if (e.code === 'Space') {
        if (unitNumber !== null) {
          e.preventDefault();
          togglePlay();
        }
        return;
      }

      // 2. ArrowLeft: Seek backward (-5s or -10s with Shift)
      if (e.code === 'ArrowLeft' && !e.altKey && !e.metaKey) {
        if (unitNumber !== null) {
          e.preventDefault();
          seekRelative(e.shiftKey ? -10 : -5);
        }
        return;
      }

      // 3. ArrowRight: Seek forward (+5s or +10s with Shift)
      if (e.code === 'ArrowRight' && !e.altKey && !e.metaKey) {
        if (unitNumber !== null) {
          e.preventDefault();
          seekRelative(e.shiftKey ? 10 : 5);
        }
        return;
      }

      // 4. M Key: Toggle Mute
      if (e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleMute();
        }
        return;
      }

      // 5. L Key: Toggle A-B Loop
      if (e.key === 'l' || e.key === 'L') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          if (loopSegmentId) {
            setLoopSegmentId(null);
          } else if (activeSegmentId) {
            setLoopSegmentId(activeSegmentId);
          }
        }
        return;
      }

      // 6. [ Key: Speed Down
      if (e.key === '[') {
        e.preventDefault();
        const currentIndex = availableSpeeds.indexOf(speed);
        if (currentIndex > 0) {
          setSpeed(availableSpeeds[currentIndex - 1]);
        }
        return;
      }

      // 7. ] Key: Speed Up
      if (e.key === ']') {
        e.preventDefault();
        const currentIndex = availableSpeeds.indexOf(speed);
        if (currentIndex >= 0 && currentIndex < availableSpeeds.length - 1) {
          setSpeed(availableSpeeds[currentIndex + 1]);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    unitNumber,
    isPlaying,
    speed,
    loopSegmentId,
    activeSegmentId,
    availableSpeeds,
    togglePlay,
    seekRelative,
    setSpeed,
    toggleMute,
    setLoopSegmentId,
  ]);
}
