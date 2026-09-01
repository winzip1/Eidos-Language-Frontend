import React from 'react';
import { Sliders, Gauge, Volume2, VolumeX, MoveVertical, Languages } from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { usePlayer } from '../../context/PlayerContext';

export const AudioPreferencesCard: React.FC = () => {
  const { dict, remoteConfig } = useDictionary();
  const {
    speed,
    setSpeed,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    autoScroll,
    setAutoScroll,
    showTranslation,
    setShowTranslation,
  } = usePlayer();

  const playbackSpeeds = remoteConfig?.playbackSpeeds || [0.75, 0.9, 1.0, 1.25, 1.5, 2.0];
  const volumePercent = isMuted ? 0 : Math.round(volume * 100);

  return (
    <div className="space-y-4 pt-4 border-t border-sand-100">
      <div>
        <label className="text-xs font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Sliders className="w-4 h-4 text-ocean-600" />
          <span>{dict.settings.audioPrefsTitle}</span>
        </label>
        <p className="text-[11px] text-slate-400">
          {dict.settings.audioPrefsSubtitle}
        </p>
      </div>

      <div className="space-y-4 bg-sand-50/60 p-4 rounded-2xl border border-sand-200">
        {/* 1. Default Playback Speed Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Gauge className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.settings.defaultSpeedLabel}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded-md border border-ocean-200">
              {speed}x
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {dict.settings.defaultSpeedDesc}
          </p>

          <div className="flex items-center gap-1 bg-white border border-sand-200 p-1 rounded-xl shadow-2xs">
            {playbackSpeeds.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => setSpeed(rate)}
                className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
                  speed === rate
                    ? 'bg-ocean-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-sand-100 hover:text-slate-900'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* 2. Volume Level Slider */}
        <div className="space-y-2 pt-3 border-t border-sand-200/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Volume2 className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.settings.defaultVolumeLabel}</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-700 bg-sand-100 px-2 py-0.5 rounded-md border border-sand-200">
              {volumePercent}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {dict.settings.defaultVolumeDesc}
          </p>

          <div className="flex items-center gap-3 bg-white border border-sand-200 p-2.5 rounded-xl shadow-2xs">
            <button
              type="button"
              onClick={toggleMute}
              title={isMuted ? dict.player.unmute : dict.player.mute}
              className="p-1.5 rounded-lg text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-ocean-600" />
              )}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={volumePercent}
              onChange={(e) => setVolume(Number(e.target.value) / 100)}
              aria-label={dict.settings.defaultVolumeLabel}
              className="w-full accent-ocean-600 cursor-pointer h-1.5 bg-sand-200 rounded-lg appearance-none"
            />
          </div>
        </div>

        {/* 3. Auto-Scroll Toggle */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-sand-200/60">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <MoveVertical className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.settings.autoScrollLabel}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {dict.settings.autoScrollDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer select-none shrink-0 ${
              autoScroll ? 'bg-ocean-600' : 'bg-sand-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoScroll ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 4. Show Translation Toggle */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-sand-200/60">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Languages className="w-3.5 h-3.5 text-ocean-600" />
              <span>{dict.settings.showTranslationLabel}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {dict.settings.showTranslationDesc}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTranslation(!showTranslation)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer select-none shrink-0 ${
              showTranslation ? 'bg-ocean-600' : 'bg-sand-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                showTranslation ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
