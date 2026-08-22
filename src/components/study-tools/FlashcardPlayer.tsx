import React, { useState, useEffect } from 'react';
import { 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Shuffle, 
  Check, 
  X, 
  HelpCircle, 
  Flame, 
  Trophy,
  ArrowLeft
} from 'lucide-react';
import { FlashcardDeck, Flashcard } from '../../types';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';

interface FlashcardPlayerProps {
  deck: FlashcardDeck;
  onBack: () => void;
  onDeckUpdated?: () => void;
}

export const FlashcardPlayer: React.FC<FlashcardPlayerProps> = ({
  deck,
  onBack,
  onDeckUpdated,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(deck.cards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setCards(deck.cards || []);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  }, [deck]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleToggleMastery = async (mastered: boolean) => {
    if (!currentCard) return;
    try {
      await api.updateCardMastery(deck.id, currentCard.id, mastered);
      const updated = [...cards];
      updated[currentIndex].mastered = mastered;
      setCards(updated);

      if (mastered) {
        // Trigger small confetti if all cards mastered
        const allMastered = updated.every(c => c.mastered);
        if (allMastered) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }

      if (onDeckUpdated) onDeckUpdated();
      handleNext();
    } catch (err) {
      console.error('Failed to update card mastery:', err);
    }
  };

  const masteredCount = cards.filter(c => c.mastered).length;
  const progressPercent = Math.round((masteredCount / (cards.length || 1)) * 100);

  if (!currentCard) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">No cards in this deck.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs">
          Back to Decks
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Decks</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>

          <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Card {currentIndex + 1} of {cards.length}
          </div>
        </div>
      </div>

      {/* Deck Title & Mastery Progress */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{deck.title}</h2>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 font-mono">
            {masteredCount}/{cards.length} Mastered ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* 3D Flip Flashcard */}
      <div
        id="interactive-flashcard"
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative min-h-[300px] md:min-h-[360px] w-full rounded-3xl p-6 md:p-10 cursor-pointer shadow-lg transition-all duration-300 select-none flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 hover:shadow-xl group"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-bold uppercase tracking-wider text-[11px] text-indigo-600 dark:text-indigo-400">
            {isFlipped ? 'Answer / Explanation' : 'Question / Prompt'}
          </span>
          <div className="flex items-center gap-2">
            {currentCard.difficulty && (
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                currentCard.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                currentCard.difficulty === 'hard' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' :
                'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {currentCard.difficulty}
              </span>
            )}
            {currentCard.mastered && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                <Check className="w-3.5 h-3.5" />
                Mastered
              </span>
            )}
          </div>
        </div>

        {/* Card Main Body */}
        <div className="my-auto text-center py-6">
          <p className="text-lg md:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed max-w-xl mx-auto">
            {isFlipped ? currentCard.back : currentCard.front}
          </p>

          {/* Hint disclosure */}
          {!isFlipped && currentCard.hint && (
            <div className="mt-4" onClick={e => e.stopPropagation()}>
              {showHint ? (
                <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg inline-block border border-amber-200 dark:border-amber-800/40">
                  💡 Hint: {currentCard.hint}
                </p>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-xs text-zinc-400 hover:text-amber-500 inline-flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Show Hint</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Footer prompt */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          <span>Click card or press <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">Space</kbd> to flip</span>
          <span className="flex items-center gap-1 text-indigo-500 group-hover:underline">
            <RotateCw className="w-3.5 h-3.5" />
            Flip Card
          </span>
        </div>
      </div>

      {/* Controls & Mastery Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Navigation arrows */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mastery Ratings */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => handleToggleMastery(false)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-semibold transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Still Learning</span>
          </button>

          <button
            onClick={() => handleToggleMastery(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Mastered (+5 XP)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
