/**
 * CareerLens AI — Interactive Resume-Based Interviewer Engine
 * Conducts dynamic, conversational mock interviews where the AI ASKS questions
 * and the candidate ANSWERS. Grounded strictly in the candidate's verified resume.
 */

import crypto from 'crypto';
import { dbRun, dbGet, dbAll } from '../db/database.js';
import { sendInterviewReportEmail } from './emailService.js';

// --- Technical Knowledge Base for Accurate Heuristic Evaluation & Better Answers ---
const TECHNICAL_TOPIC_KNOWLEDGE = {
  'java oop': {
    topic: 'Java OOP Principles',
    keyConcepts: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'classes', 'objects', 'interfaces'],
    modelAnswer: 'The four core OOP principles in Java are: 1. Encapsulation: bundling data (fields) and methods that operate on them, using private access and public getters/setters. 2. Inheritance: mechanism where one class inherits fields and methods from a superclass using extends. 3. Polymorphism: ability for an entity to take multiple forms—either compile-time (method overloading) or runtime (method overriding via dynamic dispatch). 4. Abstraction: hiding complex internal implementation details and exposing only the essential interface using abstract classes and interfaces.',
    hint: 'Think about the 4 pillars (E.I.P.A): protecting data, reusing code through hierarchies, dynamic method dispatch, and hiding implementation details.'
  },
  'java collections': {
    topic: 'Java Collections Framework',
    keyConcepts: ['hashmap', 'arraylist', 'linkedlist', 'hashcode', 'equals', 'collision', 'bucket', 'treeify', 'time complexity'],
    modelAnswer: 'HashMap works internally via an array of Node buckets. Each key is hashed using hash(key.hashCode()) and mapped to an index = (n - 1) & hash. When collisions occur, entries are stored in a linked list. In Java 8+, once a bucket reaches a TREEIFY_THRESHOLD of 8 elements (and total table capacity is >= 64), the linked list converts into a Red-Black Tree, improving lookup from O(n) to O(log n). ArrayList provides O(1) random access backed by a dynamic array, whereas LinkedList provides O(1) insertion/deletion at ends but O(n) traversal.',
    hint: 'Recall the hashCode() & equals() contract, bucket array indexing via bitwise AND, and how Java 8 converts long linked collision chains into balanced trees.'
  },
  'sql joins and queries': {
    topic: 'SQL Joins & Optimization',
    keyConcepts: ['inner join', 'left join', 'right join', 'group by', 'having', 'index', 'b-tree', 'aggregate', 'where'],
    modelAnswer: 'An INNER JOIN returns rows with matching values in both tables, whereas a LEFT JOIN returns all rows from the left table plus matched rows from the right table (filling nulls for unmatched). WHERE filters individual rows before grouping, while HAVING filters aggregated groups after the GROUP BY execution. An index creates a sorted B-Tree lookup structure that accelerates SELECT queries to O(log n), but introduces write overhead on INSERT/UPDATE/DELETE operations due to index rebalancing.',
    hint: 'Distinguish row-level filtering vs aggregate group filtering, and consider how B-Trees improve lookup times while imposing write overhead.'
  },
  'servicenow platform': {
    topic: 'ServiceNow Platform Development',
    keyConcepts: ['business rule', 'client script', 'ui policy', 'flow designer', 'server-side', 'client-side', 'gliderecord', 'acl', 'itsm'],
    modelAnswer: 'In ServiceNow, Client Scripts run client-side in the browser on events like onLoad, onChange, and onSubmit to validate inputs and manipulate the DOM/form directly. Business Rules run server-side upon database actions (before, after, async, display) to enforce data integrity, calculations, and GlideRecord operations. Flow Designer provides a low-code automated workflow environment to orchestrate multi-step approval, task creation, and notifications without complex scripting.',
    hint: 'Distinguish where the code executes (browser client vs ServiceNow application server) and the database trigger points (before/after insert/update).'
  },
  'spring boot and microservices': {
    topic: 'Spring Boot & Microservices Architecture',
    keyConcepts: ['inversion of control', 'ioc', 'dependency injection', 'di', 'beans', 'rest', 'annotations', 'autowired', 'microservices'],
    modelAnswer: 'Spring Boot leverages Inversion of Control (IoC) where object creation and lifecycle management are delegated to the Spring IoC Container rather than manually instantiated with new. Dependency Injection (DI) injects required dependencies via constructors or annotations (@Autowired). For microservices, Spring Boot provides isolated, self-contained REST services configured via application.properties/yml, easily containerized and scaled.',
    hint: 'Focus on how the Spring Container creates and injects beans, and why constructor injection is preferred over field injection for testability and immutability.'
  },
  'cloud devops': {
    topic: 'Cloud & Containerization (Docker / AWS)',
    keyConcepts: ['docker', 'container', 'image', 'dockerfile', 'kubernetes', 'aws', 'ci/cd', 'ec2', 's3', 'scalability'],
    modelAnswer: 'Docker packages an application and all its runtime dependencies, libraries, and system tools into an immutable container image built from a Dockerfile. Unlike heavy virtual machines that virtualize the entire OS hardware layer, containers share the host OS kernel, making them lightweight, rapid to start, and perfectly reproducible across dev and production. In AWS, containers can be deployed on ECS or EKS, backed by S3 for object storage and managed load balancers.',
    hint: 'Compare container isolation sharing the host kernel with traditional VM hypervisors, and highlight portability across environments.'
  }
};

/**
 * 1. Start a New Interactive Interview Session
 */
