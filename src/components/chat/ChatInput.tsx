import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Square, 
  Mic, 
  MicOff, 
  Paperclip, 
  Sparkles, 
  X, 
  FileText,
  ChevronDown
} from 'lucide-react';
import { StudyMode, StudyDocument } from '../../types';
import { RESPONSE_LANGUAGES, ResponseLanguage } from '../../types/languages';
import { MODE_DETAILS } from '../common/StudyModeBadge';
import { LanguageSelector } from '../common/LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onStopGeneration?: () => void;
  isStreaming: boolean;
  activeMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  attachedDocument?: StudyDocument | null;
  onRemoveDocument?: () => void;
  documents?: StudyDocument[];
  onSelectDocument?: (doc: StudyDocument) => void;
  responseLanguage: string;
  onResponseLanguageChange: (language: ResponseLanguage) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  activeMode,
  onModeChange,
  attachedDocument,
  onRemoveDocument,
  documents = [],
  onSelectDocument,
  responseLanguage,
  onResponseLanguageChange,
}) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [showDocMenu, setShowDocMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Setup Web Speech API for voice dictation
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = RESPONSE_LANGUAGES.find(language => language.code === responseLanguage)?.speechCode || 'en-IN';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Failed to initialize speech recognition:', e);
      setIsRecording(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isStreaming) return;
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const currentModeInfo = MODE_DETAILS[activeMode] || MODE_DETAILS.tutor;
  const ModeIcon = currentModeInfo.icon;

  return (
    <div className="relative max-w-4xl mx-auto px-4 pb-4 pt-2">
      {/* Attached Document Banner (if any) */}
      {attachedDocument && (
        <div className="mb-2 flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold truncate">{t('groundedMaterials')}: {attachedDocument.title}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 opacity-80">
              ({(attachedDocument.fileSize / 1024).toFixed(1)} KB)
            </span>
          </div>
          {onRemoveDocument && (
            <button
              onClick={onRemoveDocument}
              className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded text-emerald-700 dark:text-emerald-300"
                  title={t('delete')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
        {/* Top bar inside input: Mode Selector & Document Attachment button */}
        <div className="flex items-center justify-between px-3 pt-2.5 pb-1 border-b border-zinc-100 dark:border-zinc-800/80">
          {/* Mode Selector Button */}
          <div className="relative">
            <button
              type="button"
              id="btn-chat-mode-selector"
              onClick={() => setShowModeMenu(!showModeMenu)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${currentModeInfo.bgColor} ${currentModeInfo.color} ${currentModeInfo.borderColor}`}
            >
              <ModeIcon className="w-3.5 h-3.5" />
              <span>{currentModeInfo.name}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Mode Dropdown Menu */}
            {showModeMenu && (
              <div className="absolute left-0 bottom-full mb-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1.5 z-50 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {t('selectStudyMode')}
                </div>
                {(Object.keys(MODE_DETAILS) as StudyMode[]).map(modeKey => {
                  const info = MODE_DETAILS[modeKey];
                  const Icon = info.icon;
                  const isSelected = activeMode === modeKey;
                  return (
                    <button
                      key={modeKey}
                      type="button"
                      onClick={() => {
                        onModeChange(modeKey);
                        setShowModeMenu(false);
                      }}
                      className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${info.color}`} />
                      <div>
                        <div className="font-semibold">{info.name}</div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal leading-tight">
                          {info.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <LanguageSelector value={responseLanguage} onChange={onResponseLanguageChange} compact />

          {/* Document Grounding Selector */}
          {documents.length > 0 && onSelectDocument && (
            <div className="relative">
              <button
                type="button"
                id="btn-attach-document"
                onClick={() => setShowDocMenu(!showDocMenu)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('attachDoc')}</span>
              </button>

              {showDocMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1.5 z-50">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    {t('groundedMaterials')}
                  </div>
                  {documents.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        onSelectDocument(d);
                        setShowDocMenu(false);
                      }}
                      className="w-full text-left flex items-center gap-2 p-2 rounded-lg text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 truncate"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{d.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Textarea Input */}
        <div className="p-3 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            id="chat-textarea-input"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? 'Listening to your voice...'
                : `Ask ScholarMind in ${currentModeInfo.name} (Press Enter to send)...`
            }
            className="flex-1 bg-transparent border-0 resize-none text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none max-h-48 leading-relaxed"
          />

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Speech-to-Text Button */}
            <button
              type="button"
              id="btn-voice-input"
              onClick={toggleVoiceInput}
              title={isRecording ? 'Stop voice recording' : 'Speak your question'}
              className={`p-2 rounded-xl text-xs transition-colors ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send / Stop Generation Button */}
            {isStreaming ? (
              <button
                type="button"
                id="btn-stop-generation"
                onClick={onStopGeneration}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors flex items-center justify-center"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-send-message"
                onClick={handleSubmit}
                disabled={!input.trim()}
                className={`p-2 rounded-xl text-white transition-all flex items-center justify-center ${
                  input.trim()
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 scale-100 cursor-pointer'
                    : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed scale-95'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-zinc-400 dark:text-zinc-500">
        <span>Shift + Enter for new line • Grounded in educational pedagogy</span>
        <span className="font-mono">Gemini 3.7 Flash</span>
      </div>
    </div>
  );
};
