/**
 * CareerLens AI — Interview Preparation & Dynamic Learning Roadmap Engine
 * Generates tailored interview questions based strictly on the candidate's verified resume skills,
 * projects, and target role benchmarks without inventing false candidate claims.
 */

export function generateInterviewQuestions(candidateSkillsOrParsed, projectsArg, targetRoleArg = 'Java Developer') {
  let candidateSkills = [];
  let projects = [];
  let targetRole = targetRoleArg;

  if (candidateSkillsOrParsed && candidateSkillsOrParsed.skills) {
    candidateSkills = candidateSkillsOrParsed.skills.allSkillsFound || [];
    projects = candidateSkillsOrParsed.projects || [];
    targetRole = typeof projectsArg === 'string' ? projectsArg : targetRoleArg;
  } else {
    candidateSkills = Array.isArray(candidateSkillsOrParsed) ? candidateSkillsOrParsed : [];
    projects = Array.isArray(projectsArg) ? projectsArg : [];
  }

  const skillsLower = candidateSkills.map(s => String(s).toLowerCase());

  // 1. Resume & Project Specific Questions
  const projectQuestions = projects.slice(0, 3).map((proj, idx) => ({
    id: `proj-q-${idx + 1}`,
    category: 'Project Architecture & Decisions',
    question: `In your project "${proj.name}", how did you design the data flow between ${proj.technologies.slice(0, 2).join(' and ')}? What was the most significant technical bottleneck you encountered?`,
    difficulty: 'Medium',
    whyInterviewerMayAsk: 'To determine whether you built the project yourself and understand end-to-end component communication.',
    expectedConcepts: [
      'Component separation (client, controller, service, persistence)',
      'Specific trade-offs made during schema or API design',
      'Realistic debugging and troubleshooting experience'
    ],
    sampleAnswerStructure: '1. State the core goal -> 2. Detail the architecture flow -> 3. Mention a concrete bug or latency issue -> 4. Explain how you resolved it.'
  }));

  // 2. Java Questions (if Java is present or target role is Java)
  const javaQuestions = [
    {
      id: 'java-q-1',
      category: 'Java Core & Concurrency',
      question: 'How does HashMap work internally in Java 8+? What happens during a hash collision and when does a linked bucket convert to a red-black tree?',
      difficulty: 'Medium / Hard',
      whyInterviewerMayAsk: 'Standard core question for software engineers to verify deep understanding of the Java Collections Framework.',
      expectedConcepts: ['hashCode() and equals() contract', 'Bucket indexing via (n - 1) & hash', 'Treeification threshold (8) and min capacity (64)'],
      sampleAnswerStructure: 'Explain hashing -> mention collision chaining -> explain treeification at threshold 8 for O(log n) worst-case performance.'
    },
    {
      id: 'java-q-2',
      category: 'Java Enterprise / Spring Boot',
      question: 'What is Inversion of Control (IoC) and Dependency Injection (DI) in Spring Boot? How does the ApplicationContext manage bean lifecycles?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'To evaluate your grasp of enterprise application frameworks and loose coupling.',
      expectedConcepts: ['IoC Container', '@Autowired / Constructor Injection', 'Bean scopes (Singleton, Prototype)', 'Lifecycle annotations (@PostConstruct, @PreDestroy)'],
      sampleAnswerStructure: 'Define IoC -> explain Constructor injection advantages -> describe the 3 main phases of the Spring Bean lifecycle.'
    }
  ];

  // 3. DSA Questions
  const dsaQuestions = [
    {
      id: 'dsa-q-1',
      category: 'Data Structures & Algorithms',
      question: 'Given an array of integers, how would you find two numbers that sum up to a target value in O(n) time complexity?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Tests fundamental time/space complexity optimization from O(n^2) brute-force to linear time using hash-based lookups.',
      expectedConcepts: ['Hash map complement lookup', 'One-pass vs two-pass trade-offs', 'Space complexity O(n)'],
      sampleAnswerStructure: 'Iterate through elements -> compute target - current -> check if complement exists in HashMap -> return indices or insert current.'
    },
    {
      id: 'dsa-q-2',
      category: 'Data Structures & Algorithms',
      question: 'How would you detect a cycle in a singly linked list without extra memory? Explain the mathematical intuition.',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Tests mastery of pointer manipulation and Floyd\'s Cycle Detection (Tortoise and Hare) algorithm.',
      expectedConcepts: ['Slow and fast pointers', 'O(1) auxiliary space', 'Relative speed of 1 step/iteration guaranteeing meeting point'],
      sampleAnswerStructure: 'Initialize slow (1 step) and fast (2 steps) -> if fast or fast.next is null, no cycle -> if slow == fast, cycle detected.'
    }
  ];

  // 4. SQL / Database Questions
  const sqlQuestions = [
    {
      id: 'sql-q-1',
      category: 'Databases & SQL',
      question: 'What is the difference between WHERE and HAVING in SQL? Write a query scenario where HAVING is strictly required.',
      difficulty: 'Easy / Medium',
      whyInterviewerMayAsk: 'Checks whether you understand SQL clause execution order (FROM -> WHERE -> GROUP BY -> HAVING -> SELECT).',
      expectedConcepts: ['Row-level filtering vs aggregate group filtering', 'Use with GROUP BY and aggregate functions (COUNT, SUM, AVG)'],
      sampleAnswerStructure: 'WHERE filters rows before grouping; HAVING filters aggregated groups after GROUP BY. Example: filtering departments where COUNT(*) > 5.'
    },
    {
      id: 'sql-q-2',
      category: 'Databases & SQL',
      question: 'Explain Database Indexing. When can an index degrade performance instead of improving it?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Assesses practical production database knowledge and trade-offs between read speed and write overhead.',
      expectedConcepts: ['B-Tree index structure', 'Fast O(log n) lookups', 'Write/Insert/Update overhead due to index tree rebalancing'],
      sampleAnswerStructure: 'Explain B-Tree search -> state that tables with high-frequency INSERT/UPDATE operations experience performance degradation if over-indexed.'
    }
  ];

  // 5. ServiceNow Questions
  const serviceNowQuestions = [
    {
      id: 'sn-q-1',
      category: 'ServiceNow Architecture',
      question: 'What is the difference between Business Rules and Client Scripts in ServiceNow? When should each be used?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Critical core concept for any ServiceNow platform developer.',
      expectedConcepts: ['Client Script runs in user browser (onLoad, onChange, onSubmit)', 'Business Rule runs server-side on database operations (before, after, async, display)', 'Security & performance best practices'],
      sampleAnswerStructure: 'Client scripts handle UI behavior and instant feedback; Business rules enforce server-side business logic and database data validation.'
    },
    {
      id: 'sn-q-2',
      category: 'ServiceNow Scripting',
      question: 'Explain GlideRecord vs GlideAggregate. Why is GlideAggregate strongly preferred for counting records?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Evaluates your awareness of enterprise performance and memory efficiency.',
      expectedConcepts: ['GlideRecord fetches entire row objects into memory', 'GlideAggregate performs direct SQL GROUP BY/COUNT on the database engine', 'Query execution latency and memory usage'],
      sampleAnswerStructure: 'GlideAggregate pushes count calculation down to the database engine, preventing thousands of record objects from being loaded into memory.'
    }
  ];

  // 7. Personal & General HR Questions
  const personalHrQuestions = [
    {
      id: 'hr-gen-1',
      category: 'Personal & General HR',
      question: 'Where do you see yourself professionally in the next 2 to 3 years, and what technical milestones do you plan to achieve?',
      difficulty: 'Easy',
      whyInterviewerMayAsk: 'To evaluate long-term ambition, retention likelihood, and career planning clarity.',
      expectedConcepts: ['Realistic professional milestones', 'Desire to grow from junior to independent contributor', 'Continuous skill acquisition'],
      sampleAnswerStructure: 'State short-term goal of becoming self-sufficient in the stack -> outline desire to take ownership of end-to-end features -> mention goal of mentoring future interns.'
    },
    {
      id: 'hr-gen-2',
      category: 'Personal & General HR',
      question: 'How do you handle technical frustration or high-pressure deadlines without compromising code quality?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Assesses emotional intelligence, stress management, and code integrity.',
      expectedConcepts: ['Prioritization', 'Communicating early with team leads', 'Taking strategic breaks to maintain focus'],
      sampleAnswerStructure: 'Break down the bottleneck -> communicate timeline risks transparently -> maintain unit testing discipline rather than taking shortcuts.'
    }
  ];

  // 8. Company-Based HR Questions
  const companyHrQuestions = [
    {
      id: 'hr-comp-1',
      category: 'Company-Based HR',
      question: 'What attracted you to apply for an engineering role at our company, and how does our technical mission align with your values?',
      difficulty: 'Easy / Medium',
      whyInterviewerMayAsk: 'To evaluate candidate preparation, genuine interest, and culture fit.',
      expectedConcepts: ['Company products or engineering reputation', 'Alignment with team culture', 'Desire to solve impactful real-world problems'],
      sampleAnswerStructure: 'Highlight a specific aspect of the company platform or culture -> connect it to your technical passion.'
    },
    {
      id: 'hr-comp-2',
      category: 'Company-Based HR',
      question: 'How do you adapt when internal engineering standards or architectural guidelines differ from how you previously wrote code?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Checks open-mindedness, humility, and adherence to company conventions.',
      expectedConcepts: ['Respecting shared code conventions', 'Active participation in code reviews', 'Prioritizing team consistency over personal stylistic preference'],
      sampleAnswerStructure: 'Embrace team linters and style guides -> understand the architectural reasoning -> prioritize maintainability for the entire engineering organization.'
    }
  ];

  // 9. Situational & Behavioral Questions
  const situationalQuestions = [
    {
      id: 'sit-1',
      category: 'Behavioral & Situational',
      question: 'Describe a situation where you had to quickly learn an unfamiliar technology, library, or framework to complete an assignment. What was your approach?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Measures learning agility, resourcefulness, and self-directed study under time constraints.',
      expectedConcepts: ['Consulting official documentation', 'Building minimal proof-of-concept prototypes', 'Incremental learning applied to project needs'],
      sampleAnswerStructure: 'Identify core API patterns -> build a throwaway sandbox script to test edge cases -> integrate into the main project.'
    },
    {
      id: 'sit-2',
      category: 'Behavioral & Situational',
      question: 'What would you do if a mentor or senior engineer left critical feedback on your pull request pointing out major design flaws?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Tests ego management, receptive attitude to critique, and ability to improve code collaboratively.',
      expectedConcepts: ['Viewing critique objectively as a learning opportunity', 'Asking clarifying questions', 'Refactoring with updated tests'],
      sampleAnswerStructure: 'Thank the reviewer -> clarify requirements on complex points -> refactor the code and verify behavior with automated tests.'
    }
  ];

  // 10. Fresher-Specific Questions
  const fresherQuestions = [
    {
      id: 'fresh-1',
      category: 'Fresher-Specific Questions',
      question: 'As a fresher transitioning from college to corporate software engineering, what do you anticipate will be your biggest challenge, and how are you preparing for it?',
      difficulty: 'Easy / Medium',
      whyInterviewerMayAsk: 'Assesses self-awareness, realistic expectations of industry velocity, and proactive preparation.',
      expectedConcepts: ['Navigating large legacy codebases', 'Rigorous testing and code review standards', 'Active listening and seeking guidance when blocked'],
      sampleAnswerStructure: 'Acknowledge the scale of production codebases -> mention reading open-source code and practicing Git workflows -> outline commitment to disciplined documentation.'
    },
    {
      id: 'fresh-2',
      category: 'Fresher-Specific Questions',
      question: 'How have you kept your practical coding skills active outside of your formal university syllabus?',
      difficulty: 'Easy',
      whyInterviewerMayAsk: 'Validates intrinsic passion for software development and hands-on initiative.',
      expectedConcepts: ['Building independent projects', 'Solving coding challenges on LeetCode/HackerRank', 'Following tech blogs and release notes'],
      sampleAnswerStructure: 'Highlight personal GitHub repositories -> describe daily algorithmic practice -> mention building working applications.'
    }
  ];

  // 11. Unexpected & Critical-Thinking Questions
  const criticalThinkingQuestions = [
    {
      id: 'crit-1',
      category: 'Critical-Thinking & Edge Cases',
      question: 'How would you explain the concept of an API or database index to a non-technical marketing executive in simple terms?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Tests cross-functional communication and ability to abstract complex technical mechanisms.',
      expectedConcepts: ['Real-world analogy (restaurant menu/waiter for API, book index for DB index)', 'Avoiding unnecessary technical jargon', 'Focusing on business value'],
      sampleAnswerStructure: 'Use a clear analogy -> explain why it speeds up retrieval or facilitates communication -> summarize business impact.'
    },
    {
      id: 'crit-2',
      category: 'Critical-Thinking & Edge Cases',
      question: 'If a critical third-party payment or authentication API experiences a complete outage, how should your application respond to prevent user confusion and data corruption?',
      difficulty: 'Hard',
      whyInterviewerMayAsk: 'Evaluates resilience thinking, fault tolerance, and defensive programming.',
      expectedConcepts: ['Graceful degradation', 'Circuit breaker pattern', 'Informative user error messages', 'Queueing or idempotent retries'],
      sampleAnswerStructure: 'Catch boundary timeouts -> display clean status notices rather than crashing -> queue non-time-sensitive actions with idempotency keys.'
    }
  ];

  // 12. Resume Introduction & Overview Questions
  const introQuestions = [
    {
      id: 'intro-1',
      category: 'Resume & Introduction',
      question: 'Tell me about yourself, your educational journey, and what technical areas you are most passionate about.',
      difficulty: 'Beginner',
      whyInterviewerMayAsk: 'Standard opening question to evaluate verbal communication structure, enthusiasm, and focus.',
      expectedConcepts: ['Structured chronological overview', 'Key skills and coursework', 'Why you want to excel in this role'],
      sampleAnswerStructure: 'Introduce academic background -> highlight core languages and projects -> express passion for this engineering domain.'
    },
    {
      id: 'intro-2',
      category: 'Resume & Introduction',
      question: 'Looking at your resume, what technical project or accomplishment are you most proud of, and why was it significant to you?',
      difficulty: 'Beginner / Medium',
      whyInterviewerMayAsk: 'To assess depth of ownership and pride in technical craftsmanship.',
      expectedConcepts: ['Clear technical context', 'Personal contribution and challenges overcome', 'Measurable result or lesson learned'],
      sampleAnswerStructure: 'Name the accomplishment -> detail the technical challenge -> explain what you learned from delivering it.'
    }
  ];

  // 13. Teamwork & Individual Contribution
  const teamworkQuestions = [
    {
      id: 'team-1',
      category: 'Teamwork & Contribution',
      question: 'In your team or academic projects, how did you divide responsibilities, agree on API contracts, and resolve merge conflicts or differing technical opinions?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Validates collaborative habits, version control maturity, and constructive conflict resolution.',
      expectedConcepts: ['Defining OpenAPI/Swagger or interface contracts early', 'Feature branch workflows in Git', 'Resolving technical debates with empirical benchmarks'],
      sampleAnswerStructure: 'Agree on interfaces before coding -> use pull requests with code reviews -> test controversial approaches with minimal prototypes.'
    }
  ];

  // 14. Scenario-Based Technical Questions
  const scenarioQuestions = [
    {
      id: 'scen-1',
      category: 'Scenario-Based Reasoning',
      question: 'If users report that the application has suddenly become extremely sluggish and slow to respond under moderate traffic, what step-by-step diagnostic process would you follow?',
      difficulty: 'Hard',
      whyInterviewerMayAsk: 'Tests holistic production troubleshooting and systems telemetry knowledge.',
      expectedConcepts: ['Checking server CPU, RAM, and disk I/O', 'Reviewing database connection pool saturation and slow query logs', 'Inspecting thread dumps or memory leak heap traces'],
      sampleAnswerStructure: 'Check infrastructure health metrics -> inspect slow query logs -> profile active threads -> deploy targeted fix or index.'
    },
    {
      id: 'scen-2',
      category: 'Scenario-Based Reasoning',
      question: 'How would you handle defensive validation for unexpected, missing, or maliciously malformed payloads sent to your backend endpoints?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Evaluates defensive programming and API boundary security.',
      expectedConcepts: ['Schema validation before business logic', 'Sanitization against injection', 'Returning explicit 400 Bad Request responses with field details'],
      sampleAnswerStructure: 'Validate input models at the controller level -> reject malformed structures early -> log security anomalies without leaking stack traces.'
    }
  ];

  // 15. Certifications & Internships Questions
  const certificationQuestions = [
    {
      id: 'cert-1',
      category: 'Certifications & Internships',
      question: 'What was the most valuable practical engineering lesson you learned from your internships, online certifications, or independent coursework?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'Determines whether the candidate connects theoretical credentials with real engineering practice.',
      expectedConcepts: ['Bridging theory with hands-on practice', 'Mastering debugging or deployment tooling', 'Appreciation for testing and clean code'],
      sampleAnswerStructure: 'Identify the certification or internship -> describe a concrete scenario where the concept was applied -> explain the long-term impact on your code.'
    }
  ];

  // Consolidate into full question library
  const allQuestions = [
    ...introQuestions,
    ...projectQuestions,
    ...javaQuestions,
    ...dsaQuestions,
    ...sqlQuestions,
    ...serviceNowQuestions,
    ...behavioralQuestions,
    ...personalHrQuestions,
    ...companyHrQuestions,
    ...situationalQuestions,
    ...fresherQuestions,
    ...criticalThinkingQuestions,
    ...teamworkQuestions,
    ...scenarioQuestions,
    ...certificationQuestions
  ];

  return {
    projectQuestions,
    javaQuestions,
    dsaQuestions,
    sqlQuestions,
    serviceNowQuestions: skillsLower.some(s => s.includes('servicenow')) || targetRole.includes('ServiceNow') ? serviceNowQuestions : [],
    behavioralQuestions,
    personalHrQuestions,
    companyHrQuestions,
    situationalQuestions,
    fresherQuestions,
    criticalThinkingQuestions,
    introQuestions,
    teamworkQuestions,
    scenarioQuestions,
    certificationQuestions,
    allQuestions
  };
}

