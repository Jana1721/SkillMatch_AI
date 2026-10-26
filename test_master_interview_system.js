import assert from 'assert';
import {
  startInterviewSession,
  submitInterviewAnswer,
  recordTabSwitchEvent,
  compileFinalInterviewReport
} from './server/services/interactiveInterviewer.js';
import { INTERVIEW_DOMAINS } from './server/services/aiInterviewService.js';

async function runMasterVerification() {
  console.log('=== RUNNING MASTER VERIFICATION: SKILLMATCH AI ENHANCED INTERVIEWER ===\n');

  // Test 1: Verify all 19 required domains are available
  console.log('Test 1: Verify 19 Specialized Interview Domains...');
  const requiredDomains = [
    'Software Development',
    'Java Development',
    'Python Development',
    'Web Development',
    'Frontend Development',
    'Backend Development',
    'Full-Stack Development',
    'Data Analytics',
    'Data Science and Machine Learning',
    'Artificial Intelligence',
    'Cloud Computing',
    'Cybersecurity',
    'Database Management and SQL',
    'Software Testing and QA',
    'ServiceNow',
    'HR and Behavioral Interviews',
    'Fresher and Graduate Interviews',
    'Project-Based Interviews',
    'General Technical Interviews'
  ];

  requiredDomains.forEach((domain) => {
    assert(INTERVIEW_DOMAINS.includes(domain), `Domain missing from backend bank: ${domain}`);
  });
  console.log('✓ All 19 required domains verified in backend interview bank.\n');

  // Test 2: Mode 1 - Resume-Based Personalized Interview
  console.log('Test 2: Mode 1 — Resume-Based Personalized Interview...');
  const candidateResume = {
    id: 'res-cand-101',
    parsedData: {
      contact: { name: 'Priya Sharma', email: 'priya@example.com' },
      skills: { allSkillsFound: ['Java', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Docker'] },
      projects: [
        {
          name: 'Distributed Order Streaming Engine',
          technologies: ['Java', 'Kafka', 'Spring Boot', 'PostgreSQL'],
          description: 'High-throughput event-driven order processing engine handling 20,000 events/sec.'
        }
      ],
      education: [{ degree: 'B.E. Computer Engineering', college: 'PSG College of Technology' }]
    }
  };

  const resumeSession = await startInterviewSession({
    userId: 'user-priya-101',
    interviewMode: 'resume',
    targetRole: 'Java Developer',
    interviewType: 'Mixed Interview',
    experienceLevel: 'Fresher',
    difficulty: 'Intermediate',
    totalQuestions: 5,
    resumeData: candidateResume
  });

  assert(resumeSession.sessionId, 'Session ID must be created');
  assert(resumeSession.currentQuestion, 'Question 1 must be loaded');
  assert.strictEqual(resumeSession.welcomeMessage, 'Hi, Priya Sharma! Welcome to the AI Interview.');
  assert.strictEqual(resumeSession.progress.total, 5);

  // Submit answer for Question 1
  const ans1 = await submitInterviewAnswer({
    sessionId: resumeSession.sessionId,
    userId: 'user-priya-101',
    candidateAnswer: 'I developed the Distributed Order Streaming Engine using Java and Spring Boot with Kafka for asynchronous pub-sub messaging. My role was designing the consumer partition rebalancing logic.',
    durationSeconds: 25
  });
  assert(ans1.success, 'Turn 1 submission must succeed');
  assert(ans1.evaluation.awardedMarks >= 5, 'Spoken answer grounded in project must be rewarded');
  console.log('✓ Mode 1 personalized resume flow verified successfully.\n');

  // Test 3: Mode 2 - Manual Domain Practice (Without Resume)
  console.log('Test 3: Mode 2 — Manual Domain Practice Without Resume...');
  const manualSession = await startInterviewSession({
    userId: 'user-manual-202',
    interviewMode: 'manual',
    domain: 'Cybersecurity',
    specialization: 'Security Operations & Incident Response',
    interviewType: 'Technical Interview',
    experienceLevel: 'Beginner',
    difficulty: 'Medium',
    totalQuestions: 3
  });

  assert(manualSession.sessionId, 'Manual session ID must be created');
  assert(manualSession.currentQuestion, 'Question 1 for Cybersecurity must be generated');
  assert.strictEqual(manualSession.welcomeMessage, 'Hi! Welcome to the AI Interview.');
  console.log(`  Cybersecurity Question 1: "${manualSession.currentQuestion.questionText}"`);

  // Submit answer for manual question
  console.log(`  Submitting answer addressing Question 1: "${manualSession.currentQuestion.questionText}"...`);
  const manualAns1 = await submitInterviewAnswer({
    sessionId: manualSession.sessionId,
    userId: 'user-manual-202',
    candidateAnswer: 'SQL injection is prevented by using parameterized queries and prepared statements, ensuring user input is treated as data rather than executable code. XSS is mitigated through context-aware output encoding, strict input sanitization, and Content Security Policy (CSP) headers. In a TLS handshake, asymmetric encryption with public and private keys is used to authenticate the server and securely exchange a symmetric pre-master secret key. Once established, high-performance symmetric session encryption (like AES-GCM) is used for bulk data transfer.',
    durationSeconds: 32
  });
  console.log(`  Awarded marks: ${manualAns1.evaluation.awardedMarks}/10. Spoken feedback: "${manualAns1.spokenFeedback}"`);
  assert(manualAns1.success, 'Turn 1 submission for manual domain practice must succeed');
  assert(manualAns1.evaluation.awardedMarks >= 7, 'Accurate technical answer matching question must receive strong score');
  console.log('✓ Mode 2 manual domain practice verified without requiring resume.\n');

  // Test 4: Tab-Switch Detection Proctoring (3 Events Max & Termination)
  console.log('Test 4: Tab-Switch Detection Proctoring (Max 3 Events)...');
  const proctorSession = await startInterviewSession({
    userId: 'user-proctor-303',
    interviewMode: 'manual',
    domain: 'Cloud Computing',
    interviewType: 'Technical Interview',
    experienceLevel: 'Intermediate',
    difficulty: 'Medium',
    totalQuestions: 3
  });

  const pSessionId = proctorSession.sessionId;

  // Event 1
  const switch1 = await recordTabSwitchEvent({
    sessionId: pSessionId,
    userId: 'user-proctor-303',
    eventNumber: 1,
    maxEvents: 3
  });
  assert.strictEqual(switch1.eventNumber, 1);
  assert.strictEqual(switch1.maxEvents, 3);
  assert.strictEqual(switch1.shouldTerminate, false);
  assert(switch1.warningMessage.includes('switched away from the interview'));

  // Event 2
  const switch2 = await recordTabSwitchEvent({
    sessionId: pSessionId,
    userId: 'user-proctor-303',
    eventNumber: 2,
    maxEvents: 3
  });
  assert.strictEqual(switch2.eventNumber, 2);
  assert.strictEqual(switch2.shouldTerminate, false);
  assert(switch2.warningMessage.includes('Warning 2 of 3'));

  // Event 3 (Limit Reached)
  const switch3 = await recordTabSwitchEvent({
    sessionId: pSessionId,
    userId: 'user-proctor-303',
    eventNumber: 3,
    maxEvents: 3
  });
  assert.strictEqual(switch3.eventNumber, 3);
  assert.strictEqual(switch3.shouldTerminate, true);
  assert(switch3.warningMessage.includes('Maximum tab-switch limit reached'));

  // Verified final report generated upon termination
  const finalReport = switch3.finalReport;
  assert(finalReport, 'Final report must be compiled');
  assert.strictEqual(finalReport.tabSwitchTerminated, true);
  assert.strictEqual(finalReport.tabSwitchCount, 3);
  assert(finalReport.interviewMode.toLowerCase().includes('manual'), 'Interview mode must indicate manual practice');
  assert.strictEqual(finalReport.selectedDomain, 'Cloud Computing');
  assert(finalReport.marksheet.overallPerformance.tabSwitchTerminated, 'Marksheet must reflect termination');
  assert(finalReport.marksheet.overallPerformance.completionStatus.includes('Terminated'), 'Completion status must reflect termination');

  // Verify formula: Overall percentage = (Total earned score ÷ Total possible score) × 100
  const overall = finalReport.marksheet.overallPerformance;
  const expectedPercentage = overall.totalMaxMarks > 0
    ? Math.round((overall.totalMarksObtained / overall.totalMaxMarks) * 100)
    : 0;
  assert.strictEqual(overall.overallPercentage, expectedPercentage, 'Overall percentage must match formula exactly');

  console.log('✓ Tab-switch 3-event limit and termination policy verified successfully.\n');

  console.log('=== ALL MASTER VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

runMasterVerification().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
