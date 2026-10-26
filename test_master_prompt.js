// Comprehensive verification script for Master Prompt Upgrades
const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
  console.log('=== SKILLMATCH AI MASTER PROMPT UPGRADE VERIFICATION ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(healthRes.ok && health.status === 'online', 'Health endpoint operational');

    // 2. Student Registration with Roll Number, Department, Phone, Name, Email, Password
    const testRoll = `ROLL-${Date.now()}`;
    const testEmail = `student_${Date.now()}@college.edu`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Arun Kumar',
        email: testEmail,
        rollNumber: testRoll,
        phone: '+91 9876543210',
        department: 'Computer Science & Engineering',
        college: 'National Institute of Technology',
        degree: 'B.Tech Information Technology',
        password: 'Password@2026',
        confirmPassword: 'Password@2026',
        targetRole: 'Full Stack Java Developer'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.loginId && (regData.loginId.startsWith('SKM-') || regData.loginId.startsWith('KCE-')), 
      `Student registration succeeds and returns unique Login ID: ${regData.loginId}`);
    assert(regData.user.rollNumber === testRoll, `Roll number correctly persisted: ${regData.user.rollNumber}`);

    const studentToken = regData.token;
    const studentLoginId = regData.loginId;

    // 3. Duplicate Roll Number Rejected
    const dupRollRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email: `another_${Date.now()}@college.edu`,
        rollNumber: testRoll, // duplicate roll
        password: 'Password@2026'
      })
    });
    assert(dupRollRes.status === 400, 'Duplicate college roll number is rejected');

    // 4. Duplicate Email Rejected
    const dupEmailRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Student',
        email: testEmail, // duplicate email
        rollNumber: `ROLL-NEW-${Date.now()}`,
        password: 'Password@2026'
      })
    });
    assert(dupEmailRes.status === 400, 'Duplicate email address is rejected');

    // 5. Login using unique Login ID (SKM-2026-XXXXXX)
    const loginByIdRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: studentLoginId,
        password: 'Password@2026'
      })
    });
    const loginById = await loginByIdRes.json();
    assert(loginByIdRes.ok && loginById.user.credentialId === studentLoginId, 
      `Student can login using generated Login ID: ${studentLoginId}`);

    // 6. Login using Student Email
    const loginByEmailRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password: 'Password@2026'
      })
    });
    assert(loginByEmailRes.ok, 'Student can login using Email address');

    // 7. Verify OTP Email logic: Test wrong OTP limit enforcement
    const wrongOtpRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: studentLoginId,
        code: '000000'
      })
    });
    const wrongOtp = await wrongOtpRes.json();
    assert(wrongOtpRes.status === 400 && wrongOtp.error.includes('attempt'), 
      'Incorrect OTP decreases attempt count and returns informative error');

    // 8. Resend Code cooldown enforcement
    const resendCooldownRes = await fetch(`${BASE_URL}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: studentLoginId })
    });
    assert(resendCooldownRes.status === 429, 'Resend code enforces 60-second cooldown protection');

    // 9. Student Security Isolation: Student cannot access Admin endpoints
    const studentAdminRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(studentAdminRes.status === 403, 'Student access to Admin Dashboard is strictly forbidden (403)');

    // 10. Admin Authentication & Dashboard Access
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: 'admin@skillmatch.ai',
        password: 'Admin@2026!'
      })
    });
    const adminLogin = await adminLoginRes.json();
    assert(adminLoginRes.ok && adminLogin.user.role === 'admin', 'Default Administrator login succeeds');

    const adminToken = adminLogin.token;

    // 11. Admin KPI Stats from actual database
    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminStats = await adminStatsRes.json();
    assert(adminStatsRes.ok && adminStats.stats.totalCandidates >= 1, 
      `Admin KPI stats operational (Total candidates: ${adminStats.stats.totalCandidates}, Verified: ${adminStats.stats.verifiedCandidates})`);

    // 12. Admin Candidate Roster & Search/Filter
    const candidatesRes = await fetch(`${BASE_URL}/admin/candidates?search=Arun`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const candidatesData = await candidatesRes.json();
    assert(candidatesRes.ok && candidatesData.candidates.length >= 1, 
      `Admin candidates list and search working (Found: ${candidatesData.candidates.length})`);

    // 13. Admin Manual Verification & Audit Logging
    const verifyCandidateRes = await fetch(`${BASE_URL}/admin/candidates/${regData.user.id}/verify-email`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(verifyCandidateRes.ok, 'Admin can manually verify candidate email');

    const auditRes = await fetch(`${BASE_URL}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const auditData = await auditRes.json();
    assert(auditRes.ok && auditData.logs.some(l => l.action === 'MANUAL_EMAIL_VERIFICATION'), 
      'Admin manual verification properly recorded in audit log');

    // 14. GitHub Verification: Reject non-github domain
    const badGhRes = await fetch(`${BASE_URL}/github/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ url: 'https://gitlab.com/unknown/project' })
    });
    assert(badGhRes.status === 400, 'GitHub verifier rejects non-github.com domain');

    // 15. GitHub Verification: Verify legitimate public repo
    const goodGhRes = await fetch(`${BASE_URL}/github/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ url: 'https://github.com/expressjs/express' })
    });
    const goodGh = await goodGhRes.json();
    assert(goodGhRes.ok && goodGh.verification.status === 'Verified', 
      `GitHub verifier verified public repository: ${goodGh.verification?.repoDetails?.fullName} (${goodGh.verification?.status})`);

    // 16. Resume Upload & Job Description Matcher: Distinct scores
    const jdMatchRes = await fetch(`${BASE_URL}/jd/match`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        jobTitle: 'Senior Java Backend Engineer',
        companyName: 'Amazon AWS',
        jdText: 'Looking for a Senior Backend Engineer with deep knowledge of Java, Spring Boot, Microservices, SQL, AWS, and Distributed Systems. Candidate should have 3+ years experience designing high-throughput services.'
      })
    });
    const jdMatch = await jdMatchRes.json();
    assert(jdMatchRes.ok && jdMatch.scores.resumeQualityScore && jdMatch.scores.jdMatchScore !== undefined, 
      `JD Matcher separates Resume Quality Score (${jdMatch.scores?.resumeQualityScore}/100) from JD Fit Score (${jdMatch.scores?.jdMatchScore}/100)`);
    // 16b. Upload candidate resume for AI Voice Interview
    await fetch(`${BASE_URL}/resume/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        text: 'ANAND KUMAR - FULL STACK JAVA DEVELOPER\nSKILLS: Java 17, Spring Boot, React, SQL, PostgreSQL, REST APIs, Microservices, Git\nPROJECTS:\n1. E-Commerce Microservices Engine\n- Built high throughput order processing engine using Java 17 and Spring Boot with PostgreSQL.\n- Designed REST APIs for product search, shopping cart, and checkout workflows.',
        fileName: 'anand_resume.txt',
        targetRole: 'Full Stack Java Developer'
      })
    });

    // 17. AI Voice Interview Session grounded in resume
    const interviewStartRes = await fetch(`${BASE_URL}/interview/interactive/start`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        targetRole: 'Full Stack Java Developer',
        interviewType: 'Technical',
        difficulty: 'Intermediate',
        totalQuestions: 3
      })
    });
    const interviewStart = await interviewStartRes.json();
    assert(interviewStartRes.ok && interviewStart.sessionId && interviewStart.currentQuestion, 
      `AI Voice Interviewer starts session grounded in candidate resume (Session: ${interviewStart.sessionId})`);

    // 18. Answer Turn & Adaptive AI response
    const turnRes = await fetch(`${BASE_URL}/interview/interactive/turn`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        sessionId: interviewStart.sessionId,
        userAnswer: 'In Java, OOP concepts include encapsulation where fields are private, inheritance using extends, polymorphism with method overriding, and abstraction via interfaces.',
        timeTakenSeconds: 25
      })
    });
    const turnData = await turnRes.json();
    assert(turnRes.ok && turnData.evaluation && turnData.evaluation.overallScore > 0, 
      `AI Interviewer evaluates candidate response and adapts to turn (Turn score: ${turnData.evaluation?.overallScore}/100)`);

    // 19. Finish Interview & Compile Full Report
    const finishRes = await fetch(`${BASE_URL}/interview/interactive/finish`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ sessionId: interviewStart.sessionId })
    });
    const finishData = await finishRes.json();
    assert(finishRes.ok && finishData.finalReport && finishData.finalReport.overallScore, 
      `AI Interviewer compiles multi-dimensional report (Overall: ${finishData.finalReport?.overallScore}/100, Tech: ${finishData.finalReport?.technicalScore}/100, Comm: ${finishData.finalReport?.communicationScore}/100)`);

    // 20. Personalized Job Recommendations
    const recsRes = await fetch(`${BASE_URL}/jobs/recommendations`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const recsData = await recsRes.json();
    assert(recsRes.ok && recsData.recommendations.length > 0 && recsData.recommendations[0].matchScore !== undefined, 
      `Job recommendations computed with match scores (Top match: ${recsData.recommendations[0]?.title} - ${recsData.recommendations[0]?.matchScore}%)`);

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

testAll();
