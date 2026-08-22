import React from 'react';
import { 
  GraduationCap, 
  Flame, 
  Sparkles, 
  Code2, 
  HelpCircle, 
  Zap 
} from 'lucide-react';
import { StudyMode } from '../../types';

export const MODE_DETAILS: Record<StudyMode, {
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
}> = {
  tutor: {
    name: 'Socratic Tutor',
    icon: GraduationCap,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10 dark:bg-indigo-950/40',
    borderColor: 'border-indigo-500/30',
    description: 'Guiding questions & deep conceptual understanding'
  },
  exam: {
    name: 'Exam Prep',
    icon: Flame,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10 dark:bg-rose-950/40',
    borderColor: 'border-rose-500/30',
    description: 'High-yield definitions, traps & exam-style marking'
  },
  beginner: {
    name: 'Beginner (ELI5)',
    icon: Sparkles,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 dark:bg-amber-950/40',
    borderColor: 'border-amber-500/30',
    description: 'Simple analogies & jargon-free foundations'
  },
  coding: {
    name: 'Coding & CS',
    icon: Code2,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 dark:bg-cyan-950/40',
    borderColor: 'border-cyan-500/30',
    description: 'Clean typed code, Big-O complexity & optimization'
  },
  quiz: {
    name: 'Interactive Quiz',
    icon: HelpCircle,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-500/30',
    description: 'Challenging test questions & active recall'
  },
  quick_revision: {
    name: 'Quick Revision',
    icon: Zap,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10 dark:bg-violet-950/40',
    borderColor: 'border-violet-500/30',
    description: 'High-density bullet points & formula cheat sheets'
  }
};

export const StudyModeBadge: React.FC<{ mode: StudyMode; size?: 'sm' | 'md' }> = ({ mode, size = 'sm' }) => {
  const detail = MODE_DETAILS[mode] || MODE_DETAILS.tutor;
  const Icon = detail.icon;

  return (
    <span
      id={`study-mode-badge-${mode}`}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${detail.bgColor} ${detail.color} ${detail.borderColor} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{detail.name}</span>
    </span>
  );
};
