/**
 * CareerLens AI — Resume Analysis & Extraction Engine
 * Provides deterministic parsing, categorization, issue detection, and scorecard computation.
 */

// Categorized Skill Dictionary
export const SKILL_TAXONOMY = {
  programmingLanguages: [
    'Java', 'Python', 'C++', 'C', 'C#', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Ruby', 'PHP', 'Kotlin', 'Swift', 'Scala', 'R'
  ],
  webTechnologies: [
    'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind', 'Tailwind CSS', 'Bootstrap', 'Sass', 'LESS', 'WebSockets', 'GraphQL', 'REST', 'REST APIs', 'JSON', 'XML'
  ],
  frameworks: [
    'React', 'React.js', 'Angular', 'Vue', 'Vue.js', 'Next.js', 'Node.js', 'Express', 'Express.js',
    'Spring', 'Spring Boot', 'Hibernate', 'JPA', 'Django', 'Flask', 'FastAPI', 'ASP.NET', 'Laravel'
  ],
  databases: [
    'SQL', 'MySQL', 'PostgreSQL', 'Oracle', 'SQL Server', 'MongoDB', 'Redis', 'Cassandra', 'SQLite', 'DynamoDB', 'Firebase', 'Supabase'
  ],
  cloudAndDevOps: [
    'AWS', 'Amazon Web Services', 'Azure', 'Microsoft Azure', 'GCP', 'Google Cloud',
    'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform', 'Linux', 'Unix', 'Bash', 'Shell Scripting', 'Ansible'
  ],
  toolsAndPlatforms: [
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Postman', 'Jira', 'Confluence', 'Maven', 'Gradle',
    'VS Code', 'IntelliJ IDEA', 'Eclipse', 'Figma', 'Power BI', 'Tableau', 'Excel', 'Advanced Excel'
  ],
  enterpriseAndSpecialized: [
    'ServiceNow', 'ServiceNow Administration', 'ITSM', 'Flow Designer', 'GlideRecord', 'IntegrationHub',
    'Service Portal', 'Business Rules', 'Client Scripts', 'Agile', 'Scrum', 'Data Structures', 'Algorithms', 'OOP', 'System Design'
  ],
  aiAndMachineLearning: [
    'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'Keras', 'Computer Vision', 'Convolutional Neural Networks', 'CNN', 'OpenCV', 'NLP', 'Natural Language Processing', 'LLMs', 'Scikit-Learn', 'Pandas', 'NumPy', 'YOLO', 'YOLOv8', 'ResNet', 'Hugging Face'
  ],
  cybersecurity: [
    'Cybersecurity', 'Network Security', 'Snort', 'Wireshark', 'Metasploit', 'SIEM', 'Kali Linux', 'Threat Hunting', 'Firewalls', 'Penetration Testing', 'SOC', 'Cryptography', 'Honeypot'
  ],
  dataAnalytics: [
    'Data Analytics', 'ETL', 'Data Warehousing', 'Data Pipelines', 'Snowflake', 'BigQuery', 'Apache Spark', 'Hadoop', 'Statistics'
  ]
};

