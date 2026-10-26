/**
 * CareerLens AI — Interactive Resume-Based Interviewer Engine
 * Conducts dynamic, conversational mock interviews where the AI ASKS questions
 * and the candidate ANSWERS. Grounded strictly in the candidate's verified resume.
 */

import crypto from 'crypto';
import { dbRun, dbGet, dbAll } from '../db/database.js';
import { sendInterviewReportEmail } from './emailService.js';
import { getResumeContextForCandidate } from './resumeContextService.js';
import {
  generateInterviewWelcomeMessage,
  generatePersonalizedInterviewQuestion,
  evaluateCandidateAnswerAndProgress
} from './aiInterviewService.js';

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
  },
  'react and frontend': {
    topic: 'React State Management & Component Lifecycle',
    keyConcepts: ['virtual dom', 'usestate', 'useeffect', 'reconciliation', 'props', 'state', 'hooks', 'unidirectional data flow'],
    modelAnswer: 'React operates on a declarative component model with unidirectional data flow. It maintains an in-memory Virtual DOM; when state or props change, React generates a new Virtual DOM tree, performs a diffing algorithm (reconciliation) in O(n) time using element keys, and batches minimal mutations to the actual browser DOM. Hooks such as useState and useEffect manage reactive state and side-effects while respecting component lifecycle phases.',
    hint: 'Explain Virtual DOM diffing reconciliation, dependency arrays in useEffect, and why unidirectional data flow avoids state mutation chaos.'
  },
  'python memory and concurrency': {
    topic: 'Python Memory Management & Concurrency',
    keyConcepts: ['mutable', 'immutable', 'gil', 'global interpreter lock', 'garbage collection', 'reference counting', 'multiprocessing'],
    modelAnswer: 'In Python, mutable objects (lists, dicts, sets) can be altered in-place while immutable types (strings, tuples, ints) produce new memory allocations when modified. Memory is managed via reference counting supplemented by a cyclic generational garbage collector. The Global Interpreter Lock (GIL) enforces thread-safety by preventing concurrent execution of Python bytecode across native threads, making multiprocessing the preferred architecture for CPU-bound tasks.',
    hint: 'Contrast mutability semantics, explain reference counting with cyclic GC, and describe how the GIL restricts multicore threading.'
  },
  'rest api architecture': {
    topic: 'RESTful API Design & HTTP Protocols',
    keyConcepts: ['statelessness', 'idempotency', 'http methods', 'status codes', 'authentication', 'json', 'endpoints'],
    modelAnswer: 'REST is an architectural style adhering to core constraints: statelessness, client-server decoupling, cacheability, and uniform interface. HTTP methods reflect semantic operations: GET retrieves state idempotently, POST creates resources, PUT replaces existing resources idempotently, and DELETE removes resources. Status codes communicate result semantics (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500 Server Error).',
    hint: 'Discuss the idempotency contract of GET/PUT/DELETE vs non-idempotent POST, stateless session handling via JWTs, and semantic HTTP status codes.'
  }
};

/**
 * 1. Start a New Interactive Interview Session Grounded in Candidate's Own Resume
 */
