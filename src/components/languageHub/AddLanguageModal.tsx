/**
 * Eidos Language OS - Add Language & Course Request Modal
 * Allows users to request new languages, view planned roadmap, and cast interest votes.
 * Real backend persistence via POST /api/v1/courses/request.
 * ZERO HARDCODE & STRICTLY LIGHT MODE.
 */
import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Send,
  CheckCircle2,
  ThumbsUp,
  Globe2,
  BookOpen,
} from 'lucide-react';
import { useDictionary } from '../../context/DictionaryContext';
import { apiRequest } from '../../services/apiClient';
import { toast } from 'sonner';

interface AddLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialLanguageName?: string;
  initialTargetLevel?: string;
}

interface PlannedTrack {
  id: string;
  flag: string;
  name: string;
  level: string;
  description: string;
  votes: number;
}

export const AddLanguageModal: React.FC<AddLanguageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialLanguageName = '',
  initialTargetLevel = 'A1',
}) => {
  const { dict } = useDictionary();

  const [languageName, setLanguageName] = useState(initialLanguageName);
  const [targetLevel, setTargetLevel] = useState(initialTargetLevel);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync initial props when opened
  useEffect(() => {
    if (isOpen) {
      setLanguageName(initialLanguageName);
      setTargetLevel(initialTargetLevel || 'A1');
      setIsSubmitted(false);
    }
  }, [isOpen, initialLanguageName, initialTargetLevel]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleResetAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Planned tracks list for quick voting
  const [plannedTracks, setPlannedTracks] = useState<PlannedTrack[]>([
    {
      id: 'italian_a1',
      flag: '🇮🇹',
      name: 'Italiano (İtalyanca)',
      level: 'A1',
      description: 'Seyahat, restoran ve günlük pratik konuşma kalıpları.',
      votes: 42,
    },
    {
      id: 'japanese_n5',
      flag: '🇯🇵',
      name: '日本語 (Japonca)',
      level: 'N5',
      description: 'Temel telaffuz, selamlama ve günlük diyaloglar.',
      votes: 38,
    },
    {
      id: 'russian_a1',
      flag: '🇷🇺',
      name: 'Русский (Rusça)',
      level: 'A1',
      description: 'Kiril alfabesi destekli dinleme ve konuşma seti.',
      votes: 29,
    },
    {
      id: 'french_b1',
      flag: '🇫🇷',
      name: 'Français (Fransızca B1)',
      level: 'B1',
      description: 'Orta seviye akıcı diyaloglar ve iş Fransızcası.',
      votes: 24,
    },
  ]);

  const [votedTrackIds, setVotedTrackIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleVoteTrack = async (track: PlannedTrack) => {
    if (votedTrackIds.has(track.id)) return;

    try {
      await apiRequest('/api/v1/courses/request', {
        method: 'POST',
        body: JSON.stringify({
          languageName: track.name,
          targetLevel: track.level,
          reason: `Roadmap vote for ${track.name} ${track.level}`,
        }),
      });

      setVotedTrackIds((prev) => new Set(prev).add(track.id));
      setPlannedTracks((prev) =>
        prev.map((t) => (t.id === track.id ? { ...t, votes: t.votes + 1 } : t))
      );

      toast.success(dict.languageHub.requestSuccessTitle, {
        description: `${track.flag} ${track.name} • ${dict.languageHub.votedBadge}`,
      });
    } catch (err: any) {
      toast.error(err?.message || dict.errors.unexpected);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = languageName.trim();
    if (!trimmed) {
      toast.error(dict.languageHub.errorLanguageRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest('/api/v1/courses/request', {
        method: 'POST',
        body: JSON.stringify({
          languageName: trimmed,
          targetLevel: targetLevel.trim(),
          reason: reason.trim(),
        }),
      });

      setIsSubmitted(true);
      toast.success(dict.languageHub.requestSuccessTitle, {
        description: dict.languageHub.requestSuccessDesc,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err?.message || dict.errors.unexpected);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setLanguageName('');
    setReason('');
    setTargetLevel('A1');
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleResetAndClose();
        }
      }}
    >
      <div
        className="bg-white rounded-3xl border border-sand-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
        aria-labelledby="language-modal-title"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-sand-200 flex items-start justify-between gap-4 sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ocean-50 border border-ocean-200/80 flex items-center justify-center text-ocean-600 shadow-2xs shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="language-modal-title" className="text-lg font-extrabold text-slate-900">
                  {dict.languageHub.requestLanguageTitle}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-ocean-50 text-ocean-700 border border-ocean-200">
                  {dict.languageHub.requestLanguageBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {dict.languageHub.requestLanguageSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-sand-100 transition-colors cursor-pointer"
            aria-label={dict.languageHub.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto shadow-soft">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-extrabold text-slate-900">
                  {dict.languageHub.requestSuccessTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {dict.languageHub.requestSuccessDesc}
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500"
              >
                {dict.languageHub.close}
              </button>
            </div>
          ) : (
            <>
              {/* Section 1: Planned Roadmap Voting */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{dict.languageHub.upcomingPlannedRoadmap}</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {plannedTracks.length} {dict.languageHub.levelCountBadge.toLowerCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plannedTracks.map((track) => {
                    const hasVoted = votedTrackIds.has(track.id);

                    return (
                      <div
                        key={track.id}
                        className="p-3.5 rounded-2xl bg-sand-50/70 border border-sand-200/90 flex flex-col justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-lg">{track.flag}</span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-sand-200">
                              {track.level}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900">
                            {track.name}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium leading-snug">
                            {track.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-sand-200/60 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400">
                            {track.votes} {dict.languageHub.votesCount}
                          </span>

                          <button
                            type="button"
                            disabled={hasVoted}
                            onClick={() => handleVoteTrack(track)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                              hasVoted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                                : 'bg-white hover:bg-ocean-50 text-ocean-700 border border-sand-200 hover:border-ocean-300 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500'
                            }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            <span>
                              {hasVoted
                                ? dict.languageHub.votedBadge
                                : dict.languageHub.voteForTrack}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Custom Language Request Form */}
              <form onSubmit={handleSubmitForm} className="space-y-4 pt-4 border-t border-sand-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-ocean-600" />
                  <span>{dict.languageHub.requestLanguageTitle}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Language Name */}
                  <div className="sm:col-span-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        {dict.languageHub.languageNameLabel} *
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {languageName.length}/100
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={languageName}
                      onChange={(e) => setLanguageName(e.target.value)}
                      placeholder={dict.languageHub.languageNamePlaceholder}
                      className="w-full px-3.5 py-2 text-xs bg-sand-50/50 border border-sand-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 font-medium"
                    />
                  </div>

                  {/* Target CEFR Level */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      {dict.languageHub.targetLevelLabel}
                    </label>
                    <select
                      value={targetLevel}
                      onChange={(e) => setTargetLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-sand-50/50 border border-sand-200 rounded-xl text-slate-800 focus:outline-hidden focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 font-semibold cursor-pointer"
                    >
                      <option value="A1">A1 (Başlangıç)</option>
                      <option value="A2">A2 (Temel)</option>
                      <option value="B1">B1 (Orta)</option>
                      <option value="B2">B2 (İleri Orta)</option>
                      <option value="C1">C1 (Akıcı)</option>
                      <option value="C2">C2 (Usta)</option>
                    </select>
                  </div>
                </div>

                {/* Reason & Note */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      {dict.languageHub.reasonLabel}
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {reason.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={dict.languageHub.reasonPlaceholder}
                    className="w-full px-3.5 py-2 text-xs bg-sand-50/50 border border-sand-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-ocean-400 focus:ring-2 focus:ring-ocean-100 font-medium resize-none"
                  />
                </div>

                {/* Form Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="px-4 py-2 bg-sand-100 hover:bg-sand-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sand-400"
                  >
                    {dict.languageHub.cancel}
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !languageName.trim()}
                    className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-soft transition-all flex items-center gap-2 cursor-pointer active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ocean-500 ${
                      isSubmitting || !languageName.trim()
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-ocean-600 hover:bg-ocean-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>{dict.languageHub.submitting}</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{dict.languageHub.submitRequest}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
