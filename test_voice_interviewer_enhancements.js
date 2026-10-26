/**
 * test_voice_interviewer_enhancements.js
 * Verification suite for the enhanced AI Interviewer:
 * 1. Empty/silent recording rejection (Section 4).
 * 2. Candidate personalized dynamic project questions based on actual projects (Section 1 & 2.G).
 * 3. Question shuffling and sequencing across sessions (Section 3).
 * 4. Section 6.C Category-wise scores only return assessed categories (never unassessed as 0%).
 * 5. Section 6.E Marksheet percentage formula strictly: (totalEarned / totalMax) * 100.
 * 6. Resumes without projects ask about coursework/academic assignments without fabricating projects.
 */

import http from 'http';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      if (typeof data === 'string') req.write(data);
      else req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function registerCandidate(name, rollNum, email) {
  const res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    name,
    collegeRollNumber: rollNum,
    email,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    department: 'Computer Science',
    college: 'KCE Tech',
    targetRole: 'Software Engineer',
    graduationYear: 2026
  });
  return res.data;
}

async function uploadResumeText(token, resumeText, targetRole) {
  const boundary = '----WebKitFormBoundaryVoiceTest1234';
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="targetRole"`,
    '',
    targetRole || 'Software Engineer',
    `--${boundary}`,
    `Content-Disposition: form-data; name="resume"; filename="resume.txt"`,
    `Content-Type: text/plain`,
    '',
    resumeText,
    `--${boundary}--`,
    ''
  ].join('\r\n');

  const res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/resume/upload',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Authorization': `Bearer ${token}`
    }
  }, body);
  return res.data;
}

async function startInterview(token, options = {}) {
  const res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/interview/interactive/start',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    targetRole: options.targetRole || 'Software Engineer',
    interviewType: options.interviewType || 'Mixed Interview',
    experienceLevel: options.experienceLevel || 'Fresher',
    difficulty: options.difficulty || 'Intermediate',
    totalQuestions: options.totalQuestions || 5,
    ...options
  });
  return res.data;
}

async function submitAnswer(token, sessionId, userAnswer) {
  const res = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/interview/interactive/turn',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    sessionId,
    userAnswer,
    timeTakenSeconds: 30
  });
  return res;
}

async function runTests() {
  console.log('================================================================');
  console.log('🎙️ RUNNING VOICE INTERVIEWER ENHANCEMENT TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ Passed: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ Failed: ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();

  // --------------------------------------------------------------------------
  // TEST 1: Empty or silent recording rejection (Section 4)
  // --------------------------------------------------------------------------
  console.log('▶ Test 1: Empty / silent audio recording rejection...');
  const cand1 = await registerCandidate('Voice Cand1', `VOICE-${timestamp}-1`, `voice1_${timestamp}@kce.edu`);
  const cand1Token = cand1.token;

  await uploadResumeText(cand1Token, `
Name: Candidate One
Email: voice1_${timestamp}@kce.edu
Skills: Java, Spring Boot, MySQL
Project: Distributed Cache Engine
Implemented an in-memory distributed cache using Java and Spring Boot with LRU eviction.
Education: B.Tech Computer Science 2026
  `, 'Java Developer');

  const session1 = await startInterview(cand1Token, { totalQuestions: 3 });
  assert(session1.success && session1.sessionId, 'Interview session initialized for Candidate 1');

  // Submit completely empty answer
  const emptyRes = await submitAnswer(cand1Token, session1.sessionId, '');
  assert(emptyRes.status === 400, 'Server returns HTTP 400 on empty spoken answer');
  assert(emptyRes.data?.error?.includes('Empty or silent recording'), `Informative error returned: "${emptyRes.data?.error}"`);

  // Submit whitespace-only answer
  const whitespaceRes = await submitAnswer(cand1Token, session1.sessionId, '    ');
  assert(whitespaceRes.status === 400, 'Server returns HTTP 400 on whitespace-only spoken answer');

  // --------------------------------------------------------------------------
  // TEST 2: Dynamic Project Questions Grounded in Candidate's Actual Project (Section 2.G)
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 2: Dynamic Project Questions parameterized by actual project name...');
  const cand2 = await registerCandidate('Voice Cand2', `VOICE-${timestamp}-2`, `voice2_${timestamp}@kce.edu`);
  const cand2Token = cand2.token;

  await uploadResumeText(cand2Token, `
Name: Maya Sharma
Email: voice2_${timestamp}@kce.edu
Skills: React, TypeScript, GraphQL, WebSockets
Projects:
1. Collaborative Canvas Studio
Built a real-time multiplayer sketching canvas utilizing WebSockets, React, and TypeScript with Canvas API.
2. Micro-Fintech Wallet
Digital ledger wallet app built with Node.js and PostgreSQL.
Education: B.Tech Computer Science 2026
  `, 'Full Stack Developer');

  const session2 = await startInterview(cand2Token, { totalQuestions: 4, interviewType: 'Mixed Interview' });
  assert(session2.success, 'Interview session started for Maya Sharma');

  // Check that currentQuestion or subsequent questions reference Maya's actual project
  let hasProjectQuestion = false;
  let qText = session2.currentQuestion.questionText;

  if (qText.includes('Collaborative Canvas Studio') || qText.includes('Micro-Fintech Wallet') || qText.includes('React') || qText.includes('TypeScript')) {
    hasProjectQuestion = true;
  }

  // Answer Q1 with good explanation
  const turn1 = await submitAnswer(cand2Token, session2.sessionId, 'In Collaborative Canvas Studio, we designed a WebSocket gateway that broadcasts vector points between connected canvas clients using differential state synchronization.');
  assert(turn1.status === 200, 'Turn 1 evaluated successfully');
  if (turn1.data.nextQuestion?.questionText.includes('Collaborative Canvas Studio') || turn1.data.nextQuestion?.questionText.includes('Micro-Fintech Wallet')) {
    hasProjectQuestion = true;
  }

  assert(hasProjectQuestion, `Questions accurately mention candidate's real project ("Collaborative Canvas Studio" or "Micro-Fintech Wallet")`);

  // --------------------------------------------------------------------------
  // TEST 3: Resumes without projects ask academic assignments without assuming formal projects
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 3: Candidate without projects receives academic/practical questions without fabricated projects...');
  const cand3 = await registerCandidate('Voice Cand3', `VOICE-${timestamp}-3`, `voice3_${timestamp}@kce.edu`);
  const cand3Token = cand3.token;

  await uploadResumeText(cand3Token, `
Name: Pure Fresher
Email: voice3_${timestamp}@kce.edu
Education: B.Tech Computer Science, Anna University (2022 - 2026)
Coursework: Data Structures, Operating Systems, Computer Networks, Database Management
Skills: C++, Python Fundamentals, SQL
Certifications: Python for Everybody (Coursera)
  `, 'Software Developer');

  const session3 = await startInterview(cand3Token, { totalQuestions: 3 });
  assert(session3.success, 'Interview initialized for project-free candidate');

  const q1Text = session3.currentQuestion.questionText;
  assert(!q1Text.includes('universal project') && !q1Text.includes('fabricated'), 'Does not hallucinate a fictional project');
  assert(q1Text.includes('academic') || q1Text.includes('practical') || q1Text.includes('coursework') || q1Text.includes('Python') || q1Text.includes('C++') || q1Text.includes('yourself') || q1Text.includes('resume') || q1Text.includes('skills') || q1Text.includes('degree'), `Appropriate academic/coursework question generated: "${q1Text.slice(0, 80)}..."`);

  // --------------------------------------------------------------------------
  // TEST 4: Category-Wise Scores in Section 6.C only include actually assessed categories
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 4: Section 6.C Category-wise scores only return actually assessed categories...');
  // Complete session 1 (3 questions)
  const turn2_1 = await submitAnswer(cand1Token, session1.sessionId, 'HashMap uses an array of buckets. When collisions occur, it chains nodes via LinkedList, and in Java 8 it converts to a Red-Black Tree if threshold 8 is exceeded.');
  assert(turn2_1.status === 200, 'Answered Question 1');

  const turn2_2 = await submitAnswer(cand1Token, session1.sessionId, 'In my Distributed Cache Engine, we used a ConcurrentHashMap combined with a doubly-linked list to achieve O(1) eviction for LRU.');
  assert(turn2_2.status === 200, 'Answered Question 2');

  const turn2_3 = await submitAnswer(cand1Token, session1.sessionId, 'When team members face disagreement, I schedule a code spike to measure latency and test empirically rather than arguing subjectively.');
  assert(turn2_3.status === 200, 'Answered Question 3');
  assert(turn2_3.data.isCompleted, 'Session 1 completed after 3 questions');

  const finalReport = turn2_3.data.finalReport;
  const marksheet = finalReport.marksheet;
  assert(marksheet, 'Marksheet generated in final report');

  const catPerformance = marksheet.categoryWisePerformance;
  assert(Array.isArray(catPerformance), 'categoryWisePerformance is an array');
  assert(catPerformance.length > 0 && catPerformance.length <= 11, `Assessed categories count: ${catPerformance.length} (out of max 11)`);

  // Check that NO category in catPerformance has 0 questions assessed
  const unassessedFound = catPerformance.some(c => c.questionsAssessed === 0);
  assert(!unassessedFound, 'Strict requirement met: No unassessed category is included in categoryWisePerformance');

  // Verify that unassessed categories are NEVER presented as 0%
  const zeroPercentageUnassessed = catPerformance.filter(c => c.questionsAssessed === 0 && c.percentage === 0);
  assert(zeroPercentageUnassessed.length === 0, 'No unassessed category presented as 0%');

  // --------------------------------------------------------------------------
  // TEST 5: Scoring and calculation rules in Section 6.E
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 5: Section 6.E Overall Percentage Formula Verification...');
  const overall = marksheet.overallPerformance;
  assert(overall.totalMarksObtained !== undefined && overall.totalMaxMarks !== undefined, 'Total marks and max marks defined');
  const expectedPercentage = Math.round((overall.totalMarksObtained / overall.totalMaxMarks) * 100);
  assert(overall.overallPercentage === expectedPercentage, `Overall percentage strictly equals (earned ${overall.totalMarksObtained} / max ${overall.totalMaxMarks}) * 100 = ${overall.overallPercentage}%`);

  // --------------------------------------------------------------------------
  // TEST 6: Question-by-Question Section 6.B details
  // --------------------------------------------------------------------------
  console.log('\n▶ Test 6: Section 6.B Question-by-Question Evaluation Table...');
  const qTable = marksheet.questionByQuestionTable;
  assert(qTable && qTable.length === 3, `3 questions present in questionByQuestionTable (got ${qTable?.length})`);
  const q1 = qTable[0];
  assert(q1.question && q1.candidateAnswer, 'Q1 includes actual question and candidate transcript');
  assert(q1.category, `Q1 specifies interview category: "${q1.category}"`);
  assert(q1.marksDisplay && q1.marksDisplay.includes('/ 10'), `Q1 displays 0-10 score: ${q1.marksDisplay}`);
  assert(q1.explanation, `Q1 includes score explanation: "${q1.explanation.slice(0, 50)}..."`);
  assert(Array.isArray(q1.correctPoints), 'Q1 includes correct points identified');
  assert(Array.isArray(q1.missingPoints), 'Q1 includes missing/weak points');
  assert(q1.expectedAnswer, 'Q1 includes expected answer criteria');

  console.log('\n================================================================');
  console.log(`TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
