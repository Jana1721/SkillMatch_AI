/**
 * SkillMatch AI — Intelligent Resume-Aware Question Generation & Evaluation Engine
 * 
 * Supports:
 * 1. Google Gemini API (gemini-1.5-flash / gemini-2.0-flash) when GEMINI_API_KEY is configured
 * 2. OpenAI API (gpt-4o-mini) when OPENAI_API_KEY is configured
 * 3. Deep Resume-Grounded Dynamic Generator covering all 11 Master Categories:
 *    - Personal and General HR Questions
 *    - Company-Based HR Questions
 *    - Behavioral and Situational Questions
 *    - Fresher-Specific Questions
 *    - Unexpected and Critical-Thinking Questions
 *    - Resume and Introduction Questions
 *    - Dynamic Project Interview Questions (Highest Priority, 24 Reusable Patterns)
 *    - Teamwork and Individual Contribution
 *    - Technical Fundamentals (Java or candidate's verified stack)
 *    - Coding and Problem-Solving
 *    - Certifications, Internships, and Technical Topics
 *    - Scenario-Based Reasoning
 */

import crypto from 'crypto';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// 12 Master Categories as required by the Master Prompt
export const MASTER_CATEGORIES = [
  'Personal and General HR',
  'Company-Based HR',
  'Behavioral and Situational Questions',
  'Fresher-Specific Questions',
  'Unexpected and Critical-Thinking',
  'Resume and Introduction',
  'Project Understanding',
  'Technical Fundamentals',
  'Coding and Problem-Solving',
  'Teamwork and Contribution',
  'Certifications and Internships',
  'Scenario-Based Reasoning'
];

/**
 * Call Google Gemini REST API
 */
async function callGeminiApi(promptText, systemInstruction = '') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }]
      }
    ],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Gemini API returned status ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawContent) {
    throw new Error('Gemini API returned an empty or unparseable response.');
  }

  return JSON.parse(rawContent);
}

/**
 * Call OpenAI REST API
 */