export async function startInterviewSession({
  userId = 'user-demo',
  resumeData,
  interviewType = 'Mixed Interview',
  targetRole = 'Java Developer',
  experienceLevel = 'Fresher',
  difficulty = 'Intermediate',
  totalQuestions = 5,
  focusTopics = []
}) {
  if (!resumeData || !resumeData.parsedData) {
    throw new Error('Valid parsed resume data is required to start an AI Interview. Please upload or analyze a resume first.');
  }

  const { contact, skills, projects, education, certifications, experience } = resumeData.parsedData;
  const candidateName = contact?.name || 'Candidate';
  const candidateSkills = (skills?.allSkillsFound || []).map(s => s.trim());
  const candidateProjects = projects || [];
  const candidateDegree = education?.[0]?.degree || 'Computer Science / Engineering';
  const candidateCollege = education?.[0]?.college || 'University';

  const sessionId = `session-${crypto.randomUUID().slice(0, 8)}`;

  // Generate the tailored Question Agenda strictly grounded in the candidate's resume
  const questionAgenda = buildTailoredAgenda({
    candidateName,
    candidateSkills,
    candidateProjects,
    candidateDegree,
    candidateCollege,
    certifications: certifications || [],
    experience: experience || [],
    interviewType,
    targetRole,
    difficulty,
    totalQuestions,
    focusTopics
  });

  const firstQuestion = questionAgenda[0];

  const welcomeMessage = generateWelcomeIntro({
    candidateName,
    candidateDegree,
    candidateCollege,
    candidateSkills,
    candidateProjects,
    interviewType,
    targetRole,
    difficulty,
    totalQuestions
  });

  const sessionState = {
    sessionId,
    userId,
    resumeId: resumeData.id || 'current',
    candidateName,
    targetRole,
    interviewType,
    experienceLevel,
    difficulty,
    totalQuestions: questionAgenda.length,
    currentQuestionIndex: 0,
    welcomeMessage,
    agenda: questionAgenda,
    turns: [],
    strongTopics: [],
    weakTopics: [],
    skippedCount: 0,
    status: 'in_progress',
    createdAt: new Date().toISOString()
  };

  // Persist session to SQLite
  await dbRun(
    `INSERT INTO interview_sessions (id, user_id, resume_id, target_role, interview_type, experience_level, difficulty, total_questions, current_question_index, session_data_json, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionId,
      userId,
      sessionState.resumeId,
      targetRole,
      interviewType,
      experienceLevel,
      difficulty,
      sessionState.totalQuestions,
      0,
      JSON.stringify(sessionState),
      'in_progress'
    ]
  );

  return {
    sessionId,
    candidateName,
    welcomeMessage,
    currentQuestion: {
      id: firstQuestion.id,
      questionNumber: 1,
      totalQuestions: sessionState.totalQuestions,
      category: firstQuestion.category,
      topic: firstQuestion.topic,
      difficulty: firstQuestion.difficulty,
      questionText: firstQuestion.questionText,
      hintAvailable: Boolean(firstQuestion.hint),
      context: firstQuestion.context
    },
    interviewType,
    targetRole,
    difficulty,
    progress: {
      current: 1,
      total: sessionState.totalQuestions,
      percentage: Math.round((1 / sessionState.totalQuestions) * 100)
    }
  };
}

/**
 * 2. Submit Answer & Receive AI Evaluation + Next Question
 */
export async function submitInterviewAnswer({ sessionId, answerText, userAnswer }) {
  const effectiveAnswer = answerText || userAnswer || '';
  const sessionRow = await dbGet(`SELECT * FROM interview_sessions WHERE id = ?`, [sessionId]);
  if (!sessionRow) {
    throw new Error(`Interview session "${sessionId}" not found.`);
  }

  const sessionState = JSON.parse(sessionRow.session_data_json);
  if (sessionState.status === 'completed') {
    throw new Error('This interview session has already been completed.');
  }

  const currentQIndex = sessionState.currentQuestionIndex;
  const currentQuestion = sessionState.agenda[currentQIndex];

  if (!effectiveAnswer || effectiveAnswer.trim().length === 0) {
    throw new Error('Please speak or type an answer, or click "Skip Question" if you wish to pass.');
  }

  // Evaluate the answer using technical concepts & rubric
  const evaluation = evaluateCandidateAnswer(currentQuestion, effectiveAnswer.trim(), sessionState.difficulty);

  // Record topic strength / weakness
  if (evaluation.overallScore >= 75) {
    if (!sessionState.strongTopics.includes(currentQuestion.topic)) {
      sessionState.strongTopics.push(currentQuestion.topic);
    }
  } else if (evaluation.overallScore < 60) {
    if (!sessionState.weakTopics.includes(currentQuestion.topic)) {
      sessionState.weakTopics.push(currentQuestion.topic);
    }
  }

  // Record Turn
  const turnRecord = {
    turnNumber: currentQIndex + 1,
    questionId: currentQuestion.id,
    questionText: currentQuestion.questionText,
    category: currentQuestion.category,
    topic: currentQuestion.topic,
    difficulty: currentQuestion.difficulty,
    userAnswer: effectiveAnswer.trim(),
    evaluation,
    score: evaluation.overallScore,
    timestamp: new Date().toISOString()
  };

  sessionState.turns.push(turnRecord);

  // Check if there is an adaptive follow-up opportunity or advance to next question
  const nextQIndex = currentQIndex + 1;
  let nextQuestion = null;
  let isCompleted = false;

  if (nextQIndex >= sessionState.totalQuestions) {
    // Session completed!
    sessionState.status = 'completed';
    sessionState.completedAt = new Date().toISOString();
    sessionState.currentQuestionIndex = nextQIndex;
    isCompleted = true;
  } else {
    // Check if we should inject an adaptive follow-up
    const adaptiveNext = checkAndAdaptNextQuestion(currentQuestion, evaluation, sessionState.agenda[nextQIndex]);
    sessionState.agenda[nextQIndex] = adaptiveNext;
    sessionState.currentQuestionIndex = nextQIndex;

    nextQuestion = {
      id: adaptiveNext.id,
      questionNumber: nextQIndex + 1,
      totalQuestions: sessionState.totalQuestions,
      category: adaptiveNext.category,
      topic: adaptiveNext.topic,
      difficulty: adaptiveNext.difficulty,
      questionText: adaptiveNext.questionText,
      hintAvailable: Boolean(adaptiveNext.hint),
      context: adaptiveNext.context
    };
  }

  // Update SQLite session
  await dbRun(
    `UPDATE interview_sessions
     SET current_question_index = ?, session_data_json = ?, status = ?
     WHERE id = ?`,
    [
      sessionState.currentQuestionIndex,
      JSON.stringify(sessionState),
      sessionState.status,
      sessionId
    ]
  );

  let finalReport = null;
  if (isCompleted) {
    finalReport = compileFinalInterviewReport(sessionState);
    await saveAndNotifyEvaluation(sessionState, finalReport);
  }

  return {
    evaluation,
    nextQuestion,
    isCompleted,
    finalReport,
    progress: {
      current: Math.min(nextQIndex + 1, sessionState.totalQuestions),
      total: sessionState.totalQuestions,
      percentage: Math.round((Math.min(nextQIndex + 1, sessionState.totalQuestions) / sessionState.totalQuestions) * 100)
    }
  };
}

/**
 * 3. Provide Conceptual Hint
 */
export async function getQuestionHint({ sessionId }) {
  const sessionRow = await dbGet(`SELECT * FROM interview_sessions WHERE id = ?`, [sessionId]);
  if (!sessionRow) throw new Error('Session not found.');

  const sessionState = JSON.parse(sessionRow.session_data_json);
  const currentQuestion = sessionState.agenda[sessionState.currentQuestionIndex];

  if (!currentQuestion) throw new Error('No active question in this session.');

  return {
    hint: currentQuestion.hint || 'Focus on how the technical components communicate, the key data structures used, and the real-world trade-offs.',
    topic: currentQuestion.topic
  };
}

/**
 * 4. Skip Active Question
 */
export async function skipInterviewQuestion({ sessionId }) {
  const sessionRow = await dbGet(`SELECT * FROM interview_sessions WHERE id = ?`, [sessionId]);
  if (!sessionRow) throw new Error('Session not found.');

  const sessionState = JSON.parse(sessionRow.session_data_json);
  const currentQIndex = sessionState.currentQuestionIndex;
  const currentQuestion = sessionState.agenda[currentQIndex];

  if (!currentQuestion) throw new Error('No active question in this session.');

  // Record skipped turn
  sessionState.skippedCount = (sessionState.skippedCount || 0) + 1;
  if (!sessionState.weakTopics.includes(currentQuestion.topic)) {
    sessionState.weakTopics.push(currentQuestion.topic);
  }

  const turnRecord = {
    turnNumber: currentQIndex + 1,
    questionId: currentQuestion.id,
    questionText: currentQuestion.questionText,
    category: currentQuestion.category,
    topic: currentQuestion.topic,
    difficulty: currentQuestion.difficulty,
    userAnswer: '[Skipped by candidate]',
    evaluation: {
      accuracy: 0,
      relevance: 0,
      completeness: 0,
      technicalUnderstanding: 0,
      communication: 0,
      overallScore: 0,
      whatYouDidWell: ['You acknowledged the question and chose to proceed forward.'],
      whatYouMissed: ['This question was skipped without an answer.'],
      betterAnswer: currentQuestion.modelAnswer || 'Review standard reference material for this topic.',
      conciseFeedback: `Skipped. Make sure to review ${currentQuestion.topic} before your real interview.`
    },
    score: 0,
    timestamp: new Date().toISOString()
  };

  sessionState.turns.push(turnRecord);

  const nextQIndex = currentQIndex + 1;
  let nextQuestion = null;
  let isCompleted = false;

  if (nextQIndex >= sessionState.totalQuestions) {
    sessionState.status = 'completed';
    sessionState.completedAt = new Date().toISOString();
    sessionState.currentQuestionIndex = nextQIndex;
    isCompleted = true;
  } else {
    sessionState.currentQuestionIndex = nextQIndex;
    const nextQ = sessionState.agenda[nextQIndex];
    nextQuestion = {
      id: nextQ.id,
      questionNumber: nextQIndex + 1,
      totalQuestions: sessionState.totalQuestions,
      category: nextQ.category,
      topic: nextQ.topic,
      difficulty: nextQ.difficulty,
      questionText: nextQ.questionText,
      hintAvailable: Boolean(nextQ.hint),
      context: nextQ.context
    };
  }

  await dbRun(
    `UPDATE interview_sessions
     SET current_question_index = ?, session_data_json = ?, status = ?
     WHERE id = ?`,
    [
      sessionState.currentQuestionIndex,
      JSON.stringify(sessionState),
      sessionState.status,
      sessionId
    ]
  );

  let finalReport = null;
  if (isCompleted) {
    finalReport = compileFinalInterviewReport(sessionState);
    await saveAndNotifyEvaluation(sessionState, finalReport);
  }

  return {
    nextQuestion,
    isCompleted,
    finalReport,
    progress: {
      current: Math.min(nextQIndex + 1, sessionState.totalQuestions),
      total: sessionState.totalQuestions,
      percentage: Math.round((Math.min(nextQIndex + 1, sessionState.totalQuestions) / sessionState.totalQuestions) * 100)
    }
  };
}

/**
 * 5. Retry / Revise Answer for the Most Recent Turn
 */
export async function retryTurnAnswer({ sessionId, revisedAnswer }) {
  const sessionRow = await dbGet(`SELECT * FROM interview_sessions WHERE id = ?`, [sessionId]);
  if (!sessionRow) throw new Error('Session not found.');

  const sessionState = JSON.parse(sessionRow.session_data_json);
  if (!sessionState.turns || sessionState.turns.length === 0) {
    throw new Error('No previous answer to revise.');
  }

  const lastTurn = sessionState.turns[sessionState.turns.length - 1];
  const question = sessionState.agenda.find(q => q.id === lastTurn.questionId) || {
    questionText: lastTurn.questionText,
    category: lastTurn.category,
    topic: lastTurn.topic,
    difficulty: lastTurn.difficulty
  };

  const newEvaluation = evaluateCandidateAnswer(question, revisedAnswer.trim(), lastTurn.difficulty);
  const previousScore = lastTurn.score;
  const scoreDelta = newEvaluation.overallScore - previousScore;

  // Update last turn with revision
  lastTurn.revisedAnswer = revisedAnswer.trim();
  lastTurn.previousScore = previousScore;
  lastTurn.score = newEvaluation.overallScore;
  lastTurn.evaluation = newEvaluation;
  lastTurn.isRevised = true;

  // Refresh topic lists
  if (newEvaluation.overallScore >= 75) {
    if (!sessionState.strongTopics.includes(lastTurn.topic)) {
      sessionState.strongTopics.push(lastTurn.topic);
    }
    sessionState.weakTopics = sessionState.weakTopics.filter(t => t !== lastTurn.topic);
  }

  await dbRun(
    `UPDATE interview_sessions SET session_data_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [JSON.stringify(sessionState), sessionId]
  );

  return {
    previousScore,
    newScore: newEvaluation.overallScore,
    scoreDelta,
    improvementHighlights: scoreDelta > 0
      ? `Your revised answer gained +${scoreDelta} points! You addressed key technical points.`
      : 'Revised answer evaluated. Review the model answer to strengthen edge-case explanations.',
    evaluation: newEvaluation
  };
}

