import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  Target,
  Briefcase,
  BookOpen,
  IndianRupee,
  Bot,
  Bookmark,
  Settings,
  X,
  Sparkles,
  Mic,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../utils/storage';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const savedCount = StorageService.getSavedJobs().length;

  // The 9 Essential Modules as defined in Section 2 of Master Prompt
  const navItems = [
    { label: 'Career Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'AI Voice Interview Agent', path: '/interview', icon: Mic, isVoice: true, badge: 'Voice AI' },
    { label: 'AI Resume Analyzer', path: '/resume', icon: FileText, badge: 'ATS Studio' },
    { label: 'Skill Gap Analysis', path: '/skill-gap', icon: Target },
    { label: 'Career & Job Matching', path: '/jobs', icon: Briefcase },
    { label: 'AI Career Advisor', path: '/advisor', icon: Bot, isAi: true },
    { label: 'Learning & Development', path: '/learning', icon: BookOpen },
    { label: 'Saved Jobs', path: '/saved-jobs', icon: Bookmark, badgeCount: savedCount },
    { label: 'Salary Insights', path: '/salary', icon: IndianRupee },
    { label: 'Candidate Profile', path: '/profile', icon: User },
    { label: 'Account Settings', path: '/settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                SkillMatch<span className="text-indigo-600 ml-0.5 font-black">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium -mt-1 tracking-wide">
                Career Readiness Platform
              </span>
            </div>
          </NavLink>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Core Career Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  } ${item.isVoice ? 'border border-indigo-200/70 bg-indigo-50/30' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-indigo-600'
                            : item.isVoice
                            ? 'text-indigo-600 animate-pulse'
                            : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.isVoice ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-black bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-md tracking-wider uppercase shadow-xs">
                        Voice AI
                      </span>
                    ) : item.isAi ? (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-md tracking-wider">
                        AI
                      </span>
                    ) : item.badge ? (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">
                        {item.badge}
                      </span>
                    ) : item.badgeCount && item.badgeCount > 0 ? (
                      <span className="px-1.5 py-0.5 text-[11px] font-bold bg-indigo-100 text-indigo-800 rounded-full">
                        {item.badgeCount}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile & Credential Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <button
            onClick={() => {
              navigate('/profile');
              onClose();
            }}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-xs transition-all text-left cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                {user.emailVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
              </div>
              <p className="font-mono text-[10px] text-indigo-600 font-bold truncate">
                {user.credentialId || 'SKM-2026-ACTIVE'}
              </p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
