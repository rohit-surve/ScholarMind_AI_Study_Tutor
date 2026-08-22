import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Default initial state
interface DatabaseSchema {
  users: any[];
  conversations: any[];
  messages: any[];
  subjects: any[];
  topics: any[];
  notes: any[];
  flashcardDecks: any[];
  quizzes: any[];
  quizResults: any[];
  studyPlans: any[];
  documents: any[];
  stats: {
    totalQueries: number;
  };
}

// In-memory cache synced to disk
let dbCache: DatabaseSchema | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialData(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const demoPasswordHash = bcrypt.hashSync('demo1234', salt);

  const demoUserId = 'demo-user-101';
  const mathSubjectId = 'sub-math-01';
  const csSubjectId = 'sub-cs-02';
  const bioSubjectId = 'sub-bio-03';

  return {
    users: [
      {
        id: demoUserId,
        name: 'Alex Rivera',
        email: 'alex@student.edu',
        passwordHash: demoPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        studyGoal: 'Ace the Semester Finals in Algorithms & Calculus',
        preferredMode: 'tutor',
        streak: 5,
        lastActiveDate: new Date().toISOString().split('T')[0],
        xp: 1420,
        level: 4,
        createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      }
    ],
    subjects: [
      {
        id: mathSubjectId,
        userId: demoUserId,
        name: 'Calculus & Linear Algebra',
        color: '#6366f1',
        icon: 'Calculator',
        description: 'Derivatives, Eigenvalues, Matrix Transformations & Integrals',
        createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
      },
      {
        id: csSubjectId,
        userId: demoUserId,
        name: 'Data Structures & Algorithms',
        color: '#06b6d4',
        icon: 'Code2',
        description: 'Binary Trees, Dynamic Programming, Graphs & Complexity',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: bioSubjectId,
        userId: demoUserId,
        name: 'Cellular Biology',
        color: '#10b981',
        icon: 'Microscope',
        description: 'Mitochondria, DNA Replication, Cellular Respiration & Genetics',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      }
    ],
    topics: [
      {
        id: 'top-math-1',
        subjectId: mathSubjectId,
        userId: demoUserId,
        name: 'Partial Derivatives & Gradients',
        summary: 'Multivariable calculus foundational operations',
        completed: true,
        masteryLevel: 'mastered',
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: 'top-math-2',
        subjectId: mathSubjectId,
        userId: demoUserId,
        name: 'Eigenvectors & SVD',
        summary: 'Matrix decomposition and dimensionality reduction',
        completed: false,
        masteryLevel: 'learning',
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        id: 'top-cs-1',
        subjectId: csSubjectId,
        userId: demoUserId,
        name: 'Graph Traversal (BFS & DFS)',
        summary: 'Breadth-First and Depth-First Search algorithms',
        completed: true,
        masteryLevel: 'mastered',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      },
      {
        id: 'top-cs-2',
        subjectId: csSubjectId,
        userId: demoUserId,
        name: 'Dynamic Programming & Memoization',
        summary: 'Optimal substructure and overlapping subproblems',
        completed: false,
        masteryLevel: 'learning',
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        id: 'top-bio-1',
        subjectId: bioSubjectId,
        userId: demoUserId,
        name: 'Krebs Cycle & ATP Synthesis',
        summary: 'Mitochondrial metabolic pathway generating cellular energy',
        completed: true,
        masteryLevel: 'mastered',
        createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      }
    ],
    conversations: [
      {
        id: 'conv-demo-1',
        userId: demoUserId,
        title: 'Mastering Dynamic Programming Patterns',
        studyMode: 'coding',
        subjectId: csSubjectId,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        messageCount: 4,
      },
      {
        id: 'conv-demo-2',
        userId: demoUserId,
        title: 'Socratic Tutor: Matrix Inverses & Determinants',
        studyMode: 'tutor',
        subjectId: mathSubjectId,
        createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
        messageCount: 2,
      }
    ],
    messages: [
      {
        id: 'msg-1',
        conversationId: 'conv-demo-1',
        role: 'user',
        content: 'How do I identify whether a problem can be solved using Dynamic Programming?',
        mode: 'coding',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'msg-2',
        conversationId: 'conv-demo-1',
        role: 'assistant',
        content: `### 🎯 How to Spot a Dynamic Programming Problem

To determine if a problem is suitable for **Dynamic Programming (DP)**, look for two golden properties:

1. **Overlapping Subproblems**: The same smaller subproblems are computed repeatedly.
2. **Optimal Substructure**: The optimal solution to the problem can be constructed from optimal solutions to its subproblems.

---

### Common DP Problem Archetypes
* **Min/Max to Reach Target**: *(e.g., Coin Change, Minimum Path Sum)*
* **Distinct Ways / Counting**: *(e.g., Climbing Stairs, Decode Ways)*
* **Decision Making (Take / Don't Take)**: *(e.g., 0/1 Knapsack, House Robber)*
* **Longest Subsequence**: *(e.g., Longest Increasing Subsequence, LCS)*

---

### 💡 4-Step DP Framework
\`\`\`ts
// Standard Tabulation Blueprint
function solveDP(n: number): number {
  // 1. State Definition: dp[i] represents result for input i
  const dp: number[] = new Array(n + 1).fill(0);
  
  // 2. Base Cases
  dp[0] = 0;
  dp[1] = 1;
  
  // 3. State Transition Relation
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  
  // 4. Return Final Target
  return dp[n];
}
\`\`\`

Would you like to walk through a specific LeetCode problem or convert a recursive tree into memoization?`,
        mode: 'coding',
        timestamp: new Date(Date.now() - 2 * 86400000 + 5000).toISOString(),
      }
    ],
    notes: [
      {
        id: 'note-1',
        userId: demoUserId,
        subjectId: csSubjectId,
        topicId: 'top-cs-2',
        title: 'Dynamic Programming Cheat Sheet & Recurrence Relations',
        content: `# Dynamic Programming Essentials

## 1. Top-Down vs Bottom-Up
- **Top-Down (Memoization)**: Natural recursion tree + hash table / array cache.
- **Bottom-Up (Tabulation)**: Iterative filling of table from base cases upward. Saves recursion stack space!

## 2. Complexity Analysis
- Time Complexity: \`O(Number of States * Transitions per State)\`
- Space Complexity: \`O(Number of States)\` (can often be optimized to \`O(1)\` if only previous row is needed).

## 3. Key Formulas
- **Fibonacci**: $DP[i] = DP[i-1] + DP[i-2]$
- **Knapsack**: $DP[i][w] = \max(DP[i-1][w], DP[i-1][w-weight[i]] + val[i])$`,
        tags: ['Algorithms', 'DP', 'Computer Science'],
        summary: 'A fast reference guide for top-down memoization and bottom-up tabulation complexity.',
        keyTakeaways: [
          'Always identify base cases before writing the recurrence relation.',
          'Optimize space complexity by discarding older state rows.',
          'Use top-down when subproblem space is sparse.'
        ],
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      }
    ],
    flashcardDecks: [
      {
        id: 'deck-1',
        userId: demoUserId,
        subjectId: csSubjectId,
        topicId: 'top-cs-1',
        title: 'Graph Algorithms & Time Complexities',
        description: 'Core concepts on Dijkstra, Bellman-Ford, A*, and topological sort.',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        cards: [
          {
            id: 'c1',
            front: 'What is the time complexity of Breadth-First Search (BFS) on an adjacency list?',
            back: 'O(V + E), where V is the number of vertices and E is the number of edges.',
            hint: 'Every vertex is enqueued once and all edges are inspected.',
            difficulty: 'easy',
            mastered: true,
          },
          {
            id: 'c2',
            front: 'Can Dijkstra algorithm handle negative edge weights?',
            back: 'No. Dijkstra greedily assumes path weights only increase. For negative edges, use Bellman-Ford (O(VE)).',
            hint: 'Think about greedy choice property.',
            difficulty: 'medium',
            mastered: false,
          },
          {
            id: 'c3',
            front: 'What data structure is required to detect cycles in a Directed Acyclic Graph (DAG) during Topological Sort?',
            back: 'In-degree array (Kahn Algorithm with Queue) or DFS recursion stack (visited & on-path states).',
            hint: 'Consider in-degrees of nodes with zero prerequisites.',
            difficulty: 'medium',
            mastered: true,
          }
        ]
      }
    ],
    quizzes: [
      {
        id: 'quiz-1',
        userId: demoUserId,
        subjectId: mathSubjectId,
        topicId: 'top-math-1',
        title: 'Multivariable Calculus & Partial Derivatives',
        topicName: 'Partial Derivatives',
        difficulty: 'medium',
        timeLimitMinutes: 10,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        questions: [
          {
            id: 'q1',
            question: 'What is the gradient vector ∇f(x,y) geometrically representing?',
            options: [
              'The direction of steepest decrease of the function',
              'The direction of steepest ascent and its magnitude gives the rate of increase',
              'A tangent line parallel to the contour level set',
              'The second derivative curvature matrix'
            ],
            correctIndex: 1,
            explanation: 'The gradient ∇f points in the direction of the greatest rate of increase of the scalar field, and its length is the directional derivative in that direction.'
          },
          {
            id: 'q2',
            question: 'If f(x, y) = x²y + 3y³, what is ∂f/∂x evaluated at (2, 1)?',
            options: ['4', '12', '8', '7'],
            correctIndex: 0,
            explanation: 'Treat y as constant: ∂f/∂x = 2xy. Evaluating at x=2, y=1 gives 2*(2)*(1) = 4.'
          },
          {
            id: 'q3',
            question: 'Clairaut Theorem states that mixed second partial derivatives f_xy and f_yx are equal when:',
            options: [
              'The function is polynomial only',
              'Both mixed partial derivatives are continuous in an open region',
              'The determinant of the Hessian matrix is zero',
              'The gradient vector is orthogonal'
            ],
            correctIndex: 1,
            explanation: 'By Clairaut Theorem (Schwarz theorem), if f_xy and f_yx are both continuous on a disk containing (a, b), then f_xy(a, b) = f_yx(a, b).'
          }
        ]
      }
    ],
    quizResults: [
      {
        id: 'res-1',
        userId: demoUserId,
        quizId: 'quiz-1',
        quizTitle: 'Multivariable Calculus & Partial Derivatives',
        score: 3,
        totalQuestions: 3,
        percentage: 100,
        timeSpentSeconds: 145,
        answers: [
          {
            questionId: 'q1',
            question: 'What is the gradient vector ∇f(x,y) geometrically representing?',
            selectedOption: 1,
            correctOption: 1,
            isCorrect: true,
            explanation: 'The gradient ∇f points in the direction of the greatest rate of increase.'
          },
          {
            questionId: 'q2',
            question: 'If f(x, y) = x²y + 3y³, what is ∂f/∂x evaluated at (2, 1)?',
            selectedOption: 0,
            correctOption: 0,
            isCorrect: true,
            explanation: '∂f/∂x = 2xy -> 2*2*1 = 4.'
          },
          {
            questionId: 'q3',
            question: 'Clairaut Theorem states that mixed second partial derivatives f_xy and f_yx are equal when:',
            selectedOption: 1,
            correctOption: 1,
            isCorrect: true,
            explanation: 'Continuous partial derivatives ensure equality of mixed partials.'
          }
        ],
        completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      }
    ],
    studyPlans: [
      {
        id: 'plan-1',
        userId: demoUserId,
        subjectId: csSubjectId,
        title: '7-Day Algorithms Mastery Plan',
        targetGoal: 'Master DP, Trees, and Graph searches before midterm exam',
        targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        dailyHours: 2.5,
        weeklySchedule: [
          {
            day: 'Monday',
            focus: 'Dynamic Programming Patterns',
            tasks: [
              { id: 't1', task: 'Review 1D Tabulation & Memoization', durationMinutes: 45, completed: true },
              { id: 't2', task: 'Solve 3 Coin Change / Knapsack problems', durationMinutes: 60, completed: true }
            ]
          },
          {
            day: 'Tuesday',
            focus: 'Binary Trees & BST Traversals',
            tasks: [
              { id: 't3', task: 'Implement Inorder, Preorder, Postorder iteratively', durationMinutes: 50, completed: true },
              { id: 't4', task: 'Lowest Common Ancestor & Diameter of Tree', durationMinutes: 40, completed: false }
            ]
          },
          {
            day: 'Wednesday',
            focus: 'Graph Search (BFS & DFS)',
            tasks: [
              { id: 't5', task: 'Number of Islands & Flood Fill implementations', durationMinutes: 45, completed: false },
              { id: 't6', task: 'Topological Sort on DAGs', durationMinutes: 45, completed: false }
            ]
          },
          {
            day: 'Thursday',
            focus: 'Shortest Path Algorithms',
            tasks: [
              { id: 't7', task: 'Dijkstra with Min-Heap implementation', durationMinutes: 60, completed: false }
            ]
          },
          {
            day: 'Friday',
            focus: 'Full Mock Quiz & Timed Practice',
            tasks: [
              { id: 't8', task: 'Complete AI-generated 15-question exam quiz', durationMinutes: 45, completed: false }
            ]
          }
        ],
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      }
    ],
    documents: [],
    stats: {
      totalQueries: 18,
    }
  };
}