// Target Role Standards
export const ROLE_BENCHMARKS = {
  'Java Developer': {
    title: 'Java Developer',
    coreSkills: ['Java', 'Spring Boot', 'SQL', 'REST APIs', 'Git', 'Data Structures', 'OOP'],
    recommendedSkills: ['Hibernate', 'Docker', 'PostgreSQL', 'MySQL', 'System Design', 'CI/CD', 'Maven', 'JUnit'],
    commonInterviewTopics: ['Core Java (Multithreading, Collections, Stream API)', 'OOP Concepts & Design Patterns', 'Spring Boot Lifecycle & Annotations', 'SQL Queries & Indexing', 'DSA (Arrays, LinkedLists, Binary Trees)'],
    keywords: ['Java 17/21', 'Spring Boot', 'RESTful API', 'Microservices', 'Hibernate JPA', 'PostgreSQL', 'JUnit', 'Maven', 'Docker']
  },
  'Software Developer / SDE': {
    title: 'Software Developer / SDE',
    coreSkills: ['Java', 'Python', 'C++', 'Data Structures', 'Algorithms', 'SQL', 'Git', 'OOP'],
    recommendedSkills: ['System Design', 'REST APIs', 'Linux', 'Docker', 'Database Management'],
    commonInterviewTopics: ['Data Structures & Algorithms', 'Time and Space Complexity Analysis', 'OOP Principles (Polymorphism, Inheritance, Encapsulation)', 'Database Normalization & ACID Properties', 'System Architecture basics'],
    keywords: ['Algorithms', 'Data Structures', 'Problem Solving', 'OOP', 'SQL', 'Git', 'System Design', 'Scalability']
  },
  'ServiceNow Developer': {
    title: 'ServiceNow Developer',
    coreSkills: ['ServiceNow', 'JavaScript', 'ITSM', 'REST APIs', 'Flow Designer', 'GlideRecord'],
    recommendedSkills: ['IntegrationHub', 'Service Portal', 'ServiceNow Administration', 'Business Rules', 'Client Scripts', 'UI Policies', 'Agile'],
    commonInterviewTopics: ['GlideRecord vs GlideSystem APIs', 'Client Scripts vs Business Rules execution sequence', 'ITSM Incident/Problem/Change lifecycles', 'Flow Designer automation actions', 'Script Includes & REST Integrations'],
    keywords: ['ServiceNow CSA/CAD', 'ITSM', 'GlideRecord', 'Business Rules', 'Client Scripts', 'Flow Designer', 'Service Catalog', 'REST Integration']
  },
  'Full Stack Developer': {
    title: 'Full Stack Developer',
    coreSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'REST APIs', 'Git', 'HTML', 'CSS'],
    recommendedSkills: ['TypeScript', 'Express', 'Tailwind', 'MongoDB', 'Docker', 'PostgreSQL', 'Next.js'],
    commonInterviewTopics: ['React Hooks & Virtual DOM', 'Asynchronous JavaScript & Event Loop', 'REST API design & HTTP Status codes', 'Database schemas & Query optimization', 'State Management'],
    keywords: ['React', 'Node.js', 'TypeScript', 'Full Stack', 'RESTful APIs', 'PostgreSQL', 'Tailwind CSS', 'Docker']
  },
  'Cloud & DevOps Engineer': {
    title: 'Cloud & DevOps Engineer',
    coreSkills: ['AWS', 'Docker', 'Git', 'Linux', 'CI/CD', 'Python'],
    recommendedSkills: ['Kubernetes', 'Terraform', 'Jenkins', 'Ansible', 'Bash', 'System Design'],
    commonInterviewTopics: ['Docker container lifecycle & multi-stage builds', 'AWS core primitives (EC2, S3, IAM, VPC)', 'CI/CD pipeline stages & automation', 'Linux shell scripting & file permissions', 'Infrastructure as Code (IaC)'],
    keywords: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux', 'Bash', 'Jenkins', 'Cloud Architecture']
  },
  'Data Analyst': {
    title: 'Data Analyst',
    coreSkills: ['Python', 'SQL', 'Power BI', 'Excel', 'Data Visualization'],
    recommendedSkills: ['Tableau', 'AWS', 'Pandas', 'NumPy', 'Data Warehousing', 'ETL', 'Statistical Analysis'],
    commonInterviewTopics: ['SQL Complex Joins, Window Functions & Aggregations', 'Data Cleaning & Normalization in Python (Pandas)', 'Power BI DAX formulas & Relationship modeling', 'Business KPI interpretation & Storytelling', 'Statistical Outlier handling'],
    keywords: ['SQL', 'Power BI', 'Python (Pandas)', 'Advanced Excel', 'Data Modeling', 'ETL Pipelines', 'DAX', 'Tableau']
  }
};

/**
 * 1. Personal & Contact Information Extraction
 */
export function extractPersonalInfo(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Name heuristic: usually in first 3 non-empty lines
  let name = 'Not found in resume';
  for (let i = 0; i < Math.min(4, lines.length); i++) {
    const line = lines[i];
    if (
      line.length > 2 &&
      line.length < 35 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/\d/.test(line) &&
      !/resume|curriculum|cv|profile|summary|education/i.test(line)
    ) {
      name = line;
      break;
    }
  }

  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const portfolioMatch = text.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:io|dev|com|me|tech)(?:\/[^\s]*)?/i);

  // Location heuristics (common Indian IT cities or general formats)
  const locationMatch = text.match(/\b(Bengaluru|Bangalore|Hyderabad|Pune|Mumbai|Chennai|Delhi|Noida|Gurugram|Gurgaon|Kolkata|Ahmedabad|Kochi|India)\b/i);

  return {
    name: name !== 'Not found in resume' ? name : 'Candidate',
    email: emailMatch ? emailMatch[0] : 'Not found in resume',
    phone: phoneMatch ? phoneMatch[0] : 'Not found in resume',
    linkedin: linkedinMatch ? linkedinMatch[0] : 'Not found in resume',
    github: githubMatch ? githubMatch[0] : 'Not found in resume',
    portfolio: portfolioMatch && !portfolioMatch[0].includes('linkedin') && !portfolioMatch[0].includes('github') ? portfolioMatch[0] : 'Not found in resume',
    location: locationMatch ? locationMatch[0] : 'Not found in resume'
  };
}

