/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StudentDashboard } from './components/StudentDashboard';
import { SyllabusExplorer } from './components/SyllabusExplorer';
import { ImportantTopicsView } from './components/ImportantTopicsView';
import { SharedResourcesView } from './components/SharedResourcesView';
import { AdminPanel } from './components/AdminPanel';
import { LoginModal } from './components/LoginModal';
import { AddResourceModal } from './components/AddResourceModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { DataService } from './services/dataService';
import {
  Profile,
  SemesterWithSubjects,
  StudyResource,
  ProgressSummary,
} from './types/database';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'syllabus' | 'important' | 'resources' | 'admin'
  >('dashboard');

  const [currentUser, setCurrentUser] = useState<Profile | null>(() =>
    DataService.getCurrentUser()
  );

  const [syllabus, setSyllabus] = useState<SemesterWithSubjects[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [savingItems, setSavingItems] = useState<Record<string, boolean>>({});

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Load syllabus hierarchy
  const loadSyllabus = useCallback(async () => {
    try {
      const data = await DataService.getSyllabusTree();
      setSyllabus(data);
    } catch (err) {
      console.error('Failed to load syllabus:', err);
    }
  }, []);

  // Load resources
  const loadResources = useCallback(async () => {
    try {
      const data = await DataService.getResources({ user: currentUser });
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  }, [currentUser]);

  // Load user progress (Strict isolation per student!)
  const loadProgress = useCallback(async (userId: string) => {
    try {
      const map = await DataService.getUserProgress(userId);
      setProgressMap(map);
    } catch (err) {
      console.error('Failed to load user progress:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSyllabus();
    loadResources();
  }, [loadSyllabus, loadResources]);

  // When current user changes, reload their private progress
  useEffect(() => {
    if (currentUser) {
      loadProgress(currentUser.id);
    } else {
      setProgressMap({});
    }
  }, [currentUser, loadProgress]);

  // Calculate overall & subject-wise progress summary
  const progressSummary: ProgressSummary = DataService.calculateProgressSummary(
    syllabus,
    progressMap
  );

  // Toggle Topic Progress Checkbox
  const handleToggleTopic = async (topicId: string, isCompleted: boolean) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    // Optimistic UI update
    setProgressMap((prev) => ({
      ...prev,
      [topicId]: isCompleted,
    }));
    setSavingItems((prev) => ({ ...prev, [topicId]: true }));

    try {
      const res = await DataService.toggleProgress(currentUser.id, topicId, 'topic', isCompleted);
      if (!res.success) {
        // Revert on error
        setProgressMap((prev) => ({
          ...prev,
          [topicId]: !isCompleted,
        }));
        showToast('error', res.error || 'Failed to save progress to database.');
      }
    } catch {
      setProgressMap((prev) => ({
        ...prev,
        [topicId]: !isCompleted,
      }));
      showToast('error', 'Network connection interrupted. Save failed.');
    } finally {
      setSavingItems((prev) => {
        const next = { ...prev };
        delete next[topicId];
        return next;
      });
    }
  };

  // Toggle Subtopic Progress Checkbox
  const handleToggleSubtopic = async (subtopicId: string, isCompleted: boolean) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setProgressMap((prev) => ({
      ...prev,
      [subtopicId]: isCompleted,
    }));
    setSavingItems((prev) => ({ ...prev, [subtopicId]: true }));

    try {
      const res = await DataService.toggleProgress(currentUser.id, subtopicId, 'subtopic', isCompleted);
      if (!res.success) {
        setProgressMap((prev) => ({
          ...prev,
          [subtopicId]: !isCompleted,
        }));
        showToast('error', res.error || 'Failed to update subtopic');
      }
    } catch {
      setProgressMap((prev) => ({
        ...prev,
        [subtopicId]: !isCompleted,
      }));
      showToast('error', 'Failed to update subtopic');
    } finally {
      setSavingItems((prev) => {
        const next = { ...prev };
        delete next[subtopicId];
        return next;
      });
    }
  };

  // Toggle Important Status (Admin role required!)
  const handleToggleImportant = async (topicId: string, isImportant: boolean) => {
    if (!currentUser || currentUser.role !== 'admin') {
      showToast('error', 'RLS Denied: Only faculty administrators can mark examination topics as important.');
      return;
    }

    const res = await DataService.toggleTopicImportantStatus(topicId, isImportant, currentUser);
    if (res.success) {
      showToast('success', `Topic updated: ${isImportant ? 'Important ⭐' : 'Regular'}`);
      loadSyllabus();
    } else {
      showToast('error', res.error || 'Failed to update topic importance');
    }
  };

  // Switch demo user to test isolation between Student A, Student B, and Admin
  const handleSwitchDemo = (role: 'student1' | 'student2' | 'admin') => {
    const switchedUser = DataService.switchDemoUser(role);
    setCurrentUser(switchedUser);
    showToast(
      'success',
      `Switched session to ${switchedUser.display_name} (${switchedUser.role === 'admin' ? 'Faculty Admin' : switchedUser.roll_number}). Private progress loaded.`
    );
  };

  // Logout
  const handleLogout = () => {
    DataService.logout();
    setCurrentUser(null);
    showToast('success', 'Logged out successfully. Sign in to access student records.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-subtle">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 max-w-md ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-slate-700'
                : 'bg-red-600 text-white border-red-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenConfig={() => setIsConfigModalOpen(true)}
        onSwitchDemo={handleSwitchDemo}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && currentUser && (
          <StudentDashboard
            currentUser={currentUser}
            syllabus={syllabus}
            progressSummary={progressSummary}
            progressMap={progressMap}
            resources={resources}
            onNavigateTab={setCurrentTab}
            onToggleTopic={handleToggleTopic}
            onOpenAddResource={() => setIsAddResourceOpen(true)}
          />
        )}

        {currentTab === 'dashboard' && !currentUser && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Student Session Required</h2>
            <p className="text-xs text-slate-500 mb-6">
              Please enter your name and college roll number to view your private semester dashboard.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors"
            >
              Sign In with Student Credentials
            </button>
          </div>
        )}

        {currentTab === 'syllabus' && (
          <SyllabusExplorer
            syllabus={syllabus}
            currentUser={currentUser || ({} as Profile)}
            progressMap={progressMap}
            savingItems={savingItems}
            onToggleTopic={handleToggleTopic}
            onToggleSubtopic={handleToggleSubtopic}
            onToggleImportant={handleToggleImportant}
            onOpenAddModal={() => setCurrentTab('admin')}
          />
        )}

        {currentTab === 'important' && (
          <ImportantTopicsView
            syllabus={syllabus}
            currentUser={currentUser || ({} as Profile)}
            progressMap={progressMap}
            savingItems={savingItems}
            onToggleTopic={handleToggleTopic}
            onToggleImportant={handleToggleImportant}
          />
        )}

        {currentTab === 'resources' && (
          <SharedResourcesView
            resources={resources}
            syllabus={syllabus}
            currentUser={currentUser || ({} as Profile)}
            onOpenAddModal={() => setIsAddResourceOpen(true)}
            onRefreshResources={loadResources}
          />
        )}

        {currentTab === 'admin' && currentUser && (
          <AdminPanel
            currentUser={currentUser}
            syllabus={syllabus}
            resources={resources}
            onRefreshSyllabus={loadSyllabus}
            onRefreshResources={loadResources}
          />
        )}
      </main>

      {/* Modals */}
      <LoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast('success', `Welcome, ${user.display_name}! Session restored.`);
        }}
      />

      {currentUser && (
        <AddResourceModal
          isOpen={isAddResourceOpen}
          onClose={() => setIsAddResourceOpen(false)}
          syllabus={syllabus}
          currentUser={currentUser}
          onResourceAdded={() => {
            loadResources();
            showToast('success', 'Study material successfully shared!');
          }}
        />
      )}

      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-800">Smart Study Tracker</span>
            <span className="mx-2">·</span>
            <span>Academic Syllabus & Record-Isolated Progress System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>PostgreSQL Row Level Security</span>
            <span>·</span>
            <span>Supabase Storage</span>
            <span>·</span>
            <span>TypeScript SPA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
