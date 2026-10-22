import { ROLE_BENCHMARKS } from './resumeAnalyzer.js';

export const COMPANY_CATALOG = [
  // 1. Product Companies
  {
    name: 'ServiceNow',
    category: 'Product Companies',
    relevantRole: 'Associate Software Engineer / Quality Engineer',
    whyItMayMatch: 'Candidates with JavaScript fundamentals, enterprise workflow understanding, or Java backend basics align directly with platform development teams.',
    skillsCommonlyRelevant: ['JavaScript', 'Java', 'ITSM', 'REST APIs', 'Data Structures', 'Flow Designer'],
    preparationAreas: 'JavaScript event loop and async patterns, GlideRecord API concepts, OOP principles, and clean algorithm problem solving.',
    publicInfoNotice: 'Company hiring is typically conducted via campus university partnerships and off-campus early-career portal requisitions.'
  },
  {
    name: 'Zoho Corporation',
    category: 'Product Companies',
    relevantRole: 'Software Developer (Product Engineering)',
    whyItMayMatch: 'Zoho focuses deeply on strong fundamentals in Core Java, C/C++, and building custom software from scratch without heavy third-party dependencies.',
    skillsCommonlyRelevant: ['Java', 'C++', 'Data Structures', 'Algorithms', 'OOP', 'SQL'],
    preparationAreas: 'Low-level design, writing algorithms without built-in library shortcuts, Java memory management, multi-threading, and object-oriented modeling.',
    publicInfoNotice: 'Zoho conducts multi-round on-site coding tests focusing on pure programming without standard libraries.'
  },
  {
    name: 'Freshworks',
    category: 'Product Companies',
    relevantRole: 'Software Engineer Trainee',
    whyItMayMatch: 'Freshworks develops customer engagement and IT service software (Freshservice), making web and enterprise developers strong candidates.',
    skillsCommonlyRelevant: ['Java', 'Ruby on Rails', 'React', 'REST APIs', 'SQL', 'Git'],
    preparationAreas: 'REST API design, web scalability principles, relational database querying, and responsive UI architecture.',
    publicInfoNotice: 'Regularly conducts university hiring drives and online hackathons for graduating batches.'
  },

  // 2. IT Services Companies
  {
    name: 'Tata Consultancy Services (TCS)',
    category: 'IT Services Companies',
    relevantRole: 'Systems Engineer (Digital / Prime Cadres)',
    whyItMayMatch: 'The TCS Digital and Prime cadres specifically hire freshers who show proficiency in Java, Cloud, full-stack web, and algorithmic problem solving.',
    skillsCommonlyRelevant: ['Java', 'Python', 'SQL', 'Data Structures', 'Spring Boot', 'Cloud fundamentals'],
    preparationAreas: 'TCS National Qualifier Test (NQT) Advanced Section, Java OOP concepts, competitive coding (Arrays, Strings, Recursion), and DBMS normalization.',
    publicInfoNotice: 'National hiring via TCS NQT cycles for 2025/2026/2027 graduating cohorts.'
  },
  {
    name: 'Infosys',
    category: 'IT Services Companies',
    relevantRole: 'Specialist Programmer (SP) / Digital Specialist Engineer (DSE)',
    whyItMayMatch: 'High-package fresher roles tailored for candidates with demonstrable project builds and competitive coding skill.',
    skillsCommonlyRelevant: ['Java', 'Python', 'Data Structures', 'Algorithms', 'Database Design', 'Spring'],
    preparationAreas: 'HackWithInfy / InfyTQ problem solving (Dynamic Programming, Graph theory, Trees), Core Java concepts, and project architecture explanation.',
    publicInfoNotice: 'Annual national hiring drives through HackWithInfy and campus selection processes.'
  },

  // 3. Consulting Companies
  {
    name: 'Deloitte USI',
    category: 'Consulting Companies',
    relevantRole: 'Analyst — Enterprise Technology & Performance',
    whyItMayMatch: 'Deloitte recruits engineering graduates into enterprise platform practices (ServiceNow, Salesforce, SAP) and cloud integration teams.',
    skillsCommonlyRelevant: ['ServiceNow', 'Java', 'SQL', 'JavaScript', 'Business Analysis', 'Cloud'],
    preparationAreas: 'ITSM frameworks, case study problem solving, software development life cycle (SDLC), client communication, and database querying.',
    publicInfoNotice: 'Campus recruitment and national early-career drives across Indian offices.'
  },
  {
    name: 'Capgemini',
    category: 'Consulting Companies',
    relevantRole: 'Software Engineer Trainee / Platform Specialist',
    whyItMayMatch: 'Maintains massive Java Enterprise and ServiceNow Centers of Excellence, recruiting fresh graduates into targeted training programs.',
    skillsCommonlyRelevant: ['Java', 'Spring Boot', 'ServiceNow', 'JavaScript', 'SQL', 'Git'],
    preparationAreas: 'Pseudo-code assessment, cognitive ability tests, Core Java technical interviews, and SQL join queries.',
    publicInfoNotice: 'Annual off-campus and on-campus engineering graduate recruitment drives.'
  },

  // 4. Platform & ServiceNow-Focused Companies
  {
    name: 'Cognizant (ServiceNow Practice)',
    category: 'ServiceNow-Focused Opportunities',
    relevantRole: 'Programmer Analyst Trainee — ServiceNow COE',
    whyItMayMatch: 'Cognizant is an Elite ServiceNow Partner and regularly transitions computer science freshers into ITSM and platform engineering workflows.',
    skillsCommonlyRelevant: ['ServiceNow', 'JavaScript', 'ITSM', 'REST APIs', 'SQL', 'HTML/CSS'],
    preparationAreas: 'ServiceNow platform fundamentals (Tables, Forms, Lists), JavaScript DOM & Glide APIs, and ITIL process awareness.',
    publicInfoNotice: 'Recruited via Cognizant GenC / GenC Pro placement pipelines.'
  },
  {
    name: 'LTIMindtree',
    category: 'ServiceNow-Focused Opportunities',
    relevantRole: 'Graduate Engineer Trainee (Enterprise Platforms)',
    whyItMayMatch: 'Enterprise clients partner with LTIMindtree for automated workflow modernizations on ServiceNow and cloud backends.',
    skillsCommonlyRelevant: ['ServiceNow Administration', 'Flow Designer', 'JavaScript', 'Java', 'REST'],
    preparationAreas: 'Automated workflow triggers, business rules logic, REST API integration fundamentals, and problem-solving aptitude.',
    publicInfoNotice: 'Conducted through pan-India college drives and platform recruitment challenges.'
  },

  // 5. Java-Focused Opportunities
  {
    name: 'Oracle Financial Services Software',
    category: 'Java-Focused Opportunities',
    relevantRole: 'Associate Software Engineer (Core Banking Systems)',
    whyItMayMatch: 'Enterprise banking engines are built heavily on resilient Java, SQL, multithreading, and transactional ACID guarantees.',
    skillsCommonlyRelevant: ['Java 17/21', 'Spring Boot', 'SQL', 'PL/SQL', 'Multithreading', 'Data Structures'],
    preparationAreas: 'Java Collections Framework internals, JVM garbage collection, deadlock prevention, SQL query indexing, and financial transaction models.',
    publicInfoNotice: 'Campus placement and off-campus career portal applications.'
  },
  {
    name: 'Amdocs',
    category: 'Java-Focused Opportunities',
    relevantRole: 'Software Engineering Associate',
    whyItMayMatch: 'Telecommunications billing and cloud-native microservices built primarily with Spring Boot, Java, and distributed message queues.',
    skillsCommonlyRelevant: ['Java', 'Spring Boot', 'Microservices', 'SQL', 'Docker', 'Linux'],
    preparationAreas: 'Microservices architecture, RESTful API contract design, Spring annotations, and Linux command line troubleshooting.',
    publicInfoNotice: 'Annual fresher engineering intake across Pune and Gurugram technology centers.'
  },

  // 6. Startups & Fast-Growing Tech
  {
    name: 'Razorpay',
    category: 'Startups & FinTech',
    relevantRole: 'Software Development Engineer 1 (SDE-1)',
    whyItMayMatch: 'Values candidates who can write clean, high-throughput code with deep understanding of databases, APIs, and reliable payments infrastructure.',
    skillsCommonlyRelevant: ['Java', 'Go', 'Python', 'SQL', 'PostgreSQL', 'Redis', 'Docker'],
    preparationAreas: 'System design fundamentals, concurrency, idempotent API design, transactional integrity, and LeetCode Medium problem solving.',
    publicInfoNotice: 'Hiring via competitive programming challenges, AngelList/Wellfound, and official career page.'
  }
];