/**
 * 2. Education Extraction
 */
export function extractEducation(text) {
  const explicitDegree = text.match(/(?:degree|major|branch|qualification)[:\s]+([^\n\r,]+)/i);
  const explicitCollege = text.match(/(?:college|university|institution|institute)[:\s]+([^\n\r,]+)/i);

  const degreeMatch = explicitDegree
    ? [explicitDegree[1].trim()]
    : text.match(/\b(B\.Tech|B\.E\.|BTech|BE|BCA|B\.Sc|BSc|M\.Tech|MTech|MCA|M\.Sc|Bachelor of Technology|Bachelor of Engineering|Master of Computer Applications|Computer Science|Information Technology)\b/i);

  const collegeMatch = explicitCollege
    ? [null, explicitCollege[1].trim()]
    : (text.match(/(?:\b(?:at|from|in)\b|,|-)\s*([A-Z][a-zA-Z\s.,&]+(?:Engineering|College|Institute|University|Technology|Campus))/i) ||
       text.match(/([A-Z][a-zA-Z\s.,&]+(?:Institute of Technology|College of Engineering|University))/i));
  
  const gradYearMatch = text.match(/\b(202[0-9]|201[8-9])\b/);
  const cgpaMatch = text.match(/\b(CGPA|GPA|Percentage|Score)[:\s]*([0-9]+(?:\.[0-9]+)?(?:\s*\/\s*10|\s*%)?)\b/i) ||
                    text.match(/\b([0-9]\.[0-9]{1,2})\s*(?:\/|\s*out of\s*)10\b/i);

  return {
    degree: degreeMatch ? (degreeMatch[1] || degreeMatch[0]).trim() : 'Not found in resume',
    college: collegeMatch ? (collegeMatch[1] || collegeMatch[0]).trim() : 'Not found in resume',
    graduationYear: gradYearMatch ? gradYearMatch[0] : 'Not found in resume',
    cgpa: cgpaMatch ? (cgpaMatch[2] || cgpaMatch[1]) : 'Not found in resume'
  };
}

/**
 * 3. Categorized Technical Skills Extraction
 */
export function extractCategorizedSkills(text) {
  const result = {
    programmingLanguages: [],
    webTechnologies: [],
    frameworks: [],
    databases: [],
    cloudAndDevOps: [],
    toolsAndPlatforms: [],
    enterpriseAndSpecialized: [],
    aiAndMachineLearning: [],
    cybersecurity: [],
    dataAnalytics: [],
    allSkillsFound: []
  };

  const allFoundSet = new Set();

  for (const [category, skillsList] of Object.entries(SKILL_TAXONOMY)) {
    for (const skill of skillsList) {
      const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
      if (regex.test(text)) {
        if (!result[category].includes(skill)) {
          result[category].push(skill);
        }
        allFoundSet.add(skill);
      }
    }
  }

  result.allSkillsFound = Array.from(allFoundSet);
  return result;
}

/**
 * 4. Project Extraction & Analysis
 */
