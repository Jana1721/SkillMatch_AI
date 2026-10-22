/**
 * SkillMatch AI — Frontend API Client
 * Connects React UI to the Express SQLite Backend
 */

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
    password: string;
    passwordConfirm?: string;
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

  async login(email: string, pass: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login failed');
    if (result.token) {
      localStorage.setItem('skillmatch_auth_token', result.token);
    }
    return result;
  },

  async getMe() {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load profile');
    return res.json();
  },

  async verifyEmail(email?: string, token?: string) {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email, token })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Email verification failed');
    return result;
  },

  async resendVerification(email?: string) {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to resend verification email');
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
  // RESUME & DOCUMENT PARSING
  // --------------------------------------------------------------------------
  async uploadResume(file: File, targetRole: string = 'Java Developer'): Promise<AnalysisResponse> {
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

  async analyzeText(text: string, targetRole: string = 'Java Developer', sourceName: string = 'Pasted_Resume.txt'): Promise<AnalysisResponse> {
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

  async matchJD(jdText: string, jobTitle?: string, companyName?: string) {
    const res = await fetch('/api/jd/match', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ jdText, jobTitle, companyName })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'JD Matching failed' }));
      throw new Error(err.error || 'JD Matching failed');
    }

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

  async getInterviewQuestions(role?: string) {
    const res = await fetch(`/api/interview/questions${role ? `?role=${encodeURIComponent(role)}` : ''}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load interview questions');
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
  // SAVED JOBS & CATALOGS
  // --------------------------------------------------------------------------
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
