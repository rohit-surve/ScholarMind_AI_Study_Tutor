import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Play, 
  Plus, 
  Trash2, 
  Sparkles, 
  Check, 
  BookOpen, 
  ChevronRight,
  X
} from 'lucide-react';
import { FlashcardDeck } from '../../types';
import { api } from '../../services/api';
import { FlashcardPlayer } from './FlashcardPlayer';
import { useLanguage } from '../../context/LanguageContext';

interface FlashcardsHubProps {
  onRefreshData?: () => void;
}

export const FlashcardsHub: React.FC<FlashcardsHubProps> = ({ onRefreshData }) => {
  const { t } = useLanguage();
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Modal form states
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [cardCount, setCardCount] = useState(8);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [generating, setGenerating] = useState(false);

  const loadDecks = async () => {
    try {
      setLoading(true);
      const res = await api.getFlashcards();
      setDecks(res.decks || []);
    } catch (err) {
      console.error('Failed to load flashcard decks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  const handleGenerateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await api.generateFlashcards({
        topic: topic.trim(),
        subject: subject.trim() || undefined,
        cardCount: Number(cardCount),
        difficulty,
        autoSave: true,
      });
      setDecks(prev => [res.deck, ...prev]);
      setShowCreateModal(false);
      setTopic('');
      setSubject('');
      setActiveDeck(res.deck);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate flashcards');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteDeck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this deck?')) return;
    try {
      await api.deleteFlashcardDeck(id);
      setDecks(prev => prev.filter(d => d.id !== id));
      if (activeDeck?.id === id) setActiveDeck(null);
    } catch (err) {
      console.error('Failed to delete deck:', err);
    }
  };

  if (activeDeck) {
    return (
      <FlashcardPlayer
        deck={activeDeck}
        onBack={() => {
          setActiveDeck(null);
          loadDecks();
        }}
        onDeckUpdated={loadDecks}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                {t('flashcards')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t('flashcards')}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Interactive 3D flip card decks to strengthen memory retention and concept mastery.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 self-start sm:self-auto transition-all"
          >
            <Plus className="w-4 h-4" />
                <span>{t('studyTools')}</span>
          </button>
        </div>

        {/* Decks Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {t('flashcards')} ({decks.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-zinc-400 text-xs">Loading flashcards...</div>
          ) : decks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
              No flashcard decks yet. Click "Generate Flashcard Deck" to create one!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map(deck => {
                const cards = deck.cards || [];
                const masteredCount = cards.filter(c => c.mastered).length;
                const percent = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

                return (
                  <div
                    key={deck.id}
                    id={`deck-card-${deck.id}`}
                    onClick={() => setActiveDeck(deck)}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Layers className="w-4 h-4" />
                        </div>
                        <button
                          onClick={e => handleDeleteDeck(deck.id, e)}
                          className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                          title="Delete Deck"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 leading-snug">
                        {deck.title}
                      </h3>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {deck.description || 'Flashcard Deck'} • {cards.length} Cards
                      </p>

                      {/* Mastery Progress Bar */}
                      <div className="space-y-1 mt-4">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500">
                          <span>{masteredCount}/{cards.length} Mastered</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{percent}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setActiveDeck(deck);
                      }}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Study Deck</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Generate Flashcard Deck */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Generate Spaced Repetition Deck
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-700">✕</button>
              </div>

              <form onSubmit={handleGenerateDeck} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Deck Topic / Concept *
                  </label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Cranial Nerves, Python Data Structures, Microeconomics"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Subject (Optional)
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Medicine, CS, Economics"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={e => setDifficulty(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Card Count</label>
                    <select
                      value={cardCount}
                      onChange={e => setCardCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value={5}>5 Cards</option>
                      <option value={8}>8 Cards</option>
                      <option value={12}>12 Cards</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={generating}
                  className="w-full mt-3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  {generating ? 'Generating Deck...' : 'Generate & Open Deck'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
