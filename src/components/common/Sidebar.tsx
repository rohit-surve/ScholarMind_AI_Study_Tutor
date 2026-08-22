import React, { useState } from 'react';
import { 
  MessageSquare, 
  Wrench, 
  HelpCircle, 
  Layers, 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  Calendar, 
  FileCheck, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  ChevronRight,
  Sparkles,
  Flame,
  X
} from 'lucide-react';
import { Conversation, StudyMode } from '../../types';
import { StudyModeBadge, MODE_DETAILS } from './StudyModeBadge';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const navItems = [
    { id: 'chat', label: t('aiStudyChat'), icon: MessageSquare, badge: 'AI' },
    { id: 'tools', label: t('studyTools'), icon: Wrench, badge: 'New' },
    { id: 'quizzes', label: t('quizSystem'), icon: HelpCircle },
    { id: 'flashcards', label: t('flashcards'), icon: Layers },
    { id: 'dashboard', label: t('analytics'), icon: LayoutDashboard },
    { id: 'subjects', label: t('subjects'), icon: BookOpen },
    { id: 'notes', label: t('notes'), icon: FileText },
    { id: 'planner', label: t('planner'), icon: Calendar },
    { id: 'documents', label: t('documents'), icon: FileCheck },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingConvId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-zinc-50 dark:bg-zinc-900/90 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full lg:w-0 lg:min-w-0 lg:overflow-hidden'
        }`}
      >
        {/* Header / Mobile Close */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 lg:hidden">
          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            {t('settings')}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Study Session */}
        <div className="p-3">
          <button
            id="btn-sidebar-new-chat"
            onClick={() => {
              onNewChat();
              setActiveView('chat');
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newStudyChat')}</span>
          </button>
        </div>

        {/* Main Navigation Links */}
        <div className="px-2 py-1 space-y-0.5 overflow-y-auto max-h-64 border-b border-zinc-200 dark:border-zinc-800">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => {
                  setActiveView(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chat History Section */}
        <div className="flex-1 flex flex-col min-h-0 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t('recentChats')} ({conversations.length})
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchConversations')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-xs">
                {t('noConversations')}
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isSelected = activeConversationId === conv.id && activeView === 'chat';
                const isEditing = editingConvId === conv.id;
                const modeDetail = MODE_DETAILS[conv.studyMode] || MODE_DETAILS.tutor;
                const ModeIcon = modeDetail.icon;

                return (
                  <div
                    key={conv.id}
                    id={`conv-item-${conv.id}`}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      setActiveView('chat');
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`group relative flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors border ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 shadow-2xs font-medium'
                        : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {isEditing ? (
                      <form 
                        onSubmit={e => handleSaveRename(conv.id, e)}
                        className="flex items-center gap-1 w-full"
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          autoFocus
                          onBlur={() => setEditingConvId(null)}
                          className="flex-1 px-1.5 py-0.5 text-xs bg-white dark:bg-zinc-900 border border-indigo-500 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none"
                        />
                        <button type="submit" className="text-[10px] text-indigo-500 font-semibold">{t('save')}</button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                          <ModeIcon className={`w-3.5 h-3.5 shrink-0 ${modeDetail.color}`} />
                          <span className="truncate">{conv.title}</span>
                        </div>

                        {/* Action buttons (Rename & Delete) on hover */}
                        <div className="hidden group-hover:flex items-center gap-1 shrink-0 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                          <button
                            onClick={e => startRename(conv, e)}
                            title={t('rename')}
                            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onDeleteConversation(conv.id);
                            }}
                            title={t('delete')}
                            className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
