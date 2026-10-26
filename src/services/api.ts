/**
 * SkillMatch AI — Frontend API Client
 * Connects React UI to the Express SQLite Backend
 */

import {
  UserProfile,
  AdminStats,
  AdminCandidateSummary,
  CandidateDetailData,
  GitHubVerificationItem,
  JDMatchResponse
} from '../types';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('skillmatch_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export interface AnalysisResponse {
  success: boolean;
  fileInfo?: {
    name: string;
    type: string;
    sizeBytes: number;
    wordCount: number;
  };
  analysis: any;
  error?: string;
}

export const ApiService = {
  // --------------------------------------------------------------------------
  // AUTHENTICATION & CREDENTIALS
  // --------------------------------------------------------------------------
  async register(data: {
    name: string;
    email: string;
    rollNumber: string;
    phone?: string;
    department?: string;
    password: string;
    confirmPassword?: string;
    college?: string;
    degree?: string;
    targetRole?: string;
  }) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registration failed');
    if (result.token) {
      localStorage.setItem('skillmatch_auth_token', result.token);
    }
    return result;
  },

  async login(identifier: string, pass: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password: pass })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login failed');
    if (result.token) {
      localStorage.setItem('skillmatch_auth_token', result.token);
    }
    return result;
  },

  async getMe(): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  async updateProfile(data: Partial<UserProfile>) {
    const res = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update profile');
    return result;
  },

  async verifyEmail(code: string, identifier?: string, email?: string) {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ code, identifier, email })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Email verification failed');
    return result;
  },

  async resendVerification(identifier?: string, email?: string) {
    const res = await fetch('/api/auth/resend-code', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ identifier, email })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to resend verification email');
    return result;
  },

  async forgotPassword(identifier: string) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to request password reset');
    return result;
  },

  async resetPassword(email: string, token: string, newPassword: string) {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Password reset failed');
    return result;
  },

  async resubmitIdentity(data: { rollNumber: string; department?: string; name?: string; phone?: string }) {
    const res = await fetch('/api/user/resubmit-identity', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to resubmit identity details');
    return result;
  },

  async getUserEmails() {
    const res = await fetch('/api/user/emails', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch personal emails');
    return res.json();
  },

  // --------------------------------------------------------------------------
  // ADMIN DASHBOARD & CANDIDATE MANAGEMENT
  // --------------------------------------------------------------------------
  async getAdminStats(): Promise<{ success: boolean; stats: AdminStats }> {
    const res = await fetch('/api/admin/stats', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Forbidden' }));
      throw new Error(err.error || 'Admin access required');
    }
    return res.json();
  },

  async getAdminCandidates(params: {
    search?: string;
    department?: string;
    verificationStatus?: string;
    interviewStatus?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    success: boolean;
    candidates: AdminCandidateSummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.department) query.set('department', params.department);
    if (params.verificationStatus) query.set('verificationStatus', params.verificationStatus);
    if (params.interviewStatus) query.set('interviewStatus', params.interviewStatus);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);

    const res = await fetch(`/api/admin/candidates?${query.toString()}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch candidate roster' }));
      throw new Error(err.error || 'Failed to fetch candidate roster');
    }
    return res.json();
  },

  async getAdminCandidateDetail(id: string): Promise<CandidateDetailData & { success: boolean }> {
    const res = await fetch(`/api/admin/candidates/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Candidate not found' }));
      throw new Error(err.error || 'Failed to fetch candidate details');
    }
    return res.json();
  },

  async adminVerifyCandidateEmail(id: string) {
    const res = await fetch(`/api/admin/candidates/${id}/verify-email`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to verify candidate email');
    return result;
  },

  async adminVerifyCandidateIdentity(id: string, action: 'approve' | 'reject', reason?: string) {
    const res = await fetch(`/api/admin/candidates/${id}/verify-identity`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action, reason })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to review candidate identity');
    return result;
  },

  async getAdminAuditLogs() {
    const res = await fetch('/api/admin/audit-logs', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  getAdminExportUrl(format: 'csv' | 'json' = 'csv') {
    return `/api/admin/export?format=${format}`;
  },

  // --------------------------------------------------------------------------
  // GITHUB PROJECT LINK VERIFICATION
  // --------------------------------------------------------------------------
  async verifyGitHubRepo(url: string): Promise<{ success: boolean; verification: GitHubVerificationItem }> {
    const res = await fetch('/api/github/verify', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'GitHub verification failed');
    return result;
  },

  async getGitHubVerifications(): Promise<{ success: boolean; verifications: GitHubVerificationItem[] }> {
    const res = await fetch('/api/github/verifications', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load GitHub verifications');
    return res.json();
  },

  // --------------------------------------------------------------------------
  // RESUME & DOCUMENT PARSING
  // --------------------------------------------------------------------------
  async uploadResume(file: File, targetRole: string = 'Software Engineer'): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    const token = localStorage.getItem('skillmatch_auth_token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/resume/upload', {
      method: 'POST',
      headers,
      body: formData
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errData.error || `HTTP ${res.status}: Upload failed`);
    }

    return res.json();
  },

  async analyzeText(text: string, targetRole: string = 'Software Engineer', sourceName: string = 'Pasted_Resume.txt'): Promise<AnalysisResponse> {
    const res = await fetch('/api/resume/analyze-text', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ text, targetRole, sourceName })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(errData.error || `HTTP ${res.status}: Analysis failed`);
    }

    return res.json();
  },

  async getCurrentResume(): Promise<AnalysisResponse> {
    const res = await fetch('/api/resume/current', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      throw new Error('Failed to fetch current resume data');
    }
    return res.json();
  },

  async verifyProject(data: {
    projectName: string;
    githubUrl?: string;
    documentation?: string;
    architectureNotes?: string;
    hasDb: boolean;
    hasApi: boolean;
    hasAuth: boolean;
    hasTesting: boolean;
    hasDeploy: boolean;
  }) {
    const res = await fetch('/api/projects/verify', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Verification failed' }));
      throw new Error(err.error || 'Verification failed');
    }

    return res.json();
  },

  // --------------------------------------------------------------------------
  // JOB DESCRIPTION MATCHING (Separate Resume Quality Score vs JD Fit Score)
  // --------------------------------------------------------------------------
  async matchJD(data: {
    jdText: string;
    jobTitle?: string;
    companyName?: string;
    resumeText?: string;
  }): Promise<JDMatchResponse> {
    const res = await fetch('/api/jd/match', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'JD Matching failed' }));
      throw new Error(err.error || 'JD Matching failed');
    }

    return res.json();
  },

  async analyzeJDOnly(data: {
    jdText: string;
    jobTitle?: string;
    companyName?: string;
  }): Promise<{ success: boolean; analysis: any }> {
    const res = await fetch('/api/jd/analyze-only', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'JD Analysis failed' }));
      throw new Error(err.error || 'JD Analysis failed');
    }

    return res.json();
  },

  async getPastJDMatches() {
    const res = await fetch('/api/jd/matches', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch past JD matches');
    return res.json();
  },

  async getImprovements(targetRole?: string) {
    const res = await fetch('/api/resume/improve', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ targetRole })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate improvements' }));
      throw new Error(err.error || 'Failed to generate improvements');
    }

    return res.json();
  },

  // --------------------------------------------------------------------------
  // AI VOICE INTERVIEW AGENT
  // --------------------------------------------------------------------------
  async startInteractiveInterview(options: {
    interviewType?: string;
    targetRole?: string;
    experienceLevel?: string;
    difficulty?: string;
    totalQuestions?: number;
    focusTopics?: string[];
    resumeData?: any;
    resumeId?: string;
  }) {
    const res = await fetch('/api/interview/interactive/start', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(options)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to start interview' }));
      throw new Error(err.error || 'Failed to start interview');
    }
    return res.json();
  },

  async verifyGitHubRepo(url: string) {
    const res = await fetch('/api/resume/verify-github', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'GitHub verification failed' }));
      throw new Error(err.error || 'GitHub verification failed');
    }
    return res.json();
  },

  async submitInteractiveAnswer(sessionId: string, userAnswer: string, timeTakenSeconds: number = 30) {
    const res = await fetch('/api/interview/interactive/turn', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId, userAnswer, timeTakenSeconds })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to process answer' }));
      throw new Error(err.error || 'Failed to process answer');
    }
    return res.json();
  },

  async getInteractiveHint(sessionId: string) {
    const res = await fetch('/api/interview/interactive/hint', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId })
    });
    if (!res.ok) throw new Error('Failed to get hint');
    return res.json();
  },

  async skipInteractiveQuestion(sessionId: string) {
    const res = await fetch('/api/interview/interactive/skip', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId })
    });
    if (!res.ok) throw new Error('Failed to skip question');
    return res.json();
  },

  async finishInteractiveInterview(sessionId: string) {
    const res = await fetch('/api/interview/interactive/finish', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sessionId })
    });
    if (!res.ok) throw new Error('Failed to finish interview');
    return res.json();
  },

  async getInterviewHistory() {
    const res = await fetch('/api/interview/history', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load interview history');
    return res.json();
  },

  async getInteractiveMarksheet(sessionId: string) {
    const res = await fetch(`/api/interview/interactive/${sessionId}/marksheet`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch interview marksheet' }));
      throw new Error(err.error || 'Failed to fetch interview marksheet');
    }
    return res.json();
  },

  async getAdminInterviewMarksheet(sessionId: string) {
    const res = await fetch(`/api/admin/interview/${sessionId}/marksheet`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch marksheet' }));
      throw new Error(err.error || 'Failed to fetch marksheet');
    }
    return res.json();
  },

  async getInterviewQuestions(role?: string) {
    const res = await fetch(`/api/interview/questions${role ? `?role=${encodeURIComponent(role)}` : ''}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load interview questions');
    return res.json();
  },

  // --------------------------------------------------------------------------
  // PERSONALIZED JOB SUGGESTIONS & SAVED JOBS
  // --------------------------------------------------------------------------
  async getJobRecommendations(role?: string) {
    const res = await fetch(`/api/jobs/recommendations${role ? `?role=${encodeURIComponent(role)}` : ''}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load job recommendations');
    return res.json();
  },

  async getSavedJobs() {
    const res = await fetch('/api/jobs/saved', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load saved jobs');
    return res.json();
  },

  async saveJob(job: any) {
    const res = await fetch('/api/jobs/save', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ job })
    });
    if (!res.ok) throw new Error('Failed to save job');
    return res.json();
  },

  async removeSavedJob(jobId: string) {
    const res = await fetch(`/api/jobs/save/${jobId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to remove saved job');
    return res.json();
  },

  // --------------------------------------------------------------------------
  // LEARNING ROADMAP & PROGRESS
  // --------------------------------------------------------------------------
  async getRoadmap(role?: string) {
    const res = await fetch(`/api/roadmap${role ? `?role=${encodeURIComponent(role)}` : ''}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load learning roadmap');
    return res.json();
  },

  async getLearningProgress() {
    const res = await fetch('/api/learning/progress', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load learning progress');
    return res.json();
  },

  async saveLearningProgress(itemId: string, itemType: string = 'course', status: string = 'completed') {
    const res = await fetch('/api/learning/progress', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ itemId, itemType, status })
    });
    if (!res.ok) throw new Error('Failed to save learning progress');
    return res.json();
  },

  // --------------------------------------------------------------------------
  // CATALOGS
  // --------------------------------------------------------------------------
  async getCompanies() {
    const res = await fetch('/api/companies');
    if (!res.ok) throw new Error('Failed to load company suggestions');
    return res.json();
  },

  async getRoles() {
    const res = await fetch('/api/roles');
    if (!res.ok) throw new Error('Failed to load target roles');
    return res.json();
  },

  getDownloadReportUrl() {
    return '/api/report/download';
  }
};
