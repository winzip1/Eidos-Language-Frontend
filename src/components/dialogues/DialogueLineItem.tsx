import React, { useState } from 'react';
import {
  Volume2,
  Sparkles,
  User,
  UserCheck,
  Mic,
  BookmarkPlus,
  Check,
  Languages,
} from 'lucide-react';
import type { DialogueLine } from '../../types';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

interface DialogueLineItemProps {
  line: DialogueLine;
  unitNumber: number;
  isActive: boolean;
  isPlaying: boolean;
  onPlayLine: (line: DialogueLine) => void;
  onOpenDrill?: (line: DialogueLine) => void;
}

export const DialogueLineItem: React.FC<DialogueLineItemProps> = ({
  line,
  unitNumber,
  isActive,
  isPlaying,
  onPlayLine,
  onOpenDrill,
}) => {
  const { dict } = useDictionary();
  const ds = dict?.dialogueStudy || initialFallbackDict.dialogueStudy;
  const spk = dict?.speakers || initialFallbackDict.speakers;
  const { saveWordMastery } = useAuth();
  const [isSaved, setIsSaved] = useState(false);

  const getSpeakerBadge = () => {
    switch (line.speaker) {
      case 'GERMAN_FEMALE':
        return {
          icon: UserCheck,
          label: spk?.GERMAN_FEMALE || 'Almanca Kadın Konuşmacı',
          bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dot: 'bg-rose-500',
        };
      case 'GERMAN_MALE':
        return {
          icon: User,
          label: spk?.GERMAN_MALE || 'Almanca Erkek Konuşmacı',
          bg: 'bg-ocean-50 text-ocean-700 border-ocean-200/80',
          dot: 'bg-ocean-600',
        };
      case 'NARRATOR':
      default:
        return {
          icon: Mic,
          label: spk?.NARRATOR || 'Eğitmen',
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
        };
    }
  };

  const speaker = getSpeakerBadge();
  const Icon = speaker.icon;

  const handleSaveToVocab = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveWordMastery(line.id, 'learning', unitNumber, line.germanText, line.turkishText, line.englishExplanation);
    setIsSaved(true);
    toast.success(ds.savedToVocab || 'Kelime Defterine Eklendi');
  };

  return (
    <div
      className={`group relative p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
        isActive && isPlaying
          ? 'bg-ocean-50/80 border-ocean-400 shadow-soft-md ring-2 ring-ocean-300/50 scale-[1.005]'
          : 'bg-white hover:bg-slate-50/70 border-slate-200/80 shadow-2xs hover:border-slate-300'
      }`}
    >
      {/* Header with Speaker Badge, Duration, and Quick Actions */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${speaker.bg}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{speaker.label}</span>
          </span>

          {line.durationMs ? (
            <span className="text-[11px] text-slate-400 font-mono">
              {(line.durationMs / 1000).toFixed(1)}s
            </span>
          ) : null}
        </div>

        {/* Action Buttons: Play Native Audio, Speaking Drill, Save to Vocab */}
        <div className="flex items-center gap-1.5">
          {/* Save to Vocabulary Button */}
          <button
            type="button"
            onClick={handleSaveToVocab}
            title={ds.saveToVocab || 'Kelime Defterine Ekle'}
            aria-label={ds.saveToVocab || 'Kelime Defterine Ekle'}
            className={`p-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 hover:bg-ocean-50 text-slate-500 hover:text-ocean-700 border-slate-200'
            }`}
          >
            {isSaved ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-ocean-600" />
            )}
          </button>

          {/* Speaking Pronunciation Drill Trigger */}
          {onOpenDrill && (
            <button
              type="button"
              onClick={() => onOpenDrill(line)}
              title={ds.practiceLine || 'Telaffuz Pratiği Yap'}
              aria-label={ds.practiceLine || 'Telaffuz Pratiği Yap'}
              className="p-1.5 rounded-xl bg-sand-100 hover:bg-ocean-100 text-slate-600 hover:text-ocean-800 border border-sand-200 text-xs font-semibold transition-all cursor-pointer active:scale-95"
            >
              <Mic className="w-3.5 h-3.5 text-ocean-600" />
            </button>
          )}

          {/* Native Audio Listen Button */}
          <button
            type="button"
            onClick={() => onPlayLine(line)}
            title={ds.listenLineButton}
            aria-label={ds.listenLineButton}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 ${
              isActive && isPlaying
                ? 'bg-ocean-600 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-ocean-100 text-slate-700 hover:text-ocean-800 border border-slate-200/90'
            }`}
          >
            {isActive && isPlaying ? (
              <>
                <div className="flex items-center gap-0.5">
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>{ds.playingAudioLabel}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-ocean-600" />
                <span>{ds.listenLineButton}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* German Original Line (Crisp Typography) */}
      <div className="mb-2">
        <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-relaxed select-text">
          {line.germanText}
        </h4>
      </div>

      {/* Turkish Translation */}
      <div className="mb-2 flex items-start gap-2 text-sm font-medium text-slate-700">
        <span className="text-[11px] px-1.5 py-0.5 rounded bg-sand-200/70 text-slate-600 shrink-0 select-none font-semibold">
          TR
        </span>
        <p className="leading-snug select-text">{line.turkishText}</p>
      </div>

      {/* English Grammatical & Cultural Context Explanation */}
      {line.englishExplanation && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600 bg-sand-50/60 p-2.5 rounded-xl border border-sand-200/60">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-slate-800 mr-1.5 inline-flex items-center gap-1">
              <Languages className="w-3 h-3 text-slate-400 inline" />
              Not:
            </span>
            <span className="italic select-text leading-normal">{line.englishExplanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};