async function callOpenAiApi(promptText, systemInstruction = '') {
  const url = 'https://api.openai.com/v1/chat/completions';

  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  messages.push({ role: 'user', content: promptText });

  const payload = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.4,
    response_format: { type: 'json_object' }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`OpenAI API returned status ${response.status}: ${errorBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('OpenAI API returned an empty response.');
  }

  return JSON.parse(rawContent);
}

/**
 * Build System Instructions for the AI Interviewer
 */
function buildSystemInstruction() {
  return `You are an expert AI Technical & HR Interviewer for SkillMatch AI.
Your objective is to conduct a realistic, high-signal, spoken job interview strictly grounded in the candidate's actual uploaded resume.

STRICT GROUNDING RULES:
1. ONLY ask about technical skills, programming languages, and tools explicitly mentioned in the candidate's resume.
2. When asking project questions, reference the candidate's ACTUAL project title, technologies, and implementation details listed in their resume. Never assume or invent details.
3. If project implementation stages or individual contribution are not explicitly described in the resume, ask open-ended clarification questions.
4. Probe concrete responsibilities, architectural decisions, technical trade-offs, bottlenecks, and measurable results.
5. NEVER assume qualifications, libraries, or experiences not listed in their resume.
6. Ask only ONE question at a time. Keep question text clear, conversational, and direct so it can be spoken aloud naturally.
7. Return all responses in valid JSON format matching the requested schema.`;
}

/**
 * Generate the Personalized Welcome Message
 * Greets candidate professionally, outlines process, evaluation criteria, and final marksheet.
 */
export function generateInterviewWelcomeMessage({ resumeContext, candidateName: directName = null }) {
  const rawResumeName = (resumeContext?.candidateName || '').replace(/^(name\s*:\s*)/i, '').trim();
  const rawDirectName = (directName || '').replace(/^(name\s*:\s*)/i, '').trim();
  const effectiveName = (rawDirectName && rawDirectName !== 'Candidate' && rawDirectName !== 'Not found in resume')
    ? rawDirectName
    : ((rawResumeName && rawResumeName !== 'Candidate' && rawResumeName !== 'Not found in resume')
      ? rawResumeName
      : null);

  if (effectiveName) {
    return `Hi, ${effectiveName}! Welcome to the AI Interview.`;
  }
  return `Hi! Welcome to the AI Interview.`;
}


/**
 * Helper: Array Shuffler (Fisher-Yates) for Session Randomization
 */
function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate Dynamic Resume-Grounded Questions across the 11 Master Categories
 */
function generateDynamicResumeQuestion({
  resumeContext,
  targetRole = 'Software Engineer',
  interviewType = 'Mixed Interview',
  difficulty = 'Intermediate',
  questionNumber = 1,
  totalQuestions = 5,
  askedTopics = []
}) {
  const candidateSkills = resumeContext.skills?.allSkillsFound || [];
  const candidateProjects = resumeContext.projects || [];
  const education = resumeContext.education?.[0] || {};
  const experience = resumeContext.experience || [];
  const certifications = resumeContext.certifications || [];
  const rawText = resumeContext.rawText || '';

  const rawDeg = (education.degree || '').trim();
  const degree = (rawDeg && !rawDeg.toLowerCase().includes('not found')) ? rawDeg : 'Computer Science / Engineering';
  const rawCol = (education.college || '').trim();
  const college = (rawCol && !rawCol.toLowerCase().includes('not found')) ? rawCol : 'your university';
  const skillsLower = candidateSkills.map(s => s.toLowerCase());

  // Determine target Category Slot based on interviewType and questionNumber
  let targetCategory = 'Technical Fundamentals';

  if (interviewType.includes('HR')) {
    const hrSlots = [
      'Personal and General HR',
      'Fresher-Specific Questions',
      'Behavioral and Situational Questions',
      'Teamwork and Contribution',
      'Company-Based HR'
    ];
    targetCategory = hrSlots[(questionNumber - 1) % hrSlots.length];
  } else if (interviewType.includes('Behavioral')) {
    const behSlots = [
      'Behavioral and Situational Questions',
      'Teamwork and Contribution',
      'Behavioral and Situational Questions',
      'Unexpected and Critical-Thinking',
      'Scenario-Based Reasoning'
    ];
    targetCategory = behSlots[(questionNumber - 1) % behSlots.length];
  } else if (interviewType.includes('Project')) {
    targetCategory = 'Project Understanding';
  } else if (interviewType.includes('Technical')) {
    const techSlots = [
      'Technical Fundamentals',
      'Project Understanding',
      'Coding and Problem-Solving',
      'Scenario-Based Reasoning',
      'Project Understanding'
    ];
    targetCategory = techSlots[(questionNumber - 1) % techSlots.length];
  } else {
    // Default: Mixed Interview (5 turns standard progression)
    // Turn 1: Resume & Introduction
    // Turn 2: Project Understanding (Highest Priority)
    // Turn 3: Technical Fundamentals
    // Turn 4: Teamwork & Behavioral
    // Turn 5: Scenario-Based Reasoning / Critical Thinking
    if (questionNumber === 1) {
      targetCategory = 'Resume and Introduction';
    } else if (questionNumber === 2) {
      targetCategory = 'Project Understanding';
    } else if (questionNumber === 3) {
      targetCategory = 'Technical Fundamentals';
    } else if (questionNumber === 4) {
      targetCategory = (experience.length > 0 || candidateProjects.length > 0)
        ? 'Teamwork and Contribution'
        : 'Behavioral and Situational Questions';
    } else if (questionNumber === totalQuestions) {
      targetCategory = 'Scenario-Based Reasoning';
    } else {
      if (questionNumber % 2 === 0) {
        targetCategory = 'Project Understanding';
      } else {
        targetCategory = 'Coding and Problem-Solving';
      }
    }
  }

  // Generate question options for targetCategory
  let questionOptions = [];

  // ============================================================================
  // CATEGORY F: RESUME AND INTRODUCTION
  // ============================================================================
  if (targetCategory === 'Resume and Introduction') {
    const flagshipProj = candidateProjects[0];
    const projName = flagshipProj?.name;

    questionOptions.push({
      category: 'Resume and Introduction',
      topic: 'Tell Me About Yourself',
      difficulty: 'Beginner',
      context: `Education: ${degree} at ${college}`,
      questionText: 'Tell me about yourself.',
      expectedConcepts: ['clear verbal structure', 'academic background', 'core technical stack', 'career motivation'],
      modelAnswer: `I am a ${degree} student at ${college} passionate about software engineering and ${targetRole} positions. My technical foundation spans ${(candidateSkills.slice(0, 3).join(', ')) || 'modern programming'}. I have built practical projects where I applied architectural principles and data structures to solve concrete problems.`,
      hint: 'Structure chronologically: academic path, key skills, and passion for this role.'
    });

    questionOptions.push({
      category: 'Resume and Introduction',
      topic: 'Resume Walkthrough & Achievements',
      difficulty: 'Beginner / Intermediate',
      context: `Education: ${degree} at ${college}`,
      questionText: 'Can you walk me through your resume and highlight your key technical achievements?',
      expectedConcepts: ['structured walkthrough', 'highlights from education and skills', 'concrete technical achievements'],
      modelAnswer: `Walking through my resume, my education provided a solid foundation in computer science at ${college}. Key achievements include mastering ${(candidateSkills.slice(0, 3).join(', ')) || 'software development tools'}, delivering functioning applications, and maintaining rigorous testing practices.`,
      hint: 'Walk through your education, key projects, and the technical milestones you are most proud of.'
    });

    questionOptions.push({
      category: 'Resume and Introduction',
      topic: 'Academic Preparation & Technical Foundation',
      difficulty: 'Beginner',
      context: `Education: ${degree} at ${college}`,
      questionText: `Can you explain your academic background in ${degree} at ${college} and how it prepared you for this role?`,
      expectedConcepts: ['academic curriculum', 'data structures and systems concepts', 'practical coursework', 'readiness for industry'],
      modelAnswer: `My coursework at ${college} provided rigorous training in algorithms, database design, and software engineering. Completing laboratory assignments and collaborative coursework gave me the practical mindset needed for ${targetRole} responsibilities.`,
      hint: 'Connect specific coursework (like DSA, DBMS, or OS) to the daily work of this role.'
    });

    questionOptions.push({
      category: 'Resume and Introduction',
      topic: 'Technical Focus & Core Skills',
      difficulty: 'Beginner / Intermediate',
      context: `Core Skills: ${(candidateSkills.slice(0, 3).join(', ')) || 'Software Engineering'}`,
      questionText: 'What motivated you to focus on the skills and tools listed in your resume?',
      expectedConcepts: ['motivation for technology choices', 'practical problem solving', 'learning journey', 'alignment with career path'],
      modelAnswer: `I focused on ${(candidateSkills.slice(0, 3).join(', ')) || 'software development'} because of their wide adoption, strong community support, and power in building scalable backend systems. Building applications with these tools deepened my passion for software engineering.`,
      hint: 'Explain what drew you to your primary programming languages and technologies.'
    });

    questionOptions.push({
      category: 'Resume and Introduction',
      topic: 'Degree & Specialization Choice',
      difficulty: 'Beginner',
      context: `Education: ${degree}`,
      questionText: 'Why did you choose your degree and specialization?',
      expectedConcepts: ['genuine passion for technology', 'early curiosity or problem solving', 'long-term career vision'],
      modelAnswer: `I chose ${degree} because I have always been fascinated by how software automates complex tasks and connects people globally. The opportunity to build software from first principles inspired my path.`,
      hint: 'Share what sparked your interest in computer science and technology.'
    });

    if (projName) {
      questionOptions.push({
        category: 'Resume and Introduction',
        topic: `${projName} Overview`,
        difficulty: 'Beginner / Intermediate',
        context: `Featured Project: "${projName}"`,
        questionText: `Can you provide an overview of your project "${projName}" and the primary problem it was designed to solve?`,
        expectedConcepts: ['problem statement', 'project overview', 'technologies used', 'end-to-end functionality'],
        modelAnswer: `In "${projName}", the core objective was solving key operational challenges through automated processing. I designed the architecture to handle user inputs, process logic reliably, and store persistent records.`,
        hint: 'Summarize the problem, the core solution, and the technologies you used.'
      });
    }
  }

  if (targetCategory === 'Project Understanding') {
    if (candidateProjects.length > 0) {
      // Pick the next unasked project or cycle
      const unaskedProjects = candidateProjects.filter(p => !askedTopics.some(t => t.includes(p.name)));
      const activeProject = unaskedProjects.length > 0 ? unaskedProjects[0] : candidateProjects[0];
      const pName = activeProject.name || 'your project';
      const techList = (activeProject.technologies && activeProject.technologies.length > 0)
        ? activeProject.technologies
        : candidateSkills.slice(0, 3);
      const techStr = techList.slice(0, 3).join(', ') || 'your technology stack';

      // 24 Dynamic Project Question Patterns from Master Prompt Section 2.G
      const projectPatterns = [
        // 1. Overview & Purpose
        {
          topic: `${pName} Overview`,
          questionText: `In your resume, you highlighted your project "${pName}". Can you give an overview of what this application does and what primary purpose it serves?`,
          expectedConcepts: ['project overview', 'purpose', 'core functionality', techList[0] || 'software architecture'],
          modelAnswer: `"${pName}" is an application designed to automate key workflows and process data efficiently using ${techStr}.`,
          hint: 'Summarize the primary purpose, who it helps, and how it functions at a high level.'
        },
        // 2. Problem Statement & Motivation
        {
          topic: `${pName} Problem Statement`,
          questionText: `What specific problem statement motivated you to develop "${pName}", and what existing limitations did you set out to solve?`,
          expectedConcepts: ['problem statement', 'motivation', 'existing limitations', 'user pain points'],
          modelAnswer: `The motivation behind "${pName}" was to eliminate manual errors and latency in the existing workflow by providing an automated, reliable software solution.`,
          hint: 'State the clear business or operational problem that existed before your project.'
        },
        // 3. Target Users & Use Cases
        {
          topic: `${pName} Target Users`,
          questionText: `Who are the primary target users for "${pName}", and can you describe a realistic scenario of how a user interacts with the system?`,
          expectedConcepts: ['target users', 'user persona', 'practical use cases', 'end-to-end journey'],
          modelAnswer: `Target users include team members or customers who need to perform data entry and generate reports. In a typical journey, the user authenticates, submits inputs, and receives immediate processed confirmation.`,
          hint: 'Walk through an end-to-end user scenario from login to final output.'
        },
        // 6 & 7. Tech Stack & Selection Rationale
        {
          topic: `${pName} Technology Selection`,
          questionText: `For "${pName}", you chose to work with ${techStr}. What was your rationale for selecting these specific technologies, and what trade-offs did you consider?`,
          expectedConcepts: [`${techStr} selection rationale`, 'performance trade-offs', 'developer productivity', 'scalability or ecosystem'],
          modelAnswer: `We selected ${techStr} due to strong library support, type safety, and robust tooling for database connectivity and REST endpoints.`,
          hint: 'Contrast your chosen tools with alternatives (e.g. why SQL vs NoSQL, or why your chosen framework).'
        },
        // 8 & 9. Workflow & Architecture
        {
          topic: `${pName} Architecture & Data Flow`,
          questionText: `Can you walk me through the end-to-end architecture and data flow in "${pName}"—from the initial user request to backend processing and persistence?`,
          expectedConcepts: ['presentation layer', 'business logic tier', 'persistence layer', 'data validation', 'request response cycle'],
          modelAnswer: `Incoming client requests are validated at controller endpoints, handed to domain service classes for business logic execution, and committed to the database within explicit transaction boundaries.`,
          hint: 'Explain the distinct tiers: UI/API layer -> Service/Logic layer -> Database storage.'
        },
        // 10. Development Stages (Mandatory Exact Clarification Pattern)
        {
          topic: `${pName} Development Stages`,
          questionText: `Can you walk me through the major stages you followed to develop "${pName}", from the initial idea to the final implementation?`,
          expectedConcepts: ['requirements gathering', 'system design & schema modeling', 'iterative coding', 'testing & bug fixing', 'deployment or demonstration'],
          modelAnswer: `I followed structured stages: first defining user stories and database schemas, implementing backend endpoints followed by frontend integration, conducting unit tests, and optimizing database queries.`,
          hint: 'Break your answer into: Requirements -> Architecture/Schema -> Coding -> Testing & Deployment.'
        },
        // 11. Individual Contribution (Mandatory Clarification Pattern)
        {
          topic: `${pName} Individual Contribution`,
          questionText: `In your project "${pName}", what parts did you personally design, implement, test, or support? What was your specific individual contribution?`,
          expectedConcepts: ['personal ownership', 'specific modules written', 'database design or api development', 'testing done personally'],
          modelAnswer: `I personally designed the relational schema, developed the core REST API endpoints using ${techList[0] || 'backend code'}, and wrote unit tests to validate edge-case inputs.`,
          hint: 'Be specific about what code and modules YOU personally authored versus third-party templates.'
        },
        // 14 & 15. Difficult Problem & Debugging
        {
          topic: `${pName} Bottlenecks & Debugging`,
          questionText: `What was the most difficult technical bottleneck or unexpected bug you encountered while building "${pName}", and what debugging methods did you use to resolve it?`,
          expectedConcepts: ['concrete bottleneck or bug', 'root cause analysis', 'logging or debugger tools', 'measurable resolution'],
          modelAnswer: `During development of "${pName}", we experienced high latency during concurrent database operations. By profiling queries with EXPLAIN and adding composite indexes on foreign keys, we reduced latency by over 40%.`,
          hint: 'Describe a real bug (e.g., state inconsistency, race condition, query slowdown) and how you isolated it.'
        },
        // 16. Testing & Validation
        {
          topic: `${pName} Testing & Validation`,
          questionText: `How did you test and validate that "${pName}" works reliably? What automated tests, manual test scenarios, or edge cases did you verify?`,
          expectedConcepts: ['unit testing', 'boundary input testing', 'integration testing', 'null/empty data validation'],
          modelAnswer: `I tested input validation for boundary values and malformed payloads, verified database transaction rollbacks upon error, and tested key REST endpoints using Postman and automated test assertions.`,
          hint: 'Mention testing edge cases like invalid credentials, duplicate entries, or network timeouts.'
        },
        // 17 & 18. Limitations & Future Scope
        {
          topic: `${pName} Limitations & Future Improvements`,
          questionText: `What are the current technical limitations of "${pName}", and if you had another month to work on it, what improvements or architectural enhancements would you prioritize?`,
          expectedConcepts: ['honest technical limitations', 'caching or indexing improvements', 'security or authentication additions', 'scaling plans'],
          modelAnswer: `Currently, the project lacks distributed caching and asynchronous background job queues. I would prioritize integrating Redis for read-heavy caching and setting up CI/CD pipelines.`,
          hint: 'Acknowledge an area for improvement (e.g. caching, microservice separation, mobile responsiveness).'
        },
        // 23. Scaling the Solution
        {
          topic: `${pName} Scalability & Concurrency`,
          questionText: `If user traffic or data volume for "${pName}" grew by a factor of 100x, where would the primary bottlenecks occur, and how would you redesign the system to scale?`,
          expectedConcepts: ['database connection pool & read replicas', 'distributed caching with redis', 'message queues like kafka/rabbitmq', 'stateless horizontal scaling'],
          modelAnswer: `Under 100x traffic, the database would become the bottleneck. I would introduce read replicas, implement Redis caching for frequent queries, and decouple heavy operations with asynchronous message queues.`,
          hint: 'Discuss horizontal scaling, caching, database indexing, and asynchronous messaging.'
        }
      ];

      projectPatterns.forEach(p => {
        questionOptions.push({
          category: 'Project Understanding',
          topic: p.topic,
          difficulty: difficulty,
          context: `Resume Project: "${pName}" (Technologies: ${techStr})`,
          questionText: p.questionText,
          expectedConcepts: p.expectedConcepts,
          modelAnswer: p.modelAnswer,
          hint: p.hint
        });
      });
    } else {
      // If candidate has NO formal projects listed in resume, ask about academic assignments without assuming formal project
      questionOptions.push({
        category: 'Project Understanding',
        topic: 'Academic Coursework & Technical Exercises',
        difficulty: 'Medium',
        context: `Academic Background: ${degree}`,
        questionText: `Can you walk me through a major practical coding assignment, lab project, or technical exercise you completed during your studies? What problem did it solve, and what technologies did you use?`,
        expectedConcepts: ['practical coding assignment', 'technologies used', 'problem solved', 'personal implementation'],
        modelAnswer: `In my academic coursework, I implemented a data management application where I designed data structures, handled input validation, and implemented search algorithms.`,
        hint: 'Describe a significant lab assignment or technical coursework problem you solved.'
      });
    }
  }

  // ============================================================================
  // CATEGORY I: TECHNICAL FUNDAMENTALS (JAVA OR CANDIDATE'S STACK)
  // ============================================================================
  if (targetCategory === 'Technical Fundamentals') {
    if (skillsLower.some(s => s.includes('java')) || targetRole.toLowerCase().includes('java')) {
      questionOptions.push({
        category: 'Technical Fundamentals',
        topic: 'Java Collections Framework',
        difficulty: 'Hard',
        context: 'Verified Skill: Java',
        questionText: `How does HashMap work internally in Java? What happens during a hash collision, and when does a bucket convert from a linked list into a red-black tree in Java 8+?`,
        expectedConcepts: ['hashcode and equals contract', 'bucket index (n-1)&hash', 'collision chaining', 'treeify threshold 8 to red-black tree', 'concurrenthashmap for thread safety'],
        modelAnswer: `HashMap uses an array of Node buckets indexed by (n-1)&hash. Collisions are chained in linked lists; when a bucket reaches 8 elements and capacity is >= 64, it converts to a Red-Black Tree, improving lookup from O(n) to O(log n).`,
        hint: 'Mention hashCode/equals, collision linked lists, and Java 8 treeify threshold of 8.'
      });

      questionOptions.push({
        category: 'Technical Fundamentals',
        topic: 'Java OOP Principles',
        difficulty: difficulty,
        context: 'Verified Skill: Java',
        questionText: `You have listed Java as a core technical skill on your resume. Can you explain the four core OOP principles in Java—specifically how runtime polymorphism differs from compile-time polymorphism?`,
        expectedConcepts: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'method overriding runtime', 'method overloading compile-time'],
        modelAnswer: `The four OOP principles are encapsulation (protecting data via private fields), inheritance (code reuse via extends), polymorphism (overloading compile-time vs overriding runtime with dynamic dispatch), and abstraction (hiding details via interfaces).`,
        hint: 'Explain encapsulation, inheritance, polymorphism, and abstraction, highlighting @Override.'
      });

      questionOptions.push({
        category: 'Technical Fundamentals',
        topic: 'Java Exception Handling & Memory',
        difficulty: 'Medium',
        context: 'Verified Skill: Java',
        questionText: `In Java, what is the architectural difference between Checked and Unchecked exceptions? In addition, how does memory allocation differ between the Stack and the Heap?`,
        expectedConcepts: ['checked exceptions compile-time subclass exception', 'unchecked exceptions runtime subclass runtimeexception', 'stack for primitive and frame pointers', 'heap for objects and garbage collection'],
        modelAnswer: `Checked exceptions must be declared or caught at compile time, whereas Unchecked exceptions occur at runtime. Primitive variables and method frames live on the Stack, while objects reside on the Heap managed by Garbage Collection.`,
        hint: 'Contrast compile-time Exception vs RuntimeException, and Stack call frames vs Heap objects.'
      });
    } else if (skillsLower.some(s => s.includes('python')) || targetRole.toLowerCase().includes('python') || targetRole.toLowerCase().includes('machine learning')) {
      questionOptions.push({
        category: 'Technical Fundamentals',
        topic: 'Python Memory & Data Structures',
        difficulty: difficulty,
        context: 'Verified Skill: Python',
        questionText: `In your resume, you listed Python. Can you explain how Python manages memory, the difference between mutable and immutable types, and how the Global Interpreter Lock (GIL) affects concurrency?`,
        expectedConcepts: ['mutable vs immutable types', 'reference counting and cyclic gc', 'gil restricts bytecodes to one thread', 'multiprocessing for cpu bound tasks'],
        modelAnswer: `Mutable objects (lists, dicts) can be modified in place, while immutable types (strings, tuples) create new allocations. Python uses reference counting and cyclic GC. The GIL prevents concurrent native thread execution, making multiprocessing necessary for CPU tasks.`,
        hint: 'Contrast lists vs tuples, explain reference counting GC, and describe how the GIL restricts threading.'
      });
    } else if (skillsLower.some(s => s.includes('react') || s.includes('javascript') || s.includes('typescript'))) {
      questionOptions.push({
        category: 'Technical Fundamentals',
        topic: 'JavaScript Event Loop & React Reconciliation',
        difficulty: difficulty,
        context: 'Verified Skill: JavaScript / React',
        questionText: `You have highlighted JavaScript and React on your resume. Can you walk me through the JavaScript Event Loop, Call Stack, and Microtask queue? In React, why is immutability essential during state updates?`,
        expectedConcepts: ['call stack single-threaded execution', 'microtask queue promises vs macrotask timer', 'immutability enabling shallow comparisons', 'virtual dom diffing reconciliation'],
        modelAnswer: `JavaScript runs on a single Call Stack; asynchronous Promises queue in the Microtask queue. In React, mutating state directly bypasses setter triggers, whereas immutable updates allow shallow comparison and Virtual DOM reconciliation.`,
        hint: 'Explain how Promises run before setTimeout in the Event Loop, and why React state must not be mutated in-place.'
      });
    } else if (skillsLower.some(s => s.includes('go') || s.includes('golang') || s.includes('kubernetes') || s.includes('grpc') || s.includes('envoy')) || targetRole.toLowerCase().includes('cloud') || targetRole.toLowerCase().includes('devops')) {
      const projRef = candidateProjects.find(p => /cloud|mesh|envoy|proxy|go|service/i.test(p.name))?.name || candidateProjects[0]?.name;
      const projMention = projRef ? ` such as in your "${projRef}" project` : '';
      questionOptions.push({
        category: 'Technical Fundamentals',
        topic: 'Go Concurrency & Cloud Native Systems',
        difficulty: difficulty,
        context: 'Verified Skill: Go / Cloud',
        questionText: `You have listed Go on your resume${projMention}. How does Go's concurrency model (goroutines and channels) differ from traditional OS threads, and how do you use channels and context cancellation to prevent memory leaks?`,
        expectedConcepts: ['goroutine lightweight stack vs os thread', 'channels communication over shared memory', 'context cancellation to prevent leaks', 'select statement and mutex synchronization'],
        modelAnswer: `Goroutines have a small initial stack (2KB) managed by the Go runtime rather than 1-2MB OS threads. Communication across goroutines happens through typed channels. Using context.WithCancel or context.WithTimeout ensures downstream goroutines terminate cleanly upon cancellation, preventing goroutine leaks.`,
        hint: 'Contrast lightweight 2KB goroutine stacks with OS threads, and explain context cancellation.'
      });
    } else if (skillsLower.some(s => s.includes('security') || s.includes('linux') || s.includes('kali') || s.includes('snort') || s.includes('wireshark')) || targetRole.toLowerCase().includes('security')) {
      const projRef = candidateProjects.find(p => /intrusion|honeypot|snort|security/i.test(p.name))?.name || candidateProjects[0]?.name;
      const projMention = projRef ? ` such as in your "${projRef}" project` : '';
      questionOptions.push({
        category: 'Technical Fundamentals',
        topic: 'Network Security & Threat Analysis',
        difficulty: difficulty,
        context: 'Verified Skill: Security / Linux',
        questionText: `You have listed Security tools and Linux on your resume${projMention}. How do you analyze packet captures in Wireshark or configure Snort IDS rules to detect malicious traffic, and what core steps do you follow to harden a Linux server against unauthorized access?`,
        expectedConcepts: ['packet inspection wireshark syn flood', 'snort ids signature detection rules', 'linux permissions iptables and ssh hardening', 'incident triage and siem correlation'],
        modelAnswer: `In Wireshark, I filter for anomalous SYN flags to identify denial of service attempts, and define custom Snort alert rules with signature patterns. On Linux, I disable root SSH login, enforce key-based auth, configure iptables or UFW firewalls, and audit logs with fail2ban and SIEM tooling.`,
        hint: 'Mention Wireshark packet inspection, Snort IDS rules, and Linux firewall/SSH hardening.'
      });
    } else if (candidateSkills.length > 0) {
      const skill = candidateSkills[0];
      const projRef = candidateProjects[0]?.name ? ` such as in your "${candidateProjects[0].name}" project` : '';
      questionOptions.push({
        category: 'Technical Fundamentals',
        topic: `${skill} Implementation & Concepts`,
        difficulty: difficulty,
        context: `Verified Skill: ${skill}`,
        questionText: `You have listed ${skill} on your resume${projRef}. How have you applied ${skill} in your hands-on project implementations? Specifically, what core data structures or design patterns did you leverage, and what trade-offs did you consider?`,
        expectedConcepts: [`${skill} practical application`, 'data structures or design patterns', 'performance trade-offs', 'debugging and validation'],
        modelAnswer: `I used ${skill} to implement core system components, selecting appropriate data structures for low latency and separating concerns into modular services.`,
        hint: `Detail specific libraries, patterns, and trade-offs when working with ${skill}.`
      });
    } else {
      questionOptions.push({
        category: 'Technical Fundamentals',
        topic: 'Data Structures & Algorithms Fundamentals',
        difficulty: difficulty,
        context: `Target Role: ${targetRole}`,
        questionText: `Can you explain the difference in time and space complexity between an Array and a Linked List for search, insertion, and deletion operations? When would you choose one over the other?`,
        expectedConcepts: ['array O(1) random access vs linkedlist O(n)', 'insertion at head O(1) in linkedlist', 'contiguous memory caching in arrays', 'dynamic resizing overhead'],
        modelAnswer: `Arrays provide O(1) random access due to contiguous memory, but O(n) insertion/deletion. Linked Lists provide O(1) insertions at known nodes, but require O(n) sequential traversal.`,
        hint: 'Compare O(1) indexing vs O(n) traversal, and contiguous cache locality.'
      });
    }
  }

  // ============================================================================
  // CATEGORY I: CODING AND PROBLEM-SOLVING
  // ============================================================================
  if (targetCategory === 'Coding and Problem-Solving') {
    questionOptions.push({
      category: 'Coding and Problem-Solving',
      topic: 'Array Duplicates & Frequency Counting',
      difficulty: 'Medium',
      context: 'Coding Fundamentals',
      questionText: `How would you approach finding all duplicate elements in an array? What are the time and space complexity trade-offs between using a Hash Set, sorting first, or marking in-place?`,
      expectedConcepts: ['hashset O(n) time and O(n) space', 'sorting O(n log n) time and O(1) space', 'in-place marking for 1 to n range', 'trade-offs'],
      modelAnswer: `Using a HashSet achieves O(n) time with O(n) auxiliary memory. Sorting first takes O(n log n) time with O(1) extra space. For arrays bounded between 1 and n, in-place index negation achieves O(n) time with O(1) space.`,
      hint: 'Contrast HashSet O(n) memory with sorting O(n log n) time and in-place tricks.'
    });

    questionOptions.push({
      category: 'Coding and Problem-Solving',
      topic: 'String Manipulation & Palindrome Verification',
      difficulty: 'Medium',
      context: 'Algorithmic Problem-Solving',
      questionText: `How would you verify whether a given string is a palindrome, ignoring non-alphanumeric characters and case sensitivity, using two pointers? What is the complexity?`,
      expectedConcepts: ['two pointers left and right', 'skipping non-alphanumeric chars', 'character lowercasing', 'O(n) time and O(1) space complexity'],
      modelAnswer: `Use two pointers starting at opposite ends. Advance inwards while skipping non-alphanumeric characters, compare lowercase characters, and return false on mismatch. This runs in O(n) time and O(1) space.`,
      hint: 'Explain the two-pointer technique converging from both ends in O(n) time.'
    });

    questionOptions.push({
      category: 'Coding and Problem-Solving',
      topic: 'Second Largest Element in Array',
      difficulty: 'Medium',
      context: 'Algorithmic Problem-Solving',
      questionText: `How would you find the second-largest element in an unsorted array in a single traversal pass O(n) without sorting? What edge cases would you handle?`,
      expectedConcepts: ['single pass tracking max and second max', 'updating second when new max found', 'handling duplicates of max', 'edge cases: array length < 2 or all identical'],
      modelAnswer: `Initialize largest and secondLargest to minimum values. Traverse each element: if greater than largest, update secondLargest = largest and largest = element; else if between secondLargest and largest, update secondLargest. Runs in O(n) time.`,
      hint: 'Maintain two variables in a single loop, updating both when a new maximum is found.'
    });
  }

  // ============================================================================
  // CATEGORY H: TEAMWORK AND INDIVIDUAL CONTRIBUTION
  // ============================================================================
  if (targetCategory === 'Teamwork and Contribution') {
    questionOptions.push({
      category: 'Teamwork and Contribution',
      topic: 'Division of Work in Team',
      difficulty: 'Medium',
      context: 'Team Collaboration',
      questionText: 'How did your team divide the work?',
      expectedConcepts: ['division of responsibilities', 'defining clear api or interface contracts', 'communication channels', 'accountability'],
      modelAnswer: `We broke the project down by functional tiers. I took ownership of the backend routes and database schemas, agreeing on contract specifications early to enable frontend teammates to develop in parallel.`,
      hint: 'Focus on agreeing on data contracts, dividing modules cleanly, and regular check-ins.'
    });

    questionOptions.push({
      category: 'Teamwork and Contribution',
      topic: 'Assigned Responsibilities',
      difficulty: 'Medium',
      context: 'Role Ownership',
      questionText: 'What responsibilities were assigned to you?',
      expectedConcepts: ['specific modules or tasks', 'personal accountability', 'interfaces built'],
      modelAnswer: `I was assigned the core business logic, database migrations, and REST endpoints. I also wrote automated unit tests to validate edge cases before merging code.`,
      hint: 'Detail the concrete technical deliverables you personally owned.'
    });

    questionOptions.push({
      category: 'Teamwork and Contribution',
      topic: 'Personally Implemented Components',
      difficulty: 'Medium',
      context: 'Hands-on Implementation',
      questionText: 'Which parts did you personally implement?',
      expectedConcepts: ['code authored directly', 'architecture design', 'debugging and testing'],
      modelAnswer: `I personally authored the authentication flow, data access layer with indexed queries, and integration test suites that verified end-to-end API payloads.`,
      hint: 'Specify the exact components, algorithms, or database tables you coded.'
    });

    questionOptions.push({
      category: 'Teamwork and Contribution',
      topic: 'Coordination With Team Members',
      difficulty: 'Medium',
      context: 'Team Communication',
      questionText: 'How did you coordinate with other team members?',
      expectedConcepts: ['daily standups or syncs', 'git branching strategy', 'code reviews and documentation'],
      modelAnswer: `We coordinated through daily standups, shared Postman collections for API documentation, and used GitHub feature branches with pull request reviews before merging into main.`,
      hint: 'Mention git workflows, API documentation, and communication channels.'
    });

    questionOptions.push({
      category: 'Teamwork and Contribution',
      topic: 'Resolving Technical Disagreements',
      difficulty: 'Medium',
      context: 'Conflict Resolution',
      questionText: 'How did you resolve technical disagreements?',
      expectedConcepts: ['objective evaluation of options', 'benchmarking or documentation review', 'respectful communication', 'aligning on project goals'],
      modelAnswer: `Rather than debating subjectively, we benchmarked prototypes, reviewed official documentation, and aligned on the architecture that best fulfilled performance and delivery constraints.`,
      hint: 'Use the STAR method: explain the options, data-backed benchmarking, and consensus.'
    });

    questionOptions.push({
      category: 'Teamwork and Contribution',
      topic: 'Teammate Delays or Incomplete Tasks',
      difficulty: 'Medium',
      context: 'Team Reliability',
      questionText: 'What would you do if a teammate could not complete an assigned task?',
      expectedConcepts: ['early communication of blockers', 'stepping in to pair program', 'scope adjustment', 'transparency'],
      modelAnswer: `I would identify what was blocking them, offer pair-programming support, and if necessary, work together to isolate the critical path to meet the deadline.`,
      hint: 'Emphasize constructive support, pair programming, and proactive communication.'
    });

    questionOptions.push({
      category: 'Teamwork and Contribution',
      topic: 'Communicating Progress and Blockers',
      difficulty: 'Medium',
      context: 'Transparency',
      questionText: 'How did you communicate progress and blockers?',
      expectedConcepts: ['early escalation of blockers', 'clear status updates', 'actionable proposals'],
      modelAnswer: `I provided brief daily status updates highlighting completed tasks, current focus, and any dependency blockers, proposing possible workarounds to avoid stalling progress.`,
      hint: 'Highlight proactive communication and raising blockers before they impact deadlines.'
    });

    questionOptions.push({
      category: 'Teamwork and Contribution',
      topic: 'Lessons From Collaboration',
      difficulty: 'Medium',
      context: 'Collaborative Growth',
      questionText: 'What did you learn from collaborating with others?',
      expectedConcepts: ['importance of documentation and contracts', 'valuing diverse perspectives', 'empathy in code reviews'],
      modelAnswer: `I learned that clear API contracts, comprehensive documentation, and empathetic code reviews are just as important as writing functional code for shipping reliable software on schedule.`,
      hint: 'Reflect on interface contracts, communication clarity, and teamwork.'
    });
  }

  // ============================================================================
  // CATEGORY C: BEHAVIORAL AND SITUATIONAL QUESTIONS
  // ============================================================================
  if (targetCategory === 'Behavioral and Situational Questions') {
    questionOptions.push({
      category: 'Behavioral and Situational Questions',
      topic: 'Handling Difficult Situations',
      difficulty: 'Medium',
      context: 'Resilience & Problem Solving',
      questionText: 'Describe a difficult situation and how you handled it.',
      expectedConcepts: ['STAR method', 'defining the challenge clearly', 'systematic actions taken', 'positive outcome and lesson learned'],
      modelAnswer: `When faced with a difficult milestone where third-party APIs failed intermittently, I analyzed failure logs, implemented a circuit breaker and retry policy with exponential backoff, and maintained continuous communication with the team until stability was restored.`,
      hint: 'Use the STAR format: Situation, Task, Action you took, and final Result.'
    });

    questionOptions.push({
      category: 'Behavioral and Situational Questions',
      topic: 'Learning From Mistakes',
      difficulty: 'Medium',
      context: 'Accountability & Growth',
      questionText: 'Tell me about a time you made a mistake and learned from it.',
      expectedConcepts: ['taking personal accountability', 'root cause diagnosis', 'preventative measures like automated tests'],
      modelAnswer: `In an earlier project, I pushed an unindexed database query that degraded performance under load. I owned the issue immediately, diagnosed the slow query using EXPLAIN, added the composite index, and added automated performance tests to prevent recurrence.`,
      hint: 'Highlight prompt ownership, root cause analysis, and preventative steps.'
    });

    questionOptions.push({
      category: 'Behavioral and Situational Questions',
      topic: 'Handling Disagreement With Teammate',
      difficulty: 'Medium',
      context: 'Interpersonal Conflict',
      questionText: 'How would you handle disagreement with a teammate?',
      expectedConcepts: ['respectful listening', 'focusing on objective criteria and data', 'finding common ground for the project outcome'],
      modelAnswer: `I listen actively to understand their perspective, separate subjective opinions from technical requirements, build small proof-of-concept tests to compare approaches objectively, and align on what is best for the project.`,
      hint: 'Emphasize data-driven evaluation, active listening, and team alignment.'
    });

    questionOptions.push({
      category: 'Behavioral and Situational Questions',
      topic: 'Managing Approaching Deadlines',
      difficulty: 'Medium',
      context: 'Deadline Management',
      questionText: 'What would you do if you could not complete a task before its deadline?',
      expectedConcepts: ['early notification', 'assessing minimum viable scope', 'proposing solutions rather than just reporting failure'],
      modelAnswer: `As soon as I detect that a task is at risk, I notify my lead, explain the blocker transparently, present the progress made so far, and propose delivering the essential critical path first followed by remaining items.`,
      hint: 'Emphasize early transparency, offering solutions, and prioritizing core deliverables.'
    });

    questionOptions.push({
      category: 'Behavioral and Situational Questions',
      topic: 'Prioritizing Multiple Responsibilities',
      difficulty: 'Medium',
      context: 'Time Management',
      questionText: 'How do you prioritize multiple responsibilities?',
      expectedConcepts: ['evaluating impact vs urgency', 'breaking large deliverables into milestones', 'protecting focus time'],
      modelAnswer: `I prioritize tasks based on their urgency and dependency on other teammates. I organize deliverables into manageable milestones, communicate expected timelines, and maintain focus on high-impact work.`,
      hint: 'Describe your prioritization matrix and staying organized under pressure.'
    });

    questionOptions.push({
      category: 'Behavioral and Situational Questions',
      topic: 'Responding to Negative Feedback',
      difficulty: 'Medium',
      context: 'Emotional Intelligence',
      questionText: 'How would you respond to negative feedback?',
      expectedConcepts: ['emotional maturity', 'separating emotion from constructive takeaways', 'taking proactive corrective steps'],
      modelAnswer: `I maintain an open, non-defensive mindset, thank the reviewer for their perspective, ask clarifying questions to pinpoint the root cause, and implement concrete changes to improve my deliverables.`,
      hint: 'Focus on maturity, receptive attitude, and turning feedback into tangible improvements.'
    });

    questionOptions.push({
      category: 'Behavioral and Situational Questions',
      topic: 'Demonstrating Leadership',
      difficulty: 'Medium',
      context: 'Leadership & Initiative',
      questionText: 'Describe a situation where you demonstrated leadership.',
      expectedConcepts: ['taking initiative without waiting for orders', 'supporting peers', 'driving delivery to completion'],
      modelAnswer: `During a university project where requirements shifted, I stepped forward to organize our architecture roadmap, set up our git repository structure, and helped teammates troubleshoot blockers so our team delivered on time.`,
      hint: 'Leadership is about initiative, unblocking others, and rallying the team around goals.'
    });

    questionOptions.push({
      category: 'Behavioral and Situational Questions',
      topic: 'Handling Unclear Requirements',
      difficulty: 'Medium',
      context: 'Requirement Analysis',
      questionText: 'How would you handle an unclear requirement?',
      expectedConcepts: ['proactive clarification', 'documenting assumptions', 'asking targeted questions before coding'],
      modelAnswer: `I break down the ambiguous areas, document possible interpretations and edge cases, and proactively schedule a brief sync with the stakeholder to validate expectations before writing code.`,
      hint: 'Show initiative in clarifying edge cases before jumping straight into code.'
    });
  }

  // ============================================================================
  // CATEGORY D: FRESHER-SPECIFIC QUESTIONS
  // ============================================================================
  if (targetCategory === 'Fresher-Specific Questions') {
    questionOptions.push({
      category: 'Fresher-Specific Questions',
      topic: 'Choosing Degree and Specialization',
      difficulty: 'Beginner',
      context: `Education: ${degree}`,
      questionText: 'Why did you choose your degree and specialization?',
      expectedConcepts: ['curiosity and passion for computing', 'fascination with software systems', 'career alignment'],
      modelAnswer: `I chose ${degree} because I have always been fascinated by algorithmic problem-solving and software systems. The opportunity to build applications from first principles inspired my academic path.`,
      hint: 'Share what inspired your choice of study and interest in software engineering.'
    });

    questionOptions.push({
      category: 'Fresher-Specific Questions',
      topic: 'Important Skills Developed During Studies',
      difficulty: 'Beginner / Intermediate',
      context: 'Academic Development',
      questionText: 'What important skills have you developed during your studies?',
      expectedConcepts: ['core CS fundamentals', 'hands-on programming languages', 'problem breakdown and debugging'],
      modelAnswer: `During my studies, I developed strong foundations in data structures, algorithms, and database management, along with practical skills in ${(candidateSkills.slice(0, 3).join(', ')) || 'modern programming languages'} and systematic debugging.`,
      hint: 'Highlight core technical skills, teamwork, and methodical debugging.'
    });

    questionOptions.push({
      category: 'Fresher-Specific Questions',
      topic: 'Academic Experience Preparing for Role',
      difficulty: 'Beginner / Intermediate',
      context: `Target Role: ${targetRole}`,
      questionText: 'Which academic experience prepared you for this role?',
      expectedConcepts: ['practical lab coursework', 'capstone project or assignments', 'collaborative coding exercises'],
      modelAnswer: `My practical laboratory projects and capstone software implementations prepared me best. They required designing normalized database schemas, building REST endpoints, and debugging under real constraints.`,
      hint: 'Reference specific labs, coursework projects, or technical presentations.'
    });

    questionOptions.push({
      category: 'Fresher-Specific Questions',
      topic: 'Tackling Unfamiliar Engineering Problems',
      difficulty: 'Medium',
      context: 'Problem Solving Methodology',
      questionText: 'How do you approach a problem you have never solved before?',
      expectedConcepts: ['understanding input/output and constraints', 'manual small example trace', 'brute force baseline', 'optimizing time/space complexity', 'verifying edge cases'],
      modelAnswer: `I first clarify inputs, outputs, and constraints. I trace through small examples manually, write a simple brute-force solution to verify the logic, and then optimize data structures to achieve optimal time complexity.`,
      hint: 'Walk through: Constraints -> Small test case -> Brute force -> Optimization -> Edge case verification.'
    });

    questionOptions.push({
      category: 'Fresher-Specific Questions',
      topic: 'Keeping Technical Knowledge Up to Date',
      difficulty: 'Beginner / Intermediate',
      context: 'Continuous Learning',
      questionText: 'How do you keep your technical knowledge up to date?',
      expectedConcepts: ['independent side projects', 'reading official documentation or engineering blogs', 'practicing coding platforms', 'building hands-on experiments'],
      modelAnswer: `I build small hands-on side projects to test new libraries, read engineering blogs from tech companies, and regularly solve problems on coding platforms to sharpen my algorithmic thinking.`,
      hint: 'Mention practical habits: reading documentation, building proof-of-concepts, and problem-solving.'
    });

    questionOptions.push({
      category: 'Fresher-Specific Questions',
      topic: 'Task Involving Unfamiliar Technology',
      difficulty: 'Intermediate',
      context: 'Agility & Learning',
      questionText: 'What would you do if you were assigned a task involving an unfamiliar technology?',
      expectedConcepts: ['reviewing documentation and codebase patterns', 'building small proof of concept', 'writing tests', 'seeking feedback'],
      modelAnswer: `I would read the official documentation and study existing codebase patterns, build a small standalone prototype to verify assumptions, and write tests to validate the implementation before submitting for review.`,
      hint: 'Outline reading docs, reviewing codebase patterns, building minimal prototypes, and testing.'
    });

    questionOptions.push({
      category: 'Fresher-Specific Questions',
      topic: 'Learning Outside Academic Curriculum',
      difficulty: 'Beginner / Intermediate',
      context: 'Self-Driven Learning',
      questionText: 'What have you learned outside your academic curriculum?',
      expectedConcepts: ['frameworks and developer tools', 'git and version control', 'cloud deployment or API design'],
      modelAnswer: `Outside of coursework, I learned practical developer tooling like Git workflows, Docker containerization, REST API design, and modern frontend frameworks by building end-to-end side projects.`,
      hint: 'Mention developer tools, modern frameworks, or deployment workflows not covered in lectures.'
    });

    questionOptions.push({
      category: 'Fresher-Specific Questions',
      topic: 'Demonstrating Abilities Without Full-Time Experience',
      difficulty: 'Beginner / Intermediate',
      context: 'Career Readiness',
      questionText: 'How would you demonstrate your abilities without full-time work experience?',
      expectedConcepts: ['portfolio of functioning projects', 'clean public github repositories', 'deep understanding of core cs fundamentals', 'ability to learn rapidly'],
      modelAnswer: `I demonstrate competence through clean, well-tested code in my public GitHub projects, thorough architectural documentation in READMEs, and a firm grasp of computer science fundamentals.`,
      hint: 'Focus on working code artifacts, git commits, documentation, and foundational principles.'
    });
  }

  // ============================================================================
  // CATEGORY A: PERSONAL AND GENERAL HR QUESTIONS
  // ============================================================================
  if (targetCategory === 'Personal and General HR') {
    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Tell Me About Yourself',
      difficulty: 'Beginner',
      context: 'Self-Introduction',
      questionText: 'Tell me about yourself.',
      expectedConcepts: ['education overview', 'technical skillset', 'hands-on projects', 'career ambition'],
      modelAnswer: `I am a ${degree} student at ${college} passionate about software engineering and ${targetRole} positions. My technical foundation spans ${(candidateSkills.slice(0, 3).join(', ')) || 'modern programming'}. I have built practical projects where I applied architectural principles and data structures to solve concrete problems.`,
      hint: 'Structure chronologically: academic path, key skills, and passion for this role.'
    });

    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Strengths and Areas for Improvement',
      difficulty: 'Beginner',
      context: 'Self-Awareness & Professionalism',
      questionText: 'What are your strengths and areas for improvement?',
      expectedConcepts: ['concrete strength with evidence', 'genuine area of improvement', 'actionable steps being taken to improve'],
      modelAnswer: `My core strength is disciplined debugging and root-cause analysis. An area I am improving is public technical presentation, which I practice by explaining my project architectures aloud.`,
      hint: 'Pair your strength with a real example, and show active steps you are taking on your growth area.'
    });

    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Personal Motivation',
      difficulty: 'Beginner',
      context: 'Drive & Passion',
      questionText: 'What motivates you?',
      expectedConcepts: ['problem-solving drive', 'delivering real-world value', 'continuous technical learning'],
      modelAnswer: `I am motivated by solving tangible, real-world problems through clean code, seeing users benefit from systems I build, and continuously expanding my technical capabilities.`,
      hint: 'Focus on what excites you about software engineering and building solutions.'
    });

    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Career Goals',
      difficulty: 'Beginner',
      context: 'Long-Term Vision',
      questionText: 'What are your career goals?',
      expectedConcepts: ['short-term ramp up and contribution', 'long-term system architecture and leadership'],
      modelAnswer: `In the short term, my goal is to contribute reliable code to production systems and learn team development best practices. In the long term, I aim to architect scalable distributed systems and mentor junior developers.`,
      hint: 'Balance short-term mastery with long-term architectural leadership.'
    });

    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Why Should We Hire You',
      difficulty: 'Beginner / Intermediate',
      context: 'Value Proposition',
      questionText: 'Why should we hire you?',
      expectedConcepts: ['matching skills to role requirements', 'proven hands-on problem solving', 'strong work ethic and quick learning'],
      modelAnswer: `You should hire me because of my strong technical foundation in ${(candidateSkills.slice(0, 3).join(', ')) || 'software development'}, hands-on experience building full-stack projects, and drive to ramp up quickly and write reliable code.`,
      hint: 'Connect your verified skills directly to the day-to-day needs of this engineering team.'
    });

    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Handling Pressure and Deadlines',
      difficulty: 'Beginner / Intermediate',
      context: 'Workplace Resilience',
      questionText: 'How do you handle pressure and deadlines?',
      expectedConcepts: ['calm analytical mindset', 'breaking down the blocker', 'clear communication with team', 'focusing on critical path'],
      modelAnswer: `I maintain composure by stepping back to systematically log and isolate the issue. I communicate progress to teammates and prioritize the essential functional path to meet delivery expectations.`,
      hint: 'Describe staying composed, isolating the issue, and communicating early.'
    });

    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Expectations From First Job',
      difficulty: 'Beginner',
      context: 'Workplace Alignment',
      questionText: 'What are your expectations from your first job?',
      expectedConcepts: ['opportunities for mentorship', 'working with production codebases', 'contributing to meaningful features'],
      modelAnswer: `I expect to work in a collaborative environment with experienced engineers where I can contribute to production features, receive constructive code reviews, and grow my architectural understanding.`,
      hint: 'Mention continuous learning, team mentorship, and contributing to high-impact software.'
    });

    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Where Do You See Yourself in Five Years',
      difficulty: 'Beginner',
      context: 'Professional Growth',
      questionText: 'Where do you see yourself in five years?',
      expectedConcepts: ['deep technical mastery', 'system design & architecture ownership', 'mentoring junior engineers', 'delivering business value'],
      modelAnswer: `In five years, I aim to be a senior engineer who designs scalable distributed systems, mentors junior developers, and contributes directly to high-impact technical initiatives.`,
      hint: 'Align your vision with mastering software design, system ownership, and mentoring.'
    });

    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Professional Values',
      difficulty: 'Beginner',
      context: 'Ethics & Integrity',
      questionText: 'What are your professional values?',
      expectedConcepts: ['accountability and code quality', 'transparent communication', 'empathy and team collaboration'],
      modelAnswer: `My core values are accountability, craftsmanship, and transparent communication. I believe in taking full ownership of my work, writing clean tested code, and collaborating respectfully with teammates.`,
      hint: 'Emphasize integrity, ownership, code craftsmanship, and team collaboration.'
    });

    questionOptions.push({
      category: 'Personal and General HR',
      topic: 'Responding to Constructive Feedback',
      difficulty: 'Beginner',
      context: 'Growth Mindset',
      questionText: 'How do you respond to constructive feedback?',
      expectedConcepts: ['active listening without defensiveness', 'reflecting on lessons learned', 'taking immediate corrective action'],
      modelAnswer: `I welcome constructive feedback as the fastest avenue to growth. I listen actively, clarify the actionable takeaways, and immediately integrate the suggestions into my work and testing procedures.`,
      hint: 'Demonstrate an open mindset, accountability, and proactive implementation of feedback.'
    });
  }

  // ============================================================================
  // CATEGORY B: COMPANY-BASED HR QUESTIONS
  // ============================================================================
  if (targetCategory === 'Company-Based HR') {
    questionOptions.push({
      category: 'Company-Based HR',
      topic: 'Why Join This Company',
      difficulty: 'Beginner',
      context: 'Company Alignment',
      questionText: 'Why do you want to join this company?',
      expectedConcepts: ['company mission and products', 'engineering culture', 'alignment with career values'],
      modelAnswer: `I want to join because of your focus on building high-impact software, commitment to engineering excellence, and culture that empowers engineers to take ownership of end-to-end features.`,
      hint: 'Highlight company innovation, engineering standards, and learning opportunities.'
    });

    questionOptions.push({
      category: 'Company-Based HR',
      topic: 'Company and Products Knowledge',
      difficulty: 'Beginner',
      context: 'Organizational Awareness',
      questionText: 'What do you know about the company and its products or services?',
      expectedConcepts: ['core business offerings', 'customer impact', 'technology focus'],
      modelAnswer: `I understand that the organization delivers scalable digital platforms that solve critical business workflows for users, backed by modern cloud architectures and high-availability standards.`,
      hint: 'Summarize the primary solutions and impact the organization delivers to its users.'
    });

    questionOptions.push({
      category: 'Company-Based HR',
      topic: 'Skills Alignment With Role',
      difficulty: 'Beginner / Intermediate',
      context: `Target Role: ${targetRole}`,
      questionText: 'How do your skills align with this role?',
      expectedConcepts: ['mapping skills to role duties', 'hands-on project evidence', 'willingness to learn'],
      modelAnswer: `My hands-on experience in ${(candidateSkills.slice(0, 3).join(', ')) || 'modern software engineering'} and practical project implementations directly align with the day-to-day requirements of a ${targetRole}.`,
      hint: 'Directly connect your skills and projects to what this role does day-to-day.'
    });

    questionOptions.push({
      category: 'Company-Based HR',
      topic: 'Value Contribution to Organization',
      difficulty: 'Beginner / Intermediate',
      context: 'Value Proposition',
      questionText: 'What value can you contribute to the organization?',
      expectedConcepts: ['reliable execution', 'problem solving', 'collaborative spirit', 'rapid onboarding'],
      modelAnswer: `I contribute disciplined engineering habits, clean tested code, proactive problem solving, and a collaborative attitude that helps team deliveries stay on schedule.`,
      hint: 'Focus on reliability, teamwork, writing maintainable code, and quick ramp-up.'
    });

    questionOptions.push({
      category: 'Company-Based HR',
      topic: 'Interest in Position',
      difficulty: 'Beginner',
      context: `Role: ${targetRole}`,
      questionText: 'Why are you interested in this position?',
      expectedConcepts: ['role responsibilities', 'technical growth', 'passion for the domain'],
      modelAnswer: `I am interested in this position because it offers the opportunity to tackle challenging software engineering problems, work with modern architectures, and collaborate with senior engineers to deliver high-quality systems.`,
      hint: 'Explain what excites you about the day-to-day responsibilities and technical challenges of this role.'
    });

    questionOptions.push({
      category: 'Company-Based HR',
      topic: 'Adapting to Work Environment',
      difficulty: 'Intermediate',
      context: 'Culture Adaptability',
      questionText: 'How would you adapt to the company’s work environment?',
      expectedConcepts: ['observing team norms', 'proactive communication', 'seeking feedback early'],
      modelAnswer: `I adapt by actively observing team processes and engineering conventions, asking targeted questions, building rapport with peers, and seeking early feedback on my pull requests.`,
      hint: 'Discuss learning team conventions, regular check-ins, and openness to feedback.'
    });

    questionOptions.push({
      category: 'Company-Based HR',
      topic: 'Handling Changed Responsibilities',
      difficulty: 'Intermediate',
      context: 'Flexibility & Ownership',
      questionText: 'What would you do if your assigned responsibilities changed?',
      expectedConcepts: ['flexibility and positive attitude', 'clarifying new priorities', 'rapid skill acquisition'],
      modelAnswer: `I would embrace the change positively, clarify the new priorities and deliverables with my lead, and map out the necessary technical steps to get up to speed quickly.`,
      hint: 'Demonstrate adaptability, clear communication with managers, and focus on team objectives.'
    });

    questionOptions.push({
      category: 'Company-Based HR',
      topic: 'Learning Unfamiliar Technology at Work',
      difficulty: 'Intermediate',
      context: 'Workplace Agility',
      questionText: 'How would you approach learning an unfamiliar technology at work?',
      expectedConcepts: ['reading documentation and repo patterns', 'building small proof of concept', 'asking senior peers', 'verifying with unit tests'],
      modelAnswer: `I study official documentation and existing repository patterns to understand conventions. I create a small proof-of-concept to test core APIs, and write thorough unit tests to guarantee correctness before integrating into production.`,
      hint: 'Outline reading docs, reviewing codebase patterns, building minimal prototypes, and testing.'
    });
  }

  // ============================================================================
  // CATEGORY J: CERTIFICATIONS AND INTERNSHIPS
  // ============================================================================
  if (targetCategory === 'Certifications and Internships') {
    if (certifications.length > 0) {
      const cert = certifications[0];
      questionOptions.push({
        category: 'Certifications and Internships',
        topic: `${cert.name} Certification`,
        difficulty: 'Medium',
        context: `Verified Resume Certification: ${cert.name}`,
        questionText: `In your resume, you listed your certification in "${cert.name}". What core competencies did this certification validate, and how have you applied that knowledge in your practical coding?`,
        expectedConcepts: ['certification curriculum', 'validated technical concepts', 'practical application in projects'],
        modelAnswer: `The certification validated my understanding of core principles, security best practices, and architecture standards, which I directly applied when structuring my project workflows.`,
        hint: 'Discuss the key skills validated by the credential and how you applied them.'
      });
    } else if (experience.length > 0) {
      const exp = experience[0];
      questionOptions.push({
        category: 'Certifications and Internships',
        topic: `${exp.company || 'Internship'} Experience`,
        difficulty: 'Medium',
        context: `Work Experience: ${exp.role} at ${exp.company}`,
        questionText: `You noted your experience at "${exp.company}" as "${exp.role}". What were your primary technical responsibilities, what tools did you use, and what major lesson did you take away?`,
        expectedConcepts: ['responsibilities owned', 'tools and tech used', 'technical challenge overcome', 'professional learning outcome'],
        modelAnswer: `During my time at ${exp.company}, I contributed to feature implementation and bug fixes using ${skillsList(0, 2)}. I learned the importance of automated testing and code reviews in team development.`,
        hint: 'Highlight your specific responsibilities, tools used, and key learning.'
      });
    } else {
      // Fallback to practical self-directed technical topics
      questionOptions.push({
        category: 'Certifications and Internships',
        topic: 'Self-Directed Technical Specialization',
        difficulty: 'Medium',
        context: 'Independent Learning',
        questionText: `You have developed skills in ${(candidateSkills.slice(0, 3).join(', ')) || 'software development'}. What motivated you to focus on these specific technologies, and how do you validate your mastery without formal corporate certifications?`,
        expectedConcepts: ['motivation for choosing tech stack', 'hands-on project validation', 'continuous skill assessment'],
        modelAnswer: `I chose these technologies due to their high industry demand and robust architectures. I validate my skills by building end-to-end working applications with comprehensive test coverage.`,
        hint: 'Explain why you chose this stack and how your projects validate your competence.'
      });
    }
  }

  // ============================================================================
  // CATEGORY E: UNEXPECTED AND CRITICAL-THINKING QUESTIONS
  // ============================================================================
  if (targetCategory === 'Unexpected and Critical-Thinking') {
    questionOptions.push({
      category: 'Unexpected and Critical-Thinking',
      topic: 'Initial Solution Failure',
      difficulty: 'Medium',
      context: 'Critical Thinking & Adaptability',
      questionText: 'What would you do if your initial solution failed?',
      expectedConcepts: ['not panicking', 'analyzing failure telemetry and inputs', 'revisiting assumptions', 'pivoting systematically'],
      modelAnswer: `If my initial solution failed, I would analyze the error logs and edge cases where it broke, question the underlying assumptions, and explore alternative algorithms or design patterns rather than patching fragile fixes.`,
      hint: 'Explain staying calm, analyzing error metrics, and re-evaluating core assumptions.'
    });

    questionOptions.push({
      category: 'Unexpected and Critical-Thinking',
      topic: 'Explaining Complex Concept to Nontechnical Stakeholder',
      difficulty: 'Medium',
      context: 'Communication & Empathy',
      questionText: 'How would you explain a complex technical concept to a nontechnical person?',
      expectedConcepts: ['using real-world analogies', 'avoiding obscure jargon', 'focusing on business value and outcomes'],
      modelAnswer: `I strip away implementation jargon, use familiar real-world analogies (like a postal delivery system for message queues), and focus on the user impact and business value rather than low-level syntax.`,
      hint: 'Use relatable analogies and emphasize outcomes instead of acronyms.'
    });

    questionOptions.push({
      category: 'Unexpected and Critical-Thinking',
      topic: 'Problem Solving With Limited Time & Resources',
      difficulty: 'Medium',
      context: 'Resourcefulness',
      questionText: 'If you had limited time and resources, how would you solve a problem?',
      expectedConcepts: ['identifying critical 80/20 path', 'reusing existing libraries and tools', 'iterative delivery'],
      modelAnswer: `I focus on the 80/20 rule: deliver the core functional path that resolves the primary user need, leverage robust existing libraries instead of reinventing the wheel, and plan optimizations for future sprints.`,
      hint: 'Discuss the 80/20 rule, leveraging battle-tested tools, and shipping iterative increments.'
    });

    questionOptions.push({
      category: 'Unexpected and Critical-Thinking',
      topic: 'Serious Bug Shortly Before Deadline',
      difficulty: 'Hard',
      context: 'Crisis Management',
      questionText: 'What would you do if you discovered a serious issue shortly before a project deadline?',
      expectedConcepts: ['triage severity', 'communicate immediately with stakeholders', 'evaluate rollback or hotfix risk'],
      modelAnswer: `I would immediately assess the severity. If it causes data loss or security risk, I alert the lead to pause release, implement a targeted hotfix or fallback toggle, and avoid rushed uncontrolled changes to production.`,
      hint: 'Triage impact, communicate immediately, and prioritize system stability over hasty releases.'
    });

    questionOptions.push({
      category: 'Unexpected and Critical-Thinking',
      topic: 'Handling Unknown Interview Question',
      difficulty: 'Beginner / Intermediate',
      context: 'Intellectual Honesty',
      questionText: 'How would you respond if you did not know the answer to an interview question?',
      expectedConcepts: ['admitting lack of knowledge honestly', 'sharing related fundamentals', 'explaining how to find answer'],
      modelAnswer: `I would state honestly that I do not know the exact answer, explain what I do know about related concepts, and share how I would systematically research the official documentation or test it in code to find the solution.`,
      hint: 'Acknowledge gaps honestly, share logical deductions, and explain research steps.'
    });

    questionOptions.push({
      category: 'Unexpected and Critical-Thinking',
      topic: 'Improving a Regularly Used System',
      difficulty: 'Medium',
      context: 'Systems Critique',
      questionText: 'What would you improve about a system you use regularly?',
      expectedConcepts: ['concrete friction point identified', 'proposed architectural or UX improvement', 'measuring success'],
      modelAnswer: `In university registration portals, latency surges during course enrollment due to synchronous DB locks. I would introduce an asynchronous queue (like Redis or RabbitMQ) to buffer enrollments and prevent server crashes.`,
      hint: 'Pick a tool you use daily, describe the bottleneck, and outline an architectural fix.'
    });

    questionOptions.push({
      category: 'Unexpected and Critical-Thinking',
      topic: 'Verifying Proposed Solution Works',
      difficulty: 'Medium',
      context: 'Verification & Quality',
      questionText: 'How would you verify that your proposed solution actually works?',
      expectedConcepts: ['unit and integration testing', 'load benchmarking', 'edge-case boundary inputs', 'user validation'],
      modelAnswer: `I verify through automated unit tests for edge cases, integration tests with realistic payloads, benchmarking latency under simulated concurrent requests, and observing telemetry metrics in staging.`,
      hint: 'Mention automated tests, edge case matrices, load testing, and staging telemetry.'
    });
  }

  // ============================================================================
  // CATEGORY K: SCENARIO-BASED REASONING
  // ============================================================================
  if (targetCategory === 'Scenario-Based Reasoning') {
    questionOptions.push({
      category: 'Scenario-Based Reasoning',
      topic: 'Investigating Sudden Feature Outage in Production',
      difficulty: 'Hard',
      context: 'Production Reliability & Troubleshooting',
      questionText: 'How would you troubleshoot a feature that suddenly stops working in production?',
      expectedConcepts: ['reproducing issue in staging with identical input', 'inspecting audit and database logs', 'validating recent data or config changes', 'binary search or debugger tracing', 'writing regression test'],
      modelAnswer: `I check real-time application logs and metrics, verify recent deployments or config changes, reproduce the issue in staging using the failing payload, implement a hotfix, and add regression tests.`,
      hint: 'Walk through: Reproducing -> Log analysis -> Tracing data transforms -> Regression testing.'
    });

    questionOptions.push({
      category: 'Scenario-Based Reasoning',
      topic: 'Investigating Incorrect Output or Calculations',
      difficulty: 'Medium',
      context: 'Data Integrity',
      questionText: 'How would you investigate incorrect calculation or output in an application?',
      expectedConcepts: ['validating input data types and sanitization', 'tracing intermediate calculation steps', 'verifying mathematical logic against unit tests'],
      modelAnswer: `I isolate the calculation function with unit tests, step through intermediate state with a debugger, check for floating-point inaccuracies or integer overflow, and verify input sanitization.`,
      hint: 'Isolate the logic with unit tests and trace variable transformations step-by-step.'
    });

    questionOptions.push({
      category: 'Scenario-Based Reasoning',
      topic: 'Diagnosing Latency and High Load Slowdown',
      difficulty: 'Hard',
      context: 'Performance Engineering',
      questionText: 'What would you do if the application became slow under moderate load?',
      expectedConcepts: ['monitoring cpu and memory metrics', 'database slow query logs & connection pool status', 'profiling thread and heap dumps', 'isolating network vs application latency'],
      modelAnswer: `I inspect system telemetry metrics: CPU, memory utilization, and database connection pool saturation. I review slow query logs to identify unindexed lookups, and examine heap dumps if garbage collection pauses indicate a memory leak.`,
      hint: 'Mention checking CPU/RAM, DB connection pools, slow query logs, and GC thread dumps.'
    });

    questionOptions.push({
      category: 'Scenario-Based Reasoning',
      topic: 'Validating Changes Before Deployment',
      difficulty: 'Medium',
      context: 'Release Engineering',
      questionText: 'How would you validate a change before deployment to production?',
      expectedConcepts: ['running automated test suites', 'verifying backward-compatible database migrations', 'smoke testing in staging environment', 'having an automated rollback strategy'],
      modelAnswer: `I ensure all automated unit and integration tests pass, verify that database schema migrations are backwards-compatible with active code, perform smoke tests in staging, and maintain an immediate rollback plan.`,
      hint: 'Mention automated tests, backwards-compatible DB migrations, staging verification, and rollback plans.'
    });

    questionOptions.push({
      category: 'Scenario-Based Reasoning',
      topic: 'Handling Incomplete or Invalid Input',
      difficulty: 'Medium',
      context: 'Defensive Programming',
      questionText: 'How would you handle incomplete or invalid input from users or external APIs?',
      expectedConcepts: ['defensive validation at boundaries', 'returning semantic 400 Bad Request responses', 'logging malformed payloads without crashing'],
      modelAnswer: `I validate inputs at controller boundaries using schema validators, return clear semantic 400 Bad Request error responses with specific field guidance, and use default fallbacks for non-critical optional parameters.`,
      hint: 'Discuss boundary validation, semantic HTTP 400 responses, and preventing crashes.'
    });

    questionOptions.push({
      category: 'Scenario-Based Reasoning',
      topic: 'Component Failure and High Availability',
      difficulty: 'Hard',
      context: 'System Fault Tolerance',
      questionText: 'How would you respond to a failure in an important component of your system?',
      expectedConcepts: ['circuit breaker pattern', 'graceful degradation of service', 'automated failover and health checks'],
      modelAnswer: `I implement circuit breakers and graceful degradation so secondary features fail gracefully without taking down the core application, backed by health checks and automated container restarts.`,
      hint: 'Mention circuit breakers, graceful degradation, and health check restarts.'
    });
  }

  if (questionOptions.length === 0) {
    questionOptions.push({
      category: targetCategory || 'Technical Fundamentals',
      topic: `${targetRole} Foundations`,
      difficulty: difficulty,
      context: `Target Role: ${targetRole}`,
      questionText: `As a candidate for ${targetRole}, can you explain the core architectural principles you rely on when designing and implementing software components?`,
      expectedConcepts: ['modular design', 'error handling', 'data validation', 'scalability'],
      modelAnswer: `I focus on modular component separation, rigorous input validation, explicit error boundaries, and scalable data access patterns.`,
      hint: 'Discuss component boundaries, validation, and design trade-offs.'
    });
  }

  // Shuffle eligible question options to ensure variety across sessions for all questions including Question 1
  const shuffledOptions = shuffleArray(questionOptions);
  const chosen = shuffledOptions.find(q => !askedTopics.includes(q.topic) && !askedTopics.includes(q.questionText)) || shuffledOptions[0];


  return {
    id: `q-${questionNumber}-${Date.now().toString().slice(-4)}`,
    category: chosen.category,
    topic: chosen.topic,
    difficulty: chosen.difficulty || difficulty,
    context: chosen.context || `Grounded in candidate background`,
    questionText: chosen.questionText,
    expectedConcepts: chosen.expectedConcepts || ['technical clarity', 'practical reasoning'],
    modelAnswer: chosen.modelAnswer || 'Provide a structured, step-by-step breakdown supported by your experience.',
    hint: chosen.hint || 'Focus on explaining the underlying mechanics and practical trade-offs.'
  };
}

