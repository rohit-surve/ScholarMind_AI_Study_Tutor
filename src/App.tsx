import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ChatView } from './components/chat/ChatView';
import { StudyToolsHub } from './components/study-tools/StudyToolsHub';
import { QuizHub } from './components/quiz/QuizHub';
import { FlashcardsHub } from './components/study-tools/FlashcardsHub';
import { FlashcardPlayer } from './components/study-tools/FlashcardPlayer';
import { DashboardView } from './components/dashboard/DashboardView';
import { SubjectsManager } from './components/subjects/SubjectsManager';
import { NotesView } from './components/notes/NotesView';
import { PlannerView } from './components/planner/PlannerView';
import { DocumentHub } from './components/documents/DocumentHub';
import { SettingsView } from './components/settings/SettingsView';
import { AuthModal } from './components/auth/AuthModal';
import { api } from './services/api';
import { Conversation, Message, StudyMode, Subject, StudyDocument, FlashcardDeck } from './types';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function MainApp() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { language, setLanguage } = useLanguage();
  
  // Navigation & Layout State
  const [activeView, setActiveView] = useState<string>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Chat State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeMode, setActiveMode] = useState<StudyMode>('tutor');
  const [attachedDocument, setAttachedDocument] = useState<StudyDocument | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const skipNextConversationFetchRef = useRef(false);
  const initialConversationSelectedRef = useRef(false);

  // Global Data State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [selectedDeckForStudy, setSelectedDeckForStudy] = useState<FlashcardDeck | null>(null);
  const [requestedTool, setRequestedTool] = useState<string | null>(null);
  const [requestedTopic, setRequestedTopic] = useState('');
  const [requestedSubject, setRequestedSubject] = useState('');

  const handleViewChange = (view: string) => {
    if (view === 'tools') {
      setRequestedTool(null);
      setRequestedTopic('');
      setRequestedSubject('');
    }
    setActiveView(view);
  };

  const openTool = (tool: string, topic = '', subject = '') => {
    setRequestedTool(tool);
    setRequestedTopic(topic);
    setRequestedSubject(subject);
    setActiveView('tools');
  };

  // Load initial subjects, documents, and conversations
  const loadInitialData = useCallback(async () => {
    if (!user) return;
    try {
      const [convRes, subRes, docRes] = await Promise.all([
        api.getConversations(),
        api.getSubjects(),
        api.getDocuments(),
      ]);
      setConversations(convRes.conversations || []);
      setSubjects(subRes.subjects || []);
      setDocuments(docRes.documents || []);

      if (convRes.conversations && convRes.conversations.length > 0 && !initialConversationSelectedRef.current) {
        initialConversationSelectedRef.current = true;
        setActiveConversationId(convRes.conversations[0].id);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    if (skipNextConversationFetchRef.current) {
      skipNextConversationFetchRef.current = false;
      return;
    }

    let cancelled = false;
    const fetchConv = async () => {
      try {
        const res = await api.getConversation(activeConversationId);
        if (cancelled) return;
        setActiveConversation(res.conversation);
        setMessages(res.messages || []);
        if (res.conversation.studyMode) {
          setActiveMode(res.conversation.studyMode);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load conversation messages:', err);
        }
      }
    };
    fetchConv();
    return () => {
      cancelled = true;
    };
  }, [activeConversationId]);

  // Start new clean chat
  const handleNewChat = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    skipNextConversationFetchRef.current = false;
    setActiveConversationId(null);
    setActiveConversation(null);
    setMessages([]);
    setAttachedDocument(null);
    setIsStreaming(false);
    setActiveView('chat');
  };

  const handleSelectConversation = (id: string) => {
    if (id === activeConversationId) {
      setActiveView('chat');
      return;
    }
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    skipNextConversationFetchRef.current = false;
    setIsStreaming(false);
    setActiveConversationId(id);
    setActiveView('chat');
  };

  // Send message with real-time SSE streaming
  const handleSendMessage = async (content: string, docId?: string) => {
    if (!content.trim() || isStreaming) return;

    // Create user message optimistically
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      conversationId: activeConversationId || 'temp',
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      mode: activeMode,
      documentName: attachedDocument?.title,
    };

    // Placeholder assistant message for streaming
    const assistantMsg: Message = {
      id: `assistant-${Date.now()}`,
      conversationId: activeConversationId || 'temp',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      mode: activeMode,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedText = '';

    await api.streamChat(
      {
        conversationId: activeConversationId || undefined,
        content: content.trim(),
        studyMode: activeMode,
        responseLanguage: `${language.name} (${language.nativeName}, ${language.code})`,
        documentId: docId || attachedDocument?.id,
      },
      {
        onInit: (data) => {
          if (!activeConversationId && data.conversationId) {
            skipNextConversationFetchRef.current = true;
            setActiveConversationId(data.conversationId);
            // Refresh conversation list to include newly created conversation
            api.getConversations().then(res => setConversations(res.conversations || []));
          }
        },
        onChunk: (chunk) => {
          accumulatedText += chunk;
          setMessages(prev => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
              next[lastIdx] = {
                ...next[lastIdx],
                content: accumulatedText,
              };
            }
            return next;
          });
        },
        onDone: (data) => {
          setIsStreaming(false);
          abortControllerRef.current = null;
          if (data.message) {
            setMessages(prev => {
              const next = [...prev];
              const lastIdx = next.length - 1;
              if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
                next[lastIdx] = data.message;
              }
              return next;
            });
          }
          // Refresh user XP/level stats if awarded
          if (data.xpAwarded) {
            refreshUser();
          }
        },
        onError: (err) => {
          setIsStreaming(false);
          abortControllerRef.current = null;
          setMessages(prev => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx].role === 'assistant') {
              next[lastIdx] = {
                ...next[lastIdx],
                content: accumulatedText || `⚠️ Error: ${err}`,
              };
            }
            return next;
          });
        },
      },
      controller.signal
    );
  };

  const handleResponseLanguageChange = setLanguage;

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      // Remove last assistant message
      setMessages(prev => prev.filter((_, idx) => idx !== prev.length - 1));
      handleSendMessage(lastUserMsg.content, attachedDocument?.id);
    }
  };

  // Edit and resend user prompt
  const handleEditAndResend = (newContent: string) => {
    handleSendMessage(newContent, attachedDocument?.id);
  };

  // Rename conversation
  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await api.updateConversation(id, { title: newTitle });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      if (activeConversation?.id === id) {
        setActiveConversation(prev => prev ? { ...prev, title: newTitle } : null);
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Start study chat grounded in document
  const handleStartChatWithDoc = (doc: StudyDocument) => {
    setAttachedDocument(doc);
    handleNewChat();
    setActiveView('chat');
  };

  // Start study chat from topic checklist
  const handleStartStudyOnTopic = (topicName: string, subjectName: string) => {
    handleNewChat();
    setActiveView('chat');
    handleSendMessage(`I want to study "${topicName}" from ${subjectName}. Please guide me using Socratic questioning.`);
  };

  // Generate Notes on Topic trigger
  const handleGenerateNotesOnTopic = (topicName: string, subjectName: string) => {
    openTool('notes', topicName, subjectName);
  };

  // Generate Quiz on Topic trigger
  const handleGenerateQuizOnTopic = (topicName: string, subjectName: string) => {
    openTool('mcq', topicName, subjectName);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-zinc-500">Initializing ScholarMind...</p>
        </div>
      </div>
    );
  }

  if (!user || activeView === 'auth') {
    return <AuthModal onSuccess={() => setActiveView('chat')} />;
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-indigo-500/20 selection:text-indigo-700 dark:selection:text-indigo-300">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        activeView={activeView}
        setActiveView={handleViewChange}
      />

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeView={activeView}
          setActiveView={handleViewChange}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {activeView === 'chat' && (
            <ChatView
              conversation={activeConversation}
              messages={messages}
              isStreaming={isStreaming}
              activeMode={activeMode}
              onModeChange={setActiveMode}
              onSendMessage={handleSendMessage}
              onStopGeneration={handleStopGeneration}
              onRegenerate={handleRegenerate}
              onEditAndResend={handleEditAndResend}
              onRenameConversation={handleRenameConversation}
              onDeleteConversation={handleDeleteConversation}
              documents={documents}
              attachedDocument={attachedDocument}
              onSelectDocument={setAttachedDocument}
              responseLanguage={language.code}
              onResponseLanguageChange={handleResponseLanguageChange}
            />
          )}

          {activeView === 'tools' && (
            <StudyToolsHub
              subjects={subjects}
              initialTool={requestedTool}
              initialTopic={requestedTopic}
              initialSubject={requestedSubject}
              onOpenDeck={(deck) => {
                setSelectedDeckForStudy(deck);
                setActiveView('flashcards');
              }}
              onRefreshData={loadInitialData}
              onNavigateToView={handleViewChange}
            />
          )}

          {activeView === 'quizzes' && (
            <QuizHub onRefreshStats={refreshUser} />
          )}

          {activeView === 'flashcards' && (
            selectedDeckForStudy ? (
              <FlashcardPlayer
                deck={selectedDeckForStudy}
                onBack={() => setSelectedDeckForStudy(null)}
                onDeckUpdated={loadInitialData}
              />
            ) : (
              <FlashcardsHub onRefreshData={loadInitialData} />
            )
          )}

          {activeView === 'dashboard' && (
            <DashboardView
              onNavigate={handleViewChange}
              onSelectConversation={(id) => {
                setActiveConversationId(id);
                setActiveView('chat');
              }}
              onOpenDeck={(deck) => {
                setSelectedDeckForStudy(deck);
                setActiveView('flashcards');
              }}
            />
          )}

          {activeView === 'subjects' && (
            <SubjectsManager
              subjects={subjects}
              onRefreshSubjects={loadInitialData}
              onStartStudyOnTopic={handleStartStudyOnTopic}
              onGenerateNotesOnTopic={handleGenerateNotesOnTopic}
              onGenerateQuizOnTopic={handleGenerateQuizOnTopic}
            />
          )}

          {activeView === 'notes' && (
            <NotesView onOpenNotesGenerator={() => openTool('notes')} />
          )}

          {activeView === 'planner' && (
            <PlannerView onOpenPlannerGenerator={() => openTool('planner')} />
          )}

          {activeView === 'documents' && (
            <DocumentHub onStartChatWithDoc={handleStartChatWithDoc} />
          )}

          {activeView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
