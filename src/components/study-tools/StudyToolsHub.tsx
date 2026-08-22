import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  FileSearch, 
  HelpCircle, 
  Layers, 
  Calendar, 
  Code2, 
  BrainCircuit, 
  Sparkles, 
  BookOpen, 
  Lightbulb, 
  Loader2, 
  Copy, 
  Check, 
  ArrowRight,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../services/api';
import { Subject, FlashcardDeck } from '../../types';

interface StudyToolsHubProps {
  subjects: Subject[];
  onOpenDeck?: (deck: FlashcardDeck) => void;
  onRefreshData?: () => void;
  onNavigateToView?: (view: string) => void;
  initialTool?: string | null;
  initialTopic?: string;
  initialSubject?: string;
}

export const StudyToolsHub: React.FC<StudyToolsHubProps> = ({
  subjects,
  onOpenDeck,
  onRefreshData,
  onNavigateToView,
  initialTool,
  initialTopic = '',
  initialSubject = '',
}) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [topic, setTopic] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [inputText, setInputText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLang, setCodeLang] = useState('TypeScript');
  const [detailLevel, setDetailLevel] = useState<'concise' | 'standard' | 'comprehensive'>('standard');
  const [summaryFormat, setSummaryFormat] = useState<'bullet_points' | 'executive' | 'key_takeaways' | 'simplified'>('bullet_points');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [cardCount, setCardCount] = useState(8);
  const [planDays, setPlanDays] = useState(7);
  const [planHours, setPlanHours] = useState(2.5);
  const [topicLevel, setTopicLevel] = useState<'5yo' | 'high_school' | 'college' | 'expert' | 'all'>('all');
  const [questionType, setQuestionType] = useState<'conceptual' | 'numerical' | 'coding' | 'mixed'>('mixed');

  useEffect(() => {
    if (initialTool) setActiveTool(initialTool);
    setTopic(initialTopic);
    setSubjectName(initialSubject);
  }, [initialTool, initialTopic, initialSubject]);

  const tools = [
    {
      id: 'notes',
      title: 'AI Notes Generator',
      description: 'Generates structured, textbook-grade study notes with definitions, takeaways & self-test questions.',
      icon: FileText,
      color: 'from-indigo-600 to-indigo-700',
      badge: 'High Yield',
    },
    {
      id: 'summarizer',
      title: 'Text Summarizer',
      description: 'Paste lengthy textbooks or lecture transcripts to distill high-density key concepts & formulas.',
      icon: FileSearch,
      color: 'from-cyan-600 to-blue-600',
      badge: 'Fast',
    },
    {
      id: 'mcq',
      title: 'MCQ & Quiz Generator',
      description: 'Instantly generate timed multiple-choice assessments with 4 options and detailed answer explanations.',
      icon: HelpCircle,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Exam Prep',
    },
    {
      id: 'flashcards',
      title: 'Flashcard Generator',
      description: 'Create active-recall spaced repetition flashcard decks ready for interactive 3D study review.',
      icon: Layers,
      color: 'from-amber-600 to-orange-600',
      badge: 'Memory',
    },
    {
      id: 'planner',
      title: 'AI Study Planner',
      description: 'Generate a structured multi-day milestone schedule with daily targets and estimated completion times.',
      icon: Calendar,
      color: 'from-purple-600 to-violet-600',
      badge: 'Organize',
    },
    {
      id: 'code',
      title: 'Code Explainer',
      description: 'In-depth line-by-line algorithm walkthroughs, Big-O space/time complexity & edge cases.',
      icon: Code2,
      color: 'from-sky-600 to-cyan-700',
      badge: 'Tech & CS',
    },
    {
      id: 'doubt',
      title: 'Step-by-Step Doubt Solver',
      description: 'Employs master pedagogical breakdown for complex math, physics, or conceptual problems.',
      icon: BrainCircuit,
      color: 'from-rose-600 to-pink-600',
      badge: 'Socratic',
    },
    {
      id: 'topic_explainer',
      title: 'Multi-Level Topic Explainer',
      description: 'Understand any concept at 4 distinct depths: 5-Year-Old (ELI5), High School, College, or Expert.',
      icon: Lightbulb,
      color: 'from-yellow-600 to-amber-600',
      badge: 'Intuition',
    },
    {
      id: 'questions',
      title: 'Practice Question Generator',
      description: 'Generate challenging conceptual and numerical practice questions with hidden hints & solutions.',
      icon: BookOpen,
      color: 'from-teal-600 to-emerald-700',
      badge: 'Drills',
    },
  ];

  const handleOpenTool = (toolId: string) => {
    setActiveTool(toolId);
    setResult(null);
    setError(null);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (activeTool === 'notes') {
        const res = await api.generateNotes({
          topic,
          subject: subjectName,
          detailLevel,
          autoSave: true,
        });
        setResult(res.notes);
      } else if (activeTool === 'summarizer') {
        const res = await api.summarizeText({
          text: inputText,
          format: summaryFormat,
        });
        setResult(res.summary);
      } else if (activeTool === 'mcq') {
        const res = await api.generateQuiz({
          topic,
          subject: subjectName,
          difficulty,
          questionCount: Number(questionCount),
          autoSave: true,
        });
        setResult(res.quiz);
      } else if (activeTool === 'flashcards') {
        const res = await api.generateFlashcards({
          topic,
          subject: subjectName,
          cardCount: Number(cardCount),
          difficulty,
          autoSave: true,
        });
        setResult(res.deck);
      } else if (activeTool === 'planner') {
        const res = await api.generateStudyPlan({
          goal: topic,
          subject: subjectName,
          daysCount: Number(planDays),
          dailyHours: Number(planHours),
          autoSave: true,
        });
        setResult(res.plan);
      } else if (activeTool === 'code') {
        const res = await api.explainCode({
          code: codeSnippet,
          language: codeLang,
        });
        setResult(res.explanation);
      } else if (activeTool === 'doubt') {
        const res = await api.solveDoubt({
          doubt: inputText,
          subject: subjectName,
        });
        setResult(res.solution);
      } else if (activeTool === 'topic_explainer') {
        const res = await api.explainTopic({
          topic,
          level: topicLevel,
        });
        setResult(res.explanation);
      } else if (activeTool === 'questions') {
        const res = await api.generateQuestions({
          topic,
          type: questionType,
        });
        setResult(res.questions);
      }

      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setError(err.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    const textToCopy = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              AI Pedagogical Suite
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Study Tools Hub
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl">
            Choose from 10 purpose-built AI study instruments designed for deep comprehension, active recall, exam drills, and memory retention.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                id={`study-tool-card-${tool.id}`}
                onClick={() => handleOpenTool(tool.id)}
                className="group relative p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${tool.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Generator for Active Tool */}
        {activeTool && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {tools.find(t => t.id === activeTool)?.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500">ScholarMind AI Generator</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTool(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                    {error}
                  </div>
                )}

                <form onSubmit={handleGenerate} className="space-y-4">
                  {/* Topic / Title Input */}
                  {(activeTool === 'notes' || activeTool === 'mcq' || activeTool === 'flashcards' || activeTool === 'planner' || activeTool === 'topic_explainer' || activeTool === 'questions') && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        {activeTool === 'planner' ? 'Study Goal / Exam Target' : 'Topic or Concept Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder={
                          activeTool === 'planner'
                            ? 'e.g. Master Linear Algebra & Multivariate Calculus'
                            : 'e.g. Dynamic Programming & Memoization, Photosynthesis, Bayes Theorem'
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Subject Name Input / Selector */}
                  {(activeTool === 'notes' || activeTool === 'mcq' || activeTool === 'flashcards' || activeTool === 'planner' || activeTool === 'doubt') && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Subject / Domain (Optional)
                      </label>
                      <input
                        type="text"
                        value={subjectName}
                        onChange={e => setSubjectName(e.target.value)}
                        placeholder="e.g. Computer Science, Mathematics, Biology, Organic Chemistry"
                        className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  )}

                  {/* Long Text Input for Summarizer or Doubt */}
                  {(activeTool === 'summarizer' || activeTool === 'doubt') && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        {activeTool === 'doubt' ? 'Describe Your Doubt / Problem in Detail *' : 'Paste Text / Transcript to Summarize *'}
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={inputText}
                        onChange={e => setInputText(e.target.value)}
                        placeholder={
                          activeTool === 'doubt'
                            ? 'e.g. I am stuck understanding why the gradient vector is perpendicular to level curves...'
                            : 'Paste textbook paragraphs, lecture transcripts, or articles here...'
                        }
                        className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                      />
                    </div>
                  )}

                  {/* Code Input */}
                  {activeTool === 'code' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Language</label>
                        <select
                          value={codeLang}
                          onChange={e => setCodeLang(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="TypeScript">TypeScript</option>
                          <option value="JavaScript">JavaScript</option>
                          <option value="Python">Python</option>
                          <option value="Java">Java</option>
                          <option value="C++">C++</option>
                          <option value="Go">Go</option>
                          <option value="Rust">Rust</option>
                          <option value="SQL">SQL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Paste Code Snippet *</label>
                        <textarea
                          required
                          rows={6}
                          value={codeSnippet}
                          onChange={e => setCodeSnippet(e.target.value)}
                          placeholder="Paste function, class, or algorithm here..."
                          className="w-full font-mono px-3 py-2 text-xs rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tool-specific option pills */}
                  {activeTool === 'notes' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Detail Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['concise', 'standard', 'comprehensive'] as const).map(lvl => (
                          <button
                            type="button"
                            key={lvl}
                            onClick={() => setDetailLevel(lvl)}
                            className={`py-2 text-xs rounded-lg font-semibold capitalize border transition-colors ${
                              detailLevel === lvl
                                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTool === 'summarizer' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Summary Format</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['bullet_points', 'executive', 'key_takeaways', 'simplified'] as const).map(fmt => (
                          <button
                            type="button"
                            key={fmt}
                            onClick={() => setSummaryFormat(fmt)}
                            className={`py-2 text-xs rounded-lg font-semibold capitalize border transition-colors ${
                              summaryFormat === fmt
                                ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                                : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {fmt.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTool === 'mcq' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Difficulty</label>
                        <select
                          value={difficulty}
                          onChange={e => setDifficulty(e.target.value as any)}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="easy">Easy (Fundamentals)</option>
                          <option value="medium">Medium (Standard)</option>
                          <option value="hard">Hard (Advanced / Exam)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Questions</label>
                        <select
                          value={questionCount}
                          onChange={e => setQuestionCount(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value={3}>3 Questions</option>
                          <option value={5}>5 Questions</option>
                          <option value={8}>8 Questions</option>
                          <option value={10}>10 Questions</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTool === 'flashcards' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Difficulty</label>
                        <select
                          value={difficulty}
                          onChange={e => setDifficulty(e.target.value as any)}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Card Count</label>
                        <select
                          value={cardCount}
                          onChange={e => setCardCount(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value={5}>5 Flashcards</option>
                          <option value={8}>8 Flashcards</option>
                          <option value={12}>12 Flashcards</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {activeTool === 'planner' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Timeline</label>
                        <select
                          value={planDays}
                          onChange={e => setPlanDays(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        >
                          <option value={5}>5-Day Sprint</option>
                          <option value={7}>7-Day Week</option>
                          <option value={14}>14-Day Deep Study</option>
                          <option value={30}>30-Day Mastery</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Daily Study Hours</label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="12"
                          value={planHours}
                          onChange={e => setPlanHours(Number(e.target.value))}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>
                  )}

                  {activeTool === 'topic_explainer' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Explanation Depth</label>
                      <select
                        value={topicLevel}
                        onChange={e => setTopicLevel(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="all">All 4 Depths (ELI5 + High School + College + Expert)</option>
                        <option value="5yo">Like I'm 5 (Intuitive Metaphor)</option>
                        <option value="high_school">High School Level</option>
                        <option value="college">Undergraduate University</option>
                        <option value="expert">Expert / Research Level</option>
                      </select>
                    </div>
                  )}

                  {activeTool === 'questions' && (
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Question Type</label>
                      <select
                        value={questionType}
                        onChange={e => setQuestionType(e.target.value as any)}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="mixed">Mixed (Conceptual + Numerical + Applied)</option>
                        <option value="conceptual">Conceptual & Reasoning</option>
                        <option value="numerical">Numerical / Problem Solving</option>
                        <option value="coding">Coding & Algorithms</option>
                      </select>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating with Gemini AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Learning Material</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Generated Result Output */}
                {result && (
                  <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500" />
                        Generated Result
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={copyResult}
                          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Result Content Formats */}
                    {typeof result === 'string' ? (
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed overflow-x-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {result}
                        </ReactMarkdown>
                      </div>
                    ) : activeTool === 'flashcards' && onOpenDeck ? (
                      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                          Flashcard deck with {result.cards?.length || 0} cards generated and saved!
                        </p>
                        <button
                          onClick={() => {
                            setActiveTool(null);
                            onOpenDeck(result);
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                        >
                          Open in 3D Flashcard Player
                        </button>
                      </div>
                    ) : activeTool === 'mcq' ? (
                      <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-center space-y-3">
                        <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">
                          Quiz generated with {result.questions?.length || 0} questions and saved to your quiz hub!
                        </p>
                        {onNavigateToView && (
                          <button
                            onClick={() => {
                              setActiveTool(null);
                              onNavigateToView('quizzes');
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
                          >
                            Go to Quiz Player
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono overflow-x-auto max-h-60">
                        <pre>{JSON.stringify(result, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
