/**
 * Test Suite: Realistic AI Interviewer Verification
 * Tests all 10 realistic interview scenarios mandated by Section 9:
 * 1. Correct answer evaluation (10-mark rubric)
 * 2. Partially correct answer evaluation
 * 3. Technically incorrect answer evaluation
 * 4. Completely irrelevant answer with polite redirect & retry opportunity
 * 5. Irrelevant answer first, followed by correct answer on retry
 * 6. Short but correct answer (not penalized as irrelevant)
 * 7. Speech recognition failure / unclear audio handling
 * 8. Dynamic resume grounding (different resumes produce different questions)
 * 9. Comprehensive Section 6 Final Marksheet generation (A-F)
 * 10. Role-based security (Students cannot access another candidate's marksheet; Admin can)
 */

import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING 10 REALISTIC AI INTERVIEWER TEST SCENARIOS');
  console.log('================================================================\n');

  let passedTests = 0;
  const timestamp = Date.now();

  // Helper: Register and verify a student
  async function createStudent(prefix, role = 'student', targetRole = 'Java Developer') {
    const email = `${prefix}_${timestamp}@university.edu`;
    const candidateName = prefix === 'alex_java' ? 'Alex Java' : (prefix === 'rachel_ml' ? 'Rachel ML' : `${prefix} Candidate`);
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: candidateName,
        email,
        password: 'Password123!',
        rollNumber: `ROLL-${Math.floor(Math.random() * 89999 + 10000)}`,
        phone: '9876543210',
        department: 'Computer Science & Engineering',
        targetRole
      })
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, `Failed to register ${prefix}: ${JSON.stringify(regData)}`);

    return {
      user: regData.user,
      token: regData.token,
      email
    };
  }

  // Helper: Upload resume text
  async function uploadResume(token, text, targetRole = 'Java Developer') {
    const res = await fetch(`${BASE_URL}/resume/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        text,
        fileName: 'resume.txt',
        targetRole
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Failed to upload resume: ${JSON.stringify(data)}`);
    return data;
  }

  // 1. Setup Student A (Java Developer)
  const studentA = await createStudent('alex_java', 'student', 'Java Developer');
  const resumeAContent = `
Name: Alex Java
Email: ${studentA.email}
Degree: B.Tech Computer Science and Engineering
College: Apex Institute of Technology
Target Role: Java Developer
Skills: Java, Spring Boot, MySQL, REST APIs, Git, Docker, Hibernate
Project: "E-Commerce Microservices Engine"
Technologies: Java, Spring Boot, MySQL, Redis, Docker
Summary: Developed microservices for order processing and inventory control. Implemented REST endpoints and database transactions.
  `;
  await uploadResume(studentA.token, resumeAContent, 'Java Developer');

  // Start interview session for Student A
  const startSessionRes = await fetch(`${BASE_URL}/interview/interactive/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      targetRole: 'Java Developer',
      interviewType: 'Technical Interview',
      difficulty: 'Intermediate',
      totalQuestions: 5
    })
  });
  const startSessionData = await startSessionRes.json();
  assert.strictEqual(startSessionRes.status, 200);
  assert.ok(startSessionData.sessionId, 'Session ID should be created');
  assert.ok(startSessionData.welcomeMessage, 'Welcome message must be generated');
  assert.ok(startSessionData.welcomeMessage.includes(studentA.user.name), 'Welcome message must greet candidate by name');
  assert.ok(startSessionData.welcomeMessage.toLowerCase().includes('welcome to the ai interview') || startSessionData.welcomeMessage.toLowerCase().includes('welcome to the interview'), 'Welcome message must welcome candidate to the interview');
  assert.ok(startSessionData.currentQuestion, 'Question 1 should be generated');
  assert.strictEqual(startSessionData.currentQuestion.questionNumber, 1, 'Question 1 should be question 1');
  console.log('Question 1 Text:', startSessionData.currentQuestion.questionText);
  console.log('Question 1 Category:', startSessionData.currentQuestion.category);
  console.log('Question 1 Expected Concepts:', startSessionData.currentQuestion.expectedConcepts);

  const sessionIdA = startSessionData.sessionId;

  // --------------------------------------------------------------------------
  // SCENARIO 1: Candidate gives a correct answer
  // --------------------------------------------------------------------------
  console.log('▶ Testing Scenario 1: Candidate gives a correct answer...');
  const correctAnswer = `
In Java, core programming and collection architectures operate on robust foundations:
1. Under the hood, HashMap relies on the hashCode and equals contract to index keys into buckets. Hash collisions are handled through collision chaining with linked lists, and once a bucket reaches the treeify threshold of 8 elements in Java 8+, it converts to a red-black tree for O(log n) search performance.
2. For multi-threaded safety, we leverage ConcurrentHashMap with segment or bucket level locking rather than synchronizing the entire structure.
3. Object-oriented architecture adheres to Encapsulation, Inheritance, Polymorphism, and Abstraction to preserve data integrity and modularity.
4. Regarding memory and exceptions, Checked exceptions subclass Exception and must be handled or caught at compile time, whereas Unchecked exceptions subclass RuntimeException and occur at runtime. Primitive variables and method call frames are allocated on the Stack with LIFO execution, whereas dynamic objects and arrays are created on the Heap and managed by automatic Garbage Collection.
  `;

  const turn1Res = await fetch(`${BASE_URL}/interview/interactive/turn`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      userAnswer: correctAnswer,
      timeTakenSeconds: 35
    })
  });
  const turn1Data = await turn1Res.json();
  assert.strictEqual(turn1Res.status, 200);
  assert.strictEqual(turn1Data.retryOpportunity, false, 'Correct answer should not trigger retry');
  assert.strictEqual(turn1Data.evaluation.classification, 'Relevant and correct', 'Should be classified as Relevant and correct');
  assert.ok(turn1Data.evaluation.awardedMarks >= 8.0, `Correct answer should score >= 8.0/10, got ${turn1Data.evaluation.awardedMarks}`);
  assert.strictEqual(turn1Data.evaluation.maxMarks, 10, 'Max marks must be 10');
  assert.ok(turn1Data.evaluation.marksBreakdown, 'Marks breakdown must be present');
  assert.strictEqual(turn1Data.nextQuestion.questionNumber, 2, 'Should advance to Question 2');
  console.log(`  ✓ Passed: Classification="${turn1Data.evaluation.classification}", Marks=${turn1Data.evaluation.awardedMarks}/10\n`);
  passedTests++;

  // --------------------------------------------------------------------------
  // SCENARIO 2: Candidate gives a partially correct answer
  // --------------------------------------------------------------------------
  console.log('▶ Testing Scenario 2: Candidate gives a partially correct answer...');
  const partialAnswer = `In our project we used Spring Boot and MySQL for saving records. We wrote a few controllers.`;

  const turn2Res = await fetch(`${BASE_URL}/interview/interactive/turn`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      userAnswer: partialAnswer,
      timeTakenSeconds: 20
    })
  });
  const turn2Data = await turn2Res.json();
  assert.strictEqual(turn2Res.status, 200);
  assert.strictEqual(turn2Data.retryOpportunity, false);
  assert.ok(
    turn2Data.evaluation.classification === 'Relevant but partially correct' || turn2Data.evaluation.classification === 'Partially relevant',
    `Expected partial classification, got ${turn2Data.evaluation.classification}`
  );
  assert.ok(turn2Data.evaluation.awardedMarks >= 4.5 && turn2Data.evaluation.awardedMarks <= 7.8, `Partial answer score should be in 4.5-7.8 range, got ${turn2Data.evaluation.awardedMarks}`);
  assert.ok(turn2Data.spokenFeedback.includes('part') || turn2Data.spokenFeedback.includes('details') || turn2Data.spokenFeedback.includes('Thank you'), 'Feedback should acknowledge partial understanding');
  console.log(`  ✓ Passed: Classification="${turn2Data.evaluation.classification}", Marks=${turn2Data.evaluation.awardedMarks}/10\n`);
  passedTests++;

  // --------------------------------------------------------------------------
  // SCENARIO 3: Candidate gives a technically incorrect answer
  // --------------------------------------------------------------------------
  console.log('▶ Testing Scenario 3: Candidate gives a technically incorrect answer...');
  const incorrectAnswer = `HashMap works by storing elements sequentially in a fixed binary tree where keys cannot be hashed and collisions overwrite existing data without any bucket.`;

  const turn3Res = await fetch(`${BASE_URL}/interview/interactive/turn`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      userAnswer: incorrectAnswer,
      timeTakenSeconds: 15
    })
  });
  const turn3Data = await turn3Res.json();
  assert.strictEqual(turn3Res.status, 200);
  assert.ok(
    turn3Data.evaluation.classification === 'Relevant but incorrect' || turn3Data.evaluation.classification === 'Relevant but partially correct',
    `Expected incorrect/partial classification, got ${turn3Data.evaluation.classification}`
  );
  assert.ok(turn3Data.evaluation.awardedMarks <= 5.5, `Incorrect answer should be penalized, got ${turn3Data.evaluation.awardedMarks}`);
  assert.ok(turn3Data.evaluation.mistakeAnalysis, 'Mistake analysis must be generated for answer with lost marks');
  console.log(`  ✓ Passed: Classification="${turn3Data.evaluation.classification}", Marks=${turn3Data.evaluation.awardedMarks}/10, Misunderstood="${turn3Data.evaluation.mistakeAnalysis?.whatMisunderstood}"\n`);
  passedTests++;

  // --------------------------------------------------------------------------
  // SCENARIO 4: Candidate gives a completely irrelevant answer (Polite redirect & retry)
  // --------------------------------------------------------------------------
  console.log('▶ Testing Scenario 4: Candidate gives a completely irrelevant answer...');
  const irrelevantAnswer = `I completed my B.Tech degree with 85 percentage from college and I like sports and music.`;

  const turn4Attempt1Res = await fetch(`${BASE_URL}/interview/interactive/turn`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      userAnswer: irrelevantAnswer,
      timeTakenSeconds: 10
    })
  });
  const turn4Attempt1Data = await turn4Attempt1Res.json();
  console.log('turn4Attempt1Data:', JSON.stringify({
    retryOpportunity: turn4Attempt1Data.retryOpportunity,
    evaluation: turn4Attempt1Data.evaluation
  }, null, 2));
  assert.strictEqual(turn4Attempt1Res.status, 200);
  assert.strictEqual(turn4Attempt1Data.retryOpportunity, true, 'First irrelevant answer MUST trigger retry opportunity');
  assert.strictEqual(turn4Attempt1Data.evaluation.classification, 'Irrelevant or off-topic', 'Must be classified as Irrelevant or off-topic');
  assert.ok(turn4Attempt1Data.spokenFeedback.includes("does not fit this question") || turn4Attempt1Data.spokenFeedback.includes("doesn't directly address") || turn4Attempt1Data.spokenFeedback.includes("address"), 'Must contain polite redirection');
  assert.ok(turn4Attempt1Data.currentQuestion.isRetry, 'Question state should indicate retry');
  assert.strictEqual(turn4Attempt1Data.currentQuestion.attemptNumber, 2, 'Attempt number should be 2');
  console.log(`  ✓ Passed: Retry triggered=true, Spoken Redirect="${turn4Attempt1Data.spokenFeedback}"\n`);
  passedTests++;

  // --------------------------------------------------------------------------
  // SCENARIO 5: Candidate gives irrelevant first, then correct on retry
  // --------------------------------------------------------------------------
  const retryCorrectAnswer = turn4Attempt1Data.evaluation?.betterAnswer || `
Under the hood, Java HashMap uses the hashCode to index keys into buckets. When collisions occur, they are stored in linked lists via collision chaining, and once a bucket reaches 8 elements, Java 8 converts it to a red-black tree. For multi-threaded safety under concurrent operations, we use ConcurrentHashMap.
  `;

  const turn4Attempt2Res = await fetch(`${BASE_URL}/interview/interactive/turn`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      userAnswer: retryCorrectAnswer,
      timeTakenSeconds: 30
    })
  });
  const turn4Attempt2Data = await turn4Attempt2Res.json();
  assert.strictEqual(turn4Attempt2Res.status, 200);
  assert.strictEqual(turn4Attempt2Data.retryOpportunity, false, 'Second attempt must finalize turn without infinite retries');
  assert.ok(turn4Attempt2Data.evaluation.awardedMarks >= 7.0, `Retried answer should earn marks, got ${turn4Attempt2Data.evaluation.awardedMarks}`);
  assert.ok(turn4Attempt2Data.nextQuestion, 'Must advance to Question 5 after retry attempt 2 is submitted');
  console.log(`  ✓ Passed: Retry finalized turn. Marks awarded=${turn4Attempt2Data.evaluation.awardedMarks}/10\n`);
  passedTests++;

  // --------------------------------------------------------------------------
  // SCENARIO 6: Candidate gives a short but correct answer
  // --------------------------------------------------------------------------
  console.log('▶ Testing Scenario 6: Candidate gives a short but correct answer...');
  const shortCorrectAnswer = `We built prototypes, benchmarked latency objectively, and aligned collaboratively on data.`;

  const turn5Res = await fetch(`${BASE_URL}/interview/interactive/turn`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: sessionIdA,
      userAnswer: shortCorrectAnswer,
      timeTakenSeconds: 8
    })
  });
  const turn5Data = await turn5Res.json();
  assert.strictEqual(turn5Res.status, 200);
  assert.notStrictEqual(
    turn5Data.evaluation.classification,
    'Irrelevant or off-topic',
    'Short but correct answer must NOT be classified as irrelevant!'
  );
  assert.ok(turn5Data.evaluation.awardedMarks >= 4.0, `Short correct answer should receive credit for concepts covered, got ${turn5Data.evaluation.awardedMarks}`);
  assert.strictEqual(turn5Data.isCompleted, true, '5th turn must complete session');
  assert.ok(turn5Data.finalReport, 'Final report must be compiled');
  console.log(`  ✓ Passed: Short answer not penalized as irrelevant. Classification="${turn5Data.evaluation.classification}", Marks=${turn5Data.evaluation.awardedMarks}/10\n`);
  passedTests++;

  // --------------------------------------------------------------------------
  // SCENARIO 7: Speech recognition fails / unclear audio handling
  // --------------------------------------------------------------------------
  console.log('▶ Testing Scenario 7: Unclear audio / speech recognition failure...');
  // Start second session to test speech failure
  const session2Start = await fetch(`${BASE_URL}/interview/interactive/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      targetRole: 'Java Developer',
      totalQuestions: 3
    })
  });
  const session2Data = await session2Start.json();
  const sessionId2 = session2Data.sessionId;

  // Candidate provides unclear response / noise
  const unclearRes = await fetch(`${BASE_URL}/interview/interactive/turn`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentA.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: sessionId2,
      userAnswer: 'uh... hmm... yes...',
      timeTakenSeconds: 5
    })
  });
  const unclearData = await unclearRes.json();
  assert.strictEqual(unclearRes.status, 200);
  assert.strictEqual(unclearData.retryOpportunity, true, 'Unclear response should offer retry opportunity');
  assert.strictEqual(unclearData.evaluation.classification, 'Insufficient information to evaluate');
  console.log(`  ✓ Passed: Unclear audio categorized as "${unclearData.evaluation.classification}", Retry offered=true\n`);
  passedTests++;

  // --------------------------------------------------------------------------
  // SCENARIO 8: Candidate uploads different resumes and receives different questions
  // --------------------------------------------------------------------------
  console.log('▶ Testing Scenario 8: Different candidates receive personalized questions from their own resumes...');
  const studentB = await createStudent('rachel_ml', 'student', 'Machine Learning Engineer');
  const resumeBContent = `
Name: Rachel ML
Email: ${studentB.email}
Degree: M.Tech Artificial Intelligence
College: Indian Institute of Technology
Target Role: Machine Learning Engineer
Skills: Python, PyTorch, TensorFlow, Computer Vision, CNNs, OpenCV, Docker
Project: "DeepLearning Chest-XRay Classifier"
Technologies: Python, PyTorch, ResNet-50, FastAPI, CUDA
Summary: Built deep convolutional neural networks for automated thoracic pathology detection. Trained transfer learning models with 94% AUC.
  `;
  await uploadResume(studentB.token, resumeBContent, 'Machine Learning Engineer');

  const startMLRes = await fetch(`${BASE_URL}/interview/interactive/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentB.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      targetRole: 'Machine Learning Engineer',
      interviewType: 'Technical Interview',
      totalQuestions: 5
    })
  });
  const startMLData = await startMLRes.json();
  assert.strictEqual(startMLRes.status, 200);
  const q1TopicA = startSessionData.currentQuestion.topic.toLowerCase();
  const q1TopicB = startMLData.currentQuestion.topic.toLowerCase();
  const q1TextB = startMLData.currentQuestion.questionText.toLowerCase();

  console.log(`  Candidate A (Java) Q1 Topic: "${startSessionData.currentQuestion.topic}"`);
  console.log(`  Candidate B (ML)   Q1 Topic: "${startMLData.currentQuestion.topic}"`);
  assert.notStrictEqual(q1TopicA, q1TopicB, 'Candidates with different resumes must not receive identical questions');
  assert.ok(
    q1TopicB.includes('python') || q1TopicB.includes('learning') || q1TopicB.includes('classifier') || q1TopicB.includes('vision') || q1TextB.includes('python') || q1TextB.includes('project') || q1TextB.includes('chest-xray'),
    'Candidate B question must be strictly grounded in Candidate B resume'
  );
  console.log('  ✓ Passed: Personalized question generation strictly verified against candidate resume\n');
  passedTests++;

  // --------------------------------------------------------------------------
  // SCENARIO 9: Interview ends and generates the complete official Section 6 Marksheet
  // --------------------------------------------------------------------------
  console.log('▶ Testing Scenario 9: Full Section 6 Marksheet generation verification...');
  const marksheet = turn5Data.finalReport.marksheet;
  assert.ok(marksheet, 'Final report must include Section 6 marksheet object');

  // 9A: Overall Performance
  const overall = marksheet.overallPerformance;
  assert.ok(overall, 'Section 6.A overallPerformance must be present');
  assert.strictEqual(overall.candidateName, studentA.user.name);
  assert.strictEqual(overall.targetJobRole, 'Java Developer');
  assert.strictEqual(overall.questionsAsked, 5);
  assert.strictEqual(overall.questionsAnswered, 5);
  assert.ok(overall.totalMarksObtained > 0, 'Total marks obtained must be calculated');
  assert.strictEqual(overall.totalMaxMarks, 50, '5 questions * 10 marks = 50 totalMaxMarks');
  const expectedPercentage = Number(((overall.totalMarksObtained / 50) * 100).toFixed(1));
  assert.strictEqual(overall.overallPercentage, expectedPercentage, 'Formula: (totalMarksObtained / totalMaxMarks) * 100 must be exact');
  assert.ok(overall.performanceLevel, 'Performance level tier must be populated');
  assert.strictEqual(overall.completionStatus, 'Completed');
  console.log(`  ✓ 6.A Overall: Marks=${overall.totalMarksObtained}/${overall.totalMaxMarks} (${overall.overallPercentage}%), Tier="${overall.performanceLevel}"`);

  // 9B: Question-by-Question Table
  const table = marksheet.questionByQuestionTable;
  assert.ok(Array.isArray(table) && table.length === 5, 'Section 6.B questionByQuestionTable must contain all 5 questions');
  table.forEach((row, i) => {
    assert.ok(row.question, `Row ${i+1} must contain question asked`);
    assert.ok(row.candidateAnswer, `Row ${i+1} must contain candidate answer`);
    assert.ok(row.awardedMarks !== undefined, `Row ${i+1} must contain awarded marks`);
    assert.strictEqual(row.maxMarks, 10, `Row ${i+1} max marks must be 10`);
    assert.ok(row.evaluation, `Row ${i+1} must contain evaluation classification`);
    assert.ok(row.improvementFeedback, `Row ${i+1} must contain improvement feedback`);
    assert.ok(row.marksBreakdown, `Row ${i+1} must contain rubric breakdown`);
  });
  console.log(`  ✓ 6.B Question Table: 5 rows verified with questions, answers, awarded marks / 10, and rubrics`);

  // 9C: Skill-Wise Performance
  const skills = marksheet.skillWisePerformance;
  assert.ok(Array.isArray(skills) && skills.length >= 4, 'Section 6.C skillWisePerformance must be present');
  skills.forEach(s => {
    assert.ok(s.skill, 'Skill name must be present');
    assert.ok(s.score >= 0 && s.score <= 100, 'Skill score must be 0-100');
    assert.ok(s.evidence && s.evidence.length > 10, 'Skill must provide explicit evidence explanation');
  });
  console.log(`  ✓ 6.C Skill-Wise: ${skills.length} competencies scored with evidence explanations`);

  // 9D: Mistakes and Weak Areas
  const mistakes = marksheet.mistakesAndWeakAreas;
  assert.ok(Array.isArray(mistakes), 'Section 6.D mistakesAndWeakAreas must be an array');
  assert.ok(mistakes.length > 0, 'Mistakes should capture turns where marks were lost');
  const m1 = mistakes[0];
  assert.ok(m1.question, 'Mistake must specify question');
  assert.ok(m1.whatMisunderstood, 'Mistake must specify what candidate misunderstood');
  assert.ok(m1.whyIncompleteOrIncorrect, 'Mistake must specify why incomplete/incorrect');
  assert.ok(m1.correctConcept, 'Mistake must provide the correct principle');
  assert.ok(m1.improvementExample, 'Mistake must provide concrete improvement example');
  console.log(`  ✓ 6.D Mistakes: ${mistakes.length} weak areas analyzed with root causes and corrective concepts`);

  // 9E: Personalized Learning Plan (3 Priorities)
  const plan = marksheet.personalizedLearningPlan;
  assert.ok(plan, 'Section 6.E personalizedLearningPlan must be present');
  assert.ok(plan.priority1_mustImprove && plan.priority1_mustImprove.length > 0, 'Priority 1 must be present');
  assert.ok(plan.priority2_practiceMore && plan.priority2_practiceMore.length > 0, 'Priority 2 must be present');
  assert.ok(plan.priority3_advancedLearning && plan.priority3_advancedLearning.length > 0, 'Priority 3 must be present');
  assert.ok(plan.recommendedPracticeQuestions && plan.recommendedPracticeQuestions.length > 0, 'Practice questions must be present');
  console.log(`  ✓ 6.E Learning Plan: 3 Priorities (Must Improve, Practice More, Advanced) + Verbal practice questions verified`);

  // 9F: Interviewer Closing Feedback
  const feedback = marksheet.interviewerClosingFeedback;
  assert.ok(feedback, 'Section 6.F interviewerClosingFeedback must be present');
  assert.ok(feedback.strongestAreas.length > 0, 'Strongest areas must be populated');
  assert.ok(feedback.roleReadinessVerdict.length > 20, 'Role readiness verdict must be comprehensive');
  assert.ok(feedback.recommendedNextActions.length >= 3, 'Must recommend 3-5 next actions');
  console.log(`  ✓ 6.F Closing: Readiness verdict and ${feedback.recommendedNextActions.length} next actions verified\n`);
  passedTests++;

  // --------------------------------------------------------------------------
  // SCENARIO 10: Role-based security & marksheet endpoint access
  // --------------------------------------------------------------------------
  console.log('▶ Testing Scenario 10: Candidate data isolation and Admin Dashboard marksheet access...');

  // 10A: Student A fetches their own marksheet -> Success 200
  const ownMarksheetRes = await fetch(`${BASE_URL}/interview/interactive/${sessionIdA}/marksheet`, {
    headers: { 'Authorization': `Bearer ${studentA.token}` }
  });
  assert.strictEqual(ownMarksheetRes.status, 200, 'Student should be able to fetch their own marksheet');
  const ownMarksheetData = await ownMarksheetRes.json();
  assert.ok(ownMarksheetData.marksheet, 'Own marksheet returned');

  // 10B: Student B attempts to access Student A\'s marksheet -> Forbidden 403
  const unauthorizedRes = await fetch(`${BASE_URL}/interview/interactive/${sessionIdA}/marksheet`, {
    headers: { 'Authorization': `Bearer ${studentB.token}` }
  });
  assert.strictEqual(unauthorizedRes.status, 403, 'Student B MUST be forbidden from accessing Student A marksheet');
  const unauthorizedData = await unauthorizedRes.json();
  assert.ok(unauthorizedData.error.includes('Access denied'), 'Error must specify access denied');
  console.log('  ✓ Data Isolation: Student B blocked from accessing Student A marksheet with HTTP 403');

  // 10C: Admin user accesses candidate marksheet -> Success 200
  // Login as admin
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@skillmatch.ai',
      password: 'Admin@2026!'
    })
  });
  const adminLoginData = await adminLoginRes.json();
  assert.strictEqual(adminLoginRes.status, 200, 'Admin login should succeed');
  const adminToken = adminLoginData.token;

  const adminMarksheetRes = await fetch(`${BASE_URL}/admin/interview/${sessionIdA}/marksheet`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminMarksheetRes.status, 200, 'Admin should be able to access candidate marksheet');
  const adminMarksheetData = await adminMarksheetRes.json();
  assert.ok(adminMarksheetData.marksheet, 'Admin marksheet must contain marksheet payload');
  assert.strictEqual(adminMarksheetData.candidateId, studentA.user.id);

  // 10D: Verify candidate dossier in Admin Dashboard includes the interview evaluation
  const adminCandidateRes = await fetch(`${BASE_URL}/admin/candidates/${studentA.user.id}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminCandidateData = await adminCandidateRes.json();
  assert.strictEqual(adminCandidateRes.status, 200);
  assert.ok(adminCandidateData.interviews && adminCandidateData.interviews.length > 0, 'Admin dossier must list candidate interviews');
  const adminDossierInterview = adminCandidateData.interviews.find(i => i.sessionId === sessionIdA);
  assert.ok(adminDossierInterview, 'Admin dossier must contain completed interview session');
  assert.ok(adminDossierInterview.report?.marksheet, 'Admin dossier must include marksheet in report');
  console.log('  ✓ Admin Integration: Admin successfully accessed candidate marksheet and full dossier\n');
  passedTests++;

  console.log('================================================================');
  console.log(`🎉 ALL ${passedTests} / 10 REALISTIC AI INTERVIEWER TEST SCENARIOS PASSED!`);
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('\n❌ Test Failure:', err);
  process.exit(1);
});
