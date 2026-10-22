import { UserProfile } from '../types';
import { SALARY_BENCHMARKS } from '../data/salary';

export interface SalaryProjection {
  role: string;
  estimatedMin: number;
  estimatedMax: number;
  entryLevelMin: number;
  entryLevelMax: number;
  upgradedMin: number;
  upgradedMax: number;
  topContributingSkills: string[];
  recommendedBoostSkills: string[];
  locationMultiplier: number;
}

export function calculateSalaryProjection(profile: UserProfile, targetRole?: string): SalaryProjection {
  const roleName = targetRole || profile.targetRole || 'Data Analyst';
  const benchmark = SALARY_BENCHMARKS.find(b => 
    b.role.toLowerCase().includes(roleName.toLowerCase()) ||
    roleName.toLowerCase().includes(b.role.toLowerCase())
  ) || SALARY_BENCHMARKS[0];

  const userSkillsMap = new Map<string, string>();
  profile.skills.forEach(s => userSkillsMap.set(s.name.toLowerCase().trim(), s.proficiency));

  // Location modifier
  let locationMultiplier = 1.0;
  const loc = (profile.preferredLocation || '').toLowerCase();
  if (loc.includes('bengaluru') || loc.includes('bangalore')) {
    locationMultiplier = 1.12;
  } else if (loc.includes('mumbai') || loc.includes('hyderabad')) {
    locationMultiplier = 1.08;
  } else if (loc.includes('pune') || loc.includes('delhi') || loc.includes('gurugram')) {
    locationMultiplier = 1.05;
  }

  // Calculate skill score bonus
  let skillBonus = 0;
  const topContributingSkills: string[] = [];
  const recommendedBoostSkills: string[] = [];

  benchmark.topSkills.forEach(reqSkill => {
    const userProf = userSkillsMap.get(reqSkill.toLowerCase().trim());
    if (userProf === 'Advanced' || userProf === 'Expert') {
      skillBonus += 0.45;
      topContributingSkills.push(reqSkill);
    } else if (userProf === 'Intermediate') {
      skillBonus += 0.25;
      topContributingSkills.push(reqSkill);
    } else if (userProf === 'Beginner') {
      skillBonus += 0.10;
      recommendedBoostSkills.push(reqSkill);
    } else {
      recommendedBoostSkills.push(reqSkill);
    }
  });

  // CGPA & College factor
  if (profile.cgpa >= 8.0) {
    skillBonus += 0.3;
  }

  const baseMin = benchmark.entryLevelMin * locationMultiplier;
  const baseMax = benchmark.entryLevelMax * locationMultiplier;

  const estimatedMin = Number((baseMin + skillBonus).toFixed(1));
  const estimatedMax = Number((baseMax + skillBonus * 1.3).toFixed(1));

  // Upgraded skills potential (if top recommended boost skills are leveled up)
  const upgradedMin = Number((estimatedMin + 1.4).toFixed(1));
  const upgradedMax = Number((estimatedMax + 2.5).toFixed(1));

  return {
    role: benchmark.role,
    estimatedMin,
    estimatedMax,
    entryLevelMin: Number(baseMin.toFixed(1)),
    entryLevelMax: Number(baseMax.toFixed(1)),
    upgradedMin,
    upgradedMax,
    topContributingSkills,
    recommendedBoostSkills,
    locationMultiplier
  };
}
