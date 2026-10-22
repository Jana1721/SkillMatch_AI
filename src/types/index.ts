export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface UserSkill {
  name: string;
  proficiency: ProficiencyLevel;
  category?: 'Programming' | 'Cloud' | 'Tools' | 'Database' | 'Soft Skills' | 'Framework';
}

export interface UserProfile {
  id: string;
  credentialId?: string;
  emailVerified?: boolean;
  name: string;
  email: string;
  phone: string;
  college: string;
  degree: string;
  department: string;
  graduationYear: number;
  cgpa: number;
  skills: UserSkill[];
  interests: string[];
  targetRole: string;
  preferredLocation: string;
  workMode: 'Remote' | 'Hybrid' | 'On-site' | 'Any';
  expectedSalary: string;
  bio?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  companyId: string;
  location: string;
  salaryRange: string;
  minSalary: number; // in LPA
  maxSalary: number; // in LPA
  experienceLevel: 'Fresher' | 'Entry-Level' | '0-1 Years' | '1-2 Years';
  workMode: 'Remote' | 'Hybrid' | 'On-site';
  roleCategory: 'Data Analytics' | 'ServiceNow' | 'Cloud & DevOps' | 'Software Engineering' | 'Business Analysis' | 'AI & ML';
  requiredSkills: {
    name: string;
    requiredLevel: ProficiencyLevel;
    weight?: number;
  }[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  postedDate: string;
  deadline: string;
  department: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  location: string;
  headquarters: string;
  size: string;
  rating: number;
  openRolesCount: number;
  techStack: string[];
  about: string;
  cultureHighlights: string[];
  website: string;
  benefits: string[];
}

export interface Certification {
  id: string;
  name: string;
  provider: string;
  relevanceScore: number;
  whyItMatters: string;
  skillsCovered: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  prepTime: string;
  examCost: string;
  targetRoles: string[];
}

export interface Course {
  id: string;
  title: string;
  platform: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  skillsGained: string[];
  url: string;
  enrolled?: boolean;
  completed?: boolean;
}

export interface RoadmapTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface LearningPhase {
  id: string;
  phaseNumber: number;
  title: string;
  duration: string;
  description: string;
  skills: string[];
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  tasks: RoadmapTask[];
  recommendedCourses: Course[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  applicantName: string;
  applicantEmail: string;
  resumeName: string;
  coverLetter: string;
  appliedAt: string;
  status: 'Submitted' | 'Under Review' | 'Shortlisted';
}

export interface SalaryBenchmark {
  role: string;
  entryLevelMin: number;
  entryLevelMax: number;
  midLevelMin: number;
  midLevelMax: number;
  seniorMin: number;
  seniorMax: number;
  topSkills: string[];
  demandTrend: 'High' | 'Very High' | 'Moderate';
  description: string;
}

export interface CollegeIndustryBenchmark {
  skill: string;
  collegeAvg: number;
  industryDemand: number;
  category: 'Programming' | 'Cloud' | 'Tools' | 'Database' | 'Enterprise';
  gap: number;
  insight: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  jobAlerts: boolean;
  learningReminders: boolean;
  careerInsights: boolean;
  publicProfile: boolean;
  weeklyDigest: boolean;
}

export interface ResumeAnalysisResult {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  resumeScore: number;
  atsScore: number;
  sections: {
    contactInfo: boolean;
    skills: boolean;
    education: boolean;
    projects: boolean;
    experience: boolean;
    certifications: boolean;
    keywords: boolean;
  };
  strengths: string[];
  improvements: string[];
  missingKeywords: string[];
  detectedSkills: string[];
}
