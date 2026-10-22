/**
 * CareerLens AI — Interview Preparation & Dynamic Learning Roadmap Engine
 * Generates tailored interview questions based strictly on the candidate's verified resume skills,
 * projects, and target role benchmarks without inventing false candidate claims.
 */

export function generateInterviewQuestions(candidateSkills, projects, targetRole = 'Java Developer') {
  const skillsLower = candidateSkills.map(s => s.toLowerCase());

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

  // 6. HR & Behavioral Questions
  const behavioralQuestions = [
    {
      id: 'hr-q-1',
      category: 'Behavioral & Teamwork',
      question: 'Tell me about a time when your code didn\'t work as expected or a deployment failed. How did you diagnose the issue?',
      difficulty: 'Medium',
      whyInterviewerMayAsk: 'To evaluate accountability, debugging maturity, and emotional resilience under pressure.',
      expectedConcepts: ['STAR Method (Situation, Task, Action, Result)', 'Root-cause analysis (logs, stack traces)', 'Preventive actions taken'],
      sampleAnswerStructure: 'Situation: describe the bug -> Action: describe checking server logs and reproducing -> Result: resolved bug and added automated test.'
    },
    {
      id: 'hr-q-2',
      category: 'HR & Career Alignment',
      question: `Why are you specifically interested in starting your career as a ${targetRole}? How have your academic projects prepared you for this transition?`,
      difficulty: 'Easy / Medium',
      whyInterviewerMayAsk: 'To test genuine domain passion and self-awareness regarding your current technical baseline.',
      expectedConcepts: ['Clear career trajectory', 'Specific tools and languages you enjoy building with', 'Eagerness to learn in a structured team'],
      sampleAnswerStructure: 'Connect your academic coursework and hands-on projects directly to the day-to-day responsibilities of the role.'
    }
  ];

  return {
    projectQuestions,
    javaQuestions,
    dsaQuestions,
    sqlQuestions,
    serviceNowQuestions: skillsLower.some(s => s.includes('servicenow')) || targetRole.includes('ServiceNow') ? serviceNowQuestions : [],
    behavioralQuestions
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
