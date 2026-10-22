import { UserProfile, UserSettings } from '../types';

export const DEFAULT_USER: UserProfile = {
  id: 'user-alex-1',
  name: 'Alex Kumar',
  email: 'student@skillmatch.ai',
  phone: '+91 98765 43210',
  college: 'ABC Engineering College',
  degree: 'B.Tech',
  department: 'Computer Science & Engineering',
  graduationYear: 2027,
  cgpa: 8.4,
  skills: [
    { name: 'Python', proficiency: 'Advanced', category: 'Programming' },
    { name: 'SQL', proficiency: 'Intermediate', category: 'Database' },
    { name: 'JavaScript', proficiency: 'Intermediate', category: 'Programming' },
    { name: 'React', proficiency: 'Intermediate', category: 'Programming' },
    { name: 'Excel', proficiency: 'Advanced', category: 'Tools' },
    { name: 'Power BI', proficiency: 'Beginner', category: 'Tools' },
    { name: 'AWS', proficiency: 'Beginner', category: 'Cloud' },
    { name: 'ServiceNow Administration', proficiency: 'Beginner', category: 'Enterprise' }
  ],
  interests: ['Data Analytics', 'Cloud', 'AI/ML', 'ServiceNow'],
  targetRole: 'Data Analyst',
  preferredLocation: 'Bengaluru',
  workMode: 'Hybrid',
  expectedSalary: '₹6–10 LPA',
  bio: 'Passionate 3rd-year computer science undergrad interested in data analytics, cloud systems, and building high-impact software solutions.'
};

export const DEFAULT_SETTINGS: UserSettings = {
  emailNotifications: true,
  jobAlerts: true,
  learningReminders: true,
  careerInsights: true,
  publicProfile: true,
  weeklyDigest: true
};
