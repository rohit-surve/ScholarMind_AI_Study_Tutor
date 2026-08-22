import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, 
  GraduationCap, 
  Flame, 
  Code2, 
  Zap, 
  Trash2, 
  Edit3,
  ChevronDown
} from 'lucide-react';
import { Conversation, Message, StudyMode, StudyDocument } from '../../types';
import { ResponseLanguage } from '../../types/languages';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { StudyModeBadge } from '../common/StudyModeBadge';
import { useLanguage } from '../../context/LanguageContext';

interface ChatViewProps {
  conversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  activeMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  onSendMessage: (content: string, documentId?: string) => void;
  onStopGeneration: () => void;
  onRegenerate: () => void;
  onEditAndResend: (newContent: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  documents: StudyDocument[];
  attachedDocument: StudyDocument | null;
  onSelectDocument: (doc: StudyDocument | null) => void;
  responseLanguage: string;
  onResponseLanguageChange: (language: ResponseLanguage) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  messages,
  isStreaming,
  activeMode,
  onModeChange,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onEditAndResend,
  onRenameConversation,
  onDeleteConversation,
  documents,
  attachedDocument,
  onSelectDocument,
  responseLanguage,
  onResponseLanguageChange,
}) => {
  const { t } = useLanguage();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabledRef = useRef<boolean>(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const prevMessagesCountRef = useRef(messages.length);

  // Scroll to bottom helper that operates solely on the message container
  const scrollToBottom = useCallback((smooth: boolean = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  // Handle user scroll detection: if user scrolls up, don't force auto-scroll
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceToBottom < 80;

    isAutoScrollEnabledRef.current = isNearBottom;
    setShowScrollBottomBtn(!isNearBottom && messages.length > 2);
  };

  // Scroll on new message added or conversation change
  useEffect(() => {
    if (messages.length !== prevMessagesCountRef.current) {
      prevMessagesCountRef.current = messages.length;
      if (isAutoScrollEnabledRef.current) {
        setShowScrollBottomBtn(false);
        // Small timeout to allow DOM update
        requestAnimationFrame(() => {
          scrollToBottom(false);
        });
      } else if (messages.length > 2) {
        setShowScrollBottomBtn(true);
      }
    }
  }, [messages.length, conversation?.id, scrollToBottom]);

  // Keep pinned to bottom during streaming without jerking
  useEffect(() => {
    if (isStreaming && isAutoScrollEnabledRef.current) {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages, isStreaming]);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conversation && titleInput.trim()) {
      onRenameConversation(conversation.id, titleInput.trim());
      setIsEditingTitle(false);
    }
  };

  const starterPrompts = [
    {
      title: 'Socratic Concept Breakdown',
      mode: 'tutor' as StudyMode,
      prompt: 'Explain the intuition and mathematics behind Eigenvalues & Eigenvectors step-by-step.',
      icon: GraduationCap,
      color: 'border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/5',
    },
    {
      title: 'Exam Trap Buster',
      mode: 'exam' as StudyMode,
      prompt: 'What are the top 5 mistakes students make on Dynamic Programming & Recursion exams?',
      icon: Flame,
      color: 'border-rose-500/30 hover:border-rose-500 bg-rose-500/5',
    },
    {
      title: 'Algorithm & Complexity Drill',
      mode: 'coding' as StudyMode,
      prompt: 'Write and explain Dijkstra algorithm in TypeScript with a Min-Heap and Big-O time complexity.',
      icon: Code2,
      color: 'border-cyan-500/30 hover:border-cyan-500 bg-cyan-500/5',
    },
    {
      title: 'Rapid Cramming Cheat Sheet',
      mode: 'quick_revision' as StudyMode,
      prompt: 'Give me a 10-point ultra-dense cheat sheet on Cellular Respiration, Glycolysis, and ATP yield.',
      icon: Zap,
      color: 'border-violet-500/30 hover:border-violet-500 bg-violet-500/5',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-zinc-950 overflow-hidden relative">
      {/* Chat Header */}
      {conversation && (
        <div
          id="chat-header-bar"
          className="h-14 border-b border-zinc-200 dark:border-zinc-800/80 px-4 md:px-6 flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shrink-0 z-10"
        >
          <div className="flex items-center gap-3 min-w-0">
            {isEditingTitle ? (
              <form onSubmit={handleTitleSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  autoFocus
                  onBlur={() => setIsEditingTitle(false)}
                  className="px-2 py-1 text-sm rounded bg-zinc-100 dark:bg-zinc-800 border border-indigo-500 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
                  <button type="submit" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{t('save')}</button>
              </form>
            ) : (
              <div className="flex items-center gap-2 truncate">
                <h2 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-xs md:max-w-md">
                  {conversation.title}
                </h2>
                <button
                  onClick={() => {
                    setTitleInput(conversation.title);
                    setIsEditingTitle(true);
                  }}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  title={t('rename')}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <StudyModeBadge mode={activeMode} size="sm" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDeleteConversation(conversation.id)}
              className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title={t('delete')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Message Feed Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto relative overscroll-contain"
      >
        {messages.length === 0 ? (
          /* Empty / Welcome State with Study Prompt Starters */
          <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
              {t('welcomeStudy')}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-8">
              {t('studyIntro')}
            </p>

            {/* Quick Prompt Starters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {starterPrompts.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      onModeChange(item.mode);
                      onSendMessage(item.prompt);
                    }}
                    className={`p-4 rounded-xl border transition-all text-left group hover:scale-[1.01] shadow-2xs ${item.color}`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                      <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      "{item.prompt}"
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {messages.map((msg, idx) => (
              <ChatMessage
                key={msg.id || idx}
                message={msg}
                isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
                onRegenerate={idx === messages.length - 1 && msg.role === 'assistant' ? onRegenerate : undefined}
                onEditAndResend={msg.role === 'user' ? onEditAndResend : undefined}
              />
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
              <div
                role="status"
                aria-live="polite"
                className="px-4 py-5 md:px-6 text-sm text-zinc-500 dark:text-zinc-400"
              >
                <div className="max-w-4xl mx-auto flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  <span>{t('generatingResponse')}</span>
                  <span className="inline-flex gap-1" aria-hidden="true">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {showScrollBottomBtn && (
        <button
          onClick={() => {
            isAutoScrollEnabledRef.current = true;
            setShowScrollBottomBtn(false);
            scrollToBottom(true);
          }}
          className="absolute bottom-28 right-6 z-20 p-2.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105 transition-all flex items-center gap-1.5 text-xs font-semibold"
          title="Scroll to latest message"
        >
          <ChevronDown className="w-4 h-4" />
          <span className="hidden sm:inline">{t('latest')}</span>
        </button>
      )}

      {/* Fixed Bottom Input Container */}
      <div className="shrink-0 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
        <ChatInput
          onSendMessage={(text) => onSendMessage(text, attachedDocument?.id)}
          onStopGeneration={onStopGeneration}
          isStreaming={isStreaming}
          activeMode={activeMode}
          onModeChange={onModeChange}
          attachedDocument={attachedDocument}
          onRemoveDocument={() => onSelectDocument(null)}
          documents={documents}
          onSelectDocument={onSelectDocument}
          responseLanguage={responseLanguage}
          onResponseLanguageChange={onResponseLanguageChange}
        />
      </div>
    </div>
  );
};