export function loadDB(): DatabaseSchema {
  if (dbCache) return dbCache;
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    dbCache = initial;
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    dbCache = JSON.parse(raw);
    return dbCache!;
  } catch (err) {
    console.error('Error loading DB file, rebuilding initial data:', err);
    const initial = getInitialData();
    dbCache = initial;
    return initial;
  }
}

export function saveDB() {
  if (!dbCache) return;
  ensureDataDir();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbCache, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB:', err);
  }
}

// Database helper functions
export const db = {
  // Users
  getUserById(id: string) {
    const database = loadDB();
    return database.users.find(u => u.id === id) || null;
  },
  getUserByEmail(email: string) {
    const database = loadDB();
    return database.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  createUser(userData: any) {
    const database = loadDB();
    const id = 'user-' + crypto.randomUUID();
    const newUser = {
      id,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      xp: 100,
      level: 1,
      createdAt: new Date().toISOString(),
      ...userData,
    };
    database.users.push(newUser);
    saveDB();
    return newUser;
  },
  updateUser(id: string, updates: any) {
    const database = loadDB();
    const idx = database.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      database.users[idx] = { ...database.users[idx], ...updates };
      saveDB();
      return database.users[idx];
    }
    return null;
  },
  addXp(userId: string, xpPoints: number) {
    const database = loadDB();
    const user = database.users.find(u => u.id === userId);
    if (user) {
      user.xp = (user.xp || 0) + xpPoints;
      // Level up every 500 XP
      user.level = Math.floor(user.xp / 500) + 1;
      
      // Update streak
      const today = new Date().toISOString().split('T')[0];
      if (user.lastActiveDate !== today) {
        const lastDate = new Date(user.lastActiveDate || today);
        const currDate = new Date(today);
        const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          user.streak = (user.streak || 1) + 1;
        } else if (diffDays > 1) {
          user.streak = 1;
        }
        user.lastActiveDate = today;
      }
      saveDB();
      return { xp: user.xp, level: user.level, streak: user.streak };
    }
    return null;
  },

  // Conversations
  getConversations(userId: string) {
    const database = loadDB();
    return database.conversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
  },
  getConversationById(id: string) {
    const database = loadDB();
    return database.conversations.find(c => c.id === id) || null;
  },
  createConversation(convData: any) {
    const database = loadDB();
    const id = 'conv-' + crypto.randomUUID();
    const now = new Date().toISOString();
    const newConv = {
      id,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      ...convData,
    };
    database.conversations.push(newConv);
    saveDB();
    return newConv;
  },
  updateConversation(id: string, updates: any) {
    const database = loadDB();
    const idx = database.conversations.findIndex(c => c.id === id);
    if (idx !== -1) {
      database.conversations[idx] = {
        ...database.conversations[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveDB();
      return database.conversations[idx];
    }
    return null;
  },
  deleteConversation(id: string, userId: string) {
    const database = loadDB();
    database.conversations = database.conversations.filter(c => !(c.id === id && c.userId === userId));
    database.messages = database.messages.filter(m => m.conversationId !== id);
    saveDB();
    return true;
  },

  // Messages
  getMessages(conversationId: string) {
    const database = loadDB();
    return database.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },
  addMessage(messageData: any) {
    const database = loadDB();
    const id = 'msg-' + crypto.randomUUID();
    const msg = {
      id,
      timestamp: new Date().toISOString(),
      ...messageData,
    };
    database.messages.push(msg);
    // increment conversation messageCount and update timestamp
    const conv = database.conversations.find(c => c.id === messageData.conversationId);
    if (conv) {
      conv.messageCount = (conv.messageCount || 0) + 1;
      conv.updatedAt = new Date().toISOString();
      conv.lastMessage = messageData.content.slice(0, 80);
    }
    database.stats.totalQueries = (database.stats.totalQueries || 0) + 1;
    saveDB();
    return msg;
  },
  deleteMessage(messageId: string) {
    const database = loadDB();
    database.messages = database.messages.filter(m => m.id !== messageId);
    saveDB();
    return true;
  },

  // Subjects & Topics
  getSubjects(userId: string) {
    const database = loadDB();
    const subjects = database.subjects.filter(s => s.userId === userId);
    return subjects.map(s => {
      const subTopics = database.topics.filter(t => t.subjectId === s.id);
      const completedCount = subTopics.filter(t => t.completed).length;
      return {
        ...s,
        topicsCount: subTopics.length,
        completedTopicsCount: completedCount,
      };
    });
  },
  createSubject(subjectData: any) {
    const database = loadDB();
    const id = 'sub-' + crypto.randomUUID();
    const newSubject = {
      id,
      createdAt: new Date().toISOString(),
      ...subjectData,
    };
    database.subjects.push(newSubject);
    saveDB();
    return newSubject;
  },
  updateSubject(id: string, userId: string, updates: any) {
    const database = loadDB();
    const idx = database.subjects.findIndex(s => s.id === id && s.userId === userId);
    if (idx !== -1) {
      database.subjects[idx] = { ...database.subjects[idx], ...updates };
      saveDB();
      return database.subjects[idx];
    }
    return null;
  },
  deleteSubject(id: string, userId: string) {
    const database = loadDB();
    database.subjects = database.subjects.filter(s => !(s.id === id && s.userId === userId));
    database.topics = database.topics.filter(t => t.subjectId !== id);
    saveDB();
    return true;
  },

  // Topics
  getTopics(subjectId: string, userId: string) {
    const database = loadDB();
    return database.topics.filter(t => t.subjectId === subjectId && t.userId === userId);
  },
  getAllTopics(userId: string) {
    const database = loadDB();
    return database.topics.filter(t => t.userId === userId);
  },
  createTopic(topicData: any) {
    const database = loadDB();
    const id = 'top-' + crypto.randomUUID();
    const newTopic = {
      id,
      completed: false,
      masteryLevel: 'learning',
      createdAt: new Date().toISOString(),
      ...topicData,
    };
    database.topics.push(newTopic);
    saveDB();
    return newTopic;
  },
  updateTopic(id: string, userId: string, updates: any) {
    const database = loadDB();
    const idx = database.topics.findIndex(t => t.id === id && t.userId === userId);
    if (idx !== -1) {
      database.topics[idx] = { ...database.topics[idx], ...updates };
      saveDB();
      return database.topics[idx];
    }
    return null;
  },
  deleteTopic(id: string, userId: string) {
    const database = loadDB();
    database.topics = database.topics.filter(t => !(t.id === id && t.userId === userId));
    saveDB();
    return true;
  },

  // Notes
  getNotes(userId: string, subjectId?: string) {
    const database = loadDB();
    return database.notes.filter(n => n.userId === userId && (!subjectId || n.subjectId === subjectId));
  },
  getNoteById(id: string, userId: string) {
    const database = loadDB();
    return database.notes.find(n => n.id === id && n.userId === userId) || null;
  },
  createNote(noteData: any) {
    const database = loadDB();
    const id = 'note-' + crypto.randomUUID();
    const newNote = {
      id,
      tags: noteData.tags || [],
      createdAt: new Date().toISOString(),
      ...noteData,
    };
    database.notes.push(newNote);
    saveDB();
    return newNote;
  },
  updateNote(id: string, userId: string, updates: any) {
    const database = loadDB();
    const idx = database.notes.findIndex(n => n.id === id && n.userId === userId);
    if (idx !== -1) {
      database.notes[idx] = {
        ...database.notes[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveDB();
      return database.notes[idx];
    }
    return null;
  },
  deleteNote(id: string, userId: string) {
    const database = loadDB();
    database.notes = database.notes.filter(n => !(n.id === id && n.userId === userId));
    saveDB();
    return true;
  },

  // Flashcards
  getFlashcardDecks(userId: string) {
    const database = loadDB();
    return database.flashcardDecks.filter(d => d.userId === userId).map(deck => {
      const mastered = deck.cards.filter((c: any) => c.mastered).length;
      return { ...deck, masteredCount: mastered };
    });
  },
  getFlashcardDeckById(id: string, userId: string) {
    const database = loadDB();
    return database.flashcardDecks.find(d => d.id === id && d.userId === userId) || null;
  },
  createFlashcardDeck(deckData: any) {
    const database = loadDB();
    const id = 'deck-' + crypto.randomUUID();
    const newDeck = {
      id,
      createdAt: new Date().toISOString(),
      cards: (deckData.cards || []).map((c: any) => ({
        id: c.id || 'card-' + crypto.randomUUID(),
        front: c.front,
        back: c.back,
        hint: c.hint || '',
        difficulty: c.difficulty || 'medium',
        mastered: c.mastered || false,
      })),
      ...deckData,
    };
    database.flashcardDecks.push(newDeck);
    saveDB();
    return newDeck;
  },
  updateCardMastery(deckId: string, cardId: string, userId: string, mastered: boolean) {
    const database = loadDB();
    const deck = database.flashcardDecks.find(d => d.id === deckId && d.userId === userId);
    if (deck) {
      const card = deck.cards.find((c: any) => c.id === cardId);
      if (card) {
        card.mastered = mastered;
        saveDB();
        return card;
      }
    }
    return null;
  },
  deleteFlashcardDeck(id: string, userId: string) {
    const database = loadDB();
    database.flashcardDecks = database.flashcardDecks.filter(d => !(d.id === id && d.userId === userId));
    saveDB();
    return true;
  },

  // Quizzes & Results
  getQuizzes(userId: string) {
    const database = loadDB();
    return database.quizzes.filter(q => q.userId === userId);
  },
  getQuizById(id: string, userId: string) {
    const database = loadDB();
    return database.quizzes.find(q => q.id === id && q.userId === userId) || null;
  },
  createQuiz(quizData: any) {
    const database = loadDB();
    const id = 'quiz-' + crypto.randomUUID();
    const newQuiz = {
      id,
      createdAt: new Date().toISOString(),
      ...quizData,
    };
    database.quizzes.push(newQuiz);
    saveDB();
    return newQuiz;
  },
  saveQuizResult(resultData: any) {
    const database = loadDB();
    const id = 'res-' + crypto.randomUUID();
    const newResult = {
      id,
      completedAt: new Date().toISOString(),
      ...resultData,
    };
    database.quizResults.push(newResult);
    saveDB();
    return newResult;
  },
  getQuizResults(userId: string) {
    const database = loadDB();
    return database.quizResults
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  },

  // Study Plans
  getStudyPlans(userId: string) {
    const database = loadDB();
    return database.studyPlans.filter(p => p.userId === userId);
  },
  createStudyPlan(planData: any) {
    const database = loadDB();
    const id = 'plan-' + crypto.randomUUID();
    const newPlan = {
      id,
      createdAt: new Date().toISOString(),
      ...planData,
    };
    database.studyPlans.push(newPlan);
    saveDB();
    return newPlan;
  },
  toggleTaskCompleted(planId: string, taskId: string, userId: string) {
    const database = loadDB();
    const plan = database.studyPlans.find(p => p.id === planId && p.userId === userId);
    if (plan) {
      for (const day of plan.weeklySchedule) {
        const task = day.tasks.find((t: any) => t.id === taskId);
        if (task) {
          task.completed = !task.completed;
          saveDB();
          return task;
        }
      }
    }
    return null;
  },
  deleteStudyPlan(id: string, userId: string) {
    const database = loadDB();
    database.studyPlans = database.studyPlans.filter(p => !(p.id === id && p.userId === userId));
    saveDB();
    return true;
  },

  // Documents
  getDocuments(userId: string) {
    const database = loadDB();
    return database.documents.filter(d => d.userId === userId).map(d => ({
      id: d.id,
      userId: d.userId,
      title: d.title,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      summary: d.summary,
      keyTopics: d.keyTopics,
      chunksCount: d.chunks ? d.chunks.length : 1,
      createdAt: d.createdAt,
    }));
  },
  getDocumentById(id: string, userId: string) {
    const database = loadDB();
    return database.documents.find(d => d.id === id && d.userId === userId) || null;
  },
  createDocument(docData: any) {
    const database = loadDB();
    const id = 'doc-' + crypto.randomUUID();
    const newDoc = {
      id,
      createdAt: new Date().toISOString(),
      ...docData,
    };
    database.documents.push(newDoc);
    saveDB();
    return newDoc;
  },
  deleteDocument(id: string, userId: string) {
    const database = loadDB();
    database.documents = database.documents.filter(d => !(d.id === id && d.userId === userId));
    saveDB();
    return true;
  },

  // Dashboard Stats Aggregator
  getDashboardStats(userId: string) {
    const database = loadDB();
    const user = database.users.find(u => u.id === userId);
    const userConvs = database.conversations.filter(c => c.userId === userId);
    const userQuizzes = database.quizResults.filter(r => r.userId === userId);
    const userSubjects = database.subjects.filter(s => s.userId === userId);
    const userTopics = database.topics.filter(t => t.userId === userId);
    const userDecks = database.flashcardDecks.filter(d => d.userId === userId);
    const userNotes = database.notes.filter(n => n.userId === userId);
    const userPlans = database.studyPlans.filter(p => p.userId === userId);

    let masteredFlashcards = 0;
    userDecks.forEach(d => {
      masteredFlashcards += d.cards.filter((c: any) => c.mastered).length;
    });

    const avgScore = userQuizzes.length > 0
      ? Math.round(userQuizzes.reduce((acc, q) => acc + q.percentage, 0) / userQuizzes.length)
      : 0;

    const upcomingTasks: any[] = [];
    userPlans.forEach(p => {
      p.weeklySchedule?.forEach((day: any) => {
        day.tasks?.forEach((t: any) => {
          if (!t.completed && upcomingTasks.length < 6) {
            upcomingTasks.push({
              id: t.id,
              planId: p.id,
              task: t.task,
              day: day.day,
              completed: t.completed,
            });
          }
        });
      });
    });

    let totalUserQuestions = 0;
    userConvs.forEach(c => {
      const msgs = database.messages.filter(m => m.conversationId === c.id && m.role === 'user');
      totalUserQuestions += msgs.length;
    });

    return {
      totalQuestionsAsked: totalUserQuestions,
      totalStudySessions: userConvs.length,
      totalQuizzesTaken: userQuizzes.length,
      averageQuizScore: avgScore,
      studyStreakDays: user?.streak || 1,
      totalSubjects: userSubjects.length,
      totalTopics: userTopics.length,
      completedTopics: userTopics.filter(t => t.completed).length,
      totalFlashcardsMastered: masteredFlashcards,
      totalNotesCreated: userNotes.length,
      xp: user?.xp || 100,
      level: user?.level || 1,
      recentConversations: userConvs.slice(0, 5),
      upcomingTasks,
      recentQuizResults: userQuizzes.slice(0, 5),
    };
  }
};