export async function startInterviewSession({
  userId = 'user-demo',
  resumeId = null,
  resumeData = null,
  interviewType = 'Mixed Interview',
  targetRole = 'Java Developer',
  experienceLevel = 'Fresher',
  difficulty = 'Intermediate',
  totalQuestions = 5,
  focusTopics = []
}) {
  if (!userId || userId === 'guest-user') {
    throw new Error('Authentication required to start an AI Voice Interview. Please log in.');
  }

  // 1. Retrieve the authenticated candidate's verified, ready resume context
  let resumeContext = null;
  try {
    resumeContext = await getResumeContextForCandidate({
      userId,
      resumeId: resumeId || resumeData?.id || null,
      resumeData
    });
  } catch (err) {
    console.error(`[Diagnostic] [Interview Start Failed] userId=${userId} error=${err.message}`);
    throw err;
  }

  const userRow = await dbGet('SELECT name FROM users WHERE id = ?', [userId]);
  const rawResumeName = (resumeContext.candidateName || '').replace(/^(name\s*:\s*)/i, '').trim();
  const candidateName = (userRow?.name && userRow.name !== 'Candidate' && userRow.name !== 'User')
    ? userRow.name
    : ((rawResumeName && rawResumeName !== 'Candidate' && rawResumeName !== 'Not found in resume')
      ? rawResumeName
      : '');
  const totalNumQuestions = parseInt(totalQuestions, 10) || 5;

  // 2. Generate personalized welcome message
  const welcomeMessage = generateInterviewWelcomeMessage({
    resumeContext: {
      ...resumeContext,
      candidateName: candidateName || 'Candidate'
    },
    candidateName: candidateName || null,
    interviewType,
    targetRole,
    difficulty,
    totalQuestions: totalNumQuestions
  });

  // 3. Pre-generate the planned session agenda covering required categories, personalized from candidate resume
  const plannedAgenda = [];
  const askedQuestions = [];
  for (let qIndex = 0; qIndex < totalNumQuestions; qIndex++) {
    const qNum = qIndex + 1;
    const q = await generatePersonalizedInterviewQuestion({
      candidateId: userId,
      resumeContext,
      targetRole,
      interviewType,
      experienceLevel,
      difficulty,
      questionNumber: qNum,
      totalQuestions: totalNumQuestions,
      askedQuestions
    });
    plannedAgenda.push(q);
    askedQuestions.push(q);
  }

  const firstQuestion = plannedAgenda[0];

  const sessionId = `session-${crypto.randomUUID().slice(0, 8)}`;

  const sessionState = {
    sessionId,
    userId,
    resumeId: resumeContext.resumeId,
    candidateName: candidateName || 'Candidate',
    targetRole,
    interviewType,
    experienceLevel,
    difficulty,
    totalQuestions: totalNumQuestions,
    currentQuestionIndex: 0,
    welcomeMessage,
    agenda: plannedAgenda,
    turns: [],
    strongTopics: [],
    weakTopics: [],
    skippedCount: 0,
    status: 'in_progress',
    createdAt: new Date().toISOString()
  };

  // 4. Persist session to SQLite
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
      totalNumQuestions,
      0,
      JSON.stringify(sessionState),
      'in_progress'
    ]
  );

  console.log(`[Diagnostic] [AI Voice Interview Initialized] sessionId=${sessionId} userId=${userId} resumeId=${resumeContext.resumeId} q1Topic="${firstQuestion.topic}"`);

  return {
    sessionId,
    candidateName,
    welcomeMessage,
    currentQuestion: {
      id: firstQuestion.id,
      questionNumber: 1,
      totalQuestions: totalNumQuestions,
      category: firstQuestion.category,
      topic: firstQuestion.topic,
      difficulty: firstQuestion.difficulty,
      question: firstQuestion.questionText,
      questionText: firstQuestion.questionText,
      hintAvailable: Boolean(firstQuestion.hint),
      context: firstQuestion.context
    },
    interviewType,
    targetRole,
    difficulty,
    progress: {
      current: 1,
      total: totalNumQuestions,
      percentage: Math.round((1 / totalNumQuestions) * 100)
    }
  };
}

/**
 * 2. Submit Answer & Receive AI Evaluation + Next Resume-Grounded Question
 */
