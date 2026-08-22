import React from 'react';
import { 
  Sparkles, 
  Flame, 
  Moon, 
  Sun, 
  Menu, 
  User as UserIcon,
  LogOut,
  Trophy,
  BookOpen,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onToggleSidebar, 
  onNewChat, 
  activeView, 
  setActiveView 
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  // Calculate XP progress within current level (500 XP per level)
  const currentXp = user?.xp || 100;
  const level = user?.level || 1;
  const xpInLevel = currentXp % 500;
  const xpPercentage = Math.min(100, Math.round((xpInLevel / 500) * 100));

  return (
    <header
      id="app-navbar"
      className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30 select-none"
    >
      {/* Left side: Hamburger, Logo & New Chat */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          aria-label={t('aiStudyChat')}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div 
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-zinc-900 dark:text-zinc-100 text-base">
                Scholar<span className="text-indigo-600 dark:text-indigo-400">Mind</span>
              </span>
              <span className="px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                AI Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Intelligent Study Assistant
            </p>
          </div>
        </div>

        <button
          id="btn-quick-new-chat"
          onClick={onNewChat}
          className="hidden md:flex items-center gap-1.5 ml-4 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold border border-indigo-200 dark:border-indigo-800/60 transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('newChat')}</span>
        </button>
      </div>

      {/* Right side: Streak, XP/Level, Theme Toggle, User Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Study Streak Counter */}
        <div 
          id="navbar-streak-counter"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-xs font-semibold shadow-2xs"
          title={`${user?.streak || 1} Day Study Streak`}
        >
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          <span>{user?.streak || 1}d {t('studyStreak')}</span>
        </div>

        {/* Level & XP Progress Bar */}
        <div 
          id="navbar-level-badge"
          className="hidden lg:flex items-center gap-2.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
        >
          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Lvl {level}</span>
          </div>
          <div className="w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <span className="text-zinc-500 dark:text-zinc-400 text-[11px] font-medium font-mono">
            {xpInLevel}/500 XP
          </span>
        </div>

        <LanguageSelector value={language.code} onChange={setLanguage} compact />

        {/* Dark/Light Theme Toggle */}
        <button
          id="btn-theme-toggle"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          aria-label="Toggle Theme"
          title={t('settings')}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* User Profile Button */}
        {user ? (
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <button
              id="btn-user-profile-header"
              onClick={() => setActiveView('settings')}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-left"
            >
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
                className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 border border-zinc-200 dark:border-zinc-700 object-cover"
              />
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-tight truncate max-w-[110px]">
                  {user.name}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none">
                  {t('student')}
                </p>
              </div>
            </button>

            <button
              id="btn-user-logout"
              onClick={logout}
              className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title={t('logOut')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setActiveView('auth')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition-colors"
          >
            {t('signIn')}
          </button>
        )}
      </div>
    </header>
  );
};