/**
 * Match a Pasted Job Description against the Candidate's Resume
 */
export function matchJobDescription(jdText, candidateSkills, projects = []) {
  if (!jdText || jdText.trim().length < 20) {
    throw new Error('Please paste a substantial job description (minimum 20 characters) to analyze.');
  }

  const jdLower = jdText.toLowerCase();
  const candidateLower = candidateSkills.map(s => s.toLowerCase());

  // Master keywords list to scan for in the JD
  const masterTaxonomy = [
    'Java', 'Spring Boot', 'Hibernate', 'Python', 'C++', 'C', 'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Linux', 'Git',
    'REST APIs', 'GraphQL', 'Microservices', 'Data Structures', 'Algorithms', 'System Design', 'OOP',
    'ServiceNow', 'ITSM', 'Flow Designer', 'GlideRecord', 'IntegrationHub', 'Service Portal',
    'Power BI', 'Tableau', 'Excel', 'Pandas', 'NumPy', 'Machine Learning', 'Agile', 'Jira'
  ];

  const jdRequiredSkills = masterTaxonomy.filter(skill => {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
    return regex.test(jdText);
  });

  const skillsFoundInResume = [];
  const skillsMissingFromResume = [];

  jdRequiredSkills.forEach(skill => {
    if (candidateLower.includes(skill.toLowerCase())) {
      skillsFoundInResume.push(skill);
    } else {
      skillsMissingFromResume.push(skill);
    }
  });

  const matchRatio = jdRequiredSkills.length > 0
    ? (skillsFoundInResume.length / jdRequiredSkills.length)
    : 0.7;
  const matchScore = Math.min(98, Math.max(30, Math.round(matchRatio * 100)));

  // Relevant Projects from resume that feature any of the JD skills
  const relevantProjects = projects.filter(p => {
    return p.technologies.some(t => jdRequiredSkills.map(x => x.toLowerCase()).includes(t.toLowerCase()));
  });

  // Truthfulness Rules: Recommendations for keywords
  const keywordAdvice = skillsMissingFromResume.map(skill => ({
    keyword: skill,
    advice: `Learn ${skill} first through hands-on practice. Do NOT add it to your resume until you have genuine code experience or a project demonstrating it.`
  }));

  // Recommended Interview Topics derived from the JD
  const interviewTopics = jdRequiredSkills.slice(0, 5).map(skill => {
    return `Expect technical screening questions on ${skill} core concepts and real-world project application.`;
  });

  // Sections that need improvement
  const sectionsToImprove = [];
  if (skillsMissingFromResume.length > 0) {
    sectionsToImprove.push({
      section: 'Technical Skills & Projects',
      reason: `Job description emphasizes ${skillsMissingFromResume.slice(0, 3).join(', ')}. Bridge these gaps before applying.`
    });
  }
  if (!jdLower.includes('fresher') && !jdLower.includes('entry') && jdLower.includes('years')) {
    sectionsToImprove.push({
      section: 'Experience Calibration',
      reason: 'Job posting mentions specific experience duration. Ensure your project scope emphasizes substantial complexity.'
    });
  }

  return {
    jobDescriptionLength: jdText.length,
    matchScore,
    totalSkillsIdentifiedInJD: jdRequiredSkills.length,
    skillsFoundInResume,
    skillsMissingFromResume,
    relevantProjects: relevantProjects.map(p => ({
      name: p.name,
      matchedTech: p.technologies.filter(t => jdRequiredSkills.map(x => x.toLowerCase()).includes(t.toLowerCase()))
    })),
    keywordAdvice,
    interviewTopics,
    sectionsToImprove
  };
}