export async function submitInterviewAnswer({ sessionId, answerText, userAnswer, timeTakenSeconds = 30, userId = null }) {
  const effectiveAnswer = answerText || userAnswer || '';
  const sessionRow = await dbGet(`SELECT * FROM interview_sessions WHERE id = ?`, [sessionId]);
  if (!sessionRow) {
    throw new Error(`Interview session "${sessionId}" not found.`);
  }

  // Enforce session ownership
  if (userId && sessionRow.user_id !== userId) {
    throw new Error('Access denied. You cannot submit an answer to another candidate\'s interview session.');
  }

  const sessionState = JSON.parse(sessionRow.session_data_json);
  if (sessionState.status === 'completed') {
    throw new Error('This interview session has already been completed.');
  }

  if (!effectiveAnswer || effectiveAnswer.trim().length === 0) {
    throw new Error('Please speak or type an answer, or click "Skip Question" if you wish to pass.');
  }

  // Retrieve candidate's verified resume context
  const resumeContext = await getResumeContextForCandidate({
    userId: sessionRow.user_id,
    resumeId: sessionRow.resume_id
  });

  // Evaluate candidate answer and generate next personalized question / follow-up
  const progressResult = await evaluateCandidateAnswerAndProgress({
    sessionState,
    resumeContext,
    userAnswer: effectiveAnswer.trim(),
    timeTakenSeconds: timeTakenSeconds || 30
  });

  // Update SQLite session state
  await dbRun(
    `UPDATE interview_sessions
     SET current_question_index = ?, session_data_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      sessionState.currentQuestionIndex,
      JSON.stringify(sessionState),
      sessionState.status,
      sessionId
    ]
  );

  // If candidate's response was off-topic on attempt 1, provide polite redirect and retry opportunity
  if (progressResult.retryOpportunity) {
    return {
      success: true,
      retryOpportunity: true,
      spokenFeedback: progressResult.spokenFeedback,
      evaluation: progressResult.evaluation,
      currentQuestion: {
        id: progressResult.currentQuestion.id,
        questionNumber: sessionState.currentQuestionIndex + 1,
        totalQuestions: sessionState.totalQuestions,
        category: progressResult.currentQuestion.category,
        topic: progressResult.currentQuestion.topic,
        difficulty: progressResult.currentQuestion.difficulty,
        question: progressResult.currentQuestion.questionText,
        questionText: progressResult.currentQuestion.questionText,
        hintAvailable: Boolean(progressResult.currentQuestion.hint),
        context: progressResult.currentQuestion.context,
        isRetry: true,
        attemptNumber: 2
      },
      nextQuestion: null,
      isCompleted: false,
      finalReport: null,
      progress: {
        current: sessionState.currentQuestionIndex + 1,
        total: sessionState.totalQuestions,
        percentage: Math.round(((sessionState.currentQuestionIndex + 1) / sessionState.totalQuestions) * 100)
      }
    };
  }

  let finalReport = null;
  if (progressResult.isCompleted) {
    finalReport = compileFinalInterviewReport(sessionState);
    await saveAndNotifyEvaluation(sessionState, finalReport);
    console.log(`[Diagnostic] [Interview Completed] sessionId=${sessionId} finalScore=${finalReport.overallScore}/100 totalMarks=${finalReport.marksheet?.overallPerformance?.totalMarksObtained}/${finalReport.marksheet?.overallPerformance?.totalMaxMarks}`);
  }

  return {
    success: true,
    retryOpportunity: false,
    spokenFeedback: progressResult.spokenFeedback,
    evaluation: progressResult.evaluation,
    nextQuestion: progressResult.nextQuestion ? {
      id: progressResult.nextQuestion.id,
      questionNumber: sessionState.currentQuestionIndex + 1,
      totalQuestions: sessionState.totalQuestions,
      category: progressResult.nextQuestion.category,
      topic: progressResult.nextQuestion.topic,
      difficulty: progressResult.nextQuestion.difficulty,
      question: progressResult.nextQuestion.questionText,
      questionText: progressResult.nextQuestion.questionText,
      hintAvailable: Boolean(progressResult.nextQuestion.hint),
      context: progressResult.nextQuestion.context
    } : null,
    isCompleted: progressResult.isCompleted,
    finalReport,
    progress: {
      current: Math.min(sessionState.currentQuestionIndex + 1, sessionState.totalQuestions),
      total: sessionState.totalQuestions,
      percentage: Math.round((Math.min(sessionState.currentQuestionIndex + 1, sessionState.totalQuestions) / sessionState.totalQuestions) * 100)
    }
  };
}

/**
 * 3. Provide Conceptual Hint
 */
export async function getQuestionHint({ sessionId, userId = null }) {
  const sessionRow = await dbGet(`SELECT * FROM interview_sessions WHERE id = ?`, [sessionId]);
  if (!sessionRow) throw new Error('Session not found.');

  if (userId && sessionRow.user_id !== userId) {
    throw new Error('Access denied. You cannot access hints for another candidate\'s interview session.');
  }

  const sessionState = JSON.parse(sessionRow.session_data_json);
  const currentQuestion = sessionState.agenda[sessionState.currentQuestionIndex];

  if (!currentQuestion) throw new Error('No active question in this session.');

  return {
    hint: currentQuestion.hint || 'Focus on how the technical components communicate, the key data structures used, and the real-world trade-offs.',
    topic: currentQuestion.topic
  };
}

/**
 * 4. Skip Active Question & Generate Next Resume Question
 */
export async function skipInterviewQuestion({ sessionId, userId = null }) {
  const sessionRow = await dbGet(`SELECT * FROM interview_sessions WHERE id = ?`, [sessionId]);
  if (!sessionRow) throw new Error('Session not found.');

  if (userId && sessionRow.user_id !== userId) {
    throw new Error('Access denied. You cannot modify another candidate\'s interview session.');
  }

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

    if (sessionState.agenda && sessionState.agenda[nextQIndex]) {
      nextQuestion = sessionState.agenda[nextQIndex];
    } else {
      const resumeContext = await getResumeContextForCandidate({
        userId: sessionRow.user_id,
        resumeId: sessionRow.resume_id
      });

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
  }

  await dbRun(
    `UPDATE interview_sessions
     SET current_question_index = ?, session_data_json = ?, status = ?, updated_at = CURRENT_TIMESTAMP
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
    nextQuestion: nextQuestion ? {
      id: nextQuestion.id,
      questionNumber: nextQIndex + 1,
      totalQuestions: sessionState.totalQuestions,
      category: nextQuestion.category,
      topic: nextQuestion.topic,
      difficulty: nextQuestion.difficulty,
      questionText: nextQuestion.questionText,
      hintAvailable: Boolean(nextQuestion.hint),
      context: nextQuestion.context
    } : null,
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
  const hasActualProject = candidateProjects.length > 0 && candidateProjects[0]?.name;
  const projectSnippet = hasActualProject
    ? `your project "${candidateProjects[0].name}"`
    : 'your key software development and academic coursework projects';

  const introQuestion = {
    id: 'intro-q-1',
    category: 'Resume & Professional Introduction',
    topic: 'Candidate Introduction',
    difficulty: 'Beginner',
    context: `Education: ${candidateDegree} at ${candidateCollege} | Skills: ${skillsSnippet || 'Software Engineering'}`,
    questionText: 'Tell me about yourself.',
    expectedConcepts: ['clear structure', 'academic background', 'mention of core skills', 'project context', 'career motivation'],
    modelAnswer: `I am a ${candidateDegree} student at ${candidateCollege} passionate about software engineering and ${targetRole} positions. My primary technical stack includes ${skillsSnippet || 'modern programming'}. Recently, I developed ${projectSnippet}, where I tackled real-world challenges in application architecture and data handling. I am eager to apply my foundation in software design to production-grade engineering problems.`,
    hint: 'Structure your response chronologically: 1. Your academic foundation -> 2. Key technical skills you actively use -> 3. The flagship project you built -> 4. What excites you about this role.'
  };

  // 2. Project-Based Questions (Deep analysis of ACTUAL candidate projects)
  const projectQuestions = [];
  if (candidateProjects.length > 0) {
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
      } else {
        projectQuestions.push({
          id: `proj-q-${idx + 1}-tech-data`,
          category: 'Project Technical Decisions',
          topic: `${proj.name} Implementation & Bottlenecks`,
          difficulty: 'Medium',
          context: `Project: "${proj.name}"`,
          questionText: `In "${proj.name}", what was the most significant technical bottleneck or edge-case you encountered during development, and how did you resolve it?`,
          expectedConcepts: ['concrete bottleneck', 'root cause analysis', 'troubleshooting steps', 'measurable resolution'],
          modelAnswer: 'A key bottleneck we encountered was slow query response times and race conditions during simultaneous user updates. By analyzing query execution plans, adding composite indexes on foreign keys, and implementing proper transaction boundaries, we reduced query latency by over 40% and prevented data inconsistency.',
          hint: 'State a real bug or performance issue (e.g. database locking, state synchronization, or API timeout) and walk through how you diagnosed and fixed it.'
        });
      }
    });
  } else {
    // If candidate resume did not specify distinct project titles, ask an open project overview
    projectQuestions.push({
      id: 'proj-q-general-candidate',
      category: 'Project Architecture & Problem Solving',
      topic: 'Software Development Project Experience',
      difficulty: difficulty === 'Advanced' ? 'Hard' : 'Medium',
      context: `Target Role: ${targetRole}`,
      questionText: `Can you walk me through a major software development project, academic assignment, or coursework application you have built? Explain the core problem you solved, the technology stack you chose, and how data flowed through the system.`,
      expectedConcepts: ['problem statement', 'architecture layers', 'technology choices', 'data persistence or api design', 'challenges'],
      modelAnswer: 'In my project, I identified an operational problem and designed an application using modern software patterns with clear separation between user interface, backend processing, and data storage.',
      hint: 'Outline: 1. The problem or requirement -> 2. The architectural tiers (frontend, backend, database) -> 3. How data flows when an action is triggered.'
    });
  }

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

  if (skillsLower.some(s => s.includes('python'))) {
    technicalQuestions.push({
      id: 'tech-q-python-features',
      category: 'Technical Knowledge (Python)',
      topic: 'Python Memory & Data Structures',
      difficulty: 'Medium',
      context: 'Verified Skill: Python',
      questionText: 'In Python, what is the difference between mutable and immutable types? How do list comprehensions differ in performance from standard for-loops, and what is the Global Interpreter Lock (GIL)?',
      expectedConcepts: ['mutable vs immutable (list/dict vs str/tuple)', 'pass by object reference', 'gil restricts thread execution to one core', 'list comprehension memory efficiency'],
      modelAnswer: 'In Python, mutable objects (lists, dicts, sets) can be altered in place, whereas immutable objects (strings, tuples, ints) produce new objects when modified. The GIL (Global Interpreter Lock) is a mutex that prevents multiple native threads from executing Python bytecodes simultaneously on multicore CPUs, making multiprocessing preferred over multithreading for CPU-bound tasks.',
      hint: 'Recall mutable types like lists vs immutable tuples, and how the GIL impacts thread concurrency.'
    });
  }

  if (skillsLower.some(s => s.includes('react') || s.includes('javascript') || s.includes('node') || s.includes('typescript'))) {
    technicalQuestions.push({
      id: 'tech-q-frontend-js',
      category: 'Technical Knowledge (JavaScript & React)',
      topic: 'Asynchronous JS & State Lifecycle',
      difficulty: 'Medium',
      context: 'Verified Skill: JavaScript / React',
      questionText: 'Can you explain the JavaScript Event Loop, Call Stack, and Task/Microtask Queue? In React, why must state never be mutated directly, and how does the Virtual DOM reconciliation work?',
      expectedConcepts: ['call stack and web apis', 'microtask queue promises vs macrotask settimeout', 'immutability triggers rerender', 'virtual dom diffing algorithm'],
      modelAnswer: 'The JavaScript runtime uses a single-threaded Call Stack. Asynchronous callbacks wait in the Task or Microtask queue until the Call Stack is empty. In React, mutating state directly bypasses setter functions, preventing React from scheduling reconciliation and causing stale UI states.',
      hint: 'Walk through how Promises run in the Microtask queue, and why immutability allows React to detect state changes.'
    });
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
function generateWelcomeIntro({ candidateName }) {
  const name = (candidateName && candidateName !== 'Candidate') ? candidateName : 'Candidate';
  return `Hello ${name}, welcome to the interview.`;
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

  // --------------------------------------------------------------------------
  // SECTION 6: FINAL INTERVIEW MARKSHEET GENERATION
  // --------------------------------------------------------------------------
  const scoredTurns = turns.filter(t => t.userAnswer !== '[Skipped by candidate]');
  const totalMarksObtained = turns.reduce((acc, t) => {
    const marks = t.awardedMarks !== undefined ? t.awardedMarks : (t.score ? t.score / 10 : 0);
    return acc + marks;
  }, 0);
  const totalMaxMarks = turns.length * 10;
  const overallPercentage = totalMaxMarks > 0 ? Math.round((totalMarksObtained / totalMaxMarks) * 100) : 0;

  let performanceLevel = 'Needs Intensive Preparation';
  if (overallPercentage >= 85) {
    performanceLevel = 'Exceptional — Advanced Industry Mastery';
  } else if (overallPercentage >= 70) {
    performanceLevel = 'Proficient — Strong Competency';
  } else if (overallPercentage >= 50) {
    performanceLevel = 'Developing — Foundational Knowledge';
  }

  // 6A. Overall performance
  const cleanCandidateName = (sessionState.candidateName || 'Candidate')
    .replace(/^(name\s*:\s*)/i, '')
    .trim();

  const unansweredCount = turns.filter(t => t.userAnswer === '[Skipped by candidate]').length;

  const overallPerformance = {
    candidateName: cleanCandidateName,
    interviewDate: new Date(sessionState.completedAt || sessionState.createdAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    targetJobRole: sessionState.targetRole,
    interviewType: sessionState.interviewType,
    difficulty: sessionState.difficulty,
    questionsAsked: turns.length,
    questionsAnswered: scoredTurns.length,
    unansweredCount,
    totalMarksObtained: Number(totalMarksObtained.toFixed(1)),
    totalMaxMarks,
    overallPercentage,
    performanceLevel,
    completionStatus: sessionState.status === 'completed' ? 'Completed' : 'Partially Completed'
  };

  // 6B. Question-by-question evaluation (with explanation, correct points, missing points, criteria)
  const questionByQuestionTable = turns.map((t, idx) => {
    const awarded = t.awardedMarks !== undefined ? t.awardedMarks : Number(((t.score || 0) / 10).toFixed(1));
    const max = t.maxMarks || 10;
    const classification = t.classification || (
      awarded >= 8 ? 'Relevant and correct' :
      awarded >= 5.5 ? 'Relevant but partially correct' :
      awarded >= 3 ? 'Relevant but incorrect' :
      t.userAnswer === '[Skipped by candidate]' ? 'Insufficient information to evaluate' : 'Irrelevant or off-topic'
    );
    const feedback = t.evaluation?.spokenFeedback || t.evaluation?.conciseFeedback || (t.evaluation?.whatYouMissed && t.evaluation.whatYouMissed[0]) || 'Review core technical documentation.';

    const explanation = t.evaluation?.scoreExplanation || (
      classification === 'Relevant and correct'
        ? `Strong response awarding ${awarded}/10. Answer addressed the core question prompt with sound technical reasoning.`
        : classification === 'Relevant but partially correct'
        ? `Partially correct response awarding ${awarded}/10. Foundational concepts were identified, but key technical depth was omitted.`
        : classification === 'Relevant but incorrect'
        ? `Awarded ${awarded}/10 due to conceptual inaccuracies or misconceptions regarding underlying system behavior.`
        : `Awarded ${awarded}/10 as the response did not address the required topic.`
    );

    const correctPoints = t.evaluation?.whatYouDidWell && t.evaluation.whatYouDidWell.length > 0
      ? t.evaluation.whatYouDidWell
      : ['Participated actively and maintained a professional communication tone.'];

    const missingPoints = t.evaluation?.whatYouMissed && t.evaluation.whatYouMissed.length > 0
      ? t.evaluation.whatYouMissed
      : (awarded < 8 ? [`Deepen discussion of low-level trade-offs and edge-case handling for ${t.topic}.`] : []);

    const expectedAnswer = t.evaluation?.betterAnswer || 'State a clear definition, explain internal mechanics or workflow, and illustrate with a practical implementation example.';

    return {
      questionNumber: idx + 1,
      question: t.questionText,
      topic: t.topic,
      category: t.category || 'Technical Fundamentals',
      difficulty: t.difficulty,
      candidateAnswer: t.userAnswer,
      awardedMarks: awarded,
      maxMarks: max,
      marksDisplay: `${awarded} / ${max}`,
      evaluation: classification,
      explanation,
      correctPoints,
      missingPoints,
      expectedAnswer,
      improvementFeedback: feedback,
      marksBreakdown: t.marksBreakdown || {
        relevance: Math.min(2, Math.round(awarded * 0.2)),
        correctness: Math.min(4, Math.round(awarded * 0.4)),
        depth: Math.min(2, Math.round(awarded * 0.2)),
        clarity: Math.min(2, Math.round(awarded * 0.2))
      },
      attempts: t.attempts && t.attempts.length > 0 ? t.attempts : [
        {
          attemptNumber: 1,
          userAnswer: t.userAnswer,
          classification,
          awardedMarks: awarded,
          maxMarks: max
        }
      ]
    };
  });

  // 6C. Category-Wise Scores (Only Assessed Categories - Section 6.C Requirement)
  const MASTER_CATEGORY_LIST = [
    'Personal and General HR',
    'Company-Based HR',
    'Behavioral and Situational Questions',
    'Fresher-Specific Questions',
    'Resume and Introduction',
    'Project Understanding',
    'Technical Fundamentals',
    'Coding and Problem-Solving',
    'Teamwork and Contribution',
    'Certifications and Internships',
    'Scenario-Based Reasoning'
  ];

  const categoryWisePerformance = [];
  for (const masterCat of MASTER_CATEGORY_LIST) {
    const matchingTurns = turns.filter(t => {
      const c = (t.category || '').toLowerCase();
      const target = masterCat.toLowerCase();
      if (c === target) return true;
      if (masterCat === 'Project Understanding' && (c.includes('project') || c.includes('architecture'))) return true;
      if (masterCat === 'Resume and Introduction' && (c.includes('resume') || c.includes('introduction') || c.includes('intro'))) return true;
      if (masterCat === 'Technical Fundamentals' && (c.includes('technical') || c.includes('java') || c.includes('python') || c.includes('react') || c.includes('sql') || c.includes('servicenow'))) return true;
      if (masterCat === 'Coding and Problem-Solving' && (c.includes('coding') || c.includes('problem-solving') || c.includes('dsa') || c.includes('algorithm'))) return true;
      if (masterCat === 'Behavioral and Situational Questions' && (c.includes('behavioral') || c.includes('situational'))) return true;
      if (masterCat === 'Personal and General HR' && (c.includes('personal') || c.includes('general hr') || c === 'hr')) return true;
      if (masterCat === 'Company-Based HR' && c.includes('company')) return true;
      if (masterCat === 'Fresher-Specific Questions' && (c.includes('fresher') || c.includes('academic'))) return true;
      if (masterCat === 'Teamwork and Contribution' && (c.includes('teamwork') || c.includes('contribution') || c.includes('collaboration'))) return true;
      if (masterCat === 'Certifications and Internships' && (c.includes('certification') || c.includes('internship'))) return true;
      if (masterCat === 'Scenario-Based Reasoning' && (c.includes('scenario') || c.includes('critical') || c.includes('unexpected'))) return true;
      return false;
    });

    // Strictly include only categories actually evaluated in this session
    if (matchingTurns.length > 0) {
      const totalAwarded = matchingTurns.reduce((acc, q) => acc + (q.awardedMarks !== undefined ? q.awardedMarks : (q.score / 10)), 0);
      const totalMax = matchingTurns.length * 10;
      const percentage = Math.round((totalAwarded / totalMax) * 100);
      categoryWisePerformance.push({
        category: masterCat,
        score: percentage,
        percentage,
        totalAwardedMarks: Number(totalAwarded.toFixed(1)),
        totalMaxMarks: totalMax,
        questionCount: matchingTurns.length,
        evidence: `Assessed across ${matchingTurns.length} question(s) regarding ${matchingTurns.map(q => q.topic).join(', ')}.`
      });
    }
  }

  // 6C-2. Skill-wise performance (Preserved for backwards compatibility with tests)
  const technicalQuestions = turns.filter(t => t.category && (t.category.toLowerCase().includes('tech') || t.category.toLowerCase().includes('oop') || t.category.toLowerCase().includes('data') || t.category.toLowerCase().includes('coding')));
  const projectQuestions = turns.filter(t => t.category && (t.category.toLowerCase().includes('project') || t.category.toLowerCase().includes('resume') || t.category.toLowerCase().includes('intro')));
  const problemSolvingQuestions = turns.filter(t => (t.difficulty === 'Hard' || t.category?.toLowerCase().includes('problem') || t.category?.toLowerCase().includes('scenario') || (t.topic && t.topic.toLowerCase().includes('internals'))));

  const calcCategoryScore = (questionList, fallbackScore) => {
    if (questionList.length === 0) return fallbackScore;
    const totalAwarded = questionList.reduce((acc, q) => acc + (q.awardedMarks !== undefined ? q.awardedMarks : (q.score / 10)), 0);
    return Math.min(100, Math.round((totalAwarded / (questionList.length * 10)) * 100));
  };

  const techScore = calcCategoryScore(technicalQuestions, performanceDimensions.technicalKnowledge);
  const projScore = calcCategoryScore(projectQuestions, performanceDimensions.projectUnderstanding);
  const probScore = calcCategoryScore(problemSolvingQuestions, performanceDimensions.problemSolving);
  const commScore = performanceDimensions.communication;
  const roleScore = Math.round((techScore * 0.4) + (projScore * 0.3) + (probScore * 0.3));

  const skillWisePerformance = [
    {
      skill: 'Technical Knowledge',
      score: techScore,
      percentage: techScore,
      evidence: technicalQuestions.length > 0
        ? `Evaluated across ${technicalQuestions.length} technical questions covering ${technicalQuestions.map(q => q.topic).join(', ')}.`
        : `Evaluated through foundational engineering concepts discussed during this interview.`
    },
    {
      skill: 'Resume and Project Understanding',
      score: projScore,
      percentage: projScore,
      evidence: projectQuestions.length > 0
        ? `Evaluated across ${projectQuestions.length} resume & project questions reflecting ${projectQuestions.map(q => q.topic).join(', ')}.`
        : `Assessed based on candidate self-introduction and architecture problem statements.`
    },
    {
      skill: 'Problem-Solving',
      score: probScore,
      percentage: probScore,
      evidence: `Evaluated on algorithmic logic, handling edge cases, and architectural trade-offs.`
    },
    {
      skill: 'Role-Specific Skills',
      score: roleScore,
      percentage: roleScore,
      evidence: `Calibrated specifically against the competency expectations for a ${sessionState.experienceLevel} ${sessionState.targetRole}.`
    },
    {
      skill: 'Communication & Explanation',
      score: commScore,
      percentage: commScore,
      evidence: `Assessed by clarity, logical structure, explanation depth, and verbal conciseness across all recorded answers.`
    }
  ];

  // 6D. Mistakes and weak areas (awardedMarks < 8.0, sorted by marks lost descending)
  const mistakesAndWeakAreas = turns
    .filter(t => {
      const awarded = t.awardedMarks !== undefined ? t.awardedMarks : (t.score ? t.score / 10 : 0);
      return awarded < 8.0;
    })
    .map(t => {
      const awarded = t.awardedMarks !== undefined ? t.awardedMarks : (t.score ? t.score / 10 : 0);
      const marksLost = Number((10 - awarded).toFixed(1));
      const whatMisunderstood = t.mistakeAnalysis?.whatMisunderstood || (
        t.evaluation?.whatYouMissed && t.evaluation.whatYouMissed.length > 0
          ? t.evaluation.whatYouMissed.join('; ')
          : `Omitted key underlying mechanisms for ${t.topic}.`
      );
      const whyIncompleteOrIncorrect = t.mistakeAnalysis?.whyIncompleteOrIncorrect || (
        t.classification === 'Irrelevant or off-topic'
          ? 'The answer did not directly address the prompt and discussed unrelated points.'
          : t.classification === 'Relevant but incorrect'
          ? 'The explanation contained conceptual inaccuracies regarding core system behavior.'
          : 'The answer provided only a high-level definition without explaining internal mechanics, data structures, or trade-offs.'
      );
      const correctConcept = t.mistakeAnalysis?.correctConcept || t.evaluation?.betterAnswer || `Understand the exact mechanics and architecture of ${t.topic}.`;
      const improvementExample = t.mistakeAnalysis?.improvementExample || `In your next interview, state the definition clearly, explain the internal data structures/lifecycles, and illustrate with a concrete code or project example.`;

      return {
        question: t.questionText,
        topic: t.topic,
        marksAwarded: awarded,
        marksLost,
        whatMisunderstood,
        whyIncompleteOrIncorrect,
        correctConcept,
        improvementExample
      };
    })
    .sort((a, b) => b.marksLost - a.marksLost);

  // 6E. Personalized learning plan (3 priorities)
  const p1Items = turns
    .filter(t => (t.awardedMarks !== undefined ? t.awardedMarks : t.score / 10) < 5.0)
    .map(t => ({
      topic: t.topic,
      reason: `Significant knowledge gap identified in "${t.topic}". Focus on core principles from the beginning.`,
      recommendedAction: `Study official documentation for ${t.topic}. Build a minimal reproducible proof-of-concept to master the fundamental data structures and lifecycle.`
    }));

  const p2Items = turns
    .filter(t => {
      const marks = t.awardedMarks !== undefined ? t.awardedMarks : t.score / 10;
      return marks >= 5.0 && marks < 8.0;
    })
    .map(t => ({
      topic: t.topic,
      reason: `Partially understood concept in "${t.topic}". Needs greater depth, edge-case coverage, and confidence.`,
      recommendedAction: `Practice explaining "${t.topic}" using the STAR method. Focus on trade-offs, time/space complexity, and architecture bottlenecks.`
    }));

  const p3Items = [
    {
      topic: `${sessionState.targetRole} High-Concurrency & System Design`,
      reason: 'Advance beyond basic syntax into production-grade scalability, caching (Redis), and asynchronous queues (Kafka).',
      recommendedAction: 'Design an end-to-end distributed system handling 10,000+ requests per second with database replication and load balancing.'
    },
    {
      topic: 'Automated Testing & CI/CD Pipeline Automation',
      reason: 'Industry standards require automated unit, integration, and contract tests before deploying to production.',
      recommendedAction: 'Implement comprehensive unit tests with JUnit/Jest and set up GitHub Actions workflows for continuous deployment.'
    }
  ];

  const recommendedPracticeQuestions = turns.slice(0, 4).map(t => ({
    topic: t.topic,
    question: `How does ${t.topic} work under high load or edge cases, and how would you debug a failure in production?`
  }));

  const personalizedLearningPlan = {
    priority1_mustImprove: p1Items.length > 0 ? p1Items : [
      {
        topic: 'Foundational Computer Science Principles',
        reason: 'Reinforce data structures, time complexity analysis, and clean code principles.',
        recommendedAction: 'Practice implementing core data structures (HashMaps, Trees, Graphs) from scratch.'
      }
    ],
    priority2_practiceMore: p2Items.length > 0 ? p2Items : [
      {
        topic: 'Project Architecture & Design Decisions',
        reason: 'Deepen the technical explanation of architectural trade-offs in your uploaded resume projects.',
        recommendedAction: 'Document schema diagrams, caching layers, and API specifications for each project on your resume.'
      }
    ],
    priority3_advancedLearning: p3Items,
    recommendedPracticeQuestions,
    recommendedProjects: [
      {
        name: `Production-Grade ${sessionState.targetRole} Microservice`,
        description: 'Build a containerized REST service with relational persistence, JWT authentication, caching, and health metrics.',
        technologies: ['Docker', 'Database Indexing', 'API Security', 'Automated Testing']
      }
    ]
  };

  // 6F. Final interviewer feedback
  const strongestAreas = Array.from(new Set([
    ...sessionState.strongTopics,
    ...(turns.filter(t => (t.awardedMarks !== undefined ? t.awardedMarks : t.score / 10) >= 8.0).map(t => t.topic))
  ]));

  const criticalMistakes = mistakesAndWeakAreas.slice(0, 3).map(m => `Lost ${m.marksLost} marks on ${m.topic}: ${m.whatMisunderstood}`);

  let roleReadinessVerdict = '';
  if (overallPercentage >= 85) {
    roleReadinessVerdict = `You demonstrated strong mastery of core concepts expected for a ${sessionState.experienceLevel} ${sessionState.targetRole}. Your answers were articulate, technically sound, and structured. Focus on system design and enterprise cloud architectures for tier-1 interviews.`;
  } else if (overallPercentage >= 70) {
    roleReadinessVerdict = `You have a solid foundation for the ${sessionState.targetRole} role with good technical familiarity. Addressing the few conceptual omissions highlighted in your weak areas will position you well for competitive technical screening rounds.`;
  } else if (overallPercentage >= 50) {
    roleReadinessVerdict = `You have foundational understanding of software development, but your explanations require deeper technical precision and practical project application. Reinforcing the Priority 1 & 2 topics will significantly elevate your performance.`;
  } else {
    roleReadinessVerdict = `This interview highlighted several critical knowledge gaps required for a ${sessionState.targetRole}. Systematic study of the fundamental concepts, practicing aloud, and building hands-on projects will help bridge these gaps.`;
  }

  const recommendedNextActions = [
    `Review the ${mistakesAndWeakAreas.length} weak areas detailed in this marksheet and study the suggested model answers.`,
    `Spend 30 minutes revising Priority 1 topics before scheduling your next mock interview.`,
    `Practice verbal articulation using the STAR framework to explain architectural decisions clearly within 90 seconds.`,
    `Retake the AI Voice Interview to verify your score progression and track competency gains.`
  ];

  const interviewerClosingFeedback = {
    strongestAreas: strongestAreas.length > 0 ? strongestAreas : ['Demonstrated willingness to engage with diverse engineering topics and communicate technical intent.'],
    criticalMistakes: criticalMistakes.length > 0 ? criticalMistakes : ['No major conceptual failures observed; continue refining low-level optimization details.'],
    roleReadinessVerdict,
    recommendedNextActions
  };

  const marksheet = {
    overallPerformance,
    questionByQuestionTable,
    categoryWisePerformance,
    skillWisePerformance,
    mistakesAndWeakAreas,
    personalizedLearningPlan,
    interviewerClosingFeedback
  };

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

  const strongAreas = Array.from(new Set(sessionState.strongTopics || []));
  const weakAreas = Array.from(new Set(sessionState.weakTopics || []));
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
    totalMarksObtained: Number(totalMarksObtained.toFixed(1)),
    totalMaxMarks,
    overallPercentage,
    marksheet,
    categoryWisePerformance,
    technicalKnowledge: performanceDimensions.technicalKnowledge,
    technicalScore: performanceDimensions.technicalKnowledge,
    projectUnderstanding: performanceDimensions.projectUnderstanding,
    problemSolving: performanceDimensions.problemSolving,
    communication: performanceDimensions.communication,
    communicationScore: performanceDimensions.communication,
    readinessTier,
    readinessColor,
    performanceDimensions,
    strongAreas,
    weakAreas,
    strengths: strongAreas.length > 0 ? strongAreas : ['Demonstrated hands-on familiarity with core technical implementations and project problem statements'],
    areasForImprovement: weakAreas.length > 0 ? weakAreas : ['Further deepen discussion of low-level architecture trade-offs and performance tuning'],
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
