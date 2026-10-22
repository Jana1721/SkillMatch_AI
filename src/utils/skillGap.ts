import { UserProfile, ProficiencyLevel } from '../types';
import { ALL_SKILLS, SkillDefinition } from '../data/skills';

export const LEVEL_NUMBERS: Record<ProficiencyLevel, number> = {
  'Beginner': 1,
  'Intermediate': 2,
  'Advanced': 3,
  'Expert': 4
};

export const NUMBER_TO_LEVEL: Record<number, ProficiencyLevel> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
  4: 'Expert'
};

export interface SkillGapItem {
  skill: string;
  category: string;
  userLevel: ProficiencyLevel | 'None';
  userLevelNumber: number;
  industryLevel: ProficiencyLevel;
  industryLevelNumber: number;
  gapNumber: number;
  gapPercentage: number;
  gapLevel: 'Low' | 'Medium' | 'High';
  priority: 'High' | 'Medium' | 'Low';
  actionTip: string;
}

export const ROLE_REQUIREMENTS: Record<string, Record<string, ProficiencyLevel>> = {
  'Data Analyst': {
    'Python': 'Advanced',
    'SQL': 'Advanced',
    'Power BI': 'Intermediate',
    'Excel': 'Advanced',
    'AWS': 'Intermediate',
    'Data Warehousing': 'Intermediate',
    'Tableau': 'Intermediate',
    'Problem Solving': 'Advanced'
  },
  'ServiceNow Developer': {
    'ServiceNow Administration': 'Advanced',
    'ITSM': 'Advanced',
    'JavaScript': 'Advanced',
    'Flow Designer': 'Intermediate',
    'IntegrationHub': 'Intermediate',
    'REST APIs': 'Intermediate',
    'Service Portal': 'Intermediate'
  },
  'Cloud & DevOps Engineer': {
    'AWS': 'Advanced',
    'Docker': 'Advanced',
    'Git & GitHub': 'Advanced',
    'Python': 'Intermediate',
    'System Design': 'Intermediate',
    'Problem Solving': 'Advanced'
  },
  'Frontend Developer': {
    'JavaScript': 'Advanced',
    'React': 'Advanced',
    'REST APIs': 'Advanced',
    'Git & GitHub': 'Advanced',
    'Problem Solving': 'Intermediate'
  },
  'Business Analyst': {
    'Business Analysis': 'Advanced',
    'SQL': 'Intermediate',
    'Excel': 'Advanced',
    'Communication': 'Advanced',
    'Power BI': 'Intermediate'
  },
  'AI / ML Engineer': {
    'Python': 'Advanced',
    'Machine Learning': 'Advanced',
    'Pandas & NumPy': 'Advanced',
    'SQL': 'Intermediate',
    'System Design': 'Intermediate'
  }
};

export function calculateSkillGaps(profile?: UserProfile | null, selectedRole?: string): SkillGapItem[] {
  const targetRole = selectedRole || profile?.targetRole || 'Data Analyst';
  const roleReqs = ROLE_REQUIREMENTS[targetRole] || ROLE_REQUIREMENTS['Data Analyst'];

  const userSkillMap = new Map<string, ProficiencyLevel>();
  (profile?.skills || []).forEach(s => userSkillMap.set(s.name.toLowerCase().trim(), s.proficiency));

  const items: SkillGapItem[] = [];

  // Check required skills for the role
  Object.entries(roleReqs).forEach(([skillName, reqLevel]) => {
    const key = skillName.toLowerCase().trim();
    const userLevel = userSkillMap.get(key) || 'None';
    const userLevelNum = userLevel === 'None' ? 0 : LEVEL_NUMBERS[userLevel];
    const reqLevelNum = LEVEL_NUMBERS[reqLevel];
    const gap = Math.max(0, reqLevelNum - userLevelNum);

    const gapPercent = Math.min(100, Math.round((gap / reqLevelNum) * 100));

    let gapLevel: 'Low' | 'Medium' | 'High' = 'Low';
    let priority: 'High' | 'Medium' | 'Low' = 'Low';

    if (gap >= 2 || userLevel === 'None') {
      gapLevel = 'High';
      priority = 'High';
    } else if (gap === 1) {
      gapLevel = 'Medium';
      priority = 'Medium';
    }

    const skillDef = ALL_SKILLS.find(s => s.name.toLowerCase() === key);
    const category = skillDef ? skillDef.category : 'Technical';

    let actionTip = `Level up from ${userLevel} to ${reqLevel}.`;
    if (userLevel === 'None') {
      actionTip = `Start foundational training in ${skillName} to satisfy mandatory job criteria.`;
    } else if (gapLevel === 'High') {
      actionTip = `Critical gap: add dedicated practice projects to reach ${reqLevel}.`;
    } else if (gapLevel === 'Medium') {
      actionTip = `Complete targeted assessment tasks to level up to ${reqLevel}.`;
    } else {
      actionTip = `Your skill is well-aligned with entry requirements.`;
    }

    items.push({
      skill: skillName,
      category,
      userLevel,
      userLevelNumber: userLevelNum,
      industryLevel: reqLevel,
      industryLevelNumber: reqLevelNum,
      gapNumber: gap,
      gapPercentage: gapPercent,
      gapLevel,
      priority,
      actionTip
    });
  });

  // Sort: High gap first, then Medium, then Low
  return items.sort((a, b) => {
    if (b.gapPercentage !== a.gapPercentage) {
      return b.gapPercentage - a.gapPercentage;
    }
    return b.gapNumber - a.gapNumber;
  });
}
