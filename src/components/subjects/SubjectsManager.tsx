import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Trash2, 
  ChevronRight, 
  MessageSquare, 
  FileText, 
  HelpCircle,
  FolderPlus
} from 'lucide-react';
import { Subject, Topic } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface SubjectsManagerProps {
  subjects: Subject[];
  onRefreshSubjects: () => void;
  onStartStudyOnTopic: (topicName: string, subjectName: string) => void;
  onGenerateNotesOnTopic: (topicName: string, subjectName: string) => void;
  onGenerateQuizOnTopic: (topicName: string, subjectName: string) => void;
}

export const SubjectsManager: React.FC<SubjectsManagerProps> = ({
  subjects,
  onRefreshSubjects,
  onStartStudyOnTopic,
  onGenerateNotesOnTopic,
  onGenerateQuizOnTopic,
}) => {
  const { t } = useLanguage();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    subjects.length > 0 ? subjects[0].id : null
  );
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);

  // Form states
  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [newSubColor, setNewSubColor] = useState('indigo');
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicSummary, setNewTopicSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || subjects[0];

  const loadTopics = async (subjId: string) => {
    try {
      setTopicsLoading(true);
      const res = await api.getTopics(subjId);
      setTopics(res.topics || []);
    } catch (err) {
      console.error('Failed to load topics:', err);
    } finally {
      setTopicsLoading(false);
    }
  };

  useEffect(() => {
    if (subjects.length === 0) {
      setSelectedSubjectId(null);
    } else if (!subjects.some(subject => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, selectedSubjectId]);

  useEffect(() => {
    if (selectedSubject?.id) {
      loadTopics(selectedSubject.id);
    } else {
      setTopics([]);
    }
  }, [selectedSubject?.id]);

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    setLoading(true);
    try {
      const res = await api.createSubject({
        name: newSubName.trim(),
        description: newSubDesc.trim(),
        color: newSubColor,
      });
      onRefreshSubjects();
      setSelectedSubjectId(res.subject.id);
      setShowAddSubjectModal(false);
      setNewSubName('');
      setNewSubDesc('');
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newTopicName.trim()) return;
    setLoading(true);
    try {
      await api.createTopic({
        subjectId: selectedSubject.id,
        name: newTopicName.trim(),
        summary: newTopicSummary.trim(),
      });
      loadTopics(selectedSubject.id);
      onRefreshSubjects();
      setShowAddTopicModal(false);
      setNewTopicName('');
      setNewTopicSummary('');
    } catch (err: any) {
      alert(err.message || 'Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopic = async (topicId: string) => {
    try {
      await api.toggleTopic(topicId);
      if (selectedSubject) {
        loadTopics(selectedSubject.id);
      }
      onRefreshSubjects();
    } catch (err) {
      console.error('Failed to toggle topic:', err);
    }
  };

  const handleDeleteSubject = async (subjectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this entire subject and all its topics?')) return;
    try {
      await api.deleteSubject(subjectId);
      onRefreshSubjects();
      if (selectedSubjectId === subjectId) {
        setSelectedSubjectId(null);
      }
    } catch (err) {
      console.error('Failed to delete subject:', err);
    }
  };

  const handleDeleteTopic = async (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this topic?')) return;
    try {
      await api.deleteTopic(topicId);
      if (selectedSubject) {
        loadTopics(selectedSubject.id);
      }
      onRefreshSubjects();
    } catch (err) {
      console.error('Failed to delete topic:', err);
    }
  };

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500 text-indigo-500 border-indigo-500/30',
    cyan: 'bg-cyan-500 text-cyan-500 border-cyan-500/30',
    emerald: 'bg-emerald-500 text-emerald-500 border-emerald-500/30',
    amber: 'bg-amber-500 text-amber-500 border-amber-500/30',
    rose: 'bg-rose-500 text-rose-500 border-rose-500/30',
    violet: 'bg-violet-500 text-violet-500 border-violet-500/30',
  };

  const completedTopicsCount = topics.filter(t => t.completed || t.masteryLevel === 'mastered').length;
  const currentSubjectPercent = topics.length > 0
    ? Math.round((completedTopicsCount / topics.length) * 100)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {t('subjects')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t('subjects')}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Organize your academic courses, monitor topic mastery, and launch AI study workflows per chapter.
            </p>
          </div>

          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 self-start sm:self-auto transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{t('newChat')}</span>
          </button>
        </div>

        {/* Layout: Left Subject List, Right Topics Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Subjects Cards */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              {t('subjects')} ({subjects.length})
            </h2>

            {subjects.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-xs text-zinc-500">
                No subjects yet. Click "Add New Subject" to begin.
              </div>
            ) : (
              subjects.map(sub => {
                const isSelected = selectedSubject?.id === sub.id;
                const totalT = sub.topicsCount || 0;
                const doneT = sub.completedTopicsCount || 0;
                const percent = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0;

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-zinc-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                        : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${colorMap[sub.color || 'indigo']?.split(' ')[0] || 'bg-indigo-500'}`} />
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {sub.name}
                        </h3>
                      </div>
                      <button
                        onClick={e => handleDeleteSubject(sub.id, e)}
                        className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {sub.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-3">
                        {sub.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{doneT}/{totalT} Topics Mastered</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{percent}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Topics Checklist & Launchers */}
          <div className="lg:col-span-2 space-y-4">
            {selectedSubject ? (
              <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-6">
                {/* Subject Title Header & Add Topic Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                      {selectedSubject.name} Curriculum
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {completedTopicsCount} of {topics.length} topics mastered ({currentSubjectPercent}%)
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddTopicModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Topic</span>
                  </button>
                </div>

                {/* Topics List */}
                <div className="space-y-3">
                  {topicsLoading ? (
                    <div className="py-8 text-center text-zinc-400 text-xs">Loading curriculum topics...</div>
                  ) : topics.length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 text-xs">
                      No topics added to this subject yet. Click "+ Add Topic" above.
                    </div>
                  ) : (
                    topics.map(topic => {
                      const isMastered = topic.completed || topic.masteryLevel === 'mastered';
                      return (
                        <div
                          key={topic.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isMastered
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                              : 'bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div
                              onClick={() => handleToggleTopic(topic.id)}
                              className="flex items-start gap-3 cursor-pointer select-none flex-1 min-w-0"
                            >
                              <button className="mt-0.5 text-zinc-400 hover:text-emerald-500 transition-colors shrink-0">
                                {isMastered ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>
                              <div>
                                <h4 className={`font-semibold text-sm leading-tight ${
                                  isMastered
                                    ? 'line-through text-zinc-400 dark:text-zinc-500'
                                    : 'text-zinc-900 dark:text-zinc-100'
                                }`}>
                                  {topic.name}
                                </h4>
                                {topic.summary && (
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                                    {topic.summary}
                                  </p>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={e => handleDeleteTopic(topic.id, e)}
                              className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                              title="Delete Topic"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick AI Action Buttons on Topic */}
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 flex-wrap">
                            <button
                              onClick={() => onStartStudyOnTopic(topic.name, selectedSubject.name)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>AI Tutor</span>
                            </button>

                            <button
                              onClick={() => onGenerateNotesOnTopic(topic.name, selectedSubject.name)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Gen Notes</span>
                            </button>

                            <button
                              onClick={() => onGenerateQuizOnTopic(topic.name, selectedSubject.name)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <HelpCircle className="w-3 h-3" />
                              <span>Take Quiz</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs">
                Select a subject from the left column to view its topic syllabus.
              </div>
            )}
          </div>
        </div>

        {/* Modal: Add Subject */}
        {showAddSubjectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Add Academic Subject</h3>
                <button onClick={() => setShowAddSubjectModal(false)} className="text-zinc-400 hover:text-zinc-700">✕</button>
              </div>

              <form onSubmit={handleCreateSubject} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={newSubName}
                    onChange={e => setNewSubName(e.target.value)}
                    placeholder="e.g. Data Structures & Algorithms, Physics II, Neuroanatomy"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={newSubDesc}
                    onChange={e => setNewSubDesc(e.target.value)}
                    placeholder="e.g. Core semester 3 coursework"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Accent Color</label>
                  <div className="flex items-center gap-2">
                    {['indigo', 'cyan', 'emerald', 'amber', 'rose', 'violet'].map(col => (
                      <button
                        type="button"
                        key={col}
                        onClick={() => setNewSubColor(col)}
                        className={`w-7 h-7 rounded-full transition-transform ${colorMap[col].split(' ')[0]} ${
                          newSubColor === col ? 'scale-110 ring-2 ring-zinc-900 dark:ring-white' : 'opacity-70'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  Create Subject
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Topic */}
        {showAddTopicModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Add Topic to {selectedSubject?.name}</h3>
                <button onClick={() => setShowAddTopicModal(false)} className="text-zinc-400 hover:text-zinc-700">✕</button>
              </div>

              <form onSubmit={handleCreateTopic} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Topic Name *</label>
                  <input
                    type="text"
                    required
                    value={newTopicName}
                    onChange={e => setNewTopicName(e.target.value)}
                    placeholder="e.g. Binary Search Trees & Red-Black Trees"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Key Summary / Notes</label>
                  <textarea
                    rows={3}
                    value={newTopicSummary}
                    onChange={e => setNewTopicSummary(e.target.value)}
                    placeholder="e.g. Self-balancing binary tree properties, tree rotations, O(log N) lookup..."
                    className="w-full px-3 py-2 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
                >
                  Add Topic
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