export function extractAndAnalyzeProjects(text, allSkills) {
  const projectKeywords = ['project', 'projects', 'academic projects', 'personal projects', 'key projects'];
  const lines = text.split('\n');
  
  let inProjectsSection = false;
  const projectBlocks = [];
  let currentBlock = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Detect project section header or direct project line
    if (/^projects?:\s*/i.test(line)) {
      if (currentBlock.length > 0) {
        projectBlocks.push(currentBlock.join('\n'));
      }
      const remainder = line.replace(/^projects?:\s*/i, '').trim();
      currentBlock = remainder ? [remainder] : [];
      inProjectsSection = true;
      continue;
    }

    if (/^(projects|academic projects|key projects|personal projects|technical projects)/i.test(line) && line.length < 35) {
      inProjectsSection = true;
      continue;
    }

    // Detect next major section header
    if (inProjectsSection && /^(education|technical skills|skills|experience|certifications|achievements|declarations)/i.test(line) && line.length < 35) {
      if (currentBlock.length > 0) {
        projectBlocks.push(currentBlock.join('\n'));
        currentBlock = [];
      }
      inProjectsSection = false;
      break;
    }

    if (inProjectsSection) {
      // Check if line indicates a new project title (e.g. numbered "1. ", or bold heading style)
      if (/^([0-9]+\.|\u2022|\*|[A-Z][a-zA-Z0-9\s-]{4,40}:)/.test(line) && currentBlock.length > 3) {
        projectBlocks.push(currentBlock.join('\n'));
        currentBlock = [line];
      } else {
        currentBlock.push(line);
      }
    }
  }

  if (currentBlock.length > 0) {
    projectBlocks.push(currentBlock.join('\n'));
  }

  // If no explicit project section was delimited, scan for project-like paragraphs
  if (projectBlocks.length === 0) {
    const matches = text.match(/\b(?:Project|System|Application|Portal|Platform|Engine|Dashboard|Bot)\b[\s\S]{30,350}(?=(?:\b(?:Project|Education|Skills|Certifications)\b|$))/gi);
    if (matches && matches.length > 0) {
      matches.slice(0, 3).forEach(m => projectBlocks.push(m.trim()));
    }
  }

  const analyzedProjects = projectBlocks.map((block, idx) => {
    const blockLines = block.split('\n').filter(Boolean);
    const rawTitle = blockLines[0] || `Project ${idx + 1}`;
    const cleanTitle = rawTitle
      .replace(/^projects?:\s*/i, '')
      .replace(/^[0-9]+\.\s*/, '')
      .replace(/^[•*-]\s*/, '')
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s+(?:github|tech|technologies|stack|using|tools)\b.*$/i, '')
      .split(/\s+[-–—|:]\s+|\s*[:|]\s*/)[0]
      .trim();

    // Detect tech in project
    const detectedTech = allSkills.filter(s => {
      const escaped = s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(block);
    });

    const hasMetrics = /\b\d+(?:\.\d+)?%|\b\d+\s*(?:users|clients|records|queries|ms|sec|hours|lpa|k\+)\b/i.test(block);
    const hasAuth = /auth|jwt|token|login|oauth|bcrypt|role/i.test(block);
    const hasDb = /database|sql|mysql|postgres|mongodb|tables|query|schema/i.test(block);
    const hasApi = /api|rest|endpoint|http|crud/i.test(block);
    const hasDeploy = /deploy|docker|aws|cloud|vercel|render|heroku/i.test(block);

    // Complexity heuristic
    let complexity = 'Moderate';
    if (detectedTech.length >= 4 && (hasDb || hasApi) && (hasAuth || hasDeploy)) {
      complexity = 'High / Production-Oriented';
    } else if (detectedTech.length <= 2 && !hasDb && !hasApi) {
      complexity = 'Foundational / Academic Prototype';
    }

    // Working Phase Classification
    let classification = 'Partially Functional';
    let evidence = [];

    if (hasDb && hasApi && hasAuth) {
      classification = 'Functional / Near Production';
      evidence.push('Integrates persistent database, API routes, and user authentication.');
    } else if (hasDb || hasApi) {
      classification = 'Partially Functional';
      evidence.push('Demonstrates backend or database component integration.');
    } else {
      classification = 'Prototype / Script';
      evidence.push('Limited evidence of end-to-end client-server architecture.');
    }

    if (hasMetrics) {
      evidence.push('Contains quantifiable performance or scale metrics.');
    } else {
      evidence.push('Lacks measurable performance indicators (latency, dataset size, percentage gain).');
    }

    return {
      name: cleanTitle || `Engineering Project ${idx + 1}`,
      rawContent: block,
      technologies: detectedTech.length > 0 ? detectedTech : ['Unspecified / General Code'],
      problemSolved: `Automates workflow and addresses operational inefficiencies identified in ${cleanTitle}.`,
      targetUsers: 'Target enterprise users, students, or system administrators.',
      architecture: {
        frontend: detectedTech.find(t => ['React', 'Angular', 'Vue', 'HTML', 'Tailwind'].includes(t)) || 'Not explicitly stated',
        backend: detectedTech.find(t => ['Java', 'Spring Boot', 'Node.js', 'Express', 'Python', 'ServiceNow'].includes(t)) || 'Not explicitly stated',
        database: detectedTech.find(t => ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle'].includes(t)) || (hasDb ? 'Database mentioned' : 'Not found in resume'),
        apis: hasApi ? 'RESTful endpoints / HTTP methods' : 'Not found in resume',
        authentication: hasAuth ? 'Token / Session auth mentioned' : 'Not found in resume',
        deployment: hasDeploy ? 'Cloud / Container deployment noted' : 'Not found in resume'
      },
      complexity,
      workingPhaseClassification: classification,
      evidenceNotes: evidence,
      whatIsStrong: [
        detectedTech.length > 0 ? `Explicitly references ${detectedTech.slice(0, 3).join(', ')}.` : 'Defines project objective.',
        hasMetrics ? 'Includes quantitative performance benchmarks.' : 'Presents functional software flow.'
      ],
      whatIsMissing: [
        !hasMetrics ? 'Measurable achievements (% performance increase, query speedup, transaction count).' : null,
        !hasDeploy ? 'Deployment environment details (Docker, AWS, Vercel, or local server).' : null,
        !hasAuth ? 'User authorization or input validation mechanisms.' : null
      ].filter(Boolean),
      whatShouldNotBeClaimed: [
        'Do not claim microservices architecture if built as a single monolithic script.',
        'Do not claim handling "thousands of concurrent live users" unless supported by real production deployment logs.'
      ]
    };
  });

  return analyzedProjects;
}

