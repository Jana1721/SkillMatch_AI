import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  User,
  LogOut,
  Save,
  CheckCircle2,
  Mail,
  Copy,
  MailCheck,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StorageService } from '../utils/storage';
import { ApiService } from '../services/api';
import { UserSettings } from '../types';

export const Settings: React.FC = () => {
  const { user, logout, resendVerification } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [settings, setSettings] = useState<UserSettings>(() => StorageService.getUserSettings());
  const [emails, setEmails] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    loadUserEmails();
  }, []);

  const loadUserEmails = async () => {
    setLoadingEmails(true);
    try {
      const res = await ApiService.getUserEmails();
      if (res.success) {
        setEmails(res.emails || []);
      }
    } catch (err) {
      console.warn('[Load Emails Error]', err);
    } finally {
      setLoadingEmails(false);
    }
  };

  const handleToggle = (key: keyof UserSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.setUserSettings(settings);
    showToast('Preferences updated successfully!', 'success');
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await resendVerification();
      showToast(res.message || 'Verification email resent!', 'success');
      loadUserEmails();
    } catch (err: any) {
      showToast(err.message || 'Failed to resend verification', 'error');
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Account & Settings</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your individual credentials, security, email notifications, and dispatched messages.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 1. Account Credentials & Permanent ID */}
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Official Candidate Credentials</h2>
            <p className="text-xs text-slate-500">Unique permanent identifiers and security status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Permanent Credential ID */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SkillMatch Candidate ID</span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-lg font-black text-indigo-700 tracking-wider">
                {user.credentialId && user.credentialId.startsWith('KCE-')
                  ? user.credentialId
                  : `KCE-${user.graduationYear || '2026'}-${(user.rollNumber || '2024CS01').toUpperCase().replace(/\s+/g, '')}`}
              </span>
              <button
                type="button"
                onClick={() => {
                  const cid = user.credentialId && user.credentialId.startsWith('KCE-')
                    ? user.credentialId
                    : `KCE-${user.graduationYear || '2026'}-${(user.rollNumber || '2024CS01').toUpperCase().replace(/\s+/g, '')}`;
                  navigator.clipboard.writeText(cid);
                  showToast('Candidate ID copied to clipboard!', 'info');
                }}
                className="p-1 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                title="Copy ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-500">Enforced by database uniqueness constraints.</p>
          </div>

          {/* Email Verification Status */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Personal Email Status</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">{user.email}</span>
              {user.emailVerified ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Unverified
                </span>
              )}
            </div>

            {!user.emailVerified && (
              <div className="pt-1 flex items-center gap-2">
                <Button onClick={() => navigate('/verify-email')} className="text-xs py-1 px-2.5 font-bold">
                  Enter Code
                </Button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  {isResending ? 'Sending...' : 'Resend Email'}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Transactional Personal Email Notifications Inbox */}
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Account Email Dispatches</h2>
              <p className="text-xs text-slate-500">
                Log of transactional emails sent to your registered address ({user.email})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadUserEmails}
            disabled={loadingEmails}
            className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingEmails ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingEmails ? (
          <div className="text-center py-6 text-xs text-slate-400">Loading dispatched email logs...</div>
        ) : emails.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl space-y-1">
            <Mail className="w-6 h-6 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">No emails logged yet for this session.</p>
            <p className="text-[11px] text-slate-400">Emails are automatically recorded when registering, verifying, or completing interviews.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {emails.map((em) => (
              <div key={em.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{em.subject}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                      {em.email_type}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Sent to: {em.recipient_email} &bull; {new Date(em.sent_at).toLocaleString()}
                  </span>
                </div>

                {em.preview_url ? (
                  <a
                    href={em.preview_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1 shrink-0"
                  >
                    <span>View HTML</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Dispatched</span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 3. Notification Preferences */}
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Email & Alert Preferences</h2>
            <p className="text-xs text-slate-500">Select which automated career notifications you wish to receive.</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
          <div className="space-y-3">
            {[
              { key: 'emailNotifications', label: 'Interview Evaluation Reports', desc: 'Receive detailed PDF scorecards and rubrics upon completing a voice interview.' },
              { key: 'jobAlerts', label: 'Matching Job Opportunities', desc: 'Notify me when openings match >85% of my verified resume skills.' },
              { key: 'learningReminders', label: 'Learning Roadmap Milestone Reminders', desc: 'Weekly check-in on pending sprint skills and courses.' },
              { key: 'careerInsights', label: 'Market Demand & Salary Updates', desc: 'Quarterly salary updates for your target engineering role.' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900">{label}</span>
                  <p className="text-[11px] text-slate-500">{desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean((settings as any)[key])}
                  onChange={() => handleToggle(key as any)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-1 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button type="submit" className="py-2.5 px-5 text-xs font-bold flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              <span>Save Preferences</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
