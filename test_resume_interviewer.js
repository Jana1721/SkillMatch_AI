import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function registerCandidate(name, email, rollNumber, role = 'student') {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      email,
      rollNumber,
      password: 'Password@123',
      confirmPassword: 'Password@123'
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Registration failed: ${JSON.stringify(data)}`);
  }
  return { token: data.token, user: data.user, loginId: data.loginId };
}

async function uploadResumeText(token, text, fileName = 'resume.txt', targetRole = 'Software Engineer') {
  const res = await fetch(`${BASE_URL}/resume/analyze-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      text,
      fileName,
      targetRole
    })
  });
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('================================================================');
  console.log('🤖 SKILLMATCH AI: RESUME-GROUNDED INTERVIEWER TEST SUITE (STEP 10)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function testPass(desc) {
    passed++;
    console.log(`✅ [PASS] ${desc}`);
  }

  function testFail(desc, err) {
    failed++;
    console.error(`❌ [FAIL] ${desc}`);
    if (err) console.error('   Error:', err.message || err);
  }

  try {
    const ts = Date.now();

    // ------------------------------------------------------------------------
    // TEST 1: Missing Resume Rejection & Candidate Isolation
    // ------------------------------------------------------------------------
    console.log('--- TEST 1: Missing Resume Rejection & Candidate Isolation ---');
    const candA = await registerCandidate('Candidate Alpha', `alpha_${ts}@test.edu`, `ROLL-A-${ts}`);
    testPass('Registered Candidate Alpha (no resume uploaded yet)');

    const startWithoutResume = await fetch(`${BASE_URL}/interview/interactive/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candA.token}`
      },
      body: JSON.stringify({
        targetRole: 'Machine Learning Engineer',
        interviewType: 'Technical',
        difficulty: 'Intermediate'
      })
    });
    const startWithoutResumeData = await startWithoutResume.json();

    if (startWithoutResume.status === 400 && startWithoutResumeData.error) {
      testPass(`Missing resume correctly rejected without demo fallback: "${startWithoutResumeData.error}"`);
    } else {
      testFail('Expected 400 error when starting interview without resume', startWithoutResumeData);
    }

    // ------------------------------------------------------------------------
    // TEST 2: Multi-Domain Grounded Question Generation
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 2: Multi-Domain Resume Grounding ---');

    // Domain 1: Python & Machine Learning
    const candML = await registerCandidate('Maya Lin (ML)', `maya_ml_${ts}@test.edu`, `ROLL-ML-${ts}`);
    const mlResumeText = `
MAYA LIN - AI & MACHINE LEARNING ENGINEER
Email: maya@test.edu | Phone: 555-0101
EDUCATION: B.S. in Computer Science, 2024
SKILLS: Python, PyTorch, TensorFlow, Computer Vision, Convolutional Neural Networks (CNN), OpenCV, FastAPI, Docker

PROJECTS:
1. Chest-XRay-Classifier (Deep Learning & Computer Vision)
   - Architected a ResNet-50 CNN model in PyTorch achieving 94.2% diagnostic accuracy on 50,000 chest radiography images.
   - Built a high-throughput DICOM preprocessing pipeline using OpenCV, reducing inference latency by 45%.
   - Deployed the inference API as a containerized FastAPI microservice with automated health checks.

2. Autonomous Drone Navigation
   - Implemented real-time obstacle avoidance using YOLOv8 and optical flow in Python.
`;
    const mlUpload = await uploadResumeText(candML.token, mlResumeText, 'maya_ml_resume.txt', 'Machine Learning Engineer');
    assert(mlUpload.ok, 'ML Resume upload should succeed');
    testPass('Uploaded Python & Machine Learning Resume for Maya');

    const mlInterviewRes = await fetch(`${BASE_URL}/interview/interactive/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candML.token}`
      },
      body: JSON.stringify({
        targetRole: 'Machine Learning Engineer',
        interviewType: 'Technical',
        difficulty: 'Intermediate'
      })
    });
    const mlInterview = await mlInterviewRes.json();
    assert(mlInterviewRes.ok && mlInterview.sessionId, 'ML Interview session should start');
    const mlQ = mlInterview.currentQuestion.question;
    console.log(`   [ML Question]: "${mlQ}"`);

    const mlMatchesKeywords = /Chest-XRay-Classifier|ResNet-50|PyTorch|CNN|DICOM|FastAPI|Computer Vision|YOLOv8|Machine Learning|Autonomous Drone|Python/i.test(mlQ);
    if (mlMatchesKeywords) {
      testPass(`ML Interview question is directly grounded in candidate's resume/project: "${mlQ.slice(0, 80)}..."`);
    } else {
      testFail(`ML question did not match expected resume skills or projects: ${mlQ}`);
    }

    // Domain 2: Java Backend & Distributed Systems
    const candJava = await registerCandidate('James Chen (Java)', `james_java_${ts}@test.edu`, `ROLL-JAVA-${ts}`);
    const javaResumeText = `
JAMES CHEN - BACKEND SOFTWARE ENGINEER
Email: james@test.edu | Phone: 555-0202
EDUCATION: B.Tech in Information Technology
SKILLS: Java 17, Spring Boot, Apache Kafka, PostgreSQL, Redis, Hibernate, Microservices, Docker, Kubernetes

PROJECTS:
1. High-Throughput Financial Ledger Service
   - Built distributed banking ledger using Spring Boot and Apache Kafka handling 12,000 transactions per second.
   - Solved dual-write consistency issues using the Outbox pattern with Debezium and PostgreSQL CDC.
   - Implemented Redis distributed locks to prevent concurrent balance deductions.

2. Distributed Rate Limiter
   - Designed a token-bucket rate limiter in Java 17 using Redis Lua scripts for 99.99% SLA.
`;
    const javaUpload = await uploadResumeText(candJava.token, javaResumeText, 'james_java_resume.txt', 'Backend Java Developer');
    assert(javaUpload.ok, 'Java Resume upload should succeed');
    testPass('Uploaded Java & Backend Resume for James');

    const javaInterviewRes = await fetch(`${BASE_URL}/interview/interactive/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candJava.token}`
      },
      body: JSON.stringify({
        targetRole: 'Backend Java Developer',
        interviewType: 'Technical',
        difficulty: 'Intermediate'
      })
    });
    const javaInterview = await javaInterviewRes.json();
    assert(javaInterviewRes.ok && javaInterview.sessionId, 'Java Interview session should start');
    const javaQ = javaInterview.currentQuestion.question;
    console.log(`   [Java Question]: "${javaQ}"`);

    const javaMatchesKeywords = /Financial Ledger|Spring Boot|Apache Kafka|Redis|PostgreSQL|Outbox|Transactions|Distributed|Java/i.test(javaQ);
    if (javaMatchesKeywords) {
      testPass(`Java Interview question is grounded in candidate's resume/project: "${javaQ.slice(0, 80)}..."`);
    } else {
      testFail(`Java question did not match expected resume skills or projects: ${javaQ}`);
    }

    // Verify ML and Java questions are meaningfully different
    if (mlQ !== javaQ) {
      testPass('Different resumes produce meaningfully different domain questions');
    } else {
      testFail('Questions for ML and Java candidates were identical!');
    }

    // Domain 3: React & Frontend
    const candReact = await registerCandidate('Rachel Green (Frontend)', `rachel_react_${ts}@test.edu`, `ROLL-REACT-${ts}`);
    const reactResumeText = `
RACHEL GREEN - FRONTEND ENGINEER
SKILLS: React 18, TypeScript, Next.js, Redux Toolkit, TailwindCSS, WebSockets, Jest, Vite
PROJECTS:
1. Collaborative Real-Time Whiteboard
   - Engineered collaborative canvas with React 18, TypeScript, and HTML5 Canvas with sub-16ms render times.
   - Integrated WebSockets for multi-user state synchronization and conflict-free replicated data types.
   - Implemented optimistic UI updates and undo/redo history using Redux Toolkit.
`;
    await uploadResumeText(candReact.token, reactResumeText, 'rachel_react.txt', 'Frontend React Developer');
    const reactInterviewRes = await fetch(`${BASE_URL}/interview/interactive/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candReact.token}` },
      body: JSON.stringify({ targetRole: 'Frontend Developer', interviewType: 'Technical', difficulty: 'Intermediate' })
    });
    const reactInterview = await reactInterviewRes.json();
    const reactQ = reactInterview.currentQuestion.question;
    console.log(`   [React Question]: "${reactQ}"`);
    const reactMatches = /Collaborative|Whiteboard|React|TypeScript|WebSockets|Redux|Frontend/i.test(reactQ);
    if (reactMatches) {
      testPass(`React question grounded in candidate's frontend resume: "${reactQ.slice(0, 80)}..."`);
    } else {
      testFail(`React question did not match frontend resume: ${reactQ}`);
    }

    // Domain 4: Cybersecurity
    const candSec = await registerCandidate('Sam Vance (Security)', `sam_sec_${ts}@test.edu`, `ROLL-SEC-${ts}`);
    const secResumeText = `
SAM VANCE - CYBERSECURITY ANALYST
SKILLS: Network Security, Snort, Wireshark, Metasploit, SIEM, Linux, Kali Linux, Threat Hunting, Firewalls
PROJECTS:
1. Automated Intrusion Detection & Honeypot
   - Configured custom Snort IDS rules detecting anomalous SYN flood attacks with automated firewall null-routing.
   - Analyzed packet captures in Wireshark and correlated security incident logs inside an ELK SIEM.
`;
    await uploadResumeText(candSec.token, secResumeText, 'sam_security.txt', 'Security Analyst');
    const secInterviewRes = await fetch(`${BASE_URL}/interview/interactive/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candSec.token}` },
      body: JSON.stringify({ targetRole: 'Security Analyst', interviewType: 'Technical', difficulty: 'Intermediate' })
    });
    const secInterview = await secInterviewRes.json();
    const secQ = secInterview.currentQuestion.question;
    console.log(`   [Security Question]: "${secQ}"`);
    const secMatches = /Intrusion Detection|Honeypot|Snort|Wireshark|SIEM|Security|Firewall|Linux|Kali/i.test(secQ);
    if (secMatches) {
      testPass(`Cybersecurity question grounded in candidate's security resume: "${secQ.slice(0, 80)}..."`);
    } else {
      testFail(`Cybersecurity question did not match security resume: ${secQ}`);
    }

    // ------------------------------------------------------------------------
    // TEST 3: Adaptive Follow-up & Turn Flow
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 3: Adaptive Follow-up & Turn Flow ---');
    const turnRes = await fetch(`${BASE_URL}/interview/interactive/turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candML.token}`
      },
      body: JSON.stringify({
        sessionId: mlInterview.sessionId,
        userAnswer: 'In the Chest-XRay-Classifier project, I utilized ResNet-50 pre-trained on ImageNet. To prevent overfitting on medical DICOM images, I used heavy spatial data augmentations like random rotations and affine transformations, along with an AdamW optimizer and cosine annealing learning rate scheduler.',
        timeTakenSeconds: 30
      })
    });
    const turnData = await turnRes.json();
    assert(turnRes.ok, `Turn should succeed: ${JSON.stringify(turnData)}`);
    assert(turnData.evaluation && turnData.evaluation.overallScore > 0, 'Turn evaluation must provide positive score');
    testPass(`Turn evaluated successfully: Score ${turnData.evaluation.overallScore}/100, Relevance: ${turnData.evaluation.relevanceScore}/100`);

    if (turnData.nextQuestion) {
      console.log(`   [Next Question / Follow-up]: "${turnData.nextQuestion.question}"`);
      testPass(`Generated dynamic follow-up/next question based on resume and previous response`);
    } else {
      testFail('Next question was not generated in turn flow');
    }

    // ------------------------------------------------------------------------
    // TEST 4: Cross-Candidate Security & Session Isolation
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 4: Cross-Candidate Security & Session Isolation ---');
    // Candidate Java tries to answer Candidate ML's session!
    const hijackTurn = await fetch(`${BASE_URL}/interview/interactive/turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candJava.token}` // Unauthorized user!
      },
      body: JSON.stringify({
        sessionId: mlInterview.sessionId,
        userAnswer: 'Attempting to submit answer to someone else session',
        timeTakenSeconds: 10
      })
    });
    const hijackData = await hijackTurn.json();
    if (hijackTurn.status === 403 || hijackTurn.status === 404) {
      testPass(`Cross-candidate session hijack blocked with status ${hijackTurn.status}`);
    } else {
      testFail('Cross-candidate session hijack was NOT blocked!', hijackData);
    }

    // ------------------------------------------------------------------------
    // TEST 5: Resume Update (New Upload Replaces Old for Next Interview)
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 5: Resume Update Replaces Old Resume ---');
    const updatedJavaResume = `
JAMES CHEN - CLOUD PLATFORM & GO ENGINEER
SKILLS: Go (Golang), Kubernetes, gRPC, Terraform, AWS, Prometheus, Docker
PROJECTS:
1. Cloud Mesh Envoy Proxy
   - Developed custom Envoy proxy control plane in Go using gRPC streaming for dynamic traffic routing.
   - Deployed on AWS EKS with Kubernetes Custom Resource Definitions (CRDs).
`;
    await uploadResumeText(candJava.token, updatedJavaResume, 'james_new_go_resume.txt', 'Cloud Platform Engineer');
    testPass('Uploaded updated Go & Kubernetes resume for James');

    const updatedInterviewRes = await fetch(`${BASE_URL}/interview/interactive/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candJava.token}`
      },
      body: JSON.stringify({
        targetRole: 'Cloud Platform Engineer',
        interviewType: 'Technical',
        difficulty: 'Intermediate'
      })
    });
    const updatedInterview = await updatedInterviewRes.json();
    const updatedQ = updatedInterview.currentQuestion.question;
    console.log(`   [Updated Resume Question]: "${updatedQ}"`);
    const isGroundedInNewResume = /Cloud Mesh|Envoy|Kubernetes|Go|Golang|gRPC|CRD/i.test(updatedQ);
    if (isGroundedInNewResume) {
      testPass(`New interview successfully grounded in the UPDATED resume: "${updatedQ.slice(0, 80)}..."`);
    } else {
      testFail(`New interview still used outdated resume or generic question: ${updatedQ}`);
    }

    // ------------------------------------------------------------------------
    // TEST 6: Unreadable / Empty Resume Text Rejection
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 6: Insufficient Text / Corrupted Resume Rejection ---');
    const candEmpty = await registerCandidate('Empty Candidate', `empty_${ts}@test.edu`, `ROLL-EMP-${ts}`);
    const emptyUploadRes = await uploadResumeText(candEmpty.token, 'Too short', 'empty.txt', 'Engineer');
    if (emptyUploadRes.status === 400) {
      testPass(`Insufficient/empty resume text rejected at upload with status 400: "${emptyUploadRes.data.error}"`);
    } else {
      testFail('Empty resume text was not rejected at upload', emptyUploadRes.data);
    }

    // ------------------------------------------------------------------------
    // TEST 7: Finish Interview & Evidence-Based Report Generation
    // ------------------------------------------------------------------------
    console.log('\n--- TEST 7: Finish Interview & Evidence-Based Report ---');
    const finishRes = await fetch(`${BASE_URL}/interview/interactive/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candML.token}`
      },
      body: JSON.stringify({ sessionId: mlInterview.sessionId })
    });
    const finishData = await finishRes.json();
    assert(finishRes.ok, `Finish interview should succeed: ${JSON.stringify(finishData)}`);
    assert(finishData.finalReport, 'Finish should return finalReport');
    const report = finishData.finalReport;
    console.log(`   [Final Report Scores] Overall: ${report.overallScore}/100, Technical: ${report.technicalKnowledge}/100, Project: ${report.projectUnderstanding}/100`);

    if (report.overallScore > 0 && report.strengths && report.strengths.length > 0) {
      testPass('Final report generated with multi-dimensional scores, strengths, and improvement areas');
    } else {
      testFail('Final report scores or strengths were missing', report);
    }

    // Verify Candidate Java cannot access Candidate ML's completed report
    const hijackFinish = await fetch(`${BASE_URL}/interview/interactive/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${candJava.token}`
      },
      body: JSON.stringify({ sessionId: mlInterview.sessionId })
    });
    if (hijackFinish.status === 403 || hijackFinish.status === 404) {
      testPass('Candidate report is secure: unauthorized candidate cannot view or finish other candidate session');
    } else {
      testFail('Unauthorized candidate was able to access another candidate interview session!');
    }

  } catch (err) {
    testFail('Unexpected test suite error', err);
  }

  console.log('\n================================================================');
  console.log(`TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