/**
 * 5. Experience Extraction
 */
export function extractExperience(text) {
  const expMatch = text.match(/(?:Experience|Work Experience|Professional Experience|Internship)[\s\S]{30,400}(?=(?:Projects|Education|Skills|Certifications|$))/i);
  if (!expMatch) {
    return [];
  }

  const block = expMatch[0].trim();
  const companyMatch = block.match(/(?:at|for|intern at|,)\s*([A-Z][a-zA-Z0-9\s.,&]{2,30}(?:Technologies|Solutions|Services|Private Limited|Pvt Ltd|Labs|Inc|Corp))/i);
  const roleMatch = block.match(/\b(Intern|Software Engineer Intern|Web Developer Intern|Developer|Trainee|Analyst)\b/i);
  const durationMatch = block.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}\s*(?:-|to)\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4}|\d{4})/i) ||
                      block.match(/\b\d+\s*(?:months|month)\b/i);

  return [{
    company: companyMatch ? companyMatch[1].trim() : 'Company / Organization mentioned',
    role: roleMatch ? roleMatch[0] : 'Engineering Intern / Fresher Role',
    duration: durationMatch ? durationMatch[0] : 'Duration not specified',
    summary: block.slice(0, 180) + '...'
  }];
}

/**
 * 6. Certifications Extraction
 */
export function extractCertifications(text) {
  const certMatches = text.match(/(?:Certified|Certification|Certificate|Associate|Practitioner|PL-300|AWS Certified|CSA|CAD)[\s\S]{10,120}(?=\n|$)/gi);
  if (!certMatches) {
    return [];
  }

  return certMatches.slice(0, 4).map(c => {
    const clean = c.replace(/^[•*-]\s*/, '').trim();
    let org = 'Recognized Platform / Body';
    if (/AWS|Amazon/i.test(clean)) org = 'Amazon Web Services';
    else if (/Microsoft|Azure|Power BI/i.test(clean)) org = 'Microsoft';
    else if (/ServiceNow/i.test(clean)) org = 'ServiceNow';
    else if (/Oracle|Java/i.test(clean)) org = 'Oracle';
    else if (/Google|GCP/i.test(clean)) org = 'Google';
    else if (/HackerRank/i.test(clean)) org = 'HackerRank';

    return {
      name: clean,
      issuer: org,
      status: 'Verified from resume text'
    };
  });
}

/**
 * 7. Comprehensive Mistake Detection (Resume Issues)
 * Categorized into Critical (🔴), Important (🟠), Improvement (🟡), Good (🟢)
 */
