import { UserProfile, UserSettings, LearningPhase, JobApplication, ResumeAnalysisResult } from '../types';
import { DEFAULT_USER, DEFAULT_SETTINGS } from '../data/defaultUser';
import { INITIAL_LEARNING_ROADMAP } from '../data/courses';

const STORAGE_KEYS = {
  AUTH_SESSION: 'skillmatch_auth_session',
  USER_PROFILE: 'skillmatch_user_profile',
  SAVED_JOBS: 'skillmatch_saved_jobs',
  SAVED_COMPANIES: 'skillmatch_saved_companies',
  APPLICATIONS: 'skillmatch_applications',
  LEARNING_ROADMAP: 'skillmatch_learning_roadmap',
  USER_SETTINGS: 'skillmatch_user_settings',
  RESUME_ANALYSIS: 'skillmatch_resume_analysis'
};

function triggerStorageUpdate() {
  window.dispatchEvent(new Event('skillmatch-storage-change'));
}

export const StorageService = {
  // Auth Session
  isAuthenticated(): boolean {
    const session = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    return session === 'true';
  },

  setAuthenticated(value: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, value ? 'true' : 'false');
    triggerStorageUpdate();
  },

  // User Profile
  getUserProfile(): UserProfile {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!data) {
      this.setUserProfile(DEFAULT_USER);
      return DEFAULT_USER;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_USER;
    }
  },

  setUserProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    triggerStorageUpdate();
  },

  // Saved Jobs
  getSavedJobs(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_JOBS);
    if (!data) {
      const initial = ['job-1', 'job-2']; // initial saved sample
      this.setSavedJobs(initial);
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  setSavedJobs(jobIds: string[]): void {
    localStorage.setItem(STORAGE_KEYS.SAVED_JOBS, JSON.stringify(jobIds));
    triggerStorageUpdate();
  },

  toggleSaveJob(jobId: string): boolean {
    const current = this.getSavedJobs();
    let updated: string[];
    let isSaved = false;
    if (current.includes(jobId)) {
      updated = current.filter(id => id !== jobId);
      isSaved = false;
    } else {
      updated = [...current, jobId];
      isSaved = true;
    }
    this.setSavedJobs(updated);
    return isSaved;
  },

  isJobSaved(jobId: string): boolean {
    return this.getSavedJobs().includes(jobId);
  },

  // Saved Companies
  getSavedCompanies(): string[] {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_COMPANIES);
    if (!data) return ['comp-1', 'comp-4'];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  toggleSaveCompany(companyId: string): boolean {
    const current = this.getSavedCompanies();
    let updated: string[];
    let isSaved = false;
    if (current.includes(companyId)) {
      updated = current.filter(id => id !== companyId);
      isSaved = false;
    } else {
      updated = [...current, companyId];
      isSaved = true;
    }
    localStorage.setItem(STORAGE_KEYS.SAVED_COMPANIES, JSON.stringify(updated));
    triggerStorageUpdate();
    return isSaved;
  },

  isCompanySaved(companyId: string): boolean {
    return this.getSavedCompanies().includes(companyId);
  },

  // Job Applications
  getApplications(): JobApplication[] {
    const data = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  addApplication(application: JobApplication): void {
    const current = this.getApplications();
    const updated = [application, ...current.filter(a => a.jobId !== application.jobId)];
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(updated));
    triggerStorageUpdate();
  },

  // Learning Roadmap
  getLearningRoadmap(): LearningPhase[] {
    const data = localStorage.getItem(STORAGE_KEYS.LEARNING_ROADMAP);
    if (!data) {
      this.setLearningRoadmap(INITIAL_LEARNING_ROADMAP);
      return INITIAL_LEARNING_ROADMAP;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_LEARNING_ROADMAP;
    }
  },

  setLearningRoadmap(phases: LearningPhase[]): void {
    localStorage.setItem(STORAGE_KEYS.LEARNING_ROADMAP, JSON.stringify(phases));
    triggerStorageUpdate();
  },

  updatePhaseProgress(phaseId: string, progress: number, status?: 'not_started' | 'in_progress' | 'completed'): void {
    const current = this.getLearningRoadmap();
    const updated = current.map(p => {
      if (p.id === phaseId) {
        const newStatus = status || (progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started');
        return { ...p, progress, status: newStatus };
      }
      return p;
    });
    this.setLearningRoadmap(updated);
  },

  toggleTaskCompleted(phaseId: string, taskId: string): void {
    const current = this.getLearningRoadmap();
    const updated = current.map(phase => {
      if (phase.id === phaseId) {
        const updatedTasks = phase.tasks.map(task => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const total = updatedTasks.length || 1;
        const calculatedProgress = Math.round((completedCount / total) * 100);
        const status = calculatedProgress === 100 ? 'completed' : calculatedProgress > 0 ? 'in_progress' : 'not_started';
        return {
          ...phase,
          tasks: updatedTasks,
          progress: calculatedProgress,
          status
        };
      }
      return phase;
    });
    this.setLearningRoadmap(updated);
  },

  // Settings
  getUserSettings(): UserSettings {
    const data = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    if (!data) {
      this.setUserSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  setUserSettings(settings: UserSettings): void {
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    triggerStorageUpdate();
  },

  // Resume Analysis
  getResumeAnalysis(): ResumeAnalysisResult | null {
    const data = localStorage.getItem(STORAGE_KEYS.RESUME_ANALYSIS);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  setResumeAnalysis(analysis: ResumeAnalysisResult): void {
    localStorage.setItem(STORAGE_KEYS.RESUME_ANALYSIS, JSON.stringify(analysis));
    triggerStorageUpdate();
  },

  // Reset demo
  resetToDemo(): void {
    localStorage.clear();
    this.setUserProfile(DEFAULT_USER);
    this.setUserSettings(DEFAULT_SETTINGS);
    this.setLearningRoadmap(INITIAL_LEARNING_ROADMAP);
    this.setSavedJobs(['job-1', 'job-2']);
    this.setAuthenticated(true);
    triggerStorageUpdate();
  }
};
