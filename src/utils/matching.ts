import { Job, UserProfile, Company, ProficiencyLevel } from '../types';

export const PROFICIENCY_WEIGHTS: Record<ProficiencyLevel, number> = {
  'Beginner': 0.45,
  'Intermediate': 0.80,
  'Advanced': 0.95,
  'Expert': 1.00
};

export interface MatchResult {
  jobId: string;
  matchScore: number;
  skillsScore: number;
  experienceScore: number;
  interestsScore: number;
  educationScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  levelGaps: { skill: string; userLevel: string; requiredLevel: string }[];
}

export function calculateJobMatch(job: Job, profile?: UserProfile | null): MatchResult {
  const userSkillMap = new Map<string, ProficiencyLevel>();
  (profile?.skills || []).forEach(s => userSkillMap.set(s.name.toLowerCase().trim(), s.proficiency));

  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];
  const levelGaps: { skill: string; userLevel: string; requiredLevel: string }[] = [];

  let skillPointsEarned = 0;
  let totalSkillPointsPossible = 0;

  job.requiredSkills.forEach(req => {
    const key = req.name.toLowerCase().trim();
    const userLevel = userSkillMap.get(key);
    const weight = req.weight || 1;
    totalSkillPointsPossible += weight;

    if (userLevel) {
      matchingSkills.push(req.name);
      const userWeight = PROFICIENCY_WEIGHTS[userLevel];
      const reqWeight = PROFICIENCY_WEIGHTS[req.requiredLevel];

      // If user meets or exceeds required level, grant full score for this skill
      if (userWeight >= reqWeight) {
        skillPointsEarned += 1.0 * weight;
      } else {
        // Partial credit proportional to current proficiency
        const ratio = userWeight / reqWeight;
        skillPointsEarned += ratio * weight;
        levelGaps.push({ skill: req.name, userLevel, requiredLevel: req.requiredLevel });
      }
    } else {
      missingSkills.push(req.name);
      levelGaps.push({ skill: req.name, userLevel: 'None', requiredLevel: req.requiredLevel });
    }
  });

  const skillsScore = totalSkillPointsPossible > 0 
    ? (skillPointsEarned / totalSkillPointsPossible) * 100 
    : 100;

  // Experience compatibility: 15%
  // Freshers/Entry-Level fit college students graduating 2026/2027
  let experienceScore = 90;
  if (job.experienceLevel === 'Fresher' || job.experienceLevel === 'Entry-Level') {
    experienceScore = 96;
  } else if (job.experienceLevel === '0-1 Years') {
    experienceScore = 88;
  } else {
    experienceScore = 75;
  }

  // Interests compatibility: 15%
  let interestsScore = 50;
  const userInterestsLower = profile.interests.map(i => i.toLowerCase().trim());
  const roleCategoryLower = job.roleCategory.toLowerCase();
  
  const hasDirectInterest = userInterestsLower.some(interest => 
    roleCategoryLower.includes(interest) || 
    interest.includes(roleCategoryLower) ||
    job.title.toLowerCase().includes(interest)
  );

  if (hasDirectInterest) {
    interestsScore = 95;
  } else {
    // Check overlapping interest in job skills
    const partialOverlap = userInterestsLower.some(interest => 
      job.requiredSkills.some(s => s.name.toLowerCase().includes(interest))
    );
    interestsScore = partialOverlap ? 75 : 55;
  }

  // Education compatibility: 10%
  let educationScore = 85;
  if (profile.degree && profile.degree.toLowerCase().includes('b.tech') || profile.degree.toLowerCase().includes('b.e.')) {
    educationScore = 95;
  }
  if (profile.cgpa >= 8.0) {
    educationScore = Math.min(100, educationScore + 5);
  }

  // Weighted combination: Skills 60%, Experience 15%, Interests 15%, Education 10%
  const finalRawScore = (skillsScore * 0.60) + (experienceScore * 0.15) + (interestsScore * 0.15) + (educationScore * 0.10);
  const matchScore = Math.min(99, Math.max(25, Math.round(finalRawScore)));

  return {
    jobId: job.id,
    matchScore,
    skillsScore: Math.round(skillsScore),
    experienceScore: Math.round(experienceScore),
    interestsScore: Math.round(interestsScore),
    educationScore: Math.round(educationScore),
    matchingSkills,
    missingSkills,
    levelGaps
  };
}

export function calculateCompanyMatch(company: Company, profile: UserProfile, jobs: Job[]): number {
  const companyJobs = jobs.filter(j => j.companyId === company.id || j.company.toLowerCase().includes(company.name.toLowerCase()));
  if (companyJobs.length === 0) {
    // Evaluate based on company tech stack
    const userSkills = profile.skills.map(s => s.name.toLowerCase());
    const matchedCount = company.techStack.filter(t => userSkills.includes(t.toLowerCase())).length;
    const ratio = matchedCount / Math.max(1, company.techStack.length);
    return Math.round(65 + (ratio * 30));
  }

  const jobMatches = companyJobs.map(j => calculateJobMatch(j, profile).matchScore);
  const avgJobMatch = jobMatches.reduce((a, b) => a + b, 0) / jobMatches.length;
  return Math.round(avgJobMatch);
}

export function calculateOverallReadiness(profile: UserProfile, jobs: Job[]): {
  overallScore: number;
  technicalSkillsScore: number;
  softSkillsScore: number;
  experienceScore: number;
  certificationsScore: number;
  resumeQualityScore: number;
} {
  // Target roles
  const targetJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(profile.targetRole.toLowerCase()) ||
    j.roleCategory.toLowerCase().includes(profile.targetRole.toLowerCase())
  );
  const relevantJobs = targetJobs.length > 0 ? targetJobs : jobs.slice(0, 5);

  const jobMatches = relevantJobs.map(j => calculateJobMatch(j, profile));
  const avgSkills = jobMatches.reduce((acc, curr) => acc + curr.skillsScore, 0) / relevantJobs.length;

  const technicalSkillsScore = Math.min(98, Math.max(50, Math.round(avgSkills * 0.95 + 10)));
  const softSkillsScore = 74;
  const experienceScore = 65;
  const certificationsScore = 70;
  const resumeQualityScore = 85;

  const overallScore = Math.round(
    (technicalSkillsScore * 0.40) +
    (softSkillsScore * 0.15) +
    (experienceScore * 0.15) +
    (certificationsScore * 0.15) +
    (resumeQualityScore * 0.15)
  );

  return {
    overallScore: Math.min(99, overallScore),
    technicalSkillsScore,
    softSkillsScore,
    experienceScore,
    certificationsScore,
    resumeQualityScore
  };
}
