import React, { useState, useMemo, useEffect } from 'react';
import { Search, Sparkles, Volume2, BookOpen, BookmarkPlus, Check, X } from 'lucide-react';
import { useDictionary, initialFallbackDict } from '../../context/DictionaryContext';
import { useAuth } from '../../context/AuthContext';
import { audioPlayer } from '../../services/audioPlayer';
import { toast } from 'sonner';

interface CheatSheetItem {
  id: number;
  unit: number;
  german: string;
  turkish: string;
  english: string;
  startMs: number;
  endMs: number;
}

const CHEAT_SHEET_ITEMS: CheatSheetItem[] = [
  { id: 1, unit: 1, german: 'Entschuldigen Sie', turkish: 'Affedersiniz', english: 'Excuse me (Formal attention)', startMs: 6628, endMs: 7800 },
  { id: 2, unit: 1, german: 'Verstehen Sie Deutsch / Englisch?', turkish: 'Almanca / İngilizce anlıyor musunuz?', english: 'Do you understand German / English?', startMs: 6628, endMs: 8806 },
  { id: 3, unit: 1, german: 'Ich verstehe ein bisschen / kein...', turkish: 'Biraz anlıyorum / Hiç anlamıyorum', english: 'I understand a little / no...', startMs: 8806, endMs: 14000 },
  { id: 4, unit: 1, german: 'Sind Sie Amerikaner / Deutscher?', turkish: 'Amerikalı / Alman mısınız?', english: 'Are you American / German?', startMs: 14000, endMs: 17562 },
  { id: 5, unit: 3, german: 'Guten Tag, wie geht es Ihnen?', turkish: 'İyi günler, nasılsınız?', english: 'Good day, how are you? (formal)', startMs: 6682, endMs: 8966 },
  { id: 6, unit: 3, german: 'Es geht mir sehr gut, danke', turkish: 'Çok iyiyim, teşekkürler', english: 'I am doing very well, thank you', startMs: 9210, endMs: 11000 },
  { id: 7, unit: 3, german: 'Aber nicht sehr gut', turkish: 'Ama çok iyi değil', english: 'But not very well (modest rejection)', startMs: 19226, endMs: 20902 },
  { id: 8, unit: 4, german: 'Doch!', turkish: 'Bilakis! / Yo, tam aksine öyle!', english: 'Yes (used to contradict a negative)', startMs: 17144, endMs: 18744 },
  { id: 9, unit: 5, german: 'Wo ist die Goethestraße?', turkish: 'Goethe Caddesi nerede?', english: 'Where is Goethe Street?', startMs: 8750, endMs: 10278 },
  { id: 10, unit: 5, german: 'Dort drüben / Hier', turkish: 'Orada (karşıda) / Burada', english: 'Over there / Here', startMs: 10618, endMs: 15622 },
  { id: 11, unit: 6, german: 'Ich möchte etwas essen / trinken', turkish: 'Bir şeyler yemek / içmek istiyorum', english: 'I would like to eat / drink something', startMs: 10466, endMs: 15078 },
  { id: 12, unit: 6, german: 'Sie auch? / Ich auch', turkish: 'Siz de mi? / Ben de', english: 'You too? / Me too', startMs: 11806, endMs: 12646 },
  { id: 13, unit: 7, german: 'Wann? Jetzt / Nicht jetzt / Später', turkish: 'Ne zaman? Şimdi / Şimdi değil / Sonra', english: 'When? Now / Not now / Later', startMs: 8538, endMs: 14306 },
  { id: 14, unit: 7, german: 'Wo? Bei mir / Am Opernplatz', turkish: 'Nerede? Bende / Opera Meydanı\'nda', english: 'Where? At my place / At Opernplatz', startMs: 14426, endMs: 15286 },
  { id: 15, unit: 8, german: 'Zwei Bier / Wein bitte', turkish: 'İki bira / Şarap lütfen', english: 'Two beers / Wine please', startMs: 33720, endMs: 35718 },
  { id: 16, unit: 8, german: 'Wie bitte?', turkish: 'Efendim? / Tekrar eder misiniz?', english: 'Pardon? / Come again?', startMs: 36270, endMs: 37766 },
  { id: 17, unit: 9, german: 'Sagen Sie, was möchten Sie machen?', turkish: 'Söyler misiniz, ne yapmak istersiniz?', english: 'Tell me, what would you like to do?', startMs: 21850, endMs: 24262 },
  { id: 18, unit: 9, german: 'Möchten Sie mit mir essen?', turkish: 'Benimle yemek yemek ister misiniz?', english: 'Would you like to eat with me?', startMs: 29040, endMs: 30566 },
  { id: 19, unit: 9, german: 'Ich weiß, wo das ist', turkish: 'Nerede olduğunu biliyorum', english: 'I know where that is', startMs: 37562, endMs: 39366 },
  { id: 20, unit: 10, german: 'Um wie viel Uhr? Um 9 Uhr', turkish: 'Saat kaçta? Saat 9\'da', english: 'At what time? At 9 o\'clock', startMs: 14222, endMs: 24486 },
  { id: 21, unit: 10, german: 'Viel später', turkish: 'Çok daha sonra', english: 'Much later', startMs: 18018, endMs: 19270 },
  { id: 22, unit: 10, german: 'Mit Ihnen zusammen', turkish: 'Sizinle birlikte', english: 'Together with you (formal)', startMs: 11450, endMs: 13862 },
  { id: 23, unit: 10, german: 'Also, dann bis 9 Uhr!', turkish: 'O halde saat 9\'da görüşmek üzere!', english: 'Well then, until 9 o\'clock!', startMs: 25262, endMs: 26302 },
  { id: 24, unit: 5, german: 'Auf Wiedersehen!', turkish: 'Hoşça kalın!', english: 'Goodbye!', startMs: 19338, endMs: 21990 },
];