/**
 * 6. Get Completed Session Report
 */
export async function getSessionReport({ sessionId }) {
  const sessionRow = await dbGet(`SELECT * FROM interview_sessions WHERE id = ?`, [sessionId]);
  if (!sessionRow) throw new Error(`Interview session "${sessionId}" not found.`);

  const sessionState = JSON.parse(sessionRow.session_data_json);
  return compileFinalInterviewReport(sessionState);
}

/**
 * 7. Get Latest Session for Reconnect / State Recovery
 */
export async function getLatestSession() {
  const sessionRow = await dbGet(`SELECT * FROM interview_sessions ORDER BY created_at DESC LIMIT 1`);
  if (!sessionRow) return null;
  return JSON.parse(sessionRow.session_data_json);
}

// ============================================================================
// HELPER FUNCTIONS & LOGIC ENGINES
// ============================================================================

/**
 * Build a structured, tailored question agenda based strictly on verified resume details.
 */
function buildTailoredAgenda({
  candidateName,
  candidateSkills,
  candidateProjects,
  candidateDegree,
  candidateCollege,
  certifications,
  experience,
  interviewType,
  targetRole,
  difficulty,
  totalQuestions = 5,
  focusTopics = []
}) {
  const agenda = [];
  const skillsLower = candidateSkills.map(s => s.toLowerCase());

  // Mode: Practice Weak Areas (Focus exclusively on requested weak topics)
  if (focusTopics.length > 0) {
    focusTopics.forEach((topic, idx) => {
      agenda.push(generateWeakTopicQuestion(topic, idx + 1, difficulty));
    });
    // Pad if needed
    while (agenda.length < totalQuestions) {
      agenda.push(generateGeneralTechnicalQuestion(skillsLower, agenda.length + 1, difficulty));
    }
    return agenda.slice(0, totalQuestions);
  }

  // 1. Personalized "Tell Me About Yourself" Introduction (Tailored to actual resume)
  const skillsSnippet = candidateSkills.slice(0, 3).join(', ');
  const projectSnippet = candidateProjects[0]?.name ? `your project "${candidateProjects[0].name}"` : 'your technical projects';

  const introQuestion = {
    id: 'intro-q-1',
    category: 'Resume & Professional Introduction',
    topic: 'Candidate Introduction',
    difficulty: 'Beginner',
    context: `Education: ${candidateDegree} at ${candidateCollege} | Skills: ${skillsSnippet}`,
    questionText: `Hello ${candidateName}, welcome to your interview. To start, please introduce yourself, focusing on your background in ${candidateDegree} at ${candidateCollege}, your core skills in ${skillsSnippet}, and what you built in ${projectSnippet}.`,
    expectedConcepts: ['clear structure', 'academic background', 'mention of core skills', 'project context', 'career motivation'],
    modelAnswer: `I am a ${candidateDegree} student at ${candidateCollege} passionate about software engineering and ${targetRole} positions. My primary technical stack includes ${skillsSnippet}. Recently, I developed ${projectSnippet}, where I tackled real-world challenges in application architecture and data handling. I am eager to apply my foundation in software design to production-grade engineering problems.`,
    hint: 'Structure your response chronologically: 1. Your academic foundation -> 2. Key technical skills you actively use -> 3. The flagship project you built -> 4. What excites you about this role.'
  };

  // 2. Project-Based Questions (Deep analysis of ACTUAL candidate projects)
  const projectQuestions = [];
  candidateProjects.forEach((proj, idx) => {
    const tech = (proj.technologies && proj.technologies.length > 0) ? proj.technologies : ['software engineering'];
    const techStr = tech.slice(0, 2).join(' and ');

    projectQuestions.push({
      id: `proj-q-${idx + 1}-arch`,
      category: 'Project Architecture & Problem Solving',
      topic: `${proj.name} Architecture`,
      difficulty: difficulty === 'Advanced' ? 'Hard' : 'Medium',
      context: `Project: "${proj.name}" | Stack: ${tech.join(', ')}`,
      questionText: `In your resume, you highlighted your project "${proj.name}" utilizing ${techStr}. Can you explain the core problem this project was designed to solve, and describe the end-to-end architecture you implemented?`,
      expectedConcepts: ['problem statement', 'architecture components', 'data flow', 'user interaction', tech[0] || 'technology choice'],
      modelAnswer: `In "${proj.name}", the primary problem was automating manual operations to improve throughput and tracking. I designed a tiered architecture separating presentation, business logic, and persistence. Using ${techStr}, incoming requests are validated, processed according to domain business rules, and persisted, ensuring auditability and minimal latency.`,
      hint: 'Outline: 1. The specific pain point or user requirement -> 2. The architectural tiers (client, server, data layer) -> 3. How data flows when an action is triggered.'
    });

    if (tech.some(t => t.toLowerCase().includes('servicenow') || t.toLowerCase().includes('flow') || t.toLowerCase().includes('rule'))) {
      projectQuestions.push({
        id: `proj-q-${idx + 1}-tech-sn`,
        category: 'Project Deep-Dive (ServiceNow)',
        topic: 'ServiceNow Implementation in Project',
        difficulty: 'Medium',
        context: `Project: "${proj.name}"`,
        questionText: `You mentioned ServiceNow components in "${proj.name}". Can you explain how you designed the workflow automation—specifically your use of Business Rules, Flow Designer, or Client Scripts?`,
        expectedConcepts: ['workflow automation', 'business rules', 'client scripts vs server side', 'flow designer trigger'],
        modelAnswer: 'In this project, I used Flow Designer to orchestrate multi-step approval workflows upon ticket creation. For data validation before database insertion, I implemented "before" Business Rules to verify fields server-side, preventing malformed records from persisting while keeping Client Scripts lightweight for browser interactions.',
        hint: 'Detail which specific ServiceNow tables and rules you created, and why server-side validation was critical.'
      });
    } else if (tech.some(t => t.toLowerCase().includes('java') || t.toLowerCase().includes('spring') || t.toLowerCase().includes('sql'))) {
      projectQuestions.push({
        id: `proj-q-${idx + 1}-tech-data`,
        category: 'Project Technical Decisions',
        topic: `${proj.name} Data Flow`,
        difficulty: 'Medium',
        context: `Project: "${proj.name}"`,
        questionText: `In "${proj.name}", what was the most significant technical bottleneck or edge-case you encountered during development, and how did you resolve it?`,
        expectedConcepts: ['concrete bottleneck', 'root cause analysis', 'troubleshooting steps', 'measurable resolution'],
        modelAnswer: 'A key bottleneck we encountered was slow query response times and race conditions during simultaneous user updates. By analyzing query execution plans, adding composite indexes on foreign keys, and implementing proper transaction boundaries, we reduced query latency by over 40% and prevented data inconsistency.',
        hint: 'State a real bug or performance issue (e.g. database locking, state synchronization, or API timeout) and walk through how you diagnosed and fixed it.'
      });
    }
  });

  // 3. Technical Questions (Strictly from verified candidate skills in resume)
  const technicalQuestions = [];

  if (skillsLower.some(s => s.includes('java'))) {
    technicalQuestions.push({
      id: 'tech-q-java-oop',
      category: 'Technical Knowledge (Java)',
      topic: 'Java OOP Principles',
      difficulty: difficulty === 'Advanced' ? 'Hard' : 'Medium',
      context: 'Verified Skill: Java',
      questionText: 'You have listed Java as one of your technical skills. Can you explain the four main principles of Object-Oriented Programming (OOP) in Java and provide a brief code example or practical use-case for Polymorphism?',
      expectedConcepts: ['encapsulation', 'inheritance', 'polymorphism', 'abstraction', 'method overriding', 'dynamic binding'],
      modelAnswer: TECHNICAL_TOPIC_KNOWLEDGE['java oop'].modelAnswer,
      hint: TECHNICAL_TOPIC_KNOWLEDGE['java oop'].hint
    });

    if (difficulty === 'Advanced' || difficulty === 'Intermediate') {
      technicalQuestions.push({
        id: 'tech-q-java-collections',
        category: 'Technical Knowledge (Java)',
        topic: 'Java Collections Internals',
        difficulty: 'Hard',
        context: 'Verified Skill: Java',
        questionText: 'How does HashMap work internally in Java? What happens during a hash collision, and under what conditions does a bucket convert from a linked list to a tree in Java 8+?',
        expectedConcepts: ['hashcode and equals', 'bucket index (n-1)&hash', 'collision chaining', 'treeify threshold 8', 'red-black tree O(log n)'],
        modelAnswer: TECHNICAL_TOPIC_KNOWLEDGE['java collections'].modelAnswer,
        hint: TECHNICAL_TOPIC_KNOWLEDGE['java collections'].hint
      });
    }
  }

  if (skillsLower.some(s => s.includes('servicenow'))) {
    technicalQuestions.push({
      id: 'tech-q-sn-rules',
      category: 'Technical Knowledge (ServiceNow)',
      topic: 'ServiceNow Platform Development',
      difficulty: 'Medium',
      context: 'Verified Skill: ServiceNow',
      questionText: 'In ServiceNow development, what is the precise difference between a Business Rule and a Client Script? When would you use each?',
      expectedConcepts: ['client-side vs server-side', 'onLoad/onChange/onSubmit', 'before/after/async business rules', 'data integrity'],
      modelAnswer: TECHNICAL_TOPIC_KNOWLEDGE['servicenow platform'].modelAnswer,
      hint: TECHNICAL_TOPIC_KNOWLEDGE['servicenow platform'].hint
    });
  }

  if (skillsLower.some(s => s.includes('sql') || s.includes('database') || s.includes('mysql') || s.includes('postgres'))) {
    technicalQuestions.push({
      id: 'tech-q-sql-joins',
      category: 'Technical Knowledge (Databases & SQL)',
      topic: 'SQL Joins & Queries',
      difficulty: 'Medium',
      context: 'Verified Skill: SQL / Relational Databases',
      questionText: 'In relational databases, what is the difference between WHERE and HAVING clauses in SQL? In what scenario is HAVING mandatory?',
      expectedConcepts: ['where filters rows before grouping', 'having filters aggregated groups after group by', 'aggregate functions count sum avg'],
      modelAnswer: TECHNICAL_TOPIC_KNOWLEDGE['sql joins and queries'].modelAnswer,
      hint: TECHNICAL_TOPIC_KNOWLEDGE['sql joins and queries'].hint
    });
  }

  if (skillsLower.some(s => s.includes('spring') || s.includes('spring boot'))) {
    technicalQuestions.push({
      id: 'tech-q-spring-ioc',
      category: 'Technical Knowledge (Spring Framework)',
      topic: 'Spring Boot IoC & DI',
      difficulty: 'Medium',
      context: 'Verified Skill: Spring Boot',
      questionText: 'Can you explain the concepts of Inversion of Control (IoC) and Dependency Injection (DI) in Spring Boot? Why is constructor injection preferred over field injection?',
      expectedConcepts: ['inversion of control', 'dependency injection', 'spring container', 'constructor injection testability immutability'],
      modelAnswer: TECHNICAL_TOPIC_KNOWLEDGE['spring boot and microservices'].modelAnswer,
      hint: TECHNICAL_TOPIC_KNOWLEDGE['spring boot and microservices'].hint
    });
  }

  if (skillsLower.some(s => s.includes('docker') || s.includes('aws') || s.includes('cloud') || s.includes('devops'))) {
    technicalQuestions.push({
      id: 'tech-q-cloud-devops',
      category: 'Technical Knowledge (Cloud & DevOps)',
      topic: 'Containerization & Cloud Infrastructure',
      difficulty: 'Medium',
      context: 'Verified Skill: Docker / Cloud',
      questionText: 'What is the fundamental difference between a Docker container and a traditional Virtual Machine? How does containerization improve deployment reliability?',
      expectedConcepts: ['shared host kernel', 'lightweight vs full os hypervisor', 'immutability', 'reproducible environment'],
      modelAnswer: TECHNICAL_TOPIC_KNOWLEDGE['cloud devops'].modelAnswer,
      hint: TECHNICAL_TOPIC_KNOWLEDGE['cloud devops'].hint
    });
  }

  // 4. HR & Behavioral Questions (Personalized to Resume Experience)
  const hrQuestions = [
    {
      id: 'hr-q-conflict-collab',
      category: 'Behavioral & Leadership',
      topic: 'Team Collaboration & Technical Disagreements',
      difficulty: 'Medium',
      context: `Context: Collaborative projects like ${candidateProjects[0]?.name || 'academic work'}`,
      questionText: `During technical project development (such as in ${candidateProjects[0]?.name || 'your engineering coursework'}), describe a time when you and a teammate had conflicting opinions on a technical decision. How did you evaluate the options and reach a resolution?`,
      expectedConcepts: ['STAR method', 'objective evaluation of trade-offs', 'professional communication', 'focus on project outcome'],
      modelAnswer: 'In my project, a teammate wanted to use an unvetted library while I advocated for standard native APIs. Instead of debating subjectively, we built small prototypes, benchmarked latency and memory footprint, and concluded that the native solution reduced bundle size by 30%. We aligned on the data-backed choice and delivered on schedule.',
      hint: 'Use the STAR format: Situation -> Task -> Action you took to evaluate options objectively -> Positive final Result.'
    },
    {
      id: 'hr-q-career-growth',
      category: 'HR & Motivation',
      topic: 'Career Vision & Role Fit',
      difficulty: 'Beginner',
      context: `Target Role: ${targetRole}`,
      questionText: `What motivated you to pursue a career as a ${targetRole}? How have your projects and technical skills prepared you to contribute effectively in this position?`,
      expectedConcepts: ['genuine passion for engineering', 'connection between resume skills and industry role', 'desire for continuous learning'],
      modelAnswer: `My passion for building robust, scalable systems that solve tangible user problems motivated me to target ${targetRole} positions. Developing ${projectSnippet} allowed me to transform academic knowledge into production-ready software. I look forward to contributing clean code, collaborating with senior engineers, and continuing to deepen my architecture expertise.`,
      hint: 'Connect your verified skills directly to the day-to-day responsibilities of this target role.'
    }
  ];

  // Assemble Agenda by Interview Type
  if (interviewType === 'Technical Interview') {
    agenda.push(...technicalQuestions);
    if (projectQuestions.length > 0) agenda.push(projectQuestions[0]);
    // Fill remaining if needed
    if (agenda.length < totalQuestions) {
      agenda.push(...projectQuestions.slice(1));
    }
  } else if (interviewType === 'Project Interview') {
    agenda.push(...projectQuestions);
    if (technicalQuestions.length > 0) agenda.push(technicalQuestions[0]);
  } else if (interviewType === 'Resume Interview') {
    agenda.push(introQuestion);
    if (projectQuestions.length > 0) agenda.push(projectQuestions[0]);
    if (technicalQuestions.length > 0) agenda.push(technicalQuestions[0]);
    agenda.push(hrQuestions[1]);
  } else if (interviewType === 'HR Interview') {
    agenda.push(introQuestion);
    agenda.push(...hrQuestions);
  } else {
    // Default: Mixed Interview (Personalized Resume Intro -> Project Architecture -> Technical Deep-Dive -> Behavioral -> Advanced Scenario)
    agenda.push(introQuestion);
    if (projectQuestions.length > 0) agenda.push(projectQuestions[0]);
    if (technicalQuestions.length > 0) agenda.push(technicalQuestions[0]);
    if (technicalQuestions.length > 1) agenda.push(technicalQuestions[1]);
    agenda.push(hrQuestions[0]);
    if (projectQuestions.length > 1) agenda.push(projectQuestions[1]);
    agenda.push(hrQuestions[1]);
  }

  // Ensure unique questions, capped at requested total
  const uniqueAgenda = [];
  const seenIds = new Set();
  for (const q of agenda) {
    if (!seenIds.has(q.id)) {
      seenIds.add(q.id);
      uniqueAgenda.push(q);
    }
    if (uniqueAgenda.length === totalQuestions) break;
  }

  // Fallback pad if candidate resume is sparse
  while (uniqueAgenda.length < totalQuestions) {
    const padQ = {
      id: `pad-q-${uniqueAgenda.length + 1}`,
      category: 'General Software Engineering',
      topic: 'Software Development Lifecycle',
      difficulty: difficulty,
      context: 'Software Engineering Best Practices',
      questionText: 'Can you explain the importance of unit testing and continuous integration (CI) in software development? How do you test your code before deploying?',
      expectedConcepts: ['unit tests', 'automated regression testing', 'ci pipeline', 'code reliability'],
      modelAnswer: 'Unit testing verifies individual methods and classes in isolation, catching regressions early. Integrated with CI/CD, every commit is automatically built and tested, preventing breaking changes from reaching production and ensuring reliable deployments.',
      hint: 'Discuss catching bugs early, automating test runs upon every git commit, and how test coverage protects production stability.'
    };
    uniqueAgenda.push(padQ);
  }

  return uniqueAgenda;
}

