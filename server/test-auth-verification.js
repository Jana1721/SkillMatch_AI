import { dbGet, dbRun } from './db/database.js';

async function runAuthVerificationTestSuite() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('=== RUNNING STUDENT OTP & IDENTITY VERIFICATION TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const testStudentEmail = `teststudent_${timestamp}@kce.ac.in`;
  const testStudentRoll = `717823P121`; // In college_roster

  // Clean up any previous test artifacts
  await dbRun("DELETE FROM users WHERE email LIKE 'teststudent_%' OR email LIKE 'unlisted_%' OR email LIKE 'lockout_%' OR roll_number = '717823P121'");

  try {
    // 1. Password cannot match Roll Number
    console.log('1. Testing: Password cannot match Roll Number');
    const weakPassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Student',
        rollNumber: testStudentRoll,
        email: testStudentEmail,
        department: 'Computer Science & Engineering',
        phone: '9876543210',
        password: testStudentRoll, // Same as roll number!
        confirmPassword: testStudentRoll,
        targetRole: 'Software Engineer',
        yearOfStudy: '3rd Year'
      })
    });
    const weakPassData = await weakPassRes.json();
    const weakPassMsg = weakPassData.error || weakPassData.message || '';
    assert(weakPassRes.status === 400 && weakPassMsg.includes('college roll number cannot be used as your account password'), 'Password matching roll number rejected with 400');

    // 2. Successful Registration - OTP code NOT in JSON response
    console.log('\n2. Testing: Registration without exposed OTP in response');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jana S',
        rollNumber: testStudentRoll,
        email: testStudentEmail,
        department: 'Computer Science & Engineering',
        phone: '9876543210',
        password: 'SecurePassword123!',
        confirmPassword: 'SecurePassword123!',
        targetRole: 'Full Stack Developer',
        yearOfStudy: '3rd Year'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201 && regData.success === true, 'Student registration successful (201)');
    assert(regData.verificationCode === undefined, 'Security: verificationCode is NOT exposed in response');
    assert(regData.emailPreview === undefined, 'Security: emailPreview is NOT exposed in response');
    assert(regData.user.emailStatus === 'Unverified', 'Initial email status is Unverified');

    // 3. Inspect generated OTP from DB directly
    const userRow = await dbGet('SELECT * FROM users WHERE email = ?', [testStudentEmail]);
    assert(userRow && userRow.verification_token && userRow.verification_token.length === 6, '6-digit OTP code securely generated in database');
    const otpExpiryDelta = new Date(userRow.token_expires_at).getTime() - Date.now();
    assert(otpExpiryDelta > 240000 && otpExpiryDelta <= 300000, `OTP expires strictly within 5 minutes (remaining: ${Math.round(otpExpiryDelta/1000)}s)`);

    // 4. Failed OTP verification attempt
    console.log('\n3. Testing: Invalid OTP entry');
    const badOtpRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        code: '999999'
      })
    });
    const badOtpData = await badOtpRes.json();
    const badOtpMsg = badOtpData.error || badOtpData.message || '';
    assert(badOtpRes.status === 400 && badOtpMsg.includes('Invalid verification code'), 'Invalid OTP rejected with 400');

    // 5. Successful OTP verification & Automatic College Roster Match
    console.log('\n4. Testing: Valid OTP verification & College Roster Match');
    const goodOtpRes = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testStudentEmail,
        code: userRow.verification_token
      })
    });
    const goodOtpData = await goodOtpRes.json();
    assert(goodOtpRes.status === 200 && goodOtpData.success === true, 'OTP verification accepted with HTTP 200');
    assert(goodOtpData.user.emailStatus === 'Verified', 'Email status updated to Verified');
    assert(goodOtpData.user.collegeIdentityStatus === 'Verified', 'College Identity automatically Verified against official roster');

    // 6. Admin Login & Verification Overview
    console.log('\n5. Testing: Admin candidate verification management');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: 'admin@skillmatch.ai',
        password: 'Admin@2026!'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.user.role === 'admin', 'Admin logged in successfully');
    const adminToken = adminLoginData.token;

    // Check admin candidate list
    const candidatesRes = await fetch(`${BASE_URL}/admin/candidates`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const candidatesData = await candidatesRes.json();
    assert(candidatesRes.status === 200 && Array.isArray(candidatesData.candidates), 'Admin candidates retrieved successfully');
    const verifiedCandidate = candidatesData.candidates.find(c => c.email === testStudentEmail);
    assert(verifiedCandidate && verifiedCandidate.emailStatus === 'Verified' && verifiedCandidate.collegeIdentityStatus === 'Verified', 'Candidate appears in Admin overview with Verified statuses');

    // 7. Register unlisted student for manual Admin review (Approve & Reject)
    console.log('\n6. Testing: Manual Admin Review & Reason Requirement');
    const unlistedEmail = `unlisted_${timestamp}@kce.ac.in`;
    const unlistedRoll = `UNLISTED_${timestamp}`;
    const unlistedRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Unlisted Candidate',
        rollNumber: unlistedRoll,
        email: unlistedEmail,
        department: 'Mechanical Engineering',
        phone: '9123456789',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
        targetRole: 'Design Engineer',
        yearOfStudy: '2nd Year'
      })
    });
    const unlistedRegData = await unlistedRegRes.json();
    const unlistedUserRow = await dbGet('SELECT * FROM users WHERE email = ?', [unlistedEmail]);

    // Verify OTP for unlisted student
    await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: unlistedEmail,
        code: unlistedUserRow.verification_token
      })
    });

    const unlistedAfterOtp = await dbGet('SELECT * FROM users WHERE email = ?', [unlistedEmail]);
    assert(unlistedAfterOtp.college_identity_status === 'Pending Verification', 'Unlisted student identity remains Pending Verification');

    // Test rejection without reason -> should fail
    const rejectNoReasonRes = await fetch(`${BASE_URL}/admin/candidates/${unlistedAfterOtp.id}/verify-identity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        action: 'reject',
        reason: '' // empty!
      })
    });
    assert(rejectNoReasonRes.status === 400, 'Rejection without reason rejected with 400');

    // Reject with reason
    const rejectWithReasonRes = await fetch(`${BASE_URL}/admin/candidates/${unlistedAfterOtp.id}/verify-identity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        action: 'reject',
        reason: 'Roll number not found in college ERP database for batch 2024.'
      })
    });
    const rejectData = await rejectWithReasonRes.json();
    assert(rejectWithReasonRes.status === 200 && rejectData.user.collegeIdentityStatus === 'Rejected', 'Identity rejected with mandatory reason');

    // 8. Resubmit Details as Student
    console.log('\n7. Testing: Student Identity Resubmission');
    const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: unlistedEmail,
        password: 'ValidPassword123!'
      })
    });
    const studentLoginData = await studentLoginRes.json();
    const studentToken = studentLoginData.token;

    const resubmitRes = await fetch(`${BASE_URL}/user/resubmit-identity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        name: 'Arun Kumar',
        rollNumber: '2024CS012', // Valid in roster!
        department: 'Computer Science & Engineering',
        phone: '9876543210'
      })
    });
    const resubmitData = await resubmitRes.json();
    assert(resubmitRes.status === 200 && resubmitData.user.collegeIdentityStatus === 'Verified', 'Resubmission with valid roster roll number instantly Verified');

    // 9. Login Rate-Limiting Lockout (5 failed attempts -> 15 min lock)
    console.log('\n8. Testing: Account Lockout on 5 Failed Login Attempts');
    const lockoutEmail = `lockout_${timestamp}@kce.ac.in`;
    await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Lockout Target',
        rollNumber: `LOCK_${timestamp}`,
        email: lockoutEmail,
        department: 'Information Technology',
        phone: '9999999999',
        password: 'TargetPassword123!',
        confirmPassword: 'TargetPassword123!'
      })
    });

    for (let i = 1; i <= 5; i++) {
      await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: lockoutEmail,
          password: 'WrongPassword!'
        })
      });
    }
    // 6th attempt must be locked out
    const lockedRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        loginId: lockoutEmail,
        password: 'WrongPassword!'
      })
    });
    const lockedData = await lockedRes.json();
    const lockedMsg = lockedData.error || lockedData.message || '';
    assert(lockedRes.status === 429 && lockedMsg.includes('locked'), 'Account locked for 15 minutes after 5 consecutive failed attempts (HTTP 429)');

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runAuthVerificationTestSuite();
