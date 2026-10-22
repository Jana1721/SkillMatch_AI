import { ResumeAnalysisResult } from '../types';

export interface ParsedContactInfo {
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
}

export interface RoleSkillTaxonomy {
  role: string;
  coreSkills: string[];
  niceToHaveSkills: string[];
  minExpectedWords: number;
}

export const ROLE_TAXONOMIES: Record<string, RoleSkillTaxonomy> = {
  'Java Developer': {
    role: 'Java Developer',
    coreSkills: ['Java', 'Spring Boot', 'SQL', 'REST APIs', 'Git', 'Data Structures', 'Algorithms'],
    niceToHaveSkills: ['Docker', 'Hibernate', 'Microservices', 'PostgreSQL', 'MySQL', 'System Design', 'CI/CD', 'AWS'],
    minExpectedWords: 250
  },
  'ServiceNow Developer': {
    role: 'ServiceNow Developer',
    coreSkills: ['ServiceNow', 'JavaScript', 'ITSM', 'REST APIs', 'Flow Designer', 'GlideRecord'],
    niceToHaveSkills: ['IntegrationHub', 'Service Portal', 'ServiceNow Administration', 'Business Rules', 'Client Scripts', 'Agile', 'Jira'],
    minExpectedWords: 250
  },
  'Data Analyst': {
    role: 'Data Analyst',
    coreSkills: ['Python', 'SQL', 'Power BI', 'Excel', 'Data Visualization'],
    niceToHaveSkills: ['AWS', 'Tableau', 'Pandas', 'NumPy', 'Data Warehousing', 'ETL', 'Machine Learning'],
    minExpectedWords: 250
  },
  'Cloud & DevOps Engineer': {
    role: 'Cloud & DevOps Engineer',
    coreSkills: ['AWS', 'Docker', 'Git', 'Linux', 'CI/CD', 'Python'],
    niceToHaveSkills: ['Kubernetes', 'Terraform', 'System Design', 'Jenkins', 'Azure', 'Bash'],
    minExpectedWords: 250
  },
  'Full-Stack Developer': {
    role: 'Full-Stack Developer',
    coreSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'REST APIs', 'Git'],
    niceToHaveSkills: ['TypeScript', 'Express', 'Tailwind', 'MongoDB', 'Docker', 'PostgreSQL', 'Java', 'Next.js'],
    minExpectedWords: 250
  }
};

const MASTER_SKILLS_DICTIONARY = [
  'Java', 'Spring Boot', 'Hibernate', 'JPA', 'C++', 'C', 'Python', 'JavaScript', 'TypeScript',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'Database', 'Redis',
  'React', 'Angular', 'Vue', 'HTML', 'CSS', 'Tailwind', 'Bootstrap', 'Node.js', 'Express', 'Next.js',
  'ServiceNow', 'ServiceNow Administration', 'ITSM', 'Flow Designer', 'GlideRecord', 'IntegrationHub', 'Service Portal', 'Business Rules', 'Client Scripts',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Linux', 'Bash', 'Terraform',
  'Git', 'GitHub', 'CI/CD', 'Jenkins', 'REST APIs', 'GraphQL', 'Microservices',
  'Data Structures', 'Algorithms', 'System Design', 'OOP', 'Object Oriented Programming',
  'Power BI', 'Tableau', 'Excel', 'Pandas', 'NumPy', 'Machine Learning', 'Data Analysis', 'Data Visualization', 'ETL', 'Data Warehousing',
  'Agile', 'Scrum', 'Jira', 'Problem Solving', 'Communication', 'Teamwork'
];

const ACTION_VERBS = [
  'developed', 'engineered', 'built', 'implemented', 'designed', 'architected',
  'optimized', 'automated', 'created', 'spearheaded', 'deployed', 'integrated',
  'managed', 'resolved', 'maintained', 'orchestrated', 'refactored', 'reduced',
  'increased', 'improved', 'accelerated', 'formulated', 'streamlined', 'analyzed'
];

export function extractContactDetails(text: string): ParsedContactInfo {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/;
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i;
  const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i;

  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);
  const linkedinMatch = text.match(linkedinRegex);
  const githubMatch = text.match(githubRegex);

  return {
    email: emailMatch ? emailMatch[0] : undefined,
    phone: phoneMatch ? phoneMatch[0] : undefined,
    linkedin: linkedinMatch ? linkedinMatch[0] : undefined,
    github: githubMatch ? githubMatch[0] : undefined
  };
}