/**
 * Generate contextual welcome message.
 */
function generateWelcomeIntro({
  candidateName,
  candidateDegree,
  candidateCollege,
  candidateSkills,
  candidateProjects,
  interviewType,
  targetRole,
  difficulty,
  totalQuestions
}) {
  const projNames = candidateProjects.map(p => p.name).slice(0, 2).join(' & ');
  const skillsList = candidateSkills.slice(0, 4).join(', ');

  return `Welcome to your personalized AI mock interview, ${candidateName}.

I have thoroughly analyzed your uploaded resume. I see your ${candidateDegree} background at ${candidateCollege}, your verified technical stack in ${skillsList}, and your practical work on ${projNames || 'your software projects'}.

This session will run as a realistic ${interviewType} calibrated for the ${targetRole} position at ${difficulty} difficulty (${totalQuestions} questions total).

I will ask you one question at a time. Take your time, explain your engineering rationale clearly, and submit your response when ready. Let's begin.`;
}

/**
 * Evaluate candidate's answer across 5 core dimensions:
 * - Accuracy (0-10)
 * - Relevance (0-10)
 * - Completeness (0-10)
 * - Technical Understanding (0-10)
 * - Communication (0-10)
 */
function evaluateCandidateAnswer(question, answerText, difficulty) {
  const lowerAnswer = answerText.toLowerCase();
  const words = answerText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const expected = question.expectedConcepts || [];
  let matchedConcepts = [];

  expected.forEach(concept => {
    const terms = concept.toLowerCase().split(/[\s,]+/);
    const hit = terms.some(t => t.length > 2 && lowerAnswer.includes(t));
    if (hit) matchedConcepts.push(concept);
  });

  const conceptCoverage = expected.length > 0 ? (matchedConcepts.length / expected.length) : 0.7;

  // 1. Scoring Calculations
  let accuracy = 7;
  let relevance = 7;
  let completeness = 6;
  let technicalUnderstanding = 6;
  let communication = 7;

  // Accuracy adjustments
  if (conceptCoverage >= 0.8) accuracy = 9;
  else if (conceptCoverage >= 0.5) accuracy = 8;
  else if (conceptCoverage >= 0.25) accuracy = 6;
  else accuracy = 4;

  // Word count & depth checks
  if (wordCount < 15) {
    completeness = Math.min(completeness, 4);
    communication = Math.min(communication, 5);
    technicalUnderstanding = Math.min(technicalUnderstanding, 4);
  } else if (wordCount >= 40 && wordCount <= 180) {
    communication = Math.min(communication + 2, 10);
    completeness = Math.min(completeness + 2, 9);
    technicalUnderstanding = Math.min(technicalUnderstanding + 2, 9);
  } else if (wordCount > 180) {
    communication = Math.max(communication - 1, 7); // slightly verbose
    completeness = Math.min(completeness + 3, 10);
  }

  // Check relevance to question topic keywords
  const topicKeywords = (question.topic || '').toLowerCase().split(/\s+/);
  const mentionsTopic = topicKeywords.some(kw => kw.length > 3 && lowerAnswer.includes(kw));
  if (mentionsTopic) {
    relevance = Math.min(relevance + 2, 10);
  } else if (conceptCoverage < 0.2) {
    relevance = Math.max(relevance - 2, 4);
  }

  // Difficulty multiplier
  if (difficulty === 'Advanced') {
    if (conceptCoverage < 0.6) technicalUnderstanding = Math.max(technicalUnderstanding - 1, 4);
  }

  // Clamp 1-10
  accuracy = Math.max(1, Math.min(10, accuracy));
  relevance = Math.max(1, Math.min(10, relevance));
  completeness = Math.max(1, Math.min(10, completeness));
  technicalUnderstanding = Math.max(1, Math.min(10, technicalUnderstanding));
  communication = Math.max(1, Math.min(10, communication));

  // Overall Score (0-100 weighted)
  // Weights: Accuracy 30%, Completeness 25%, Technical 25%, Relevance 10%, Communication 10%
  const overallScore = Math.round(
    accuracy * 3.0 +
    completeness * 2.5 +
    technicalUnderstanding * 2.5 +
    relevance * 1.0 +
    communication * 1.0
  );

  // 2. Formulate "What You Did Well"
  const whatYouDidWell = [];
  if (matchedConcepts.length > 0) {
    whatYouDidWell.push(`Correctly identified and explained: ${matchedConcepts.slice(0, 2).join(' and ')}.`);
  } else {
    whatYouDidWell.push('Communicated your perspective directly and addressed the question prompt.');
  }
  if (wordCount >= 30) {
    whatYouDidWell.push('Provided solid architectural reasoning rather than just one-line definitions.');
  }

  // 3. Formulate "What You Missed"
  const missingConcepts = expected.filter(c => !matchedConcepts.includes(c));
  const whatYouMissed = [];
  if (missingConcepts.length > 0) {
    whatYouMissed.push(`Did not touch upon key aspects: ${missingConcepts.slice(0, 2).join(' or ')}.`);
  }
  if (wordCount < 25) {
    whatYouMissed.push('Answer is somewhat brief; consider explaining the technical "why" behind your choices.');
  }

  // 4. Concise Mentor Feedback
  let conciseFeedback = '';
  if (overallScore >= 80) {
    conciseFeedback = `Strong, well-articulated response. You clearly demonstrated your grasp of ${question.topic}.`;
  } else if (overallScore >= 60) {
    conciseFeedback = `Good effort on ${question.topic}. You captured the core idea, though elaborating on ${missingConcepts[0] || 'specific implementation details'} will make it standout in technical rounds.`;
  } else {
    conciseFeedback = `Your answer touches upon the general concept of ${question.topic}, but needs stronger technical precision. Notice the missing concepts below.`;
  }

  return {
    accuracy,
    relevance,
    completeness,
    technicalUnderstanding,
    communication,
    overallScore,
    whatYouDidWell: whatYouDidWell.slice(0, 3),
    whatYouMissed: whatYouMissed.slice(0, 3),
    betterAnswer: question.modelAnswer || 'Provide a structured, step-by-step technical explanation backed by real-world usage.',
    conciseFeedback
  };
}

