import React from 'react';
import { BookOpen, Star, FolderGit2, ShieldCheck, UserCheck, LogOut, Database, Users } from 'lucide-react';
import { Profile } from '../types/database';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  currentTab: 'dashboard' | 'syllabus' | 'important' | 'resources' | 'admin';
  setCurrentTab: (tab: 'dashboard' | 'syllabus' | 'important' | 'resources' | 'admin') => void;
  currentUser: Profile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenConfig: () => void;
  onSwitchDemo: (role: 'student1' | 'student2' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenConfig,
  onSwitchDemo,
}) => {
  const isLive = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner indicating Sandbox / Live Supabase status */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>
            {isLive ? 'Supabase Live Connected' : 'Supabase Demo Sandbox'}
          </span>
          <span className="text-slate-500">·</span>
          <span className="hidden sm:inline text-slate-400">
            PostgreSQL RLS & Record Isolation Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenConfig}
            className="hover:text-white transition-colors flex items-center gap-1 text-slate-300 underline underline-offset-2"
          >
            <Database className="w-3.5 h-3.5" />
            <span>SQL Migrations & Config</span>
          </button>

          <span className="text-slate-600">|</span>

          {/* Quick Demo Switcher to test Student A vs Student B isolation */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="hidden md:inline">Test Role:</span>
            <button
              onClick={() => onSwitchDemo('student1')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                currentUser?.roll_number === 'CS2026-001'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Alex Sharma (Roll: CS2026-001)"
            >
              Student A
            </button>
            <button
              onClick={() => onSwitchDemo('student2')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                currentUser?.roll_number === 'CS2026-002'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Bhavna Patel (Roll: CS2026-002)"
            >
              Student B
            </button>
            <button
              onClick={() => onSwitchDemo('admin')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                currentUser?.role === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title="Dr. Eleanor Vance (Faculty Admin)"
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* Strict Top Bar Contract: Zone 1 (Brand) — Zone 2 (4-5 Nav Links) — Zone 3 (Primary Action) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center gap-2.5 text-left text-slate-900 group whitespace-nowrap shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900">
              Smart Study Tracker
            </span>
            <span className="block text-[11px] text-slate-500 font-medium">
              Academic Syllabus & Progress
            </span>
          </div>
        </button>

        {/* Zone 2: 4-5 Navigation Links (Single line) */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'dashboard'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setCurrentTab('syllabus')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'syllabus'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            Syllabus Explorer
          </button>

          <button
            onClick={() => setCurrentTab('important')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'important'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Important Topics</span>
          </button>

          <button
            onClick={() => setCurrentTab('resources')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'resources'
                ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                : 'hover:text-slate-900'
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Shared Resources</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors py-1 ${
                currentTab === 'admin'
                  ? 'text-purple-600 font-semibold border-b-2 border-purple-600'
                  : 'hover:text-purple-700 text-purple-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </button>
          )}
        </nav>

        {/* Zone 3: Primary Action & Profile Info */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900">
                  {currentUser.display_name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {currentUser.role === 'admin' ? 'Faculty Admin' : currentUser.roll_number}
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Log out of student session"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              Student Login
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-200 bg-slate-50 px-2 py-2 text-xs font-medium text-slate-600">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`px-2.5 py-1.5 rounded-md ${currentTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setCurrentTab('syllabus')}
          className={`px-2.5 py-1.5 rounded-md ${currentTab === 'syllabus' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
        >
          Syllabus
        </button>
        <button
          onClick={() => setCurrentTab('important')}
          className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 ${currentTab === 'important' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
        >
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>Exam Prep</span>
        </button>
        <button
          onClick={() => setCurrentTab('resources')}
          className={`px-2.5 py-1.5 rounded-md ${currentTab === 'resources' ? 'bg-white text-blue-600 shadow-sm' : ''}`}
        >
          Resources
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => setCurrentTab('admin')}
            className={`px-2.5 py-1.5 rounded-md text-purple-700 ${currentTab === 'admin' ? 'bg-white shadow-sm' : ''}`}
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
