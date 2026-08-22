import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Edit2, 
  Sparkles, 
  User, 
  FileText 
} from 'lucide-react';
import { Message, StudyMode } from '../../types';
import { StudyModeBadge } from '../common/StudyModeBadge';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onEditAndResend?: (content: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onRegenerate,
  onEditAndResend,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Reset any previous speech
    const utterance = new SpeechSynthesisUtterance(message.content.replace(/[`*#$]/g, ''));
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEditAndResend) {
      onEditAndResend(editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      id={`chat-message-${message.id}`}
      className={`py-5 px-4 md:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-zinc-50/60 dark:bg-zinc-900/50 border-y border-zinc-200/60 dark:border-zinc-800/60'
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-zinc-800 dark:bg-zinc-700 text-white flex items-center justify-center shadow-xs">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          {/* Header row: Name / Role + Mode Badge + Document Indicator */}
          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                {isUser ? 'You' : 'ScholarMind AI'}
              </span>
              {message.mode && (
                <StudyModeBadge mode={message.mode as StudyMode} size="sm" />
              )}
              {message.documentName && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                  <FileText className="w-3 h-3" />
                  <span>{message.documentName}</span>
                </span>
              )}
            </div>

            <span className="text-[11px] text-zinc-400 font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Message Text / Edit Box */}
          {isEditing ? (
            <div className="space-y-2 mt-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-indigo-500 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs font-semibold rounded bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  Save & Resend
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-zinc-800 dark:text-zinc-200 leading-relaxed break-words"
              aria-busy={isStreaming}
            >
              {message.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match && !String(children).includes('\n');
                      const codeText = String(children).replace(/\n$/, '');

                      if (isInline) {
                        return (
                          <code className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-300 font-mono text-xs" {...props}>
                            {children}
                          </code>
                        );
                      }

                      return (
                        <div className="relative group my-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 font-mono text-xs">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[11px]">
                            <span className="font-bold text-zinc-300 uppercase tracking-wider">{match ? match[1] : 'code'}</span>
                            <button
                              onClick={() => copyToClipboard(codeText)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="p-3.5 overflow-x-auto text-zinc-100 font-mono text-xs leading-5">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              ) : null}

              {isStreaming && (
                <div
                  role="status"
                  aria-live="polite"
                  aria-label="Response is still generating"
                  className="mt-2 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span>Generating response</span>
                  <span className="inline-flex gap-1" aria-hidden="true">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  </span>
                </div>
              )}

              {isStreaming && message.content && (
                <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Action Bar (Copy, TTS, Edit, Regenerate) */}
          {!isEditing && (
            <div className="flex items-center gap-1.5 mt-3 pt-2 text-zinc-400 dark:text-zinc-500">
              <button
                onClick={() => copyToClipboard(message.content)}
                title="Copy text"
                className="flex items-center gap-1 p-1 rounded text-xs hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleSpeak}
                title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                className={`flex items-center gap-1 p-1 rounded text-xs transition-colors ${
                  isSpeaking
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950'
                    : 'hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{isSpeaking ? 'Stop' : 'Listen'}</span>
              </button>

              {isUser && onEditAndResend && (
                <button
                  onClick={() => setIsEditing(true)}
                  title="Edit prompt"
                  className="flex items-center gap-1 p-1 rounded text-xs hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Edit</span>
                </button>
              )}

              {!isUser && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  title="Regenerate answer"
                  className="flex items-center gap-1 p-1 rounded text-xs hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Regenerate</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
