import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Gauge,
  Repeat,
  Volume2,
  Volume1,
  VolumeX,
  Check,
} from 'lucide-react';
import { useDictionary } from '../../../context/DictionaryContext';

interface GlobalPlayerSpeedVolumeProps {
  speed: number;
  volume: number;
  isMuted: boolean;
  loopSegmentId: string | null;
  activeSegmentId: string | null;
  onSetSpeed: (rate: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleLoop: () => void;
  disabled?: boolean;
}

export const GlobalPlayerSpeedVolume: React.FC<GlobalPlayerSpeedVolumeProps> = ({
  speed,
  volume,
  isMuted,
  loopSegmentId,
  activeSegmentId,
  onSetSpeed,
  onSetVolume,
  onToggleMute,
  onToggleLoop,
  disabled = false,
}) => {
  const { dict, remoteConfig } = useDictionary();

  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [showVolumeMenu, setShowVolumeMenu] = useState<boolean>(false);

  const speedMenuRef = useRef<HTMLDivElement>(null);
  const volumeMenuRef = useRef<HTMLDivElement>(null);

  const isLoopActive = Boolean(loopSegmentId);
  const availableSpeeds = remoteConfig.playbackSpeeds || [0.75, 1.0, 1.25, 1.5];

  // Close popovers on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
      if (volumeMenuRef.current && !volumeMenuRef.current.contains(event.target as Node)) {
        setShowVolumeMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowSpeedMenu(false);
        setShowVolumeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Smooth mouse wheel volume adjustment on hover
  const handleVolumeWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (disabled) return;
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      const nextVol = Math.max(0, Math.min(1, volume + delta));
      onSetVolume(Number(nextVol.toFixed(2)));
    },
    [disabled, volume, onSetVolume]
  );

  const renderVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="w-4 h-4 text-slate-400" />;
    }
    if (volume < 0.5) {
      return <Volume1 className="w-4 h-4 text-ocean-600" />;
    }
    return <Volume2 className="w-4 h-4 text-ocean-600" />;
  };

  return (
    <div className="flex items-center gap-1 sm:gap-2 select-none">
      {/* 1. A-B Loop Repeat Segment Button */}
      <button
        type="button"
        onClick={onToggleLoop}
        disabled={disabled || (!activeSegmentId && !loopSegmentId)}
        aria-label={dict.globalPlayer.loopAB}
        title={dict.globalPlayer.loopAB}
        className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-30 disabled:pointer-events-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ocean-500 ${
          isLoopActive
            ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-100 font-bold'
            : 'bg-sand-50 border-sand-200 text-slate-600 hover:bg-sand-100 hover:text-slate-900'
        }`}
      >
        <Repeat className={`w-3.5 h-3.5 ${isLoopActive ? 'animate-spin-slow text-amber-600' : ''}`} />
        <span className="hidden xl:inline text-[11px]">
          {isLoopActive ? dict.globalPlayer.loopActive : dict.globalPlayer.loopAB}
        </span>
      </button>

      {/* 2. Playback Speed Selector Popover */}
      <div className="relative" ref={speedMenuRef}>
        <button
          type="button"
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          disabled={disabled}
          aria-label={dict.globalPlayer.speedLabel}
          title={dict.globalPlayer.speedLabel}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-30 disabled:pointer-events-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ocean-500 ${
            speed !== 1.0
              ? 'bg-ocean-50 border-ocean-300 text-ocean-800'
              : 'bg-sand-50 border-sand-200 text-slate-700 hover:bg-sand-100'
          }`}
        >
          <Gauge className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
          <span className="font-mono text-[11px]">{speed}x</span>
        </button>

        {showSpeedMenu && (
          <div className="absolute right-0 bottom-full mb-3 bg-white border border-sand-200 rounded-2xl p-1.5 shadow-soft-lg z-50 flex flex-col gap-0.5 min-w-[120px] animate-fade-in">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-sand-100 mb-0.5">
              {dict.globalPlayer.playbackSpeedTitle}
            </div>
            {availableSpeeds.map((rate) => {
              const isSelected = speed === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    onSetSpeed(rate);
                    setShowSpeedMenu(false);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-ocean-50 text-ocean-800 font-bold'
                      : 'text-slate-600 hover:bg-sand-50 hover:text-slate-900'
                  }`}
                >
                  <span className="font-mono">{rate}x</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-ocean-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Volume / Mute Slider Popover with Mouse Wheel Control */}
      <div className="relative" ref={volumeMenuRef} onWheel={handleVolumeWheel}>
        <button
          type="button"
          onClick={onToggleMute}
          onMouseEnter={() => setShowVolumeMenu(true)}
          disabled={disabled}
          aria-label={isMuted ? dict.globalPlayer.unmuteAction : dict.globalPlayer.muteAction}
          title={isMuted ? dict.globalPlayer.unmuteAction : dict.globalPlayer.muteAction}
          className={`p-2 rounded-xl border transition-all shadow-2xs disabled:opacity-30 disabled:pointer-events-none active:scale-95 focus-visible:ring-2 focus-visible:ring-ocean-500 ${
            isMuted
              ? 'bg-sand-100 border-sand-200 text-slate-400'
              : 'bg-sand-50 border-sand-200 text-slate-700 hover:bg-sand-100'
          }`}
        >
          {renderVolumeIcon()}
        </button>

        {showVolumeMenu && (
          <div
            onMouseLeave={() => setShowVolumeMenu(false)}
            className="absolute right-0 bottom-full mb-3 bg-white border border-sand-200 rounded-2xl p-2.5 shadow-soft-lg z-50 flex items-center gap-2 min-w-[150px] animate-fade-in"
          >
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted ? dict.globalPlayer.unmuteAction : dict.globalPlayer.muteAction}
              title={isMuted ? dict.globalPlayer.unmuteAction : dict.globalPlayer.muteAction}
              className="text-slate-500 hover:text-ocean-600 p-0.5"
            >
              {renderVolumeIcon()}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              aria-label={dict.globalPlayer.volumeLabel}
              className="w-20 h-1.5 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-ocean-600"
            />
            <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
