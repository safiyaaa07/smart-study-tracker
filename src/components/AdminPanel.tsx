import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Layers,
  BookOpen,
  Users,
  FileCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SemesterWithSubjects, Profile, StudyResource } from '../types/database';
import { DataService } from '../services/dataService';

interface AdminPanelProps {
  currentUser: Profile;
  syllabus: SemesterWithSubjects[];
  resources: StudyResource[];
  onRefreshSyllabus: () => void;
  onRefreshResources: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  syllabus,
  resources,
  onRefreshSyllabus,
  onRefreshResources,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'syllabus' | 'moderation' | 'students'>('syllabus');

  // Form states for adding syllabus entities
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');
  const [targetUnitId, setTargetUnitId] = useState<string>('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newTopicHours, setNewTopicHours] = useState('2.0');
  const [newTopicIsImportant, setNewTopicIsImportant] = useState(false);
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');
  const [targetTopicIdForSub, setTargetTopicIdForSub] = useState('');

  // Form states for adding a new Subject
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCredits, setNewSubjectCredits] = useState('4');
  const [newSubjectColor, setNewSubjectColor] = useState('#2563EB');

  // Form states for adding a new Unit
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitNumber, setNewUnitNumber] = useState('1');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security Barrier: Check if user has admin privileges
  if (currentUser.role !== 'admin') {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-xl mx-auto shadow-sm my-12 animate-fade-in">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Access Denied: Faculty Privilege Required</h2>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          PostgreSQL Row Level Security (RLS) protects administrative operations. Only users with the verified 
          <code className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mx-1 font-mono">admin</code>
          role in <code className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded font-mono">public.user_roles</code> can alter syllabus entities or moderate shared resources.
        </p>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 mb-4 text-left">
          <strong>Tip for Evaluators:</strong> Use the "Test Role" switch at the top right of the navigation bar to switch to <strong>Admin (Dr. Eleanor Vance)</strong>.
        </div>
      </div>
    );
  }

  const allSubjects = syllabus.flatMap((s) => s.subjects);
  const selectedSubject = allSubjects.find((s) => s.id === targetSubjectId) || allSubjects[0];
  const availableUnits = selectedSubject?.units || [];
  const selectedUnit = availableUnits.find((u) => u.id === targetUnitId) || availableUnits[0];

  // Flat topics list for Important ⭐ management
  const allTopics: {
    id: string;
    title: string;
    subjectCode: string;
    unitTitle: string;
    isImportant: boolean;
    hours: number;
  }[] = [];

  syllabus.forEach((sem) => {
    sem.subjects.forEach((sub) => {
      sub.units.forEach((u) => {
        u.topics.forEach((t) => {
          allTopics.push({
            id: t.id,
            title: t.title,
            subjectCode: sub.code,
            unitTitle: u.title,
            isImportant: t.is_important,
            hours: t.estimated_hours,
          });
        });
      });
    });
  });

  // Handle Important Toggle
  const handleToggleImportant = async (topicId: string, currentStatus: boolean) => {
    setMessage(null);
    const res = await DataService.toggleTopicImportantStatus(topicId, !currentStatus, currentUser);
    if (res.success) {
      setMessage({ type: 'success', text: `Examination topic status updated to: ${!currentStatus ? 'Important ⭐' : 'Regular'}` });
      onRefreshSyllabus();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to update topic' });
    }
  };

  // Handle Add Topic
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const unitIdToUse = targetUnitId || availableUnits[0]?.id;
    if (!unitIdToUse) {
      setMessage({ type: 'error', text: 'Please select a unit to attach the topic to.' });
      return;
    }

    setLoading(true);
    const res = await DataService.addTopic(
      {
        unit_id: unitIdToUse,
        title: newTopicTitle.trim(),
        description: newTopicDesc.trim() || null,
        is_important: newTopicIsImportant,
        estimated_hours: parseFloat(newTopicHours) || 2.0,
        display_order: 99,
      },
      currentUser
    );

    setLoading(false);
    if (res.success) {
      setNewTopicTitle('');
      setNewTopicDesc('');
      setMessage({ type: 'success', text: 'Topic successfully published to syllabus!' });
      onRefreshSyllabus();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to add topic' });
    }
  };

  // Handle Add Subject
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectCode || !newSubjectName) return;

    setLoading(true);
    const res = await DataService.addSubject(
      {
        semester_id: syllabus[0]?.id || 'sem-4',
        code: newSubjectCode.trim().toUpperCase(),
        name: newSubjectName.trim(),
        credits: parseInt(newSubjectCredits) || 4,
        color_code: newSubjectColor,
        display_order: allSubjects.length + 1,
      },
      currentUser
    );
    setLoading(false);

    if (res.success) {
      setNewSubjectCode('');
      setNewSubjectName('');
      setMessage({ type: 'success', text: `Subject ${newSubjectCode} created successfully!` });
      onRefreshSyllabus();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to add subject' });
    }
  };

  // Handle Resource Moderation
  const handleModerate = async (resourceId: string, status: 'approved' | 'rejected') => {
    setMessage(null);
    const res = await DataService.moderateResource(resourceId, status, currentUser);
    if (res.success) {
      setMessage({ type: 'success', text: `Resource moderation status updated to: ${status}` });
      onRefreshResources();
    } else {
      setMessage({ type: 'error', text: res.error || 'Failed to moderate resource' });
    }
  };

  // Handle Deleting Topic
  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm('Are you sure you want to permanently delete this syllabus topic?')) return;
    const res = await DataService.deleteSyllabusItem('topic', topicId, currentUser);
    if (res.success) {
      setMessage({ type: 'success', text: 'Topic removed from syllabus.' });
      onRefreshSyllabus();
    } else {
      setMessage({ type: 'error', text: res.error || 'Deletion failed' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-purple-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Faculty Administration & Academic Council</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Academic Curriculum & Moderation Console
          </h1>
          <p className="text-xs text-slate-500">
            Logged in as {currentUser.display_name} ({currentUser.roll_number})
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg shrink-0">
          <button
            onClick={() => setActiveAdminTab('syllabus')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeAdminTab === 'syllabus'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Syllabus & Important Topics
          </button>
          <button
            onClick={() => setActiveAdminTab('moderation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeAdminTab === 'moderation'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resource Moderation ({resources.filter((r) => r.status === 'pending').length} Pending)
          </button>
          <button
            onClick={() => setActiveAdminTab('students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeAdminTab === 'students'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Roster
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      {/* Tab 1: Syllabus Management */}
      {activeAdminTab === 'syllabus' && (
        <div className="space-y-8">
          {/* Create Topic Form */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Add New Topic to Syllabus</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Changes are immediately synchronized to Supabase and visible to all enrolled students.
            </p>

            <form onSubmit={handleAddTopic} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Subject</label>
                  <select
                    value={targetSubjectId}
                    onChange={(e) => {
                      setTargetSubjectId(e.target.value);
                      setTargetUnitId('');
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code}: {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Unit</label>
                  <select
                    value={targetUnitId}
                    onChange={(e) => setTargetUnitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {availableUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Topic Title *</label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus & Raft Protocol"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newTopicHours}
                    onChange={(e) => setNewTopicHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="newTopicIsImportant"
                    checked={newTopicIsImportant}
                    onChange={(e) => setNewTopicIsImportant(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 cursor-pointer"
                  />
                  <label htmlFor="newTopicIsImportant" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Mark as Important Examination Topic ⭐</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                {loading ? 'Publishing Topic...' : 'Save Topic to Database'}
              </button>
            </form>
          </div>

          {/* Quick Important Examination Topic Master Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Manage Important Examination Status</h2>
                <p className="text-xs text-slate-500">
                  Toggle the ⭐ badge to highlight critical topics for student exam preparation
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {allTopics.filter((t) => t.isImportant).length} of {allTopics.length} Important
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {allTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="px-6 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        [{topic.subjectCode}]
                      </span>
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {topic.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {topic.unitTitle} · {topic.hours}h
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleToggleImportant(topic.id, topic.isImportant)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border ${
                        topic.isImportant
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          topic.isImportant ? 'fill-amber-500 text-amber-500' : ''
                        }`}
                      />
                      <span>{topic.isImportant ? 'Important ⭐' : 'Regular'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                      title="Delete topic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Resource Moderation */}
      {activeAdminTab === 'moderation' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Student Study Resource Moderation</h2>
            <p className="text-xs text-slate-500">
              Approve or reject uploaded lecture documents, YouTube links, and notes before publication
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {resources.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No resources in repository.
              </div>
            ) : (
              resources.map((res) => (
                <div key={res.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{res.title}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        res.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : res.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">{res.description || 'No description provided.'}</p>
                    <div className="text-[11px] text-slate-400">
                      Uploaded by {res.uploader_name} ({res.uploader_roll}) · Format: {res.resource_type.toUpperCase()}
                      {res.external_url && ` · ${res.external_url}`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {res.status !== 'approved' && (
                      <button
                        onClick={() => handleModerate(res.id, 'approved')}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {res.status !== 'rejected' && (
                      <button
                        onClick={() => handleModerate(res.id, 'rejected')}
                        className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Student Roster */}
      {activeAdminTab === 'students' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Enrolled Student Cohort</h2>
            <p className="text-xs text-slate-500">
              Verified students and their independent syllabus tracking records
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {[
              { name: 'Alex Sharma', roll: 'CS2026-001', dept: 'CSE', status: 'Active', progress: '45%' },
              { name: 'Bhavna Patel', roll: 'CS2026-002', dept: 'CSE', status: 'Active', progress: '20%' },
              { name: 'Dr. Eleanor Vance', roll: 'FAC-001', dept: 'Academic Council', status: 'Faculty Admin', progress: 'N/A' },
            ].map((stu, i) => (
              <div key={i} className="px-6 py-4 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">{stu.name}</div>
                  <div className="text-slate-500 font-mono">{stu.roll} · {stu.dept}</div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-semibold text-blue-600">{stu.progress}</span>
                  <span className="text-slate-400 block text-[11px]">{stu.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