/**
 * Adaptive difficulty & follow-up adjustment
 */
function checkAndAdaptNextQuestion(currentQuestion, evaluation, plannedNextQuestion) {
  if (!plannedNextQuestion) return null;

  // If user scored exceptionally well on an intermediate question, elevate next question difficulty
  if (evaluation.overallScore >= 85 && plannedNextQuestion.difficulty === 'Medium') {
    return {
      ...plannedNextQuestion,
      difficulty: 'Hard',
      questionText: `${plannedNextQuestion.questionText} Also consider: how would your solution scale under high-concurrency production load?`
    };
  }

  // If candidate struggled on a complex project question, provide a focused follow-up step
  if (evaluation.overallScore < 50 && currentQuestion.category.includes('Project')) {
    return {
      id: `follow-up-${currentQuestion.id}`,
      category: 'Project Follow-Up Clarification',
      topic: `${currentQuestion.topic} Clarification`,
      difficulty: 'Medium',
      context: currentQuestion.context,
      questionText: `Let's break down your project "${currentQuestion.topic}". Focusing just on the data or state: what specific database or storage mechanism did you choose, and why was it suited for this workflow?`,
      expectedConcepts: ['database choice', 'persistence', 'schema or data model', 'trade-offs'],
      modelAnswer: 'We chose a relational database to ensure strict ACID transactions and relational data integrity between user profiles, orders, and logs.',
      hint: 'Mention whether you used SQL, MongoDB, ServiceNow tables, or in-memory state, and why relational integrity mattered.'
    };
  }

  return plannedNextQuestion;
}

