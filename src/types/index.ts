export type StudyMode = 
  | 'tutor' 
  | 'exam' 
  | 'beginner' 
  | 'coding' 
  | 'quiz' 
  | 'quick_revision';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  studyGoal?: string;
  preferredMode?: StudyMode;
  streak: number;
  lastActiveDate: string;
  xp: number;
  level: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: StudyMode;
  timestamp: string;
  documentId?: string;
  documentName?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  studyMode: StudyMode;
  subjectId?: string;
  topicId?: string;
  documentId?: string;
  documentName?: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  topicsCount?: number;
  completedTopicsCount?: number;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  userId: string;
  name: string;
  summary?: string;
  completed: boolean;
  masteryLevel: 'not_started' | 'learning' | 'mastered';
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  subjectId?: string;
  topicId?: string;
  title: string;
  content: string;
  tags: string[];
  summary?: string;
  keyTakeaways?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mastered?: boolean;
}

export interface FlashcardDeck {
  id: string;
  userId: string;
  subjectId?: string;
  topicId?: string;
  title: string;
  description?: string;
  cards: Flashcard[];
  createdAt: string;
  masteredCount?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic?: string;
}

export interface Quiz {
  id: string;
  userId: string;
  subjectId?: string;
  topicId?: string;
  title: string;
  topicName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimitMinutes: number;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  answers: {
    questionId: string;
    question: string;
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
    explanation: string;
  }[];
  completedAt: string;
}

export interface StudyTask {
  id: string;
  task: string;
  durationMinutes: number;
  completed: boolean;
}

export interface StudyDayPlan {
  day: string;
  focus: string;
  tasks: StudyTask[];
}

export interface StudyPlan {
  id: string;
  userId: string;
  subjectId?: string;
  title: string;
  targetGoal: string;
  targetDate: string;
  dailyHours: number;
  weeklySchedule: StudyDayPlan[];
  createdAt: string;
}

export interface StudyDocument {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  rawText: string;
  summary?: string;
  keyTopics?: string[];
  chunksCount: number;
  createdAt: string;
}

export interface DashboardStats {
  totalQuestionsAsked: number;
  totalStudySessions: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  studyStreakDays: number;
  totalSubjects: number;
  totalTopics: number;
  completedTopics: number;
  totalFlashcardsMastered: number;
  totalNotesCreated: number;
  xp: number;
  level: number;
  recentConversations: Conversation[];
  upcomingTasks: {
    id: string;
    planId: string;
    task: string;
    day: string;
    completed: boolean;
  }[];
  recentQuizResults: QuizResult[];
}
