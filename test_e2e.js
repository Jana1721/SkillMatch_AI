// End-to-End User Journey Verification Script
async function runTests() {
  console.log('--- STARTING SKILLMATCH AI AUTOMATED E2E TESTS ---');
  let failures = 0;

  const assert = (condition, msg) => {
    if (!condition) {
      console.error(`❌ FAIL: ${msg}`);
      failures++;
    } else {
      console.log(`✅ PASS: ${msg}`);
    }
  };

  try {
    // 1. Health Check
    const healthRes = await fetch('http://localhost:5000/api/health').then(r => r.json());
    assert(healthRes.status === 'online', 'Health endpoint reports online status');

    // 2. Candidate Registration with Unique Credential ID
    const testEmail = `candidate_${Date.now()}@testcareer.org`;
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: testEmail,
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        college: 'Indian Institute of Technology',
        degree: 'B.Tech CS',
        targetRole: 'Java Developer'
      })
    }).then(r => r.json());

    assert(regRes.success === true, 'Candidate registered successfully');
    assert(regRes.user && /^SKM-2026-[A-Z0-9]{6}$/.test(regRes.user.credentialId), `Unique Credential ID generated in valid format: ${regRes.user?.credentialId}`);
    assert(regRes.token && regRes.token.length > 20, 'JWT authentication token received');
    const userToken = regRes.token;
    const credentialId = regRes.user.credentialId;

    // 3. Duplicate Email Rejection
    const dupRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee Clone',
        email: testEmail,
        password: 'Password123!'
      })
    });
    assert(dupRes.status === 400, 'Duplicate personal email registration properly rejected with HTTP 400');

    // 4. Login with Registered Credentials
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!'
      })
    }).then(r => r.json());

    assert(loginRes.success === true, 'Login successful with personal email & password');
    assert(loginRes.user.credentialId === credentialId, 'Login user profile retains permanent Credential ID');

    // 5. Transactional Email Outbox Verification
    const emailsRes = await fetch('http://localhost:5000/api/user/emails', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());

    assert(emailsRes.success === true && emailsRes.emails.length > 0, `Transactional verification email dispatched and logged in outbox (${emailsRes.emails?.length} email(s) found)`);
    const verificationEmail = emailsRes.emails.find(e => e.email_type === 'verification');
    assert(verificationEmail && verificationEmail.body_html.includes(credentialId), 'Verification email includes candidate permanent Credential ID');

    // 6. Complete Email Verification
    const verifyRes = await fetch('http://localhost:5000/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ email: testEmail })
    }).then(r => r.json());
    assert(verifyRes.success === true && verifyRes.emailVerified === true, 'Account email verified successfully');

    // 7. Resume Analysis
    const sampleResumeText = `
      JORDAN LEE
      jordan@testcareer.org | +91 9876543210 | Bangalore
      GitHub: https://github.com/jordanlee | LinkedIn: https://linkedin.com/in/jordanlee
      EDUCATION: B.Tech Computer Science, GPA: 8.9/10, Grad: 2026
      TECHNICAL SKILLS: Java 17, Spring Boot, SQL, PostgreSQL, REST APIs, Microservices, Git, Docker, JUnit
      PROJECT: Enterprise FinTech Billing Gateway
      Built high-throughput payment microservice using Spring Boot and PostgreSQL with connection pooling.
      Integrated JWT authentication, comprehensive unit tests, and Dockerized deployment.
    `;

    const resumeRes = await fetch('http://localhost:5000/api/resume/analyze-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        text: sampleResumeText,
        targetRole: 'Java Developer',
        sourceName: 'Jordan_Lee_Resume.txt'
      })
    }).then(r => r.json());

    assert(resumeRes.success === true, 'Resume analyzed and parsed successfully');
    assert(resumeRes.analysis.scorecard.overallScore > 70, `Resume ATS overall score calculated: ${resumeRes.analysis?.scorecard?.overallScore}/100`);

    // 8. AI Voice Interview Session Initialization
    const interviewStartRes = await fetch('http://localhost:5000/api/interview/interactive/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        targetRole: 'Java Developer',
        interviewType: 'Mixed Interview',
        experienceLevel: 'Fresher',
        difficulty: 'Intermediate',
        totalQuestions: 3
      })
    }).then(r => r.json());

    assert(interviewStartRes.success === true, 'Voice interview session started successfully');
    assert(interviewStartRes.sessionId && interviewStartRes.currentQuestion?.questionText, `Question 1 generated: "${interviewStartRes.currentQuestion?.questionText?.slice(0, 60)}..."`);
    const sessionId = interviewStartRes.sessionId;

    // 9. Submit Voice/Spoken Answer for Evaluation Turn
    const turnRes = await fetch('http://localhost:5000/api/interview/interactive/turn', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        sessionId,
        userAnswer: 'Hello! I am a Computer Science graduate from University of California with core technical skills in Java, Python, and Spring Boot. During my studies, I built the Cloud E-Commerce API project where I designed scalable REST microservices, token-based authentication, and automated database migrations. I am motivated to apply my backend software engineering foundation to high-impact distributed systems.',
        timeTakenSeconds: 32
      })
    }).then(r => r.json());

    assert(turnRes.success === true, 'Candidate spoken answer evaluated successfully');
    assert(turnRes.evaluation.overallScore >= 65, `Answer competency score computed: ${turnRes.evaluation?.overallScore}/100`);

    // 10. Finish Interview & Compile Evaluation Report
    const finishRes = await fetch('http://localhost:5000/api/interview/interactive/finish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ sessionId })
    }).then(r => r.json());

    assert(finishRes.success === true && finishRes.isCompleted === true, 'Interview finalized and completed');
    assert(finishRes.finalReport?.overallScore > 0, `Comprehensive scorecard overall score: ${finishRes.finalReport?.overallScore}/100`);
    assert(finishRes.finalReport?.performanceDimensions?.communication !== undefined, 'Communication clarity score reported');
    assert(finishRes.finalReport?.performanceDimensions?.technicalKnowledge !== undefined, 'Role technical depth score reported');

    // 11. Interview History Persistence & Email Dispatch Check
    const historyRes = await fetch('http://localhost:5000/api/interview/history', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());

    assert(historyRes.success === true && historyRes.evaluations.length > 0, 'Interview scorecard successfully persisted under candidate account ID');

    const updatedEmailsRes = await fetch('http://localhost:5000/api/user/emails', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());

    const reportEmail = updatedEmailsRes.emails.find(e => e.email_type === 'interview_report');
    assert(reportEmail !== undefined, 'Interview evaluation report automatically dispatched to candidate personal email');

    // 12. Saved Jobs Bookmark Check
    const saveJobRes = await fetch('http://localhost:5000/api/jobs/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        job: { id: 'job-test-101', title: 'Junior Java Cloud Engineer', company: 'Tech Corp' }
      })
    }).then(r => r.json());

    assert(saveJobRes.success === true, 'Job opportunity successfully bookmarked to candidate account');

    const savedJobsRes = await fetch('http://localhost:5000/api/jobs/saved', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    }).then(r => r.json());

    assert(savedJobsRes.savedJobs.some(j => j.id === 'job-test-101'), 'Saved jobs list returns bookmarked job for user');

    console.log('\n--- TEST SUMMARY ---');
    if (failures === 0) {
      console.log('🎉 ALL 15 AUTOMATED TESTS PASSED WITH 0 FAILURES!');
    } else {
      console.error(`🚨 ${failures} TEST(S) FAILED.`);
    }
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
