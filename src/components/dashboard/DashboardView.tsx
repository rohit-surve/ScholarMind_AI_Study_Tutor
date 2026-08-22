import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  Sparkles, 
  Layers, 
  HelpCircle, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  Target,
  Zap,
  TrendingUp
} from 'lucide-react';
import { DashboardStats, User, Conversation, QuizResult, FlashcardDeck } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onSelectConversation: (id: string) => void;
  onOpenDeck: (deck: FlashcardDeck) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectConversation,
  onOpenDeck,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const res = await api.getDashboardStats();
        setStats(res.stats);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const currentXp = user?.xp || 100;
  const level = user?.level || 1;
  const xpInLevel = currentXp % 500;
  const xpPercentage = Math.min(100, Math.round((xpInLevel / 500) * 100));

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="relative z-10 space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>{t('studyTools')}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-xs md:text-sm text-indigo-200 leading-relaxed">
              {user?.studyGoal 
                ? `Active Target: "${user.studyGoal}"` 
                : 'Ready to master new topics and prepare for your upcoming assessments?'}
            </p>
          </div>

          {/* Quick Launch Buttons on Banner */}
          <div className="relative z-10 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('chat')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>{t('startTutor')}</span>
            </button>
            <button
              onClick={() => onNavigate('quizzes')}
              className="px-4 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-indigo-300" />
              <span>{t('takeAssessment')}</span>
            </button>
          </div>
        </div>

        {/* 4 Core Metric KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Streak Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">{t('studyStreak')}</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {stats?.studyStreakDays || user?.streak || 1} <span className="text-xs font-normal text-zinc-400">{t('days')}</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {t('dailyGoal')}
            </p>
          </div>

          {/* Level & Total XP Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">{t('levelProgress')}</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              Lvl {level} <span className="text-xs font-normal text-zinc-400">({currentXp} XP)</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${xpPercentage}%` }} />
            </div>
          </div>

          {/* Quizzes Mastered Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">{t('quizzesTaken')}</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {stats?.totalQuizzesTaken || 0} <span className="text-xs font-normal text-zinc-400">{t('completed')}</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Avg Score: {stats?.averageQuizScore || 85}%
            </p>
          </div>

          {/* Flashcards Mastered Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500">{t('flashcardMastery')}</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {stats?.totalFlashcardsMastered || 0} <span className="text-xs font-normal text-zinc-400">{t('cards')}</span>
            </div>
            <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
              Active recall spaced repetition
            </p>
          </div>
        </div>

        {/* 2-Column Dashboard Grid: Left Recent Chats, Right Recommended Tools */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Recent Study Chats */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                {t('recentSessions')}
              </h3>
              <button
                onClick={() => onNavigate('chat')}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t('viewAll')}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {(stats?.recentConversations || []).length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  No previous chat sessions. Ask your first question!
                </div>
              ) : (
                stats?.recentConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onNavigate('chat');
                    }}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-indigo-500/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {conv.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        Mode: {conv.studyMode} • {new Date(conv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Study Tools Quick Actions */}
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Recommended Study Actions
              </h3>
              <button
                onClick={() => onNavigate('tools')}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                All 10 Tools
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate('tools')}
                className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-left hover:border-indigo-500 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mb-1.5" />
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Generate Notes</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Create structured textbook notes</p>
              </button>

              <button
                onClick={() => onNavigate('quizzes')}
                className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-left hover:border-emerald-500 transition-all cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Practice Quiz</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Test your active recall</p>
              </button>

              <button
                onClick={() => onNavigate('flashcards')}
                className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-left hover:border-amber-500 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400 mb-1.5" />
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Review Flashcards</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">3D Spaced repetition flip cards</p>
              </button>

              <button
                onClick={() => onNavigate('documents')}
                className="p-3.5 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/60 text-left hover:border-cyan-500 transition-all cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400 mb-1.5" />
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100">Upload Syllabus</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Chat with course materials</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