/**
 * Dedicated Standalone Job Description Analysis
 * Analyzes JD copy independently when candidate doesn't have a resume yet
 */
export function analyzeJobDescriptionOnly(jdText, jobTitle = 'Target Role Opening', companyName = 'Hiring Company') {
  if (!jdText || jdText.trim().length < 20) {
    throw new Error('Please provide substantial Job Description copy (at least 20 characters).');
  }

  const jdLower = jdText.toLowerCase();

  const masterTaxonomy = [
    'Java', 'Spring Boot', 'Hibernate', 'Python', 'Django', 'Flask', 'FastAPI', 'C++', 'C#', '.NET',
    'JavaScript', 'TypeScript', 'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Next.js',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle', 'SQLite',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Linux', 'Git', 'GitHub',
    'REST APIs', 'GraphQL', 'Microservices', 'Data Structures', 'Algorithms', 'System Design', 'OOP',
    'ServiceNow', 'ITSM', 'Flow Designer', 'GlideRecord', 'IntegrationHub', 'Service Portal',
    'Power BI', 'Tableau', 'Excel', 'Pandas', 'NumPy', 'Machine Learning', 'TensorFlow', 'PyTorch',
    'Agile', 'Scrum', 'Jira', 'Unit Testing', 'JUnit', 'Selenium', 'Cybersecurity', 'Kafka', 'GraphQL'
  ];

  const requiredSkills = masterTaxonomy.filter(skill => {
    const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
    return regex.test(jdText);
  });

  // Soft skills detection
  const softSkillsTaxonomy = [
    'Communication', 'Problem-Solving', 'Teamwork', 'Agile / Scrum',
    'Analytical Thinking', 'Critical Thinking', 'Adaptability', 'Time Management', 'Self-Motivated'
  ];
  const detectedSoftSkills = softSkillsTaxonomy.filter(s => {
    const escaped = s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:$|[^a-zA-Z0-9])`, 'i').test(jdText);
  });

  // Extract candidate responsibilities lines
  const lines = jdText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const responsibilities = [];
  const requirements = [];

  for (const line of lines) {
    const clean = line.replace(/^[-*•\d.]+\s*/, '').trim();
    if (clean.length > 20) {
      if (/^(design|develop|build|implement|maintain|collaborate|test|deploy|lead|manage|optimize|create|write)/i.test(clean)) {
        responsibilities.push(clean);
      } else if (/^(experience|knowledge|proficiency|degree|b\.?tech|b\.?e|strong|familiarity|understanding)/i.test(clean)) {
        requirements.push(clean);
      }
    }
  }

  // Experience level inference
  let experienceLevel = 'Entry-Level / Fresher (0–2 Years)';
  if (/(\d+)[-+]?\s*(?:to\s*\d+)?\s*years?/i.test(jdText)) {
    const match = jdText.match(/(\d+)[-+]?\s*(?:to\s*\d+)?\s*years?/i);
    const yrs = parseInt(match[1], 10);
    if (yrs >= 5) experienceLevel = `Senior Level (${yrs}+ Years Experience)`;
    else if (yrs >= 3) experienceLevel = `Mid-Senior Level (${yrs}+ Years Experience)`;
    else experienceLevel = `Junior / Associate (${yrs} Years Experience)`;
  }

  // Interview preparation topics based on extracted skills
  const preparationTopics = requiredSkills.slice(0, 6).map(skill => ({
    topic: skill,
    focusArea: `Core architectural fundamentals, common interview coding patterns, and real-world project deployment using ${skill}.`
  }));

  // Recommended candidate profile
  const recommendedProfile = {
    idealRole: jobTitle || 'Software Engineer',
    targetCompany: companyName || 'Target Organization',
    experienceLevel,
    coreStack: requiredSkills.slice(0, 5),
    recommendedProjects: [
      `Full-stack production project demonstrating ${requiredSkills.slice(0, 3).join(' + ') || 'REST APIs and relational database schema'}`,
      `CI/CD pipeline with automated testing, Docker containerization, and cloud deployment`
    ]
  };

  return {
    jobTitle,
    companyName,
    contentLength: jdText.length,
    experienceLevel,
    requiredSkills: requiredSkills.length > 0 ? requiredSkills : ['Problem Solving', 'Data Structures', 'REST APIs', 'SQL'],
    softSkills: detectedSoftSkills.length > 0 ? detectedSoftSkills : ['Analytical Thinking', 'Team Collaboration', 'Problem Solving'],
    keyResponsibilities: responsibilities.slice(0, 8),
    keyRequirements: requirements.slice(0, 8),
    preparationTopics,
    recommendedProfile
  };
}