/**
 * Generate question specifically targeting a weak topic for "Practice Weak Areas" mode
 */
function generateWeakTopicQuestion(topic, num, difficulty) {
  const topicLower = topic.toLowerCase();
  for (const [key, val] of Object.entries(TECHNICAL_TOPIC_KNOWLEDGE)) {
    if (topicLower.includes(key) || key.includes(topicLower)) {
      return {
        id: `weak-practice-${num}`,
        category: `Targeted Weak Area Practice (${val.topic})`,
        topic: val.topic,
        difficulty: difficulty,
        context: `Remediation for: ${val.topic}`,
        questionText: `During your previous session, you identified ${val.topic} as an area to reinforce. Can you explain the core concepts and trade-offs of ${val.topic} with a concrete example?`,
        expectedConcepts: val.keyConcepts,
        modelAnswer: val.modelAnswer,
        hint: val.hint
      };
    }
  }

  return {
    id: `weak-practice-${num}`,
    category: `Targeted Practice (${topic})`,
    topic: topic,
    difficulty: difficulty,
    context: `Remediation for: ${topic}`,
    questionText: `Let's revisit ${topic}. What are the fundamental principles of this topic, and what common pitfalls should software engineers avoid when implementing it?`,
    expectedConcepts: ['fundamental principles', 'architecture', 'common pitfalls', 'debugging'],
    modelAnswer: `Mastering ${topic} requires understanding component separation, edge cases, and proper lifecycle or resource cleanup.`,
    hint: 'Focus on common production pitfalls and how best practices prevent runtime failures.'
  };
}

