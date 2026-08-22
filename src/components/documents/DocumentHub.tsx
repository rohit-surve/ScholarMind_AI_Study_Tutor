import React, { useState, useEffect } from 'react';
import { 
  FileCheck, 
  UploadCloud, 
  FileText, 
  Trash2, 
  MessageSquare, 
  Eye, 
  Sparkles, 
  BookOpen, 
  Clock, 
  CheckCircle2,
  FileCode,
  X
} from 'lucide-react';
import { StudyDocument } from '../../types';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '../../context/LanguageContext';

interface DocumentHubProps {
  onStartChatWithDoc: (doc: StudyDocument) => void;
}

export const DocumentHub: React.FC<DocumentHubProps> = ({ onStartChatWithDoc }) => {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<StudyDocument | null>(null);
  const [showDocumentText, setShowDocumentText] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);

    try {
      const text = await file.text();
      const res = await api.uploadDocument({
        title: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileType: file.type || 'text/plain',
        fileSize: file.size,
        rawText: text,
      });

      setDocuments(prev => [res.document, ...prev]);
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLoadSample = async () => {
    setUploading(true);
    try {
      const sampleText = `# Biology: Fundamentals of Cellular Respiration & ATP Production

## 1. Overview
Cellular respiration is the biochemical process by which eukaryotic organisms harvest chemical energy from glucose molecules and convert it into Adenosine Triphosphate (ATP). The overall balanced equation is:
C6H12O6 + 6O2 -> 6CO2 + 6H2O + ~30-32 ATP

## 2. The Four Major Stages
1. **Glycolysis (Cytoplasm)**: Anaerobic breakdown of glucose into 2 pyruvate molecules. Produces a net yield of 2 ATP and 2 NADH.
2. **Pyruvate Oxidation (Mitochondrial Matrix)**: Pyruvate is decarboxylated into Acetyl-CoA, producing 1 NADH and 1 CO2 per pyruvate.
3. **Citric Acid Cycle / Krebs Cycle (Mitochondrial Matrix)**: Acetyl-CoA is processed through a cyclic series of 8 enzymes. Yields 2 ATP/GTP, 6 NADH, 2 FADH2, and 4 CO2 per glucose.
4. **Oxidative Phosphorylation & Electron Transport Chain (Inner Membrane)**: High-energy electrons from NADH and FADH2 power proton pumping across the inner mitochondrial membrane, establishing a proton motive gradient. ATP synthase harnesses chemiosmosis to produce ~26-28 ATP.

## 3. High-Yield Exam Traps
- **Cyanide poisoning**: Directly blocks Complex IV (Cytochrome c oxidase), halting the ETC and ATP synthesis.
- **Uncoupling agents (e.g., DNP)**: Dissipate the proton gradient as heat, causing thermogenesis without ATP synthesis.`;

      const res = await api.uploadDocument({
        title: 'Cellular Respiration Textbook Chapter',
        fileName: 'cellular_respiration.md',
        fileType: 'text/markdown',
        fileSize: sampleText.length,
        rawText: sampleText,
      });

      setDocuments(prev => [res.document, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Failed to load sample');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this study document?')) return;
    try {
      await api.deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      console.error('Failed to delete doc:', err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {t('documents')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t('notes')}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Upload textbook chapters, syllabi, and lecture transcripts to chat directly with your course materials.
            </p>
          </div>

          <button
            onClick={handleLoadSample}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-2xs self-start sm:self-auto transition-colors"
          >
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>{t('studyTools')}</span>
          </button>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault();
            setDragOver(false);
            handleFileUpload(e.dataTransfer.files);
          }}
          className={`relative p-8 rounded-3xl border-2 border-dashed transition-all text-center ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
              : 'border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-400 dark:hover:border-zinc-700'
          }`}
        >
          <input
            type="file"
            id="file-upload-input"
            accept=".txt,.md,.pdf,.doc,.docx,.json"
            onChange={e => handleFileUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
            {uploading ? 'Processing & Summarizing with AI...' : 'Drop lecture files or click to browse'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Supports Markdown (.md), Plain Text (.txt), JSON, Course Notes, and Readings.
          </p>
        </div>

        {/* Documents Grid */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {t('documents')} ({documents.length})
          </h2>

          {loading ? (
            <div className="text-center py-12 text-zinc-400 text-xs">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
              No study materials uploaded yet. Upload a syllabus or textbook chapter above!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  id={`doc-card-${doc.id}`}
                  onClick={() => {
                    setSelectedDoc(doc);
                    setShowDocumentText(false);
                  }}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <button
                        onClick={e => handleDelete(doc.id, e)}
                        className="p-1 text-zinc-400 hover:text-rose-500 rounded transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {doc.title}
                    </h3>

                    {doc.summary ? (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                        {doc.summary}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2">
                        {doc.rawText?.slice(0, 120)}...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </span>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onStartChatWithDoc(doc);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat with Doc</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Reader Modal */}
        {selectedDoc && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-3xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="h-16 px-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{selectedDoc.title}</h3>
                    <p className="text-[11px] text-zinc-500 font-mono">{selectedDoc.fileName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onStartChatWithDoc(selectedDoc);
                      setSelectedDoc(null);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat With This Document</span>
                  </button>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedDoc.summary && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Key Concept Summary
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedDoc.summary}</ReactMarkdown>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">
                      Document Text Preview
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowDocumentText(value => !value)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {showDocumentText ? 'Hide text' : 'Show text'}
                    </button>
                  </div>
                  {showDocumentText && (
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs leading-relaxed font-mono whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
                      {(selectedDoc.rawText || 'No text available').slice(0, 50000)}
                      {(selectedDoc.rawText?.length || 0) > 50000 && (
                        <p className="mt-3 text-zinc-500 font-sans">
                          Preview limited to 50,000 characters. Chat with this document to search the complete file.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