/**
 * Generates a dynamic 6-week learning roadmap based strictly on identified gaps.
 */
export function generateDynamicRoadmap(missingSkills, targetRole = 'Java Developer') {
  const defaultRoadmap = [
    {
      weekNumber: 1,
      title: 'Language Fundamentals & Architecture',
      focus: `${targetRole.split(' ')[0]} Core Syntax & Object-Oriented Principles`,
      keyTopics: ['Core Language syntax', 'Classes, Interfaces & Polymorphism', 'Memory Management basics', 'Version Control with Git'],
      practiceTasks: ['Implement an inheritance hierarchy model', 'Create a clean GitHub repo with daily commits']
    },
    {
      weekNumber: 2,
      title: 'Data Structures & Algorithms Foundations',
      focus: 'Essential Collections & Algorithmic Problem Solving',
      keyTopics: ['Arrays, Strings, Two-Pointer technique', 'HashMaps & HashSets internals', 'Time & Space complexity analysis'],
      practiceTasks: ['Solve 15 essential Blind75 array/hash problems', 'Benchmark linear vs binary search']
    },
    {
      weekNumber: 3,
      title: 'Database Design & Relational Querying',
      focus: 'SQL Mastery & Data Normalization',
      keyTopics: ['Complex Multi-table Joins (INNER, LEFT)', 'Subqueries & CTEs', 'Indexing & Query execution plans', 'ACID transactions'],
      practiceTasks: ['Design a 5-table normalized schema', 'Write queries calculating running totals and rankings']
    },
    {
      weekNumber: 4,
      title: 'Backend Framework & RESTful Services',
      focus: 'API Development & Enterprise Architecture',
      keyTopics: ['REST API contract design', 'Request validation & Exception Handling', 'Controller-Service-Repository pattern', 'Authentication concepts'],
      practiceTasks: ['Build a 6-endpoint CRUD service with structured error codes', 'Test all endpoints via Postman collection']
    },
    {
      weekNumber: 5,
      title: 'End-to-End Project Integration',
      focus: 'Connecting Frontend, Backend, and Database',
      keyTopics: ['Database connection pooling', 'Environment configuration (.env)', 'Unit testing with JUnit/Jest', 'Data validation'],
      practiceTasks: ['Implement user authentication with hashed passwords', 'Add unit tests achieving at least 70% coverage']
    },
    {
      weekNumber: 6,
      title: 'Deployment, Cloud & Interview Readiness',
      focus: 'Production Containerization & Mock Interviews',
      keyTopics: ['Docker containerization', 'Cloud deployment (AWS / Render)', 'Resume bullet point refinement', 'Technical mock interviews'],
      practiceTasks: ['Containerize application using Dockerfile', 'Deploy live demo link and record 2-minute architectural walkthrough']
    }
  ];

  // If specific missing skills were flagged, prioritize them into weeks 2, 4, and 5
  if (missingSkills.length > 0) {
    if (missingSkills.includes('Spring Boot') || missingSkills.includes('REST APIs')) {
      defaultRoadmap[3].focus = 'Spring Boot Architecture & RESTful API Contracts';
    }
    if (missingSkills.includes('ServiceNow') || missingSkills.includes('ITSM')) {
      defaultRoadmap[0].focus = 'ServiceNow Platform Fundamentals, Tables & ITSM Modules';
      defaultRoadmap[3].focus = 'ServiceNow Scripting (Client Scripts, Business Rules, Flow Designer)';
    }
  }

  return defaultRoadmap;
}
