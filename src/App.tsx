import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';

// Public Standalone Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';

// SkillMatch AI Platform Pages
import { Dashboard } from './pages/Dashboard';
import { ResumeAnalyzer } from './pages/ResumeAnalyzer';
import { UploadResume } from './pages/UploadResume';
import { SkillGap } from './pages/SkillGap';
import { JobMatch } from './pages/JobMatch';
import { CareerAdvisor } from './pages/CareerAdvisor';
import { AIInterview } from './pages/AIInterview';
import { LearningPath } from './pages/LearningPath';
import { SavedJobs } from './pages/SavedJobs';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { SalaryInsights } from './pages/SalaryInsights';
import { AdminDashboard } from './pages/AdminDashboard';
import { GitHubVerification } from './pages/GitHubVerification';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public standalone pages */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* SkillMatch AI Core Platform */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Module 1: Career Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Module 2: Admin Command Center (Admin-Only) */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Module 3: Resume Upload & JD Matcher (Dual Scoring) */}
              <Route path="/upload" element={<UploadResume />} />
              <Route path="/resume" element={<ResumeAnalyzer />} />

              {/* GitHub Project Verification integrated directly into Resume Analysis */}
              <Route path="/github-verify" element={<Navigate to="/upload" replace />} />

              {/* Module 5: AI Voice Interview Agent */}
              <Route path="/interview" element={<AIInterview />} />

              {/* Module 6: Skill Gap Analysis */}
              <Route path="/skill-gap" element={<SkillGap />} />

              {/* Module 7: Career and Job Matching */}
              <Route path="/jobs" element={<JobMatch />} />

              {/* Module 8: AI Career Advisor */}
              <Route path="/advisor" element={<CareerAdvisor />} />

              {/* Module 9: Learning and Development */}
              <Route path="/learning" element={<LearningPath />} />

              {/* Module 10: Saved Jobs */}
              <Route path="/saved-jobs" element={<SavedJobs />} />

              {/* Module 11: Candidate Profile & Account Settings */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />

              {/* Secondary Feature: Salary Insights */}
              <Route path="/salary" element={<SalaryInsights />} />

              {/* Route Aliases */}
              <Route path="/jd-matcher" element={<UploadResume />} />
              <Route path="/projects" element={<Navigate to="/upload" replace />} />
              <Route path="/skills" element={<Navigate to="/skill-gap" replace />} />
              <Route path="/college-industry" element={<Navigate to="/skill-gap" replace />} />
              <Route path="/roles" element={<Navigate to="/jobs" replace />} />
              <Route path="/companies" element={<Navigate to="/jobs" replace />} />
              <Route path="/mock-interview" element={<Navigate to="/interview" replace />} />
              <Route path="/interview-prep" element={<Navigate to="/interview" replace />} />
              <Route path="/certifications" element={<Navigate to="/learning" replace />} />
              <Route path="/roadmap" element={<Navigate to="/learning" replace />} />

              {/* Wildcard Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