export function detectResumeIssues(parsedData, targetRole = 'Java Developer') {
  const issues = [];
  const { contact, education, skills, projects, certifications, rawText } = parsedData;
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const metricsCount = (rawText.match(/\b\d+(?:\.\d+)?%|\b\d+\s*(?:users|clients|records|queries|ms|sec|hours|lpa|k\+)\b/gi) || []).length;
  const benchmark = ROLE_BENCHMARKS[targetRole] || ROLE_BENCHMARKS['Java Developer'];

  // 1. Critical Issues (🔴)
  if (contact.email === 'Not found in resume' || contact.phone === 'Not found in resume') {
    issues.push({
      severity: 'Critical',
      badge: '🔴 Critical',
      problem: 'Missing mandatory contact information (Email and/or Phone).',
      whyItMatters: 'Recruiters and automated ATS scanners cannot schedule interviews or invite you to coding tests without direct contact details.',
      recommendedFix: 'Place your professional email and direct 10-digit mobile number at the top of page 1 directly under your name.'
    });
  }

  if (projects.length === 0) {
    issues.push({
      severity: 'Critical',
      badge: '🔴 Critical',
      problem: 'No dedicated Projects section identified in the resume.',
      whyItMatters: 'For CSE freshers, hands-on projects are the primary proof of coding and architecture competence in the absence of years of corporate experience.',
      recommendedFix: 'Add at least two end-to-end technical projects detailing problem solved, technologies, architecture, and personal contributions.'
    });
  }

  const missingCore = benchmark.coreSkills.filter(s => !skills.allSkillsFound.map(x => x.toLowerCase()).includes(s.toLowerCase()));
  if (missingCore.length >= 3) {
    issues.push({
      severity: 'Critical',
      badge: '🔴 Critical',
      problem: `Missing core technical keywords for target role (${targetRole}): ${missingCore.slice(0, 3).join(', ')}.`,
      whyItMatters: 'ATS parsers use exact-match filters on job requisitions. Resumes lacking primary role keywords fail the initial screening cut.',
      recommendedFix: `If you have academic or project experience in ${missingCore.slice(0, 2).join(' and ')}, state them explicitly in your Technical Skills section and project descriptions.`
    });
  }

  // 2. Important Issues (🟠)
  if (metricsCount < 2) {
    issues.push({
      severity: 'Important',
      badge: '🟠 Important',
      problem: 'Lack of measurable performance metrics or quantitative achievements in project bullets.',
      whyItMatters: 'Task-based descriptions ("worked on database", "made a website") appear generic. Recruiters look for business/engineering impact.',
      recommendedFix: 'Rewrite bullets using the Action + Context + Result formula (e.g. "Optimized SQL indexing, decreasing query execution latency by 35% across 50k mock records").'
    });
  }

  if (contact.github === 'Not found in resume') {
    issues.push({
      severity: 'Important',
      badge: '🟠 Important',
      problem: 'No direct GitHub profile URL detected in the contact header.',
      whyItMatters: 'Technical interviewers for entry-level engineering roles evaluate code cleanliness, git commit habits, and README documentation on GitHub.',
      recommendedFix: 'Add a clean link to your GitHub profile (e.g., github.com/yourhandle) containing public repositories for your main projects.'
    });
  }

  if (contact.linkedin === 'Not found in resume') {
    issues.push({
      severity: 'Important',
      badge: '🟠 Important',
      problem: 'No LinkedIn profile URL found.',
      whyItMatters: 'Modern recruiters use LinkedIn to verify background details, college credentials, and candidate identity.',
      recommendedFix: 'Create and customize your public LinkedIn vanity URL (e.g., linkedin.com/in/yourname) and place it in the contact header.'
    });
  }

  if (wordCount < 250) {
    issues.push({
      severity: 'Important',
      badge: '🟠 Important',
      problem: `Resume length is unusually brief (${wordCount} words).`,
      whyItMatters: 'An overly brief resume leaves key engineering decisions, modules, and testing practices unexplained.',
      recommendedFix: 'Elaborate on your project architecture, specific responsibilities, database schema design, and algorithms implemented to reach the optimal 350–700 word range.'
    });
  }

  // 3. Improvement Issues (🟡)
  if (certifications.length === 0) {
    issues.push({
      severity: 'Improvement',
      badge: '🟡 Improvement',
      problem: `No industry credentials or certifications found for ${targetRole}.`,
      whyItMatters: 'Accredited certifications (such as Oracle Java SE, ServiceNow CSA, or AWS Cloud Practitioner) differentiate freshers during on-campus/off-campus placement pools.',
      recommendedFix: `Pursue a verified foundational credential relevant to ${targetRole} to validate your domain readiness.`
    });
  }

  if (education.cgpa === 'Not found in resume') {
    issues.push({
      severity: 'Improvement',
      badge: '🟡 Improvement',
      problem: 'CGPA or academic percentage is not clearly stated.',
      whyItMatters: 'Many Indian IT service and product campus hiring drives enforce an academic eligibility cutoff (e.g. 60% or 6.5+ CGPA).',
      recommendedFix: 'If your CGPA satisfies common cutoffs (e.g., 7.0+ / 10), state it clearly next to your degree and graduation year.'
    });
  }

  // 4. Good Practices Observed (🟢)
  if (skills.allSkillsFound.length >= 6) {
    issues.push({
      severity: 'Good',
      badge: '🟢 Good',
      problem: `Detected ${skills.allSkillsFound.length} technical skills formatted in identifiable terms.`,
      whyItMatters: 'Shows broad technical exposure suitable for fresh graduate engineering roles.',
      recommendedFix: 'Keep technical skills grouped into categorized sections (Languages, Frameworks, Databases, Tools) for maximum readability.'
    });
  }

  if (projects.length >= 2) {
    issues.push({
      severity: 'Good',
      badge: '🟢 Good',
      problem: `Found ${projects.length} distinct engineering projects highlighted.`,
      whyItMatters: 'Demonstrates sustained commitment to building functional software outside standard classroom lectures.',
      recommendedFix: 'Ensure each project has a corresponding live demo link or clean GitHub repository with setup instructions.'
    });
  }

  return issues;
}

