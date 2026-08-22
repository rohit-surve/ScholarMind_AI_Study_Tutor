import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Settings, 
  Target, 
  Sparkles, 
  Check, 
  Moon, 
  Sun, 
  ShieldCheck, 
  Zap,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { StudyMode } from '../../types';
import { MODE_DETAILS } from '../common/StudyModeBadge';
import { useLanguage } from '../../context/LanguageContext';

export const SettingsView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [studyGoal, setStudyGoal] = useState(user?.studyGoal || '');
  const [preferredMode, setPreferredMode] = useState<StudyMode>(user?.preferredMode || 'tutor');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        studyGoal: studyGoal.trim(),
        preferredMode,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {t('accountPreferences')}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('profileSettings')}
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Customize your academic focus, preferred pedagogical teaching mode, and theme.
          </p>
        </div>

        {/* Profile Card Form */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'Student')}`}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 border border-zinc-200 dark:border-zinc-700 object-cover shadow-sm"
            />
            <div>
              <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{user?.name}</h2>
              <p className="text-xs text-zinc-500 font-mono">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  Level {user?.level || 1} • {user?.xp || 100} XP
                </span>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                  {user?.streak || 1} Day Streak
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('displayName')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('academicGoal')}
              </label>
              <input
                type="text"
                value={studyGoal}
                onChange={e => setStudyGoal(e.target.value)}
                placeholder="e.g. Master Advanced Machine Learning & Algorithms for Spring Semester"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                {t('defaultStudyMode')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(Object.keys(MODE_DETAILS) as StudyMode[]).map(modeKey => {
                  const detail = MODE_DETAILS[modeKey];
                  const Icon = detail.icon;
                  const isSelected = preferredMode === modeKey;
                  return (
                    <button
                      type="button"
                      key={modeKey}
                      onClick={() => setPreferredMode(modeKey)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 shadow-2xs'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${detail.color}`} />
                        <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          {detail.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2">
                        {detail.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
              >
                {saved ? <Check className="w-4 h-4 text-white" /> : null}
                <span>{saved ? t('changesSaved') : t('savePreferences')}</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                <span>Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode</span>
              </button>
            </div>
          </form>
        </div>

        {/* AI & Security Info */}
        <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs space-y-3 text-xs text-zinc-600 dark:text-zinc-400">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            AI Architecture & Privacy Security
          </h3>
          <p>
            ScholarMind operates on a strict server-side proxy architecture utilizing the official Google GenAI SDK. No API keys or credentials are ever exposed to client network traffic.
          </p>
          <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span>Model: Gemini 3.7 Flash</span>
            <span>Auth: JWT Bearer Tokens</span>
            <span>RAG Grounding: Multi-format text synthesis</span>
          </div>
        </div>
      </div>
    </div>
  );
};
