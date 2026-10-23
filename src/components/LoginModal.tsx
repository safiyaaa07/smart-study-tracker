import React, { useState } from 'react';
import { X, ShieldAlert, KeyRound, User, Hash, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { DataService } from '../services/dataService';
import { Profile } from '../types/database';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: Profile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'student' | 'faculty'>('student');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'student') {
        const res = await DataService.loginStudent(name, rollNumber, passcode);
        if (res.success && res.user) {
          onLoginSuccess(res.user);
          onClose();
        } else {
          setError(res.error || 'Login failed. Please check your credentials.');
        }
      } else {
        // Faculty / Admin Login
        const normalizedRoll = rollNumber.trim().toUpperCase();
        if (normalizedRoll !== 'FAC-001' && !normalizedRoll.includes('ADMIN')) {
          setError('Invalid faculty credentials. Faculty ID must be authorized by the institution.');
          setLoading(false);
          return;
        }

        const adminUser = DataService.switchDemoUser('admin');
        onLoginSuccess(adminUser);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication service error');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: 'student1' | 'student2' | 'admin') => {
    setError(null);
    if (preset === 'student1') {
      setName('Alex Sharma');
      setRollNumber('CS2026-001');
      setPasscode('202601');
      setActiveTab('student');
    } else if (preset === 'student2') {
      setName('Bhavna Patel');
      setRollNumber('CS2026-002');
      setPasscode('202602');
      setActiveTab('student');
    } else {
      setName('Dr. Eleanor Vance');
      setRollNumber('FAC-001');
      setPasscode('admin2026');
      setActiveTab('faculty');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Student Identity Verification</h3>
            <p className="text-xs text-slate-500">Sign in to sync your semester progress</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'student'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Account
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('faculty');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'faculty'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Faculty / Admin
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'student' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Student Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Sharma"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  College Roll Number
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. CS2026-001"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Roll numbers are normalized and linked to a unique student profile.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Security Passcode / PIN <span className="text-slate-400 font-normal">(Prevents unauthorized access)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="e.g. 202601"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Faculty Employee ID / Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. FAC-001"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Administrative Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Faculty security credentials"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 text-sm font-semibold text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'student'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-purple-600 hover:bg-purple-700'
            } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Continue to Tracker</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Credentials Box */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-600 mb-2">
              Instant Test Credentials (1-Click Fill):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => loadPreset('student1')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800">Student A</div>
                <div className="text-[10px] text-slate-500 font-mono">Alex (45%)</div>
              </button>

              <button
                type="button"
                onClick={() => loadPreset('student2')}
                className="p-2 border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-colors"
              >
                <div className="text-xs font-semibold text-slate-800">Student B</div>
                <div className="text-[10px] text-slate-500 font-mono">Bhavna (20%)</div>
              </button>

              <button
                type="button"
                onClick={() => loadPreset('admin')}
                className="p-2 border border-purple-200 bg-purple-50/50 rounded-lg text-left hover:bg-purple-50 transition-colors"
              >
                <div className="text-xs font-semibold text-purple-900">Admin</div>
                <div className="text-[10px] text-purple-700 font-mono">Dr. Vance</div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