/**
 * 8. Visual Scorecard Computation
 * Transparent scoring based on identifiable criteria.
 */
export function calculateScorecard(parsedData, targetRole = 'Java Developer') {
  const { contact, education, skills, projects, certifications, rawText } = parsedData;
  const benchmark = ROLE_BENCHMARKS[targetRole] || ROLE_BENCHMARKS['Java Developer'];
  const wordCount = rawText.split(/\s+/).filter(Boolean).length;
  const metricsCount = (rawText.match(/\b\d+(?:\.\d+)?%|\b\d+\s*(?:users|clients|records|queries|ms|sec|hours|lpa|k\+)\b/gi) || []).length;

  // Criteria-driven calculations
  // Structure (100 max)
  let structure = 50;
  if (contact.email !== 'Not found in resume' && contact.phone !== 'Not found in resume') structure += 15;
  if (education.degree !== 'Not found in resume') structure += 15;
  if (skills.allSkillsFound.length >= 4) structure += 10;
  if (projects.length >= 1) structure += 10;

  // Technical Skills (100 max)
  const matchedCore = benchmark.coreSkills.filter(s => skills.allSkillsFound.map(x => x.toLowerCase()).includes(s.toLowerCase())).length;
  const skillsScore = Math.min(98, Math.max(30, Math.round((matchedCore / benchmark.coreSkills.length) * 80 + (skills.allSkillsFound.length >= 8 ? 18 : 10))));

  // Projects (100 max)
  let projScore = 40;
  if (projects.length >= 1) projScore += 25;
  if (projects.length >= 2) projScore += 15;
  if (metricsCount >= 2) projScore += 20;

  // ATS Readiness (100 max)
  let atsScore = 45;
  if (contact.email !== 'Not found in resume') atsScore += 10;
  if (matchedCore >= 3) atsScore += 25;
  if (wordCount >= 250 && wordCount <= 850) atsScore += 15;
  if (skills.allSkillsFound.length >= 5) atsScore += 5;

  // Professional Writing (100 max)
  const actionVerbsCount = (rawText.toLowerCase().match(/\b(developed|engineered|implemented|designed|architected|built|optimized|automated|created|managed|integrated)\b/g) || []).length;
  const writingScore = Math.min(95, Math.max(45, 45 + (actionVerbsCount * 5) + (metricsCount * 5)));

  // Job Relevance (100 max)
  const relevanceScore = Math.min(95, Math.max(30, Math.round((matchedCore / benchmark.coreSkills.length) * 95)));

  const overall = Math.round(
    (structure * 0.15) +
    (skillsScore * 0.25) +
    (projScore * 0.25) +
    (atsScore * 0.15) +
    (writingScore * 0.10) +
    (relevanceScore * 0.10)
  );

  return {
    overallScore: Math.min(99, overall),
    categories: [
      {
        name: 'Resume Structure',
        score: Math.min(100, structure),
        explanation: 'Evaluates standard structural sections: Header, Education, Skills, and Projects.',
        improvementNeeded: structure < 85 ? 'Ensure clear section headings without complex multi-column tables.' : 'Well-structured layout.'
      },
      {
        name: 'Technical Skills Depth',
        score: skillsScore,
        explanation: `Measures match against ${targetRole} primary requirements (${matchedCore}/${benchmark.coreSkills.length} core skills present).`,
        improvementNeeded: matchedCore < benchmark.coreSkills.length ? `Add missing core skills: ${benchmark.coreSkills.filter(s => !skills.allSkillsFound.map(x => x.toLowerCase()).includes(s.toLowerCase())).join(', ')}.` : 'Strong core skill coverage.'
      },
      {
        name: 'Projects & Implementation',
        score: Math.min(100, projScore),
        explanation: `Evaluates depth, technical stack complexity, and evidence of full architecture.`,
        improvementNeeded: metricsCount < 2 ? 'Incorporate measurable impact (e.g. % performance increase, records processed).' : 'Demonstrates solid project execution.'
      },
      {
        name: 'ATS Filter Readiness',
        score: Math.min(100, atsScore),
        explanation: 'Evaluates text parsing readiness, keyword presence, and standard terminology.',
        improvementNeeded: atsScore < 80 ? 'Incorporate exact keyword terms from standard job descriptions.' : 'High parser compatibility.'
      },
      {
        name: 'Professional Writing & Metrics',
        score: writingScore,
        explanation: 'Analyzes usage of strong action verbs and quantitative proof.',
        improvementNeeded: actionVerbsCount < 4 ? 'Begin each project bullet with strong action verbs (Engineered, Architected, Automated).' : 'Action-oriented language.'
      },
      {
        name: `Relevance to ${targetRole}`,
        score: relevanceScore,
        explanation: `Calibrates candidate profile against industry entry-level ${targetRole} standards.`,
        improvementNeeded: relevanceScore < 80 ? `Align project features directly with ${targetRole} workflow requirements.` : 'Closely aligned with target role.'
      }
    ]
  };
}

