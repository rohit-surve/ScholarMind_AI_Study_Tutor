import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Trophy, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Sparkles,
  Award
} from 'lucide-react';
import { Quiz, QuizResult } from '../../types';
import { api } from '../../services/api';
import confetti from 'canvas-confetti';

interface QuizTakerProps {
  quiz: Quiz;
  onBack: () => void;
  onQuizCompleted?: (result: QuizResult) => void;
}

export const QuizTaker: React.FC<QuizTakerProps> = ({
  quiz,
  onBack,
  onQuizCompleted,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>((quiz.timeLimitMinutes || 5) * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [earnedXp, setEarnedXp] = useState<number>(0);

  const questions = quiz.questions || [];
  const currentQ = questions[currentQuestionIndex];

  // Timer countdown
  useEffect(() => {
    if (result) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [result, selectedAnswers]);

  const handleSelectOption = (optionIndex: number) => {
    if (result) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (isSubmitting || result) return;
    setIsSubmitting(true);
    const totalTimeSpent = (quiz.timeLimitMinutes || 5) * 60 - timeLeft;

    try {
      const res = await api.submitQuiz(quiz.id, {
        answers: selectedAnswers,
        timeSpentSeconds: Math.max(1, totalTimeSpent),
      });

      setResult(res.result);
      setEarnedXp(res.earnedXp);

      if (res.result.percentage >= 70) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      if (onQuizCompleted) {
        onQuizCompleted(res.result);
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentQ && !result) {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">No questions in this quiz.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs">
          Back
        </button>
      </div>
    );
  }

  // Quiz Results / Review Screen
  if (result) {
    const isPassing = result.percentage >= 70;
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Results Banner */}
        <div className={`p-6 md:p-8 rounded-3xl text-center border shadow-lg ${
          isPassing
            ? 'bg-gradient-to-b from-emerald-500/10 to-transparent border-emerald-500/30'
            : 'bg-gradient-to-b from-amber-500/10 to-transparent border-amber-500/30'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {isPassing ? 'Outstanding Performance!' : 'Good Effort! Keep Practicing'}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            You scored <span className="font-bold text-indigo-600 dark:text-indigo-400 text-lg">{result.percentage}%</span> ({result.score}/{result.totalQuestions} correct)
          </p>

          {/* Earned XP Pill */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-xs shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>+{earnedXp} XP Awarded to your profile</span>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => {
                setResult(null);
                setSelectedAnswers({});
                setTimeLeft((quiz.timeLimitMinutes || 5) * 60);
                setCurrentQuestionIndex(0);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Quiz</span>
            </button>

            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              Back to Quiz Hub
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="space-y-4">
          <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
            Detailed Review & Explanations
          </h3>

          {questions.map((q, idx) => {
            const userChoice = selectedAnswers[q.id];
            const isCorrect = userChoice === q.correctIndex;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'bg-white dark:bg-zinc-900 border-emerald-500/30'
                    : 'bg-white dark:bg-zinc-900 border-rose-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-400 font-mono">Q{idx + 1}.</span>
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {q.question}
                    </h4>
                  </div>
                  {isCorrect ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      Correct
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs shrink-0">
                      <XCircle className="w-4 h-4" />
                      Incorrect
                    </span>
                  )}
                </div>

                {/* Options list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                  {q.options.map((opt, optIdx) => {
                    const isUserSelected = userChoice === optIdx;
                    const isRightAnswer = q.correctIndex === optIdx;

                    let optClass = 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300';
                    if (isRightAnswer) {
                      optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold';
                    } else if (isUserSelected && !isRightAnswer) {
                      optClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${optClass}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-[10px]">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">Explanation: </span>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Quiz Answering View
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Header: Title, Timer, Quit */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Quiz</span>
        </button>

        {/* Live Timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border shadow-xs ${
          timeLeft < 60
            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 animate-pulse'
            : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress & Question Index Pills */}
      <div>
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{answeredCount}/{questions.length} Answered</span>
        </div>

        {/* Question Selector Bubbles */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {questions.map((q, idx) => {
            const isAnswered = selectedAnswers[q.id] !== undefined;
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isAnswered
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Question Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-6">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
            Multiple Choice
          </span>
        </div>

        <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
          {currentQ.question}
        </h3>

        {/* 4 Options Radio Group */}
        <div className="space-y-3">
          {currentQ.options.map((opt, optIdx) => {
            const isSelected = selectedAnswers[currentQ.id] === optIdx;
            return (
              <div
                key={optIdx}
                onClick={() => handleSelectOption(optIdx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}>
                  {String.fromCharCode(65 + optIdx)}
                </span>
                <span className="text-xs md:text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                  {opt}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Submit Quiz Assessment</span>
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Next Question</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