/**
 * Generate fallback general question
 */
function generateGeneralTechnicalQuestion(skillsLower, num, difficulty) {
  return {
    id: `gen-tech-${num}`,
    category: 'Software Engineering Best Practices',
    topic: 'Code Quality & Testing',
    difficulty: difficulty,
    context: 'Industry Engineering Standards',
    questionText: 'How do you approach error handling, logging, and debugging in your projects? Can you give an example of an unhandled exception or bug you resolved?',
    expectedConcepts: ['try-catch', 'logging levels', 'meaningful error messages', 'debugging strategy'],
    modelAnswer: 'I implement structured error handling using specific exception hierarchies and contextual logging at INFO and ERROR levels. For example, replacing generic catch (Exception e) with targeted handling prevents silent failures and aids rapid root cause analysis in production.',
    hint: 'Distinguish between client-facing error messages and server-side diagnostic logging.'
  };
}

/**
 * Save evaluation to SQLite and dispatch email notification
 */
export async function saveAndNotifyEvaluation(sessionState, finalReport) {
  try {
    const evalId = `eval-${sessionState.sessionId}`;
    await dbRun(
      `INSERT OR REPLACE INTO interview_evaluations 
       (id, user_id, session_id, target_role, overall_score, communication_score, technical_score, problem_solving_score, evaluation_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evalId,
        sessionState.userId || 'user-demo',
        sessionState.sessionId,
        sessionState.targetRole,
        finalReport.overallScore,
        finalReport.performanceDimensions?.communication || 0,
        finalReport.performanceDimensions?.technicalKnowledge || 0,
        finalReport.performanceDimensions?.problemSolving || 0,
        JSON.stringify(finalReport)
      ]
    );

    await dbRun(`UPDATE interview_sessions SET completed_at = CURRENT_TIMESTAMP, status = 'completed' WHERE id = ?`, [sessionState.sessionId]);

    const user = await dbGet(`SELECT * FROM users WHERE id = ?`, [sessionState.userId || 'user-demo']);
    if (user && user.email) {
      await sendInterviewReportEmail({
        userId: user.id,
        name: user.name,
        email: user.email,
        credentialId: user.credential_id,
        sessionData: sessionState,
        evaluation: {
          id: evalId,
          overallScore: finalReport.overallScore,
          communicationScore: finalReport.performanceDimensions?.communication || 0,
          technicalScore: finalReport.performanceDimensions?.technicalKnowledge || 0,
          problemSolvingScore: finalReport.performanceDimensions?.problemSolving || 0,
          strengths: finalReport.strongAreas || []
        }
      });
    }
  } catch (err) {
    console.error('[Evaluation Save/Notify Error]', err);
  }
}

/**
 * Compile comprehensive final report upon session completion
 */
export function compileFinalInterviewReport(sessionState) {
  const turns = sessionState.turns || [];
  const totalQuestions = turns.length;
  const answeredTurns = turns.filter(t => t.userAnswer !== '[Skipped by candidate]');
  const totalScore = turns.reduce((acc, t) => acc + (t.score || 0), 0);
  const averageScore = totalQuestions > 0 ? Math.round(totalScore / totalQuestions) : 0;

  // Category dimension averages
  const calcDimAvg = (key) => {
    if (answeredTurns.length === 0) return 0;
    const sum = answeredTurns.reduce((acc, t) => acc + (t.evaluation?.[key] || 0), 0);
    return Math.round((sum / answeredTurns.length) * 10); // scale to 0-100
  };

  const performanceDimensions = {
    technicalKnowledge: Math.min(100, Math.round(calcDimAvg('technicalUnderstanding') * 1.05)),
    resumeKnowledge: Math.min(100, Math.round(calcDimAvg('relevance') * 1.02)),
    projectUnderstanding: Math.min(100, Math.round(calcDimAvg('completeness') * 1.05)),
    problemSolving: Math.min(100, Math.round(calcDimAvg('accuracy') * 1.0)),
    communication: Math.min(100, Math.round(calcDimAvg('communication') * 1.0)),
    answerRelevance: calcDimAvg('relevance'),
    completeness: calcDimAvg('completeness')
  };

  // Readiness classification
  let readinessTier = 'Needs More Preparation';
  let readinessColor = 'rose';
  if (averageScore >= 80) {
    readinessTier = 'Interview Ready (Tier 1 Shortlist)';
    readinessColor = 'emerald';
  } else if (averageScore >= 65) {
    readinessTier = 'Solid Competence (Targeted Practice Recommended)';
    readinessColor = 'indigo';
  } else if (averageScore >= 50) {
    readinessTier = 'Foundational Understanding (Reinforce Technical Depth)';
    readinessColor = 'amber';
  }

  // Questions needing improvement (score < 70)
  const improvementQuestions = turns
    .filter(t => (t.score || 0) < 70)
    .map(t => ({
      questionText: t.questionText,
      topic: t.topic,
      userAnswer: t.userAnswer,
      score: t.score,
      whatYouMissed: t.evaluation?.whatYouMissed || [],
      betterAnswer: t.evaluation?.betterAnswer || ''
    }));

  // Deduplicate weak & strong topics
  const strongAreas = Array.from(new Set(sessionState.strongTopics || []));
  const weakAreas = Array.from(new Set(sessionState.weakTopics || []));

  // Recommended topics to study
  const recommendedTopics = weakAreas.length > 0 ? weakAreas : ['Distributed Systems Basics', 'SQL Indexing', 'API Security'];

  // 4-Week Actionable Preparation Plan
  const preparationPlan = [
    {
      week: 'Week 1',
      focus: 'Core Weak Area Remediation',
      description: `Revisit ${weakAreas.slice(0, 2).join(' and ') || 'fundamental technical concepts'}. Focus on memory internals, exact definitions, and edge cases.`
    },
    {
      week: 'Week 2',
      focus: 'Project Deep-Dive Mastery',
      description: 'Document the architecture, schema diagrams, and technical trade-offs for each project on your resume.'
    },
    {
      week: 'Week 3',
      focus: 'Timed Verbal / Written Practice',
      description: 'Practice answering technical questions using the STAR framework within 90 seconds per response.'
    },
    {
      week: 'Week 4',
      focus: 'Full Mock Interview Retest',
      description: 'Retake the AI Interview simulator to verify score improvements across all evaluation dimensions.'
    }
  ];

  return {
    sessionId: sessionState.sessionId,
    candidateName: sessionState.candidateName,
    targetRole: sessionState.targetRole,
    interviewType: sessionState.interviewType,
    difficulty: sessionState.difficulty,
    completedAt: sessionState.completedAt || new Date().toISOString(),
    totalQuestions,
    answeredCount: answeredTurns.length,
    skippedCount: sessionState.skippedCount || 0,
    averageScore,
    overallScore: averageScore,
    readinessTier,
    readinessColor,
    performanceDimensions,
    strongAreas,
    weakAreas,
    improvementQuestions,
    recommendedTopics,
    preparationPlan,
    transcript: turns.map((t, idx) => ({
      turnNumber: idx + 1,
      category: t.category,
      topic: t.topic,
      difficulty: t.difficulty,
      questionText: t.questionText,
      userAnswer: t.userAnswer,
      score: t.score,
      evaluation: t.evaluation
    }))
  };
}

export { submitInterviewAnswer as submitAnswerAndGetNextTurn };
