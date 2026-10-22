import { UserProfile, Job, Certification } from '../types';
import { calculateSkillGaps } from './skillGap';
import { calculateJobMatch } from './matching';
import { calculateSalaryProjection } from './salaryCalculator';
import { MOCK_CERTIFICATIONS } from '../data/certifications';
import { MOCK_JOBS } from '../data/jobs';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedFollowUps?: string[];
  actionLink?: { label: string; path: string };
}

export const QUICK_PROMPTS = [
  "Which skill should I learn next?",
  "Why am I not getting interviews?",
  "What jobs match my profile?",
  "Which certification should I choose?",
  "How can I increase my salary potential?"
];

export function generateAdvisorResponse(
  userQuery: string, 
  profile: UserProfile, 
  jobs: Job[] = MOCK_JOBS,
  certifications: Certification[] = MOCK_CERTIFICATIONS
): { text: string; actionLink?: { label: string; path: string }; suggestedFollowUps?: string[] } {
  const queryLower = userQuery.toLowerCase().trim();
  const gaps = calculateSkillGaps(profile, profile.targetRole);
  const highestGap = gaps.find(g => g.gapLevel === 'High') || gaps[0];
  const matchingJobs = jobs.map(j => ({ job: j, match: calculateJobMatch(j, profile) }))
    .sort((a, b) => b.match.matchScore - a.match.matchScore);
  const topJob = matchingJobs[0];

  // 1. "Which skill should I learn next?"
  if (queryLower.includes('skill should i learn') || queryLower.includes('learn next') || queryLower.includes('next skill')) {
    if (highestGap) {
      return {
        text: `Based on your profile, **${highestGap.skill}** is your highest-impact skill to focus on right now.

Your current proficiency is **${highestGap.userLevel}**, while **${profile.targetRole || 'Data Analyst'}** positions expect **${highestGap.industryLevel}** proficiency.

**Why this matters for you:**
- Closing this gap increases your interview shortlist probability by approximately **+18%**.
- It directly unlocks top roles like *${topJob.job.title}* at *${topJob.job.company}*.
- We recommend dedicating 2–3 weeks to hands-on dashboard/portfolio projects.`,
        actionLink: { label: 'Open Skill Gap Analysis', path: '/skill-gap' },
        suggestedFollowUps: [
          'Which certification should I choose?',
          'What jobs match my profile?',
          'How can I increase my salary potential?'
        ]
      };
    }
  }

  // 2. "Why am I not getting interviews?"
  if (queryLower.includes('not getting interviews') || queryLower.includes('why am i not') || queryLower.includes('no interviews') || queryLower.includes('rejection')) {
    const missingSkillsText = topJob.match.missingSkills.length > 0 
      ? topJob.match.missingSkills.slice(0, 3).join(', ') 
      : 'Cloud fundamentals and measurable project KPIs';
      
    return {
      text: `Looking closely at your current profile and target role (**${profile.targetRole || 'Data Analyst'}**), here are the top 3 reasons you might be facing friction in initial screenings:

1. **ATS Keyword Gaps in Resume**: Modern screening algorithms filter for exact terminology like **${missingSkillsText}**. If these aren't explicitly visible under your project bullets, resumes get auto-filtered.
2. **Missing Measurable Impact**: Recruiters look for metrics (e.g., *"Automated SQL query pipeline saving 4 hours weekly"*) rather than generic task listings (*"Worked with SQL"*).
3. **Skill Depth Mismatch**: While you have strong foundations in **Python (${profile.skills.find(s => s.name === 'Python')?.proficiency || 'Advanced'})**, tools like **Power BI** and **AWS** are currently marked as Beginner.

**Recommended Action:** Run your resume through our ATS Resume Analyzer to see missing keyword highlights and instantly fix formatting issues.`,
      actionLink: { label: 'Go to Resume Analyzer', path: '/resume' },
      suggestedFollowUps: [
        'Which skill should I learn next?',
        'Which certification should I choose?'
      ]
    };
  }

  // 3. "What jobs match my profile?"
  if (queryLower.includes('jobs match') || queryLower.includes('matching jobs') || queryLower.includes('what jobs')) {
    const topThree = matchingJobs.slice(0, 3);
    const jobList = topThree.map((item, idx) => 
      `${idx + 1}. **${item.job.title}** at **${item.job.company}** (${item.job.location}) — **${item.match.matchScore}% Match** (${item.job.salaryRange})`
    ).join('\n');

    return {
      text: `Here are the highest matching opportunities calibrated to your skills and preferences:

${jobList}

**Key takeaway:**
You are already an outstanding match (**${topThree[0].match.matchScore}%**) for **${topThree[0].job.title}**. If you add **Power BI** and intermediate **AWS**, you will comfortably exceed 95% match for all top entry-level positions!`,
      actionLink: { label: 'View All Job Matches', path: '/jobs' },
      suggestedFollowUps: [
        'How can I increase my salary potential?',
        'Which skill should I learn next?'
      ]
    };
  }

  // 4. "Which certification should I choose?"
  if (queryLower.includes('certification') || queryLower.includes('cert should') || queryLower.includes('choose')) {
    const relevantCert = profile.targetRole.toLowerCase().includes('servicenow') 
      ? certifications.find(c => c.name.includes('ServiceNow'))
      : certifications[0]; // Microsoft Power BI or AWS
      
    const cert = relevantCert || certifications[0];
    return {
      text: `For your target trajectory in **${profile.targetRole || 'Data Analytics'}**, the highest return-on-investment credential is:

🏆 **${cert.name}**
- **Relevance to you:** ${cert.relevanceScore}%
- **Estimated Prep Time:** ${cert.prepTime}
- **Why it matters:** ${cert.whyItMatters}

**Skills validated:** ${cert.skillsCovered.join(', ')}.

Adding this to your LinkedIn and resume will immediately distinguish you from fellow college applicants during campus and off-campus recruitment drives.`,
      actionLink: { label: 'Explore Certifications', path: '/certifications' },
      suggestedFollowUps: [
        'How can I increase my salary potential?',
        'What jobs match my profile?'
      ]
    };
  }

  // 5. "How can I increase my salary potential?"
  if (queryLower.includes('salary') || queryLower.includes('earn more') || queryLower.includes('increase my salary') || queryLower.includes('package')) {
    const projection = calculateSalaryProjection(profile, profile.targetRole);
    return {
      text: `Your current estimated entry-level potential in **${profile.preferredLocation || 'Bengaluru'}** is **₹${projection.estimatedMin}–₹${projection.estimatedMax} LPA**.

To move into the premium **₹${projection.upgradedMin}–₹${projection.upgradedMax} LPA** band:

1. **Stack High-Value Modern Tools**: Adding **Power BI (Intermediate)** and **AWS Cloud foundations** adds an estimated **+₹1.5–2.0 LPA** to fresher offers.
2. **Target High-Paying Role Niches**: Enterprise paths like **ServiceNow Development (₹5–9.5 LPA)** and **AI/ML Engineering (₹7–11 LPA)** offer faster initial compensation acceleration.
3. **Build Full End-to-End Projects**: Moving from basic homework scripts to a deployed, live interactive cloud dashboard immediately commands top-tier placement offers.`,
      actionLink: { label: 'Explore Salary Insights', path: '/salary' },
      suggestedFollowUps: [
        'Which skill should I learn next?',
        'What jobs match my profile?'
      ]
    };
  }

  // 6. Generic or fallback conversational AI
  return {
    text: `Great question regarding your career preparation! 

Based on your profile (**${profile.name}**, **${profile.degree} in ${profile.department}**, graduating **${profile.graduationYear}**):

- Your primary strength is **Programming fundamentals (Python)** and **Relational Databases (SQL)**.
- Your target role is set to **${profile.targetRole}** in **${profile.preferredLocation}**.
- Your overall career readiness index stands at **78/100**.

To fast-track your goal, focus on transforming theoretical coursework into tangible portfolio proof, closing your top gap (**${highestGap ? highestGap.skill : 'Power BI'}**), and reviewing our personalized 5-phase career roadmap!`,
    actionLink: { label: 'View Career Roadmap', path: '/learning' },
    suggestedFollowUps: [
      'Which skill should I learn next?',
      'What jobs match my profile?',
      'Why am I not getting interviews?'
    ]
  };
}