/**
 * 9. Skill Gap Analysis Matrix
 */
export function calculateSkillGaps(allFoundSkills, targetRole = 'Java Developer') {
  const benchmark = ROLE_BENCHMARKS[targetRole] || ROLE_BENCHMARKS['Java Developer'];
  const foundLower = allFoundSkills.map(s => s.toLowerCase());

  const gapItems = [];

  // Core requirements
  benchmark.coreSkills.forEach(skill => {
    const isFound = foundLower.includes(skill.toLowerCase());
    gapItems.push({
      skill,
      category: 'Core Requirement',
      currentEvidence: isFound ? 'Documented in resume' : 'Not found in resume',
      roleRequirement: 'Mandatory screening criteria',
      gap: isFound ? 'Low / Aligned' : 'High / Immediate Priority',
      actionRecommendation: isFound
        ? 'Maintain active project practice and prepare deep concept explanations.'
        : `Start foundational study in ${skill}; build a dedicated mini-project before applying.`
    });
  });

  // Recommended requirements
  benchmark.recommendedSkills.forEach(skill => {
    const isFound = foundLower.includes(skill.toLowerCase());
    gapItems.push({
      skill,
      category: 'Recommended Enhancement',
      currentEvidence: isFound ? 'Documented in resume' : 'Not found in resume',
      roleRequirement: 'Distinguishing interview asset',
      gap: isFound ? 'Low / Aligned' : 'Medium / Recommended',
      actionRecommendation: isFound
        ? 'Highlight this skill in interview discussions to differentiate from peer freshers.'
        : `Review core principles of ${skill} to answer bonus interview questions.`
    });
  });

  return gapItems;
}

/**
 * Main Orchestrator: Analyzes raw text into full structured result
 */
export function analyzeResume(rawText, targetRole = 'Java Developer', sourceName = 'Uploaded_Resume.pdf') {
  const cleanText = rawText.trim();
  const contact = extractPersonalInfo(cleanText);
  const education = extractEducation(cleanText);
  const skills = extractCategorizedSkills(cleanText);
  const projects = extractAndAnalyzeProjects(cleanText, skills.allSkillsFound);
  const experience = extractExperience(cleanText);
  const certifications = extractCertifications(cleanText);

  const parsedData = {
    sourceName,
    rawText: cleanText,
    contact,
    education,
    skills,
    projects,
    experience,
    certifications
  };

  const issues = detectResumeIssues(parsedData, targetRole);
  const scorecard = calculateScorecard(parsedData, targetRole);
  const skillGaps = calculateSkillGaps(skills.allSkillsFound, targetRole);
  const benchmark = ROLE_BENCHMARKS[targetRole] || ROLE_BENCHMARKS['Java Developer'];

  return {
    id: 'res-' + Date.now(),
    fileName: sourceName,
    targetRole,
    analyzedAt: new Date().toISOString(),
    parsedData,
    scorecard,
    issues,
    skillGaps,
    roleBenchmark: benchmark
  };
}
