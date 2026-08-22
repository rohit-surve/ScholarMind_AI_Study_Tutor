import { 
  User, 
  Conversation, 
  Message, 
  Subject, 
  Topic, 
  Note, 
  FlashcardDeck, 
  Quiz, 
  QuizResult, 
  StudyPlan, 
  StudyDocument, 
  DashboardStats,
  StudyMode 
} from '../types';

const TOKEN_KEY = 'scholar_mind_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async signup(data: { name: string; email: string; password: string; studyGoal?: string }) {
    return request<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(data: { email: string; password: string }) {
    return request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async demoLogin() {
    return request<{ token: string; user: User }>('/api/auth/demo-login', {
      method: 'POST',
    });
  },

  async getMe() {
    return request<{ user: User }>('/api/auth/me');
  },

  async updateProfile(data: Partial<User>) {
    return request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Conversations
  async getConversations() {
    return request<{ conversations: Conversation[] }>('/api/conversations');
  },

  async getConversation(id: string) {
    return request<{ conversation: Conversation; messages: Message[] }>(`/api/conversations/${id}`);
  },

  async createConversation(data: {
    title?: string;
    studyMode?: StudyMode;
    subjectId?: string;
    topicId?: string;
    documentId?: string;
    documentName?: string;
  }) {
    return request<{ conversation: Conversation }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateConversation(id: string, data: { title?: string; studyMode?: StudyMode }) {
    return request<{ conversation: Conversation }>(`/api/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteConversation(id: string) {
    return request<{ success: boolean }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  // Streaming Chat Client
  async streamChat(
    params: {
      conversationId?: string;
      content: string;
      studyMode?: StudyMode;
      responseLanguage?: string;
      documentId?: string;
    },
    callbacks: {
      onInit?: (data: { conversationId: string }) => void;
      onChunk: (text: string) => void;
      onDone: (data: { message: Message; xpAwarded?: number; newXp?: number }) => void;
      onError: (err: string) => void;
    },
    abortSignal?: AbortSignal
  ) {
    const token = getStoredToken();
    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
        signal: abortSignal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Streaming request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'init' && callbacks.onInit) {
                callbacks.onInit(data);
              } else if (data.type === 'chunk') {
                callbacks.onChunk(data.text);
              } else if (data.type === 'done') {
                callbacks.onDone(data);
              } else if (data.type === 'error') {
                callbacks.onError(data.error);
              }
            } catch (e) {
              console.warn('Failed to parse SSE line:', line);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        callbacks.onError(err.message || 'Stream encountered an error');
      }
    }
  },

  // Study Tools
  async generateNotes(data: {
    topic: string;
    subject?: string;
    detailLevel?: 'concise' | 'standard' | 'comprehensive';
    autoSave?: boolean;
    subjectId?: string;
    topicId?: string;
  }) {
    return request<{ notes: string; note?: Note }>('/api/study-tools/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async summarizeText(data: {
    text: string;
    format?: 'bullet_points' | 'executive' | 'key_takeaways' | 'simplified';
  }) {
    return request<{ summary: string }>('/api/study-tools/summarize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateQuiz(data: {
    topic: string;
    subject?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    questionCount?: number;
    documentText?: string;
    autoSave?: boolean;
    subjectId?: string;
    topicId?: string;
  }) {
    return request<{ quiz: Quiz }>('/api/study-tools/generate-quiz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateFlashcards(data: {
    topic: string;
    subject?: string;
    cardCount?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    sourceText?: string;
    autoSave?: boolean;
    subjectId?: string;
    topicId?: string;
  }) {
    return request<{ deck: FlashcardDeck }>('/api/study-tools/generate-flashcards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateStudyPlan(data: {
    goal: string;
    subject?: string;
    daysCount?: number;
    dailyHours?: number;
    currentLevel?: string;
    autoSave?: boolean;
    subjectId?: string;
  }) {
    return request<{ plan: StudyPlan }>('/api/study-tools/generate-plan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async explainCode(data: { code: string; language?: string }) {
    return request<{ explanation: string }>('/api/study-tools/explain-code', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async solveDoubt(data: { doubt: string; subject?: string }) {
    return request<{ solution: string }>('/api/study-tools/solve-doubt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async explainTopic(data: { topic: string; level?: '5yo' | 'high_school' | 'college' | 'expert' | 'all' }) {
    return request<{ explanation: string }>('/api/study-tools/explain-topic', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateQuestions(data: { topic: string; type?: 'conceptual' | 'numerical' | 'coding' | 'mixed' }) {
    return request<{ questions: string }>('/api/study-tools/generate-questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Subjects & Topics
  async getSubjects() {
    return request<{ subjects: Subject[] }>('/api/subjects');
  },

  async createSubject(data: { name: string; color?: string; icon?: string; description?: string }) {
    return request<{ subject: Subject }>('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSubject(id: string, data: Partial<Subject>) {
    return request<{ subject: Subject }>(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSubject(id: string) {
    return request<{ success: boolean }>(`/api/subjects/${id}`, {
      method: 'DELETE',
    });
  },

  async getTopics(subjectId: string) {
    return request<{ topics: Topic[] }>(`/api/subjects/${subjectId}/topics`);
  },

  async createTopic(data: { subjectId: string; name: string; summary?: string }) {
    return request<{ topic: Topic }>('/api/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTopic(id: string, data: Partial<Topic>) {
    return request<{ topic: Topic }>(`/api/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleTopic(id: string) {
    return request<{ topic: Topic }>(`/api/topics/${id}/toggle`, {
      method: 'PUT',
    });
  },

  async deleteTopic(id: string) {
    return request<{ success: boolean }>(`/api/topics/${id}`, {
      method: 'DELETE',
    });
  },

  // Notes
  async getNotes(subjectId?: string) {
    const url = subjectId ? `/api/notes?subjectId=${subjectId}` : '/api/notes';
    return request<{ notes: Note[] }>(url);
  },

  async createNote(data: Partial<Note>) {
    return request<{ note: Note }>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateNote(id: string, data: Partial<Note>) {
    return request<{ note: Note }>(`/api/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteNote(id: string) {
    return request<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE',
    });
  },

  // Flashcards
  async getFlashcards() {
    return request<{ decks: FlashcardDeck[] }>('/api/flashcards');
  },

  async getFlashcardDeck(id: string) {
    return request<{ deck: FlashcardDeck }>(`/api/flashcards/${id}`);
  },

  async createFlashcardDeck(data: Partial<FlashcardDeck>) {
    return request<{ deck: FlashcardDeck }>('/api/flashcards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCardMastery(deckId: string, cardId: string, mastered: boolean) {
    return request<{ card: any }>(`/api/flashcards/${deckId}/cards/${cardId}/mastery`, {
      method: 'PUT',
      body: JSON.stringify({ mastered }),
    });
  },

  async deleteFlashcardDeck(id: string) {
    return request<{ success: boolean }>(`/api/flashcards/${id}`, {
      method: 'DELETE',
    });
  },

  // Quizzes & Results
  async getQuizzes() {
    return request<{ quizzes: Quiz[] }>('/api/quizzes');
  },

  async getQuiz(id: string) {
    return request<{ quiz: Quiz }>(`/api/quizzes/${id}`);
  },

  async submitQuiz(id: string, data: { answers: Record<string, number>; timeSpentSeconds: number }) {
    return request<{ result: QuizResult; earnedXp: number; currentXp: number; level: number }>(`/api/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getQuizResults() {
    return request<{ results: QuizResult[] }>('/api/quiz-results');
  },

  // Study Plans
  async getStudyPlans() {
    return request<{ plans: StudyPlan[] }>('/api/study-plans');
  },

  async togglePlanTask(planId: string, taskId: string) {
    return request<{ task: any }>(`/api/study-plans/${planId}/tasks/${taskId}/toggle`, {
      method: 'PUT',
    });
  },

  async deleteStudyPlan(id: string) {
    return request<{ success: boolean }>(`/api/study-plans/${id}`, {
      method: 'DELETE',
    });
  },

  // Documents
  async getDocuments() {
    return request<{ documents: StudyDocument[] }>('/api/documents');
  },

  async getDocument(id: string) {
    return request<{ document: StudyDocument }>(`/api/documents/${id}`);
  },

  async uploadDocument(data: {
    title?: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    rawText: string;
  }) {
    return request<{ document: StudyDocument }>('/api/documents/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteDocument(id: string) {
    return request<{ success: boolean }>(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // Dashboard Stats
  async getDashboardStats() {
    return request<{ stats: DashboardStats }>('/api/dashboard/stats');
  }
};
