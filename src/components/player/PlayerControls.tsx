import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Gauge,
  Scroll,
  Languages,
  Repeat,
  Loader2,
  Check,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';
import { PlayerProgressBar } from './PlayerProgressBar';

export const PlayerControls: React.FC = () => {
  const { dict, remoteConfig } = useDictionary();
  const {
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
    activeSegmentId,
    loopSegmentId,
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
  } = usePlayer();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const volumeMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
      if (volumeMenuRef.current && !volumeMenuRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleLoopCurrent = () => {
    if (loopSegmentId) {
      setLoopSegmentId(null);
    } else if (activeSegmentId) {
      setLoopSegmentId(activeSegmentId);
    }
  };

  const isLoopActive = Boolean(loopSegmentId);
  const availableSpeeds = remoteConfig.playbackSpeeds || [0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

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
    <div className="bg-white border border-sand-200 rounded-3xl p-4 sm:p-5 shadow-soft-lg transition-all duration-200">
      {/* 1. High-precision Progress Bar with Ocean Gradient */}
      <div className="mb-4">
        <PlayerProgressBar
          currentMs={currentMs}
          durationMs={durationMs}
          onSeek={seek}
        />
      </div>

      {/* 2. Main Playback Controls Deck */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left Side: AutoScroll, Translation, A-B Loop, and Volume Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-start flex-wrap">
          {/* Auto Scroll Toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            aria-label={dict.tooltips.autoScroll}
            title={dict.tooltips.autoScroll}
            className={`px-3 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              autoScroll
                ? 'bg-ocean-50 border-ocean-200 text-ocean-700 font-bold'
                : 'bg-sand-50 border-sand-200 text-slate-500 hover:bg-sand-100 hover:text-slate-700'
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-[11px]">{dict.player.autoScroll}</span>
          </button>

          {/* Translation Toggle */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            aria-label={showTranslation ? dict.player.hideTranslation : dict.player.showTranslation}
            title={showTranslation ? dict.player.hideTranslation : dict.player.showTranslation}
            className={`px-3 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              showTranslation
                ? 'bg-ocean-50 border-ocean-200 text-ocean-700 font-bold'
                : 'bg-sand-50 border-sand-200 text-slate-500 hover:bg-sand-100 hover:text-slate-700'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden xs:inline text-[11px]">
              {showTranslation ? dict.player.hideTranslation : dict.player.showTranslation}
            </span>
          </button>

          {/* A-B Loop Current Segment Toggle */}
          <button
            onClick={handleToggleLoopCurrent}
            disabled={!activeSegmentId && !loopSegmentId}
            aria-label={dict.player.loopTooltip}
            title={dict.player.loopTooltip}
            className={`px-3 py-2 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-40 ${
              isLoopActive
                ? 'bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-100 font-bold'
                : 'bg-sand-50 border-sand-200 text-slate-500 hover:bg-sand-100 hover:text-slate-700'
            }`}
          >
            <Repeat className={`w-3.5 h-3.5 ${isLoopActive ? 'animate-spin-slow text-amber-600' : ''}`} />
            <span className="hidden xs:inline text-[11px]">
              {isLoopActive ? dict.player.loopActive : dict.player.loopMode}
            </span>
          </button>

          {/* Volume / Mute Control with Mini Slider */}
          <div className="relative" ref={volumeMenuRef}>
            <button
              onClick={toggleMute}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowVolumeSlider(!showVolumeSlider);
              }}
              onMouseEnter={() => setShowVolumeSlider(true)}
              aria-label={isMuted ? dict.player.unmute : dict.player.mute}
              title={isMuted ? dict.player.unmute : dict.player.mute}
              className={`p-2 rounded-2xl border transition-all shadow-xs ${
                isMuted
                  ? 'bg-sand-100 border-sand-200 text-slate-400'
                  : 'bg-sand-50 border-sand-200 text-slate-700 hover:bg-sand-100'
              }`}
            >
              {renderVolumeIcon()}
            </button>

            {/* Volume slider popover */}
            {showVolumeSlider && (
              <div
                onMouseLeave={() => setShowVolumeSlider(false)}
                className="absolute left-0 bottom-full mb-3 bg-white border border-sand-200 rounded-2xl p-3 shadow-soft-lg z-50 flex items-center gap-2 min-w-[140px] animate-fade-in"
              >
                <button
                  onClick={toggleMute}
                  aria-label={isMuted ? dict.player.unmute : dict.player.mute}
                  title={isMuted ? dict.player.unmute : dict.player.mute}
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
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  aria-label={dict.player.volume}
                  className="w-20 h-1.5 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-ocean-600"
                />
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Previous Unit, Rewind -10s, Hero Play/Pause with Wave Glow, Forward +10s, Next Unit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Previous Unit */}
          <button
            onClick={playPreviousUnit}
            disabled={!unitNumber || unitNumber <= 1}
            aria-label={dict.player.previousUnitButton}
            title={dict.player.previousUnitButton}
            className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-sand-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-2xl transition-all"
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* 10s Rewind */}
          <button
            onClick={() => seekRelative(-10)}
            aria-label={dict.player.seekBackwardLabel}
            title={dict.player.seekBackwardLabel}
            className="flex items-center gap-1 px-3 py-2.5 bg-sand-100 hover:bg-sand-200 active:scale-95 text-slate-700 rounded-2xl text-xs font-bold transition-all shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-ocean-700" />
            <span className="text-[11px] font-mono">-10 sn</span>
          </button>

          {/* Hero Play / Pause Button with Luxury Wave Ring Effect */}
          <div className="relative flex items-center justify-center">
            {/* Wave glow ripple when playing */}
            {isPlaying && !isBuffering && (
              <div className="absolute inset-0 rounded-3xl bg-ocean-400 opacity-25 animate-ping pointer-events-none" />
            )}

            <button
              onClick={togglePlay}
              disabled={durationMs === 0 && !isPlaying}
              aria-label={isPlaying ? dict.player.pauseLabel : dict.player.playLabel}
              className={`relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white shadow-soft transition-all duration-200 active:scale-95 ${
                isPlaying
                  ? 'bg-gradient-to-br from-ocean-600 to-ocean-800 ring-4 ring-ocean-200/80'
                  : 'bg-gradient-to-br from-ocean-500 via-ocean-600 to-ocean-700 hover:from-ocean-600 hover:to-ocean-800 ring-2 ring-ocean-200'
              }`}
            >
              {isBuffering ? (
                <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-white" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              ) : (
                <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
              )}
            </button>
          </div>

          {/* 10s Forward */}
          <button
            onClick={() => seekRelative(10)}
            aria-label={dict.player.seekForwardLabel}
            title={dict.player.seekForwardLabel}
            className="flex items-center gap-1 px-3 py-2.5 bg-sand-100 hover:bg-sand-200 active:scale-95 text-slate-700 rounded-2xl text-xs font-bold transition-all shadow-xs"
          >
            <span className="text-[11px] font-mono">+10 sn</span>
            <RotateCw className="w-4 h-4 text-ocean-700" />
          </button>

          {/* Next Unit */}
          <button
            onClick={playNextUnit}
            disabled={!unitNumber || unitNumber >= (remoteConfig.maxRecentUnitsDisplay || 30)}
            aria-label={dict.player.nextUnitButton}
            title={dict.player.nextUnitButton}
            className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-sand-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-2xl transition-all"
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Right Side: Playback Speed Dropdown Popover */}
        <div className="relative" ref={speedMenuRef}>
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            aria-label={dict.tooltips.playbackSpeed}
            title={dict.tooltips.playbackSpeed}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all shadow-xs ${
              speed !== 1.0
                ? 'bg-ocean-50 border-ocean-300 text-ocean-800'
                : 'bg-sand-50 border-sand-200 text-slate-700 hover:bg-sand-100'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-ocean-600" />
            <span>{speed}x</span>
          </button>

          {/* Popover Speed Selector */}
          {showSpeedMenu && (
            <div className="absolute right-0 bottom-full mb-3 bg-white border border-sand-200 rounded-2xl p-2 shadow-soft-lg z-50 flex flex-col gap-1 min-w-[120px] animate-fade-in">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-sand-100 mb-1">
                {dict.player.speedPill}
              </div>
              {availableSpeeds.map((rate) => {
                const isSelected = speed === rate;
                return (
                  <button
                    key={rate}
                    onClick={() => {
                      setSpeed(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-xl flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-ocean-50 text-ocean-800 font-bold'
                        : 'text-slate-600 hover:bg-sand-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{rate}x</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-ocean-600" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
