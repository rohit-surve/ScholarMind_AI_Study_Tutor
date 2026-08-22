import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Sparkles, 
  Trash2, 
  ChevronRight, 
  Target,
  Trophy
} from 'lucide-react';
import { StudyPlan } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface PlannerViewProps {
  onOpenPlannerGenerator: () => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({ onOpenPlannerGenerator }) => {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await api.getStudyPlans();
      setPlans(res.plans || []);
      if (res.plans?.length > 0 && !activePlanId) {
        setActivePlanId(res.plans[0].id);
      }
    } catch (err) {
      console.error('Failed to load study plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const activePlan = plans.find(p => p.id === activePlanId) || plans[0];

  const handleToggleTask = async (planId: string, taskId: string) => {
    try {
      await api.togglePlanTask(planId, taskId);
      loadPlans();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeletePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this study plan?')) return;
    try {
      await api.deleteStudyPlan(id);
      setPlans(prev => prev.filter(p => p.id !== id));
      if (activePlanId === id) setActivePlanId(null);
    } catch (err) {
      console.error('Failed to delete study plan:', err);
    }
  };

  // Calculate plan completion statistics
  const totalTasks = activePlan?.weeklySchedule?.flatMap(s => s.tasks) || [];
  const completedTasks = totalTasks.filter(t => t.completed);
  const completionPercent = totalTasks.length > 0
    ? Math.round((completedTasks.length / totalTasks.length) * 100)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {t('planner')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t('planner')}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Structured day-by-day learning roadmaps with realistic hours and actionable task checklists.
            </p>
          </div>

          <button
            onClick={onOpenPlannerGenerator}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('studyTools')}</span>
          </button>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Plans List */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Active Plans ({plans.length})
            </h2>

            {plans.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
                No study plans generated yet. Click "Generate Study Roadmap" to begin.
              </div>
            ) : (
              plans.map(p => {
                const isSelected = activePlan?.id === p.id;
                const pTasks = p.weeklySchedule?.flatMap(s => s.tasks) || [];
                const pDone = pTasks.filter(t => t.completed).length;
                const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    onClick={() => setActivePlanId(p.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-white/70 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {p.title || p.targetGoal}
                      </h3>
                      <button
                        onClick={e => handleDeletePlan(p.id, e)}
                        className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                      Target: {p.targetGoal} • {p.dailyHours || 2}h/day
                    </p>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{pDone}/{pTasks.length} Tasks Complete</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{pct}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Daily Schedule Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {activePlan ? (
              <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                {/* Plan Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 text-xs text-zinc-500">
                      <Target className="w-4 h-4 text-indigo-500" />
                      <span>{activePlan.title}</span>
                      <span>•</span>
                      <span>Target: {activePlan.targetDate || 'Upcoming Exam'}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {activePlan.targetGoal}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                      {completionPercent}% Completed
                    </span>
                  </div>
                </div>

                {/* Day-by-Day Schedule List */}
                <div className="space-y-4">
                  {(activePlan.weeklySchedule || []).map((dayItem, dIdx) => (
                    <div
                      key={dayItem.day || dIdx}
                      className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                            {dayItem.day}
                          </span>
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {dayItem.focus}
                          </h3>
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-2 pt-1">
                        {(dayItem.tasks || []).map(task => (
                          <div
                            key={task.id}
                            onClick={() => handleToggleTask(activePlan.id, task.id)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 cursor-pointer hover:border-zinc-300 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <button className="text-zinc-400 hover:text-emerald-500 shrink-0">
                                {task.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <span className={`text-xs ${
                                task.completed
                                  ? 'line-through text-zinc-400 dark:text-zinc-500'
                                  : 'text-zinc-800 dark:text-zinc-200 font-medium'
                              }`}>
                                {task.task}
                              </span>
                            </div>

                            <span className="text-[10px] font-mono text-zinc-400 shrink-0 pl-2">
                              {task.durationMinutes}m
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-16 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
                Select a plan from the left to view your daily schedule.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
