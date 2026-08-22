import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { aiService } from './server/ai.js';
import { authMiddleware, generateToken, AuthRequest, optionalAuthMiddleware } from './server/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with 50mb limit for documents & study files
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ----------------------------------------------------
  // Health & System Info
  // ----------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'ScholarMind AI Study Assistant API',
      timestamp: new Date().toISOString(),
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  // ----------------------------------------------------
  // AUTHENTICATION ROUTES
  // ----------------------------------------------------
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { name, email, password, studyGoal } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const existing = db.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const user = db.createUser({
        name,
        email,
        passwordHash,
        studyGoal: studyGoal || 'Master my subjects with AI',
        preferredMode: 'tutor',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      });

      const token = generateToken({ id: user.id, email: user.email, name: user.name });
      const { passwordHash: _, ...safeUser } = user;
      res.status(201).json({ token, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Signup failed' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update streak/xp
      db.addXp(user.id, 10);

      const token = generateToken({ id: user.id, email: user.email, name: user.name });
      const { passwordHash: _, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  // Demo 1-Click Login for immediate preview & grading
  app.post('/api/auth/demo-login', async (req: Request, res: Response) => {
    try {
      const demoUser = db.getUserById('demo-user-101') || db.getUserByEmail('alex@student.edu');
      if (!demoUser) {
        return res.status(500).json({ error: 'Demo user unavailable' });
      }

      db.addXp(demoUser.id, 15);
      const token = generateToken({ id: demoUser.id, email: demoUser.email, name: demoUser.name });
      const { passwordHash: _, ...safeUser } = demoUser;
      res.json({ token, user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Demo login failed' });
    }
  });

  app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
    const user = db.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser });
  });

  app.put('/api/auth/profile', authMiddleware, (req: AuthRequest, res: Response) => {
    const { name, studyGoal, preferredMode, avatar } = req.body;
    const updated = db.updateUser(req.user!.id, {
      ...(name ? { name } : {}),
      ...(studyGoal ? { studyGoal } : {}),
      ...(preferredMode ? { preferredMode } : {}),
      ...(avatar ? { avatar } : {}),
    });
    if (!updated) return res.status(404).json({ error: 'User not found' });
    const { passwordHash: _, ...safeUser } = updated;
    res.json({ user: safeUser });
  });

  // ----------------------------------------------------
  // CONVERSATIONS & CHAT
  // ----------------------------------------------------
  app.get('/api/conversations', authMiddleware, (req: AuthRequest, res: Response) => {
    const convs = db.getConversations(req.user!.id);
    res.json({ conversations: convs });
  });

  app.post('/api/conversations', authMiddleware, (req: AuthRequest, res: Response) => {
    const { title, studyMode, subjectId, topicId, documentId, documentName } = req.body;
    const newConv = db.createConversation({
      userId: req.user!.id,
      title: title || 'New Study Session',
      studyMode: studyMode || 'tutor',
      subjectId: subjectId || null,
      topicId: topicId || null,
      documentId: documentId || null,
      documentName: documentName || null,
    });
    res.status(201).json({ conversation: newConv });
  });

  app.get('/api/conversations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const conv = db.getConversationById(req.params.id);
    if (!conv || conv.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const messages = db.getMessages(conv.id);
    res.json({ conversation: conv, messages });
  });

  app.put('/api/conversations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const { title, studyMode } = req.body;
    const conv = db.getConversationById(req.params.id);
    if (!conv || conv.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const updated = db.updateConversation(conv.id, {
      ...(title ? { title } : {}),
      ...(studyMode ? { studyMode } : {}),
    });
    res.json({ conversation: updated });
  });

  app.delete('/api/conversations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const conv = db.getConversationById(req.params.id);
    if (!conv || conv.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    db.deleteConversation(conv.id, req.user!.id);
    res.json({ success: true });
  });

  // Server-Sent Events (SSE) Streaming Chat Route
  app.post('/api/chat/stream', authMiddleware, async (req: AuthRequest, res: Response) => {
    const { conversationId, content, studyMode, responseLanguage, documentId } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let targetConv = conversationId ? db.getConversationById(conversationId) : null;
    if (!targetConv || targetConv.userId !== req.user!.id) {
      // Auto-create conversation if not provided
      targetConv = db.createConversation({
        userId: req.user!.id,
        title: content.slice(0, 35) + (content.length > 35 ? '...' : ''),
        studyMode: studyMode || 'tutor',
        documentId: documentId || null,
      });
    }

    // Save user message to database
    db.addMessage({
      conversationId: targetConv.id,
      role: 'user',
      content,
      mode: studyMode || targetConv.studyMode,
    });

    // Check for document context if attached
    let docContext = '';
    const activeDocId = documentId || targetConv.documentId;
    if (activeDocId) {
      const doc = db.getDocumentById(activeDocId, req.user!.id);
      if (doc && doc.rawText) {
        docContext = `DOCUMENT TITLE: ${doc.title}\n${doc.rawText.slice(0, 12000)}`;
      }
    }

    // Retrieve previous messages for context
    const allMessages = db.getMessages(targetConv.id);
    const history = allMessages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send initial metadata
    res.write(`data: ${JSON.stringify({ type: 'init', conversationId: targetConv.id })}\n\n`);

    let fullAssistantReply = '';

    try {
      const streamGenerator = aiService.streamChat({
        messages: history,
        studyMode: studyMode || targetConv.studyMode,
        responseLanguage,
        documentContext: docContext,
      });

      for await (const chunk of streamGenerator) {
        fullAssistantReply += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      }

      // Save assistant message to database
      const assistantMsg = db.addMessage({
        conversationId: targetConv.id,
        role: 'assistant',
        content: fullAssistantReply,
        mode: studyMode || targetConv.studyMode,
      });

      // Award XP for asking questions and studying
      const xpResult = db.addXp(req.user!.id, 20);

      res.write(`data: ${JSON.stringify({ type: 'done', message: assistantMsg, xpAwarded: 20, newXp: xpResult?.xp })}\n\n`);
      res.end();
    } catch (err: any) {
      console.error('Streaming error in chat route:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'Stream processing failed' })}\n\n`);
      res.end();
    }
  });

  // ----------------------------------------------------
  // STUDY TOOLS API
  // ----------------------------------------------------

  // 1. Notes Generator
  app.post('/api/study-tools/notes', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { topic, subject, detailLevel, autoSave, subjectId, topicId } = req.body;
      if (!topic) return res.status(400).json({ error: 'Topic is required' });

      const notesContent = await aiService.generateNotes(topic, subject, detailLevel);
      
      let savedNote = null;
      if (autoSave !== false) {
        savedNote = db.createNote({
          userId: req.user!.id,
          subjectId: subjectId || null,
          topicId: topicId || null,
          title: `Notes: ${topic}`,
          content: notesContent,
          tags: [subject || 'General Study', 'AI Notes'],
          summary: `Comprehensive study notes on ${topic}`,
        });
      }

      db.addXp(req.user!.id, 25);
      res.json({ notes: notesContent, note: savedNote });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate notes' });
    }
  });

  // 2. Text Summarizer
  app.post('/api/study-tools/summarize', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { text, format } = req.body;
      if (!text) return res.status(400).json({ error: 'Text content is required' });

      const summary = await aiService.summarizeText(text, format);
      db.addXp(req.user!.id, 15);
      res.json({ summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to summarize text' });
    }
  });

  // 3. MCQ / Quiz Generator
  app.post('/api/study-tools/generate-quiz', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { topic, subject, difficulty, questionCount, documentText, autoSave, subjectId, topicId } = req.body;
      if (!topic) return res.status(400).json({ error: 'Topic is required' });

      const quizData = await aiService.generateQuiz({
        topic,
        subject,
        difficulty: difficulty || 'medium',
        questionCount: questionCount || 5,
        documentText,
      });

      let savedQuiz = null;
      if (autoSave !== false) {
        savedQuiz = db.createQuiz({
          userId: req.user!.id,
          subjectId: subjectId || null,
          topicId: topicId || null,
          title: quizData.title || `${topic} Quiz`,
          topicName: topic,
          difficulty: difficulty || 'medium',
          timeLimitMinutes: Math.max(5, (questionCount || 5) * 2),
          questions: (quizData.questions || []).map((q: any, i: number) => ({
            id: `q-${Date.now()}-${i}`,
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            topic: q.topic || topic,
          })),
        });
      }

      db.addXp(req.user!.id, 30);
      res.json({ quiz: savedQuiz || quizData });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate quiz' });
    }
  });

  // 4. Flashcard Generator
  app.post('/api/study-tools/generate-flashcards', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { topic, subject, cardCount, difficulty, sourceText, autoSave, subjectId, topicId } = req.body;
      if (!topic) return res.status(400).json({ error: 'Topic is required' });

      const deckData = await aiService.generateFlashcards({
        topic,
        subject,
        cardCount: cardCount || 8,
        difficulty: difficulty || 'medium',
        sourceText,
      });

      let savedDeck = null;
      if (autoSave !== false) {
        savedDeck = db.createFlashcardDeck({
          userId: req.user!.id,
          subjectId: subjectId || null,
          topicId: topicId || null,
          title: deckData.title || `${topic} Flashcards`,
          description: deckData.description || `Active recall deck on ${topic}`,
          cards: deckData.cards || [],
        });
      }

      db.addXp(req.user!.id, 25);
      res.json({ deck: savedDeck || deckData });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate flashcards' });
    }
  });

  // 5. Study Plan Generator
  app.post('/api/study-tools/generate-plan', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { goal, subject, daysCount, dailyHours, currentLevel, autoSave, subjectId } = req.body;
      if (!goal) return res.status(400).json({ error: 'Study goal is required' });

      const planData = await aiService.generateStudyPlan({
        goal,
        subject,
        daysCount: daysCount || 7,
        dailyHours: dailyHours || 2,
        currentLevel: currentLevel || 'intermediate',
      });

      let savedPlan = null;
      if (autoSave !== false) {
        savedPlan = db.createStudyPlan({
          userId: req.user!.id,
          subjectId: subjectId || null,
          title: planData.title || `${goal} Plan`,
          targetGoal: goal,
          targetDate: new Date(Date.now() + (daysCount || 7) * 86400000).toISOString().split('T')[0],
          dailyHours: dailyHours || 2,
          weeklySchedule: (planData.weeklySchedule || []).map((day: any, dIdx: number) => ({
            day: day.day,
            focus: day.focus,
            tasks: (day.tasks || []).map((t: any, tIdx: number) => ({
              id: `task-${dIdx}-${tIdx}-${Date.now()}`,
              task: t.task,
              durationMinutes: t.durationMinutes || 30,
              completed: false,
            })),
          })),
        });
      }

      db.addXp(req.user!.id, 35);
      res.json({ plan: savedPlan || planData });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate study plan' });
    }
  });

  // 6. Code Explainer
  app.post('/api/study-tools/explain-code', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { code, language } = req.body;
      if (!code) return res.status(400).json({ error: 'Code snippet is required' });

      const explanation = await aiService.explainCode(code, language);
      db.addXp(req.user!.id, 20);
      res.json({ explanation });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to explain code' });
    }
  });

  // 7. Doubt Solver
  app.post('/api/study-tools/solve-doubt', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { doubt, subject } = req.body;
      if (!doubt) return res.status(400).json({ error: 'Doubt description is required' });

      const solution = await aiService.solveDoubt(doubt, subject);
      db.addXp(req.user!.id, 20);
      res.json({ solution });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to solve doubt' });
    }
  });

  // 8. Multi-Level Topic Explainer
  app.post('/api/study-tools/explain-topic', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { topic, level } = req.body;
      if (!topic) return res.status(400).json({ error: 'Topic is required' });

      const explanation = await aiService.explainTopic(topic, level || 'all');
      db.addXp(req.user!.id, 20);
      res.json({ explanation });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to explain topic' });
    }
  });

  // 9. Practice Questions Generator
  app.post('/api/study-tools/generate-questions', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { topic, type } = req.body;
      if (!topic) return res.status(400).json({ error: 'Topic is required' });

      const questions = await aiService.generateQuestions(topic, type || 'mixed');
      db.addXp(req.user!.id, 20);
      res.json({ questions });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate questions' });
    }
  });

  // ----------------------------------------------------
  // SUBJECTS & TOPICS ROUTES
  // ----------------------------------------------------
  app.get('/api/subjects', authMiddleware, (req: AuthRequest, res: Response) => {
    const subjects = db.getSubjects(req.user!.id);
    res.json({ subjects });
  });

  app.post('/api/subjects', authMiddleware, (req: AuthRequest, res: Response) => {
    const { name, color, icon, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Subject name is required' });

    const newSub = db.createSubject({
      userId: req.user!.id,
      name,
      color: color || '#6366f1',
      icon: icon || 'BookOpen',
      description: description || '',
    });
    res.status(201).json({ subject: newSub });
  });

  app.put('/api/subjects/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const updated = db.updateSubject(req.params.id, req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Subject not found' });
    res.json({ subject: updated });
  });

  app.delete('/api/subjects/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    db.deleteSubject(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  app.get('/api/subjects/:id/topics', authMiddleware, (req: AuthRequest, res: Response) => {
    const topics = db.getTopics(req.params.id, req.user!.id);
    res.json({ topics });
  });

  app.post('/api/topics', authMiddleware, (req: AuthRequest, res: Response) => {
    const { subjectId, name, summary } = req.body;
    if (!subjectId || !name) return res.status(400).json({ error: 'Subject ID and topic name required' });

    const newTopic = db.createTopic({
      subjectId,
      userId: req.user!.id,
      name,
      summary: summary || '',
    });
    res.status(201).json({ topic: newTopic });
  });

  app.put('/api/topics/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const updated = db.updateTopic(req.params.id, req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Topic not found' });
    res.json({ topic: updated });
  });

  app.put('/api/topics/:id/toggle', authMiddleware, (req: AuthRequest, res: Response) => {
    const allTopics = db.getAllTopics(req.user!.id);
    const target = allTopics.find(t => t.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'Topic not found' });

    const newCompleted = !target.completed;
    const updated = db.updateTopic(target.id, req.user!.id, {
      completed: newCompleted,
      masteryLevel: newCompleted ? 'mastered' : 'learning',
    });

    if (newCompleted) {
      db.addXp(req.user!.id, 40);
    }

    res.json({ topic: updated });
  });

  app.delete('/api/topics/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    db.deleteTopic(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // NOTES ROUTES
  // ----------------------------------------------------
  app.get('/api/notes', authMiddleware, (req: AuthRequest, res: Response) => {
    const subjectId = req.query.subjectId as string | undefined;
    const notes = db.getNotes(req.user!.id, subjectId);
    res.json({ notes });
  });

  app.post('/api/notes', authMiddleware, (req: AuthRequest, res: Response) => {
    const { title, content, tags, subjectId, topicId, summary, keyTakeaways } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    const newNote = db.createNote({
      userId: req.user!.id,
      title,
      content,
      tags: tags || [],
      subjectId: subjectId || null,
      topicId: topicId || null,
      summary: summary || '',
      keyTakeaways: keyTakeaways || [],
    });
    db.addXp(req.user!.id, 15);
    res.status(201).json({ note: newNote });
  });

  app.put('/api/notes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const updated = db.updateNote(req.params.id, req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Note not found' });
    res.json({ note: updated });
  });

  app.delete('/api/notes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    db.deleteNote(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // FLASHCARDS ROUTES
  // ----------------------------------------------------
  app.get('/api/flashcards', authMiddleware, (req: AuthRequest, res: Response) => {
    const decks = db.getFlashcardDecks(req.user!.id);
    res.json({ decks });
  });

  app.get('/api/flashcards/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const deck = db.getFlashcardDeckById(req.params.id, req.user!.id);
    if (!deck) return res.status(404).json({ error: 'Flashcard deck not found' });
    res.json({ deck });
  });

  app.post('/api/flashcards', authMiddleware, (req: AuthRequest, res: Response) => {
    const { title, description, cards, subjectId, topicId } = req.body;
    if (!title) return res.status(400).json({ error: 'Deck title is required' });

    const newDeck = db.createFlashcardDeck({
      userId: req.user!.id,
      title,
      description: description || '',
      cards: cards || [],
      subjectId: subjectId || null,
      topicId: topicId || null,
    });
    res.status(201).json({ deck: newDeck });
  });

  app.put('/api/flashcards/:deckId/cards/:cardId/mastery', authMiddleware, (req: AuthRequest, res: Response) => {
    const { mastered } = req.body;
    const card = db.updateCardMastery(req.params.deckId, req.params.cardId, req.user!.id, Boolean(mastered));
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (mastered) {
      db.addXp(req.user!.id, 5);
    }
    res.json({ card });
  });

  app.delete('/api/flashcards/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    db.deleteFlashcardDeck(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // QUIZZES & RESULTS ROUTES
  // ----------------------------------------------------
  app.get('/api/quizzes', authMiddleware, (req: AuthRequest, res: Response) => {
    const quizzes = db.getQuizzes(req.user!.id);
    res.json({ quizzes });
  });

  app.get('/api/quizzes/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const quiz = db.getQuizById(req.params.id, req.user!.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ quiz });
  });

  app.post('/api/quizzes/:id/submit', authMiddleware, (req: AuthRequest, res: Response) => {
    const { answers, timeSpentSeconds } = req.body; // answers: { [qId]: selectedIndex }
    const quiz = db.getQuizById(req.params.id, req.user!.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let score = 0;
    const detailedAnswers = quiz.questions.map((q: any) => {
      const userSelected = answers?.[q.id];
      const isCorrect = userSelected !== undefined && Number(userSelected) === Number(q.correctIndex);
      if (isCorrect) score++;
      return {
        questionId: q.id,
        question: q.question,
        selectedOption: userSelected !== undefined ? Number(userSelected) : -1,
        correctOption: q.correctIndex,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const percentage = Math.round((score / (quiz.questions.length || 1)) * 100);

    const result = db.saveQuizResult({
      userId: req.user!.id,
      quizId: quiz.id,
      quizTitle: quiz.title,
      score,
      totalQuestions: quiz.questions.length,
      percentage,
      timeSpentSeconds: timeSpentSeconds || 60,
      answers: detailedAnswers,
    });

    // Reward XP based on score
    const earnedXp = Math.max(10, score * 15);
    const xpStatus = db.addXp(req.user!.id, earnedXp);

    res.json({ result, earnedXp, currentXp: xpStatus?.xp, level: xpStatus?.level });
  });

  app.get('/api/quiz-results', authMiddleware, (req: AuthRequest, res: Response) => {
    const results = db.getQuizResults(req.user!.id);
    res.json({ results });
  });

  // ----------------------------------------------------
  // STUDY PLANS ROUTES
  // ----------------------------------------------------
  app.get('/api/study-plans', authMiddleware, (req: AuthRequest, res: Response) => {
    const plans = db.getStudyPlans(req.user!.id);
    res.json({ plans });
  });

  app.post('/api/study-plans', authMiddleware, (req: AuthRequest, res: Response) => {
    const newPlan = db.createStudyPlan({
      userId: req.user!.id,
      ...req.body,
    });
    res.status(201).json({ plan: newPlan });
  });

  app.put('/api/study-plans/:planId/tasks/:taskId/toggle', authMiddleware, (req: AuthRequest, res: Response) => {
    const updatedTask = db.toggleTaskCompleted(req.params.planId, req.params.taskId, req.user!.id);
    if (!updatedTask) return res.status(404).json({ error: 'Task or plan not found' });
    if (updatedTask.completed) {
      db.addXp(req.user!.id, 15);
    }
    res.json({ task: updatedTask });
  });

  app.delete('/api/study-plans/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    db.deleteStudyPlan(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // DOCUMENTS / RAG QA ROUTES
  // ----------------------------------------------------
  app.get('/api/documents', authMiddleware, (req: AuthRequest, res: Response) => {
    const docs = db.getDocuments(req.user!.id);
    res.json({ documents: docs });
  });

  app.get('/api/documents/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    const doc = db.getDocumentById(req.params.id, req.user!.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ document: doc });
  });

  app.post('/api/documents/upload', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { title, fileName, fileType, rawText, fileSize } = req.body;
      if (!rawText || !fileName) {
        return res.status(400).json({ error: 'File name and text content are required' });
      }

      // Analyze document with Gemini
      const analysis = await aiService.analyzeDocument(rawText, fileName);

      const doc = db.createDocument({
        userId: req.user!.id,
        title: title || fileName.replace(/\.[^/.]+$/, ''),
        fileName,
        fileType: fileType || 'text/plain',
        fileSize: fileSize || rawText.length,
        rawText,
        summary: analysis.summary,
        keyTopics: analysis.keyTopics,
        suggestedQuestions: analysis.suggestedQuestions,
      });

      db.addXp(req.user!.id, 30);
      res.status(201).json({ document: doc });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to upload and analyze document' });
    }
  });

  app.delete('/api/documents/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    db.deleteDocument(req.params.id, req.user!.id);
    res.json({ success: true });
  });

  // ----------------------------------------------------
  // DASHBOARD AGGREGATED STATS
  // ----------------------------------------------------
  app.get('/api/dashboard/stats', authMiddleware, (req: AuthRequest, res: Response) => {
    const stats = db.getDashboardStats(req.user!.id);
    res.json({ stats });
  });

  // ----------------------------------------------------
  // VITE MIDDLEWARE / STATIC SERVING
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ScholarMind AI Study Assistant server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