export function detectSections(text: string) {
  const lower = text.toLowerCase();
  
  const hasContact = lower.includes('@') || /phone|mobile|tel|linkedin|github/i.test(text);
  const hasEducation = /education|academic|b\.tech|b\.e\.|bachelor|degree|college|university|cgpa|gpa|percentage/i.test(lower);
  const hasSkills = /skills|technical skills|proficiencies|technologies|tech stack|core competencies/i.test(lower);
  const hasProjects = /projects|academic projects|personal projects|key projects/i.test(lower);
  const hasExperience = /experience|work experience|professional experience|internship|intern/i.test(lower);
  const hasCertifications = /certifications|certificates|licenses|accreditations|certified/i.test(lower);

  return {
    contactInfo: hasContact,
    education: hasEducation,
    skills: hasSkills,
    projects: hasProjects,
    experience: hasExperience,
    certifications: hasCertifications,
    keywords: true
  };
}

export function detectSkillsInText(text: string): string[] {
  const foundSkills = new Set<string>();
  
  MASTER_SKILLS_DICTIONARY.forEach(skill => {
    // Escape special regex chars like ++, /
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
    if (regex.test(text)) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills);
}

export function countMetrics(text: string): number {
  // Looks for numbers associated with %, x, ms, scale, etc.
  const metricRegex = /\b\d+(?:\.\d+)?%\b|\b\d+(?:\.\d+)?x\b|\b\d{2,}\+?\s*(?:users|clients|requests|ms|sec|seconds|records|queries|lpa|k\+)\b/gi;
  const matches = text.match(metricRegex);
  return matches ? matches.length : 0;
}

export function countActionVerbs(text: string): number {
  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  let count = 0;
  words.forEach(w => {
    if (ACTION_VERBS.includes(w)) count++;
  });
  return count;
}

export function analyzePastedResume(
  text: string,
  targetRole: string = 'Java Developer',
  sourceName: string = 'Pasted_Resume_Content.txt'
): ResumeAnalysisResult {
  const cleanText = text.trim();
  const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
  const charCount = cleanText.length;

  const contact = extractContactDetails(cleanText);
  const sections = detectSections(cleanText);
  const detectedSkills = detectSkillsInText(cleanText);
  const metricsCount = countMetrics(cleanText);
  const actionVerbsCount = countActionVerbs(cleanText);

  const taxonomy = ROLE_TAXONOMIES[targetRole] || ROLE_TAXONOMIES['Java Developer'];
  
  // Missing skills from core and nice-to-have
  const targetLower = detectedSkills.map(s => s.toLowerCase());
  const missingCore = taxonomy.coreSkills.filter(s => !targetLower.includes(s.toLowerCase()));
  const missingNice = taxonomy.niceToHaveSkills.filter(s => !targetLower.includes(s.toLowerCase()));
  const missingKeywords = [...missingCore, ...missingNice.slice(0, 3)];

  // ATS Score Calculation
  // 1. Keyword alignment (45 pts)
  const coreMatched = taxonomy.coreSkills.length - missingCore.length;
  const coreScore = (coreMatched / taxonomy.coreSkills.length) * 35;
  const niceMatched = taxonomy.niceToHaveSkills.length - missingNice.length;
  const niceScore = (niceMatched / taxonomy.niceToHaveSkills.length) * 10;
  const keywordPts = coreScore + niceScore;

  // 2. Sections completeness (25 pts)
  let sectionPts = 0;
  if (sections.contactInfo) sectionPts += 5;
  if (sections.education) sectionPts += 5;
  if (sections.skills) sectionPts += 5;
  if (sections.projects) sectionPts += 5;
  if (sections.experience || sections.certifications) sectionPts += 5;

  // 3. Measurable metrics & action verbs (20 pts)
  const metricsPts = Math.min(10, metricsCount * 2.5);
  const verbsPts = Math.min(10, actionVerbsCount * 1.5);

  // 4. Content length / substance (10 pts)
  let lengthPts = 0;
  if (wordCount >= 250 && wordCount <= 900) {
    lengthPts = 10;
  } else if (wordCount >= 150) {
    lengthPts = 7;
  } else if (wordCount > 50) {
    lengthPts = 4;
  }

  const rawScore = keywordPts + sectionPts + metricsPts + verbsPts + lengthPts;
  const atsScore = Math.min(98, Math.max(30, Math.round(rawScore)));
  const resumeScore = Math.min(99, Math.max(35, Math.round((atsScore * 0.9) + (sectionPts * 0.4))));

  // Dynamic Strengths
  const strengths: string[] = [];
  if (detectedSkills.length >= 6) {
    strengths.push(`Detected ${detectedSkills.length} relevant technical skills clearly formatted.`);
  } else if (detectedSkills.length > 0) {
    strengths.push(`Found foundation skills including ${detectedSkills.slice(0, 3).join(', ')}.`);
  }

  if (contact.email && contact.phone) {
    strengths.push('Complete contact credentials (Email and Phone) verified.');
  }
  if (contact.github || contact.linkedin) {
    strengths.push('Professional portfolio links (GitHub / LinkedIn) present for recruiter verification.');
  }
  if (metricsCount >= 2) {
    strengths.push(`Quantifiable metrics identified (${metricsCount} instances), showing measurable project impact.`);
  }
  if (sections.education && sections.projects) {
    strengths.push('Strong structural foundation with prominent Education and Projects sections.');
  }
  if (strengths.length === 0) {
    strengths.push('Standard plain text structure that parsers can readily read.');
  }

  // Dynamic Improvements
  const improvements: string[] = [];
  if (missingCore.length > 0) {
    improvements.push(`Add essential ${targetRole} keywords: ${missingCore.slice(0, 3).join(', ')}.`);
  }
  if (metricsCount < 2) {
    improvements.push('Add measurable achievements (% efficiency gain, data size, latency decrease, user count) to project bullets.');
  }
  if (!contact.github) {
    improvements.push('Include a direct link to your active GitHub profile in the contact header.');
  }
  if (!contact.linkedin) {
    improvements.push('Add your customized LinkedIn profile URL to boost recruiter outreach.');
  }
  if (!sections.certifications) {
    improvements.push(`Include verified industry certifications relevant to ${targetRole}.`);
  }
  if (actionVerbsCount < 3) {
    improvements.push('Begin project bullet points with strong action verbs (e.g., Engineered, Architected, Automated).');
  }
  if (wordCount < 200) {
    improvements.push('Resume content appears brief. Elaborate on project architecture and technical responsibilities.');
  }

  return {
    fileName: sourceName,
    fileSize: `${(charCount / 1024).toFixed(1)} KB`,
    uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    resumeScore,
    atsScore,
    sections,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    missingKeywords,
    detectedSkills,
    rawText: cleanText,
    targetRole,
    wordCount,
    metricsCount,
    actionVerbsCount,
    contactDetails: contact
  };
}

export const SAMPLE_RESUMES: Record<string, string> = {
  'Java Developer': `Alex Kumar
Bengaluru, India | +91 98765 43210 | alex.kumar@email.com
LinkedIn: linkedin.com/in/alex-kumar-dev | GitHub: github.com/alexkumar-dev

PROFESSIONAL SUMMARY
Motivated Computer Science Engineering student specializing in Java enterprise systems, Spring Boot microservices, and database optimization. Experienced in developing scalable RESTful backends and solving algorithmic problems.

EDUCATION
B.Tech in Computer Science & Engineering
ABC Engineering College, Bengaluru (Affiliated with VTU) | CGPA: 8.4/10 | Expected: 2027

TECHNICAL SKILLS
- Programming Languages: Java (17/21), Python, JavaScript, SQL
- Frameworks & Tools: Spring Boot, Hibernate, REST APIs, Git, GitHub, Maven, Docker
- Databases: MySQL, PostgreSQL, Redis basics
- Core Competencies: Data Structures & Algorithms, Object-Oriented Programming (OOP), System Design basics

PROJECTS
1. Enterprise Employee & Asset Management System
- Architected a full-stack Spring Boot REST API serving 15+ endpoints with token-based authentication.
- Optimized PostgreSQL relational queries using compound indexing, reducing query response time by 42% on a dataset of 50,000+ employee records.
- Integrated automated Docker containerization, reducing local environment onboarding time from 3 hours to 5 minutes.

2. Distributed Order Processing Engine
- Built a multi-threaded Java asynchronous order queue processing 1,200 simulated transactions per minute.
- Enforced transactional data integrity using ACID guarantees and custom Hibernate JPA repository layers.
- Published full code on GitHub with automated JUnit test suites achieving 88% unit test coverage.

CERTIFICATIONS
- Oracle Certified Associate, Java SE 8 Programmer (In Progress)
- HackerRank 5-Star Problem Solving Badge (Java)`,

  'ServiceNow Developer': `Alex Kumar
Bengaluru, India | +91 98765 43210 | alex.kumar@email.com
LinkedIn: linkedin.com/in/alex-kumar-sn | GitHub: github.com/alexkumar-dev

PROFESSIONAL SUMMARY
Aspiring ServiceNow Developer and Computer Science undergraduate with hands-on Personal Developer Instance (PDI) experience in IT Service Management (ITSM), Flow Designer, Client Scripts, and Business Rules.

EDUCATION
B.Tech in Computer Science & Engineering
ABC Engineering College, Bengaluru | CGPA: 8.4/10 | Expected: 2027

TECHNICAL SKILLS
- ServiceNow Platform: ServiceNow Administration, ITSM (Incident, Problem, Change), Flow Designer, Service Catalog, Service Portal, IntegrationHub
- Scripting & APIs: JavaScript (ES6+), GlideRecord, GlideSystem, REST APIs, JSON, HTML, CSS
- Tools & Methodologies: Git, GitHub, Agile, Scrum, Jira, Postman

SERVICENOW PROJECTS
1. Automated IT Hardware Asset & Onboarding Portal
- Built a customized Service Catalog Item with 12 variable sets, UI Policies, and Client Scripts to streamline fresher onboarding requests.
- Designed an end-to-end Flow Designer workflow routing multi-tier manager approvals, reducing average request ticket turnaround by 65%.
- Implemented script includes and GlideRecord queries to auto-populate inventory availability based on regional office locations.

2. ServiceNow & External API Integration Hub
- Created outbound REST API messages connecting ServiceNow Incident tables with external Slack notification channels.
- Configured Business Rules with condition checks to trigger real-time alerts whenever P1/Critical incidents are logged.

CERTIFICATIONS & BADGES
- ServiceNow Certified System Administrator (CSA) - Academic Coursework
- ServiceNow Micro-Certification: Flow Designer
- JavaScript Algorithms & Data Structures - freeCodeCamp`,

  'Data Analyst': `Alex Kumar
Bengaluru, India | +91 98765 43210 | alex.kumar@email.com
LinkedIn: linkedin.com/in/alex-kumar-data | GitHub: github.com/alexkumar-data

PROFESSIONAL SUMMARY
Analytical Computer Science undergraduate with practical experience in Python data analysis, SQL query engineering, and Power BI interactive dashboards. Passionate about transforming raw operational datasets into executive KPIs.

EDUCATION
B.Tech in Computer Science & Engineering
ABC Engineering College, Bengaluru | CGPA: 8.4/10 | Expected: 2027

TECHNICAL SKILLS
- Programming & Analysis: Python (Pandas, NumPy, Matplotlib, Seaborn), SQL, Advanced Excel (VLOOKUP, Pivot Tables, Macros)
- Visualization Tools: Power BI (DAX, Data Modeling), Tableau
- Cloud & Storage: AWS (S3, RDS), Data Warehousing basics, PostgreSQL
- Core Competencies: Exploratory Data Analysis (EDA), Statistical Modeling, Business Analysis

PROJECTS
1. E-Commerce Sales Performance & Churn Dashboard
- Engineered automated Python ETL scripts cleaning and aggregating 250,000+ sales records from multi-source CSV files.
- Designed an interactive 4-page Power BI dashboard with 15+ custom DAX measures, visualizing monthly sales growth and customer churn.
- Uncovered regional revenue bottlenecks, highlighting a 28% drop-off in Tier-2 checkout completions.

2. SQL-Driven Healthcare Patient Flow Analysis
- Developed advanced SQL queries with CTEs, window functions (ROW_NUMBER, DENSE_RANK), and self-joins across 8 normalized tables.
- Reduced database query latency by 35% via index tuning on high-frequency patient appointment lookups.

CERTIFICATIONS
- Microsoft Certified: Power BI Data Analyst Associate (PL-300) Prep
- Google Data Analytics Professional Certificate`
};