/**
 * Generate Next Question via AI Provider (or fallback dynamic generator)
 */
export async function generatePersonalizedInterviewQuestion({
  candidateId,
  resumeContext,
  targetRole = 'Software Engineer',
  interviewType = 'Mixed Interview',
  experienceLevel = 'Fresher',
  difficulty = 'Intermediate',
  questionNumber = 1,
  totalQuestions = 5,
  askedQuestions = [],
  previousTurns = []
}) {
  const reqId = `qgen-${crypto.randomUUID().slice(0, 8)}`;
  console.log(`[Diagnostic] [AI Question Request Started] reqId=${reqId} candidateId=${candidateId} resumeId=${resumeContext.resumeId} qIndex=${questionNumber}/${totalQuestions}`);

  const askedTopics = askedQuestions.map(q => q.topic || q.questionText);

  // Check if an external LLM provider is available
  if (GEMINI_API_KEY || OPENAI_API_KEY) {
    try {
      const systemInstruction = buildSystemInstruction();
      const prompt = `Generate Question ${questionNumber} of ${totalQuestions} for an AI mock interview.

CANDIDATE RESUME CONTEXT:
Candidate Name: ${resumeContext.candidateName}
Education: ${JSON.stringify(resumeContext.education)}
Verified Skills: ${(resumeContext.skills?.allSkillsFound || []).join(', ')}
Candidate Projects: ${JSON.stringify((resumeContext.projects || []).map(p => ({ name: p.name, technologies: p.technologies, problemSolved: p.problemSolved, architecture: p.architecture })))}
Experience: ${JSON.stringify(resumeContext.experience || [])}
Certifications: ${JSON.stringify(resumeContext.certifications || [])}
Target Role: ${targetRole}
Interview Type: ${interviewType}
Experience Level: ${experienceLevel}
Difficulty: ${difficulty}

PREVIOUSLY ASKED TOPICS IN THIS SESSION (DO NOT REPEAT TOPICS):
${JSON.stringify(askedQuestions.map(q => ({ category: q.category, topic: q.topic, questionText: q.questionText })))}

PREVIOUS ANSWERS (IF ANY):
${JSON.stringify(previousTurns.map(t => ({ question: t.questionText, answer: t.userAnswer, score: t.score })))}

OUTPUT FORMAT: Return a valid JSON object matching this schema:
{
  "id": "q-${questionNumber}-${Date.now().toString().slice(-4)}",
  "category": "One of: Personal and General HR | Company-Based HR | Behavioral and Situational Questions | Fresher-Specific Questions | Resume and Introduction | Project Understanding | Technical Fundamentals | Coding and Problem-Solving | Teamwork and Contribution | Certifications and Internships | Scenario-Based Reasoning",
  "topic": "Specific topic (e.g. Project Name Architecture or Verified Skill Name)",
  "difficulty": "${difficulty}",
  "context": "Short reference to candidate resume item",
  "questionText": "The exact question to speak aloud to the candidate (ONE question only, grounded in their resume)",
  "expectedConcepts": ["Key concept 1", "Key concept 2", "Key concept 3"],
  "modelAnswer": "Brief 2-3 sentence reference answer",
  "hint": "Helpful conceptual hint if candidate gets stuck"
}`;

      let aiResult = null;
      if (GEMINI_API_KEY) {
        aiResult = await callGeminiApi(prompt, systemInstruction);
      } else {
        aiResult = await callOpenAiApi(prompt, systemInstruction);
      }

      if (aiResult && aiResult.questionText && aiResult.topic) {
        console.log(`[Diagnostic] [AI Question Request Succeeded via LLM] reqId=${reqId} topic=${aiResult.topic}`);
        return {
          id: aiResult.id || `q-${questionNumber}-${Date.now().toString().slice(-4)}`,
          category: aiResult.category || 'Technical Fundamentals',
          topic: aiResult.topic,
          difficulty: aiResult.difficulty || difficulty,
          context: aiResult.context || `Grounded in candidate resume`,
          questionText: aiResult.questionText,
          expectedConcepts: Array.isArray(aiResult.expectedConcepts) ? aiResult.expectedConcepts : ['technical understanding', 'clarity'],
          modelAnswer: aiResult.modelAnswer || 'Provide a structured, step-by-step explanation.',
          hint: aiResult.hint || 'Think about the core architecture and practical trade-offs.'
        };
      }
    } catch (err) {
      console.warn(`[Diagnostic] [External AI API Error] reqId=${reqId} error=${err.message}. Transitioning to dynamic resume semantic engine.`);
    }
  }

  // Fallback to high-precision dynamic resume question generator covering the 11 Master Categories
  const generatedQuestion = generateDynamicResumeQuestion({
    resumeContext,
    targetRole,
    interviewType,
    difficulty,
    questionNumber,
    totalQuestions,
    askedTopics
  });

  console.log(`[Diagnostic] [AI Question Request Succeeded via Resume Engine] reqId=${reqId} topic=${generatedQuestion.topic}`);
  return generatedQuestion;
}