interface DialogueCheatSheetProps {
  onPlaySnippet: (unitNumber: number, startMs: number, endMs: number) => void;
  onSelectUnit: (unitNumber: number) => void;
}

export const DialogueCheatSheet: React.FC<DialogueCheatSheetProps> = ({
  onPlaySnippet,
  onSelectUnit,
}) => {
  const { dict } = useDictionary();
  const ds = dict?.dialogueStudy || initialFallbackDict.dialogueStudy;
  const { saveWordMastery } = useAuth();

  const [search, setSearch] = useState('');
  const [savedItemIds, setSavedItemIds] = useState<Record<number, boolean>>({});
  const [playingItemId, setPlayingItemId] = useState<number | null>(null);

  useEffect(() => {
    const unsubState = audioPlayer.onStateChange((playing) => {
      if (!playing) setPlayingItemId(null);
    });
    const unsubEnd = audioPlayer.onEnded(() => {
      setPlayingItemId(null);
    });
    return () => {
      unsubState();
      unsubEnd();
    };
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return CHEAT_SHEET_ITEMS;
    const q = search.toLowerCase().trim();
    return CHEAT_SHEET_ITEMS.filter(
      (item) =>
        item.german.toLowerCase().includes(q) ||
        item.turkish.toLowerCase().includes(q) ||
        item.english.toLowerCase().includes(q) ||
        `ünite ${item.unit}`.includes(q) ||
        `unit ${item.unit}`.includes(q)
    );
  }, [search]);

  const handleSaveItemToVocab = (item: CheatSheetItem) => {
    const id = `cheat-sheet-${item.id}-${item.unit}`;
    saveWordMastery(id, 'learning', item.unit, item.german, item.turkish, item.english);
    setSavedItemIds((prev) => ({ ...prev, [item.id]: true }));
    toast.success(ds.savedToVocab || 'Kelime Defterine Eklendi');
  };

  const handleItemPlay = (item: CheatSheetItem) => {
    setPlayingItemId(item.id);
    onPlaySnippet(item.unit, item.startMs, item.endMs);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-sand-100/90 via-white to-ocean-50/60 p-6 rounded-3xl border border-sand-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-xl bg-ocean-100 text-ocean-700">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {ds.cheatSheetTitle}
              </h2>
            </div>
            <p className="text-sm text-slate-600">
              {ds.cheatSheetSubtitle}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={ds.cheatSheetSearchPlaceholder}
              className="w-full pl-10 pr-9 py-2.5 bg-white rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-ocean-500 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-sand-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table of Phrases */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-sand-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 w-28">{ds.unitChipPrefix}</th>
                <th className="py-3.5 px-4">{ds.germanTextLabel}</th>
                <th className="py-3.5 px-4">{ds.turkishTextLabel}</th>
                <th className="py-3.5 px-4">{ds.englishExplanationLabel}</th>
                <th className="py-3.5 px-4 w-36 text-right">Aksiyonlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredItems.map((item) => {
                const isSaved = !!savedItemIds[item.id];
                const isPlaying = playingItemId === item.id;
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors group ${
                      isPlaying ? 'bg-ocean-50/70' : 'hover:bg-ocean-50/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-slate-400">
                      {item.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectUnit(item.unit)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand-100 hover:bg-ocean-100 text-slate-700 hover:text-ocean-700 font-semibold text-xs border border-sand-200 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Ünite {item.unit}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 select-text">
                      {item.german}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium select-text">
                      {item.turkish}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 italic select-text">
                      {item.english}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Save to Vocabulary Button */}
                        <button
                          type="button"
                          onClick={() => handleSaveItemToVocab(item)}
                          title={ds.saveToVocab || 'Kelime Defterine Ekle'}
                          aria-label={ds.saveToVocab || 'Kelime Defterine Ekle'}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer active:scale-95 ${
                            isSaved
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-sand-50 hover:bg-ocean-50 text-slate-500 hover:text-ocean-700 border-sand-200'
                          }`}
                        >
                          {isSaved ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <BookmarkPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-ocean-600" />
                          )}
                        </button>

                        {/* Play Native Audio Snippet */}
                        <button
                          type="button"
                          onClick={() => handleItemPlay(item)}
                          title={ds.listenLineButton}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                            isPlaying
                              ? 'bg-ocean-600 text-white shadow-soft-sm'
                              : 'bg-ocean-50 hover:bg-ocean-600 text-ocean-700 hover:text-white border border-ocean-200/80 hover:border-transparent'
                          }`}
                        >
                          {isPlaying ? (
                            <div className="flex items-center gap-0.5">
                              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          ) : (
                            <Volume2 className="w-3.5 h-3.5" />
                          )}
                          <span>{isPlaying ? 'Çalıyor' : 'Dinle'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-slate-700">
                      {ds.emptySearchTitle}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {ds.emptySearchDesc}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