/**
 * Evaluate Candidate Spoken Answer against 10-Mark Rubric and Classify Relevance & Correctness.
 * Supports Single Retry Policy for Irrelevant/Off-Topic answers before advancing.
 */
export async function evaluateCandidateAnswerAndProgress({
  sessionState,
  resumeContext,
  userAnswer,
  timeTakenSeconds = 30
}) {
  const currentQIndex = sessionState.currentQuestionIndex;
  const currentQuestion = sessionState.agenda[currentQIndex];
  const turnNumber = currentQIndex + 1;

  sessionState.currentQuestionAttempts = sessionState.currentQuestionAttempts || [];
  const attemptNumber = sessionState.currentQuestionAttempts.length + 1;

  console.log(`[Diagnostic] [AI Candidate Spoken Answer Received] sessionId=${sessionState.sessionId} qIndex=${turnNumber} attempt=${attemptNumber} answerLength=${userAnswer?.length || 0} timeTaken=${timeTakenSeconds}s`);

  const trimmedAnswer = (userAnswer || '').trim();
  const lowerAnswer = trimmedAnswer.toLowerCase();
  const words = trimmedAnswer.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const stopWords = new Set([
    'and', 'the', 'for', 'with', 'from', 'that', 'this', 'into', 'using', 'have', 'been', 'your',
    'such', 'also', 'some', 'when', 'what', 'which', 'where', 'how', 'each', 'more', 'over', 'than',
    'will', 'can', 'may', 'should', 'would', 'could', 'about', 'like'
  ]);

  const answerWords = new Set(
    lowerAnswer
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
  );

  const expected = currentQuestion.expectedConcepts || [];
  const matchedConcepts = [];

  expected.forEach(concept => {
    const terms = concept
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !stopWords.has(t));
    if (terms.length > 0 && terms.some(t => answerWords.has(t) || lowerAnswer.includes(t))) {
      matchedConcepts.push(concept);
    }
  });

  const questionClean = (currentQuestion.questionText || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const topicClean = (currentQuestion.topic || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  const questionKeywords = questionClean
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w) && !['project', 'resume', 'explain', 'detail', 'highlighted', 'built', 'specifically'].includes(w));

  const topicKeywords = topicClean
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w) && !['concepts', 'implementation', 'architecture'].includes(w));

  const expectedTerms = expected
    .flatMap(c => c.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/))
    .filter(w => w.length > 2 && !stopWords.has(w));

  const domainKeywords = Array.from(new Set([...questionKeywords, ...topicKeywords, ...expectedTerms]));
  const matchedDomainKeywords = domainKeywords.filter(kw => answerWords.has(kw));

  const generalTechnicalTerms = [
    'code', 'program', 'programming', 'software', 'engineering', 'database', 'sql', 'mysql', 'postgres',
    'mongodb', 'api', 'rest', 'http', 'server', 'client', 'frontend', 'backend', 'controller', 'service',
    'repository', 'function', 'class', 'method', 'object', 'variable', 'array', 'list', 'loop', 'data',
    'structure', 'framework', 'spring', 'boot', 'react', 'node', 'express', 'python', 'java', 'javascript',
    'typescript', 'docker', 'git', 'commit', 'branch', 'test', 'deploy', 'cloud', 'aws', 'redis', 'cache',
    'model', 'view', 'endpoint', 'request', 'response', 'query', 'table', 'schema', 'component', 'state',
    'concurrency', 'thread', 'lock', 'mutex', 'asynchronous', 'async', 'promise', 'records', 'save', 'saving',
    'pipeline', 'dataset', 'metrics', 'accuracy', 'precision', 'model', 'training', 'validation'
  ];
  const matchedGeneralTech = generalTechnicalTerms.filter(t => answerWords.has(t));
  const candidateSkills = (resumeContext?.skills?.allSkillsFound || []).map(s => s.toLowerCase());
  const candidateProjects = (resumeContext?.projects || []).map(p => (p.name || '').toLowerCase());
  const matchedSkillsOrProjects = [...candidateSkills, ...candidateProjects].filter(s => s.length > 2 && answerWords.has(s));

  // Off-topic indicators
  const isDegreePercentageDistraction =
    /degree with a good percentage|my cgpa is|my percentage in|marks in 10th|marks in 12th|passed with distinction|good percentage|\d+\s*percentage|\d+%/i.test(lowerAnswer);
  const isGeneralChatter =
    /^(hello|hi|hey|good morning|good afternoon|how are you|i am fine|thank you|ok sir|yes sir)\.?$/i.test(lowerAnswer);
  const isDirectEvasion =
    /^(i don't know|no idea|pass|skip|next question|not sure|can't recall|i have no idea)\.?$/i.test(lowerAnswer);
  const isNonTechnicalHobbies =
    /sports|cricket|football|music|singing|dancing|movies|cooking|weather|traveling|hobbies/i.test(lowerAnswer);
  const isAudioFillerOrUnclear =
    /^(uh|um|hmm|ah|er|yes|no|huh|mhm|ok|yeah|\.|\s|\,|\-)+$/i.test(lowerAnswer) ||
    (/^(uh|um|hmm|ah|er)/i.test(lowerAnswer.trim()) && answerWords.size <= 2);

  // --------------------------------------------------------------------------
  // 10-MARK RUBRIC EVALUATION
  // Relevance: 0-2 | Correctness: 0-4 | Depth: 0-2 | Clarity: 0-2
  // --------------------------------------------------------------------------
  let classification = 'Relevant and correct';
  let relevanceScore = 2.0;
  let correctnessScore = 3.5;
  let depthScore = 1.5;
  let clarityScore = 1.5;

  if (!trimmedAnswer || wordCount < 3 || isDirectEvasion || isAudioFillerOrUnclear || answerWords.size === 0) {
    classification = 'Insufficient information to evaluate';
    relevanceScore = 0.0;
    correctnessScore = 0.0;
    depthScore = 0.0;
    clarityScore = 0.0;
  } else if ((isDegreePercentageDistraction || isGeneralChatter || isNonTechnicalHobbies) && matchedConcepts.length === 0) {
    classification = 'Irrelevant or off-topic';
    relevanceScore = 0.0;
    correctnessScore = 0.0;
    depthScore = 0.0;
    clarityScore = Math.min(1.0, wordCount > 5 ? 1.0 : 0.0);
  } else if (matchedDomainKeywords.length === 0 && matchedConcepts.length === 0 && matchedGeneralTech.length === 0 && matchedSkillsOrProjects.length === 0 && wordCount >= 6) {
    classification = 'Irrelevant or off-topic';
    relevanceScore = 0.0;
    correctnessScore = 0.0;
    depthScore = 0.0;
    clarityScore = 1.0;
  } else {
    const conceptCoverage = expected.length > 0
      ? (matchedConcepts.length / expected.length)
      : (matchedDomainKeywords.length / Math.max(2, domainKeywords.length));

    // Check for technical misconceptions
    const hasMisconception =
      /keys cannot be hashed|collisions overwrite|without any (bucket|chaining)|storing elements sequentially in a (binary|fixed)|hashmap is synchronized|hashtable is not synchronized|get request modifies database|post request cannot have body|python has no memory management|gil allows true parallelism|http is stateful|tcp is connectionless|udp is reliable|abstract class cannot have methods|interfaces cannot have|private variables can be accessed directly/i.test(lowerAnswer);

    if (hasMisconception) {
      classification = 'Relevant but incorrect';
      relevanceScore = 2.0;
      correctnessScore = 1.0;
      depthScore = 0.5;
      clarityScore = wordCount >= 10 ? 1.5 : 1.0;
    } else if (conceptCoverage >= 0.65 || (matchedConcepts.length >= 2 && wordCount >= 8)) {
      classification = 'Relevant and correct';
      relevanceScore = 2.0;
      correctnessScore = wordCount >= 25 ? 4.0 : 3.5;
      depthScore = (wordCount >= 25 || lowerAnswer.includes('trade-off') || lowerAnswer.includes('because') || lowerAnswer.includes('for example')) ? 2.0 : 1.5;
      clarityScore = wordCount >= 10 ? 2.0 : 1.5;
    } else if (conceptCoverage >= 0.25 || matchedDomainKeywords.length >= 2) {
      classification = 'Relevant but partially correct';
      relevanceScore = 2.0;
      correctnessScore = 2.5;
      depthScore = wordCount >= 20 ? 1.5 : 1.0;
      clarityScore = wordCount >= 8 ? 1.5 : 1.0;
    } else {
      classification = 'Partially relevant';
      relevanceScore = 1.0;
      correctnessScore = 2.0;
      depthScore = 1.0;
      clarityScore = 1.5;
    }
  }

  // Calculate awarded marks out of 10
  const awardedMarks = Math.min(10.0, Math.max(0.0, Math.round((relevanceScore + correctnessScore + depthScore + clarityScore) * 10) / 10));
  const overallScore = Math.round(awardedMarks * 10); // 0-100 scale

  const marksBreakdown = {
    relevance: relevanceScore,
    correctness: correctnessScore,
    depth: depthScore,
    clarity: clarityScore,
    awardedMarks,
    maxMarks: 10
  };

  const missingConcepts = expected.filter(c => !matchedConcepts.includes(c));
  const whatYouDidWell = matchedConcepts.length > 0
    ? [`Demonstrated accurate understanding of: ${matchedConcepts.slice(0, 2).join(' and ')}.`]
    : ['Participated actively and maintained a professional communication tone.'];

  if (wordCount >= 25 && classification === 'Relevant and correct') {
    whatYouDidWell.push('Supported your answer with structured technical mechanics and implementation context.');
  }

  const whatYouMissed = missingConcepts.length > 0
    ? missingConcepts
    : (awardedMarks < 8 ? [`Deepen discussion of low-level trade-offs and edge-case handling for ${currentQuestion.topic}.`] : []);

  // --------------------------------------------------------------------------
  // HANDLE IRRELEVANT ANSWERS & SINGLE-RETRY POLICY
  // --------------------------------------------------------------------------
  let retryOpportunity = false;
  let spokenFeedback = '';

  if (attemptNumber === 1 && (classification === 'Irrelevant or off-topic' || classification === 'Insufficient information to evaluate')) {
    retryOpportunity = true;
    if (classification === 'Irrelevant or off-topic' || classification === 'Insufficient information to evaluate') {
      spokenFeedback = 'Your answer does not fit this question. Please try answering the question asked.';
    }

    const attemptRecord = {
      attemptNumber: 1,
      userAnswer: trimmedAnswer,
      classification,
      awardedMarks,
      maxMarks: 10,
      marksBreakdown,
      spokenFeedback,
      timestamp: new Date().toISOString()
    };
    sessionState.currentQuestionAttempts.push(attemptRecord);

    const evaluation = {
      accuracy: correctnessScore * 2.5,
      relevance: relevanceScore * 5,
      completeness: depthScore * 5,
      technicalUnderstanding: correctnessScore * 2.5,
      communication: clarityScore * 5,
      overallScore,
      awardedMarks,
      maxMarks: 10,
      marksBreakdown,
      classification,
      isRetryOpportunity: true,
      retryAttemptNumber: 1,
      spokenFeedback,
      conciseFeedback: spokenFeedback,
      whatYouDidWell,
      whatYouMissed,
      betterAnswer: currentQuestion.modelAnswer || 'Provide a structured, step-by-step breakdown supported by your project experience.'
    };

    return {
      evaluation,
      retryOpportunity: true,
      spokenFeedback,
      currentQuestion: {
        ...currentQuestion,
        isRetry: true,
        attemptNumber: 2
      },
      nextQuestion: null,
      isCompleted: false
    };
  }

  // --------------------------------------------------------------------------
  // FINALIZE TURN (RELEVANT ANSWER OR FINAL RETRY ATTEMPT)
  // --------------------------------------------------------------------------
  if (attemptNumber >= 2 && (classification === 'Irrelevant or off-topic' || classification === 'Insufficient information to evaluate')) {
    spokenFeedback = `Thank you for your response. There appears to be a misunderstanding of this concept. Let's continue, and you can review this topic in your final marksheet.`;
  } else if (classification === 'Relevant but partially correct') {
    spokenFeedback = `Your answer covers part of the concept, but there are a few important details missing. Can you keep that in mind as we continue to the next question?`;
  } else if (classification === 'Relevant but incorrect') {
    spokenFeedback = `Thank you for your response. There appears to be a misunderstanding of this concept. Let's continue, and you can review this topic in your final marksheet.`;
  } else {
    spokenFeedback = `Excellent response on ${currentQuestion.topic}. You articulated the core concepts and implementation details clearly.`;
  }

  // Record this attempt
  const finalAttemptRecord = {
    attemptNumber,
    userAnswer: trimmedAnswer,
    classification,
    awardedMarks,
    maxMarks: 10,
    marksBreakdown,
    spokenFeedback,
    timestamp: new Date().toISOString()
  };
  sessionState.currentQuestionAttempts.push(finalAttemptRecord);

  // Detailed Mistake Analysis for Marksheet
  const mistakeAnalysis = awardedMarks < 8.0 ? {
    question: currentQuestion.questionText,
    topic: currentQuestion.topic,
    whatMisunderstood: missingConcepts.length > 0
      ? `Omitted key concepts: ${missingConcepts.join(', ')}.`
      : `Lacked depth regarding underlying mechanics and execution details.`,
    whyIncompleteOrIncorrect: classification === 'Irrelevant or off-topic'
      ? `The answer did not directly address the question prompt and discussed unrelated content.`
      : classification === 'Relevant but incorrect'
      ? `The explanation contained conceptual inaccuracies or inverted technical principles.`
      : `The response provided a surface-level definition without explaining internal data structures or practical implementation trade-offs.`,
    correctConcept: currentQuestion.modelAnswer || `Accurately articulate the underlying mechanics, data structures, and trade-offs of ${currentQuestion.topic}.`,
    improvementExample: `In interviews, state the direct definition, explain the internal mechanics (e.g., memory management, thread-safety, or time complexity), and connect it to a practical example from your project experience.`
  } : null;

  const scoreExplanation = classification === 'Relevant and correct'
    ? `Strong response awarding ${awardedMarks}/10. Addressed core concepts with appropriate technical structure.`
    : classification === 'Relevant but partially correct'
    ? `Solid effort awarding ${awardedMarks}/10. Captured foundational aspects but missed: ${missingConcepts.slice(0, 2).join(' and ') || 'specific trade-offs'}.`
    : classification === 'Relevant but incorrect'
    ? `Awarded ${awardedMarks}/10 due to conceptual inaccuracies in system mechanics.`
    : `Awarded ${awardedMarks}/10 as the response did not address the required question prompt.`;

  const evaluation = {
    accuracy: Math.round(correctnessScore * 2.5),
    relevance: Math.round(relevanceScore * 5),
    completeness: Math.round(depthScore * 5),
    technicalUnderstanding: Math.round(correctnessScore * 2.5),
    communication: Math.round(clarityScore * 5),
    overallScore,
    awardedMarks,
    maxMarks: 10,
    marksBreakdown,
    classification,
    isRetryOpportunity: false,
    spokenFeedback,
    conciseFeedback: spokenFeedback,
    scoreExplanation,
    whatYouDidWell,
    whatYouMissed,
    betterAnswer: currentQuestion.modelAnswer || 'Provide a structured, step-by-step breakdown supported by your project experience.',
    mistakeAnalysis
  };

  const turnRecord = {
    turnNumber,
    questionId: currentQuestion.id,
    questionText: currentQuestion.questionText,
    category: currentQuestion.category,
    topic: currentQuestion.topic,
    difficulty: currentQuestion.difficulty,
    userAnswer: trimmedAnswer,
    attempts: [...sessionState.currentQuestionAttempts],
    classification,
    awardedMarks,
    maxMarks: 10,
    marksBreakdown,
    score: overallScore,
    timeTakenSeconds,
    evaluation,
    mistakeAnalysis,
    timestamp: new Date().toISOString()
  };

  sessionState.turns.push(turnRecord);
  sessionState.currentQuestionAttempts = []; // reset for next question

  if (overallScore >= 75) {
    if (!sessionState.strongTopics.includes(currentQuestion.topic)) {
      sessionState.strongTopics.push(currentQuestion.topic);
    }
  } else if (overallScore < 60) {
    if (!sessionState.weakTopics.includes(currentQuestion.topic)) {
      sessionState.weakTopics.push(currentQuestion.topic);
    }
  }

  const nextQIndex = currentQIndex + 1;
  const isCompleted = nextQIndex >= sessionState.totalQuestions;

  let nextQuestion = null;

  if (!isCompleted) {
    // Generate next question or adaptive follow-up
    let adaptiveFollowUp = null;
    if (evaluation.overallScore < 55 && currentQuestion.category.includes('Project')) {
      adaptiveFollowUp = {
        id: `follow-up-${currentQuestion.id}`,
        category: 'Project Understanding',
        topic: `${currentQuestion.topic} Clarification`,
        difficulty: 'Medium',
        context: currentQuestion.context,
        questionText: `Following up on what you just explained about "${currentQuestion.topic}": what specific persistence or database schema did you choose, and how did you prevent data inconsistency?`,
        expectedConcepts: ['database technology choice', 'relational integrity or schema design', 'transaction boundaries'],
        modelAnswer: 'We implemented strict database transaction boundaries and foreign key constraints to ensure ACID compliance during high-concurrency operations.',
        hint: 'Mention the exact database used in your project and how you validated transactions.'
      };
    } else if (evaluation.overallScore >= 85 && currentQuestion.difficulty !== 'Advanced') {
      adaptiveFollowUp = {
        id: `follow-up-scale-${currentQuestion.id}`,
        category: 'Project Understanding',
        topic: `${currentQuestion.topic} High Concurrency`,
        difficulty: 'Advanced',
        context: currentQuestion.context,
        questionText: `You explained ${currentQuestion.topic} well. How would your architecture scale if traffic grew by a factor of 100x? What caching, asynchronous queuing, or database partitioning would you introduce?`,
        expectedConcepts: ['caching with redis or memcached', 'message queues like kafka or rabbitmq', 'read replicas or sharding'],
        modelAnswer: 'To handle 100x traffic, we would introduce Redis for read-heavy caching, decouple heavy write tasks using Kafka queues, and employ read-replica database pools.',
        hint: 'Discuss distributed caching, horizontal scaling, and asynchronous messaging.'
      };
    }

    if (adaptiveFollowUp) {
      nextQuestion = adaptiveFollowUp;
      sessionState.agenda[nextQIndex] = adaptiveFollowUp;
      console.log(`[Diagnostic] [AI Follow-up Question Generated] sessionId=${sessionState.sessionId} topic=${adaptiveFollowUp.topic}`);
    } else if (sessionState.agenda && sessionState.agenda[nextQIndex]) {
      // Preserve planned question order from session agenda
      nextQuestion = sessionState.agenda[nextQIndex];
    } else {
      nextQuestion = await generatePersonalizedInterviewQuestion({
        candidateId: sessionState.userId,
        resumeContext,
        targetRole: sessionState.targetRole,
        interviewType: sessionState.interviewType,
        experienceLevel: sessionState.experienceLevel,
        difficulty: sessionState.difficulty,
        questionNumber: nextQIndex + 1,
        totalQuestions: sessionState.totalQuestions,
        askedQuestions: sessionState.agenda.slice(0, nextQIndex),
        previousTurns: sessionState.turns
      });
      sessionState.agenda[nextQIndex] = nextQuestion;
    }

    sessionState.currentQuestionIndex = nextQIndex;
  } else {
    sessionState.status = 'completed';
    sessionState.completedAt = new Date().toISOString();
  }

  return {
    evaluation,
    retryOpportunity: false,
    spokenFeedback,
    nextQuestion,
    isCompleted
  };
}
