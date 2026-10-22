async function runComprehensiveIntegrationSuite() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('=== RUNNING CAREERLENS FULL-STACK INTEGRATION SUITE ===\n');

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

  try {
    // 1. Health Check
    console.log('1. Health Check Endpoint (/api/health)');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
    assert(healthData.status === 'online', 'Platform status is online');

    // 2. Empty Text Edge Case
    console.log('\n2. Negative Test: Short / Invalid Resume Text');
    const emptyRes = await fetch(`${BASE_URL}/resume/analyze-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'too short' })
    });
    assert(emptyRes.status === 400, 'Rejects text shorter than 20 chars with HTTP 400');

    // 3. Analyze Valid Resume Text
    console.log('\n3. Resume Parsing & Analysis (/api/resume/analyze-text)');
    const sampleResume = `
      PRIYA SHARMA
      Bengaluru, India | +91 9123456780 | priya.sharma@example.com
      LinkedIn: linkedin.com/in/priya-sharma | GitHub: github.com/priya-dev

      EDUCATION
      B.E. in Computer Science Engineering, RV College of Engineering, Bengaluru
      CGPA: 8.9/10 | Graduating 2026

      TECHNICAL SKILLS
      Languages: Java, Python, SQL, JavaScript, HTML5/CSS3
      Frameworks: Spring Boot, React, Node.js, Express, Tailwind CSS
      Tools & Platforms: Docker, Git, AWS (EC2, S3), PostgreSQL, MongoDB

      PROJECTS
      1. Cloud-Native Healthcare Records Management System
      - Built a microservices-based healthcare EHR portal using Spring Boot and React.
      - Implemented role-based access control (RBAC) with JWT tokens and bcrypt encryption.
      - Integrated PostgreSQL with Redis caching layer, achieving 35ms average response time on 100k records.
      - Packaged application into Docker containers and deployed to AWS EC2 instance.

      2. Automated Resume Keyword & ATS Evaluator
      - Developed a Python NLP utility extracting technical proficiencies and computing match percentages.
      - Integrated SQLite storage layer with structured schema for candidate profiles.
    `;

    const analyzeRes = await fetch(`${BASE_URL}/resume/analyze-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: sampleResume,
        targetRole: 'Java Developer',
        sourceName: 'Priya_Sharma_Resume.txt'
      })
    });
    const analyzeData = await analyzeRes.json();
    assert(analyzeRes.status === 200 && analyzeData.success === true, 'Successfully parsed and analyzed resume text');
    assert(analyzeData.analysis.scorecard.overallScore > 0, `Overall scorecard score computed: ${analyzeData.analysis.scorecard.overallScore}/100`);
    assert(analyzeData.analysis.parsedData.skills.allSkillsFound.length >= 8, `Skills extracted correctly (${analyzeData.analysis.parsedData.skills.allSkillsFound.length} skills found)`);
    assert(analyzeData.analysis.parsedData.projects.length >= 2, `Projects extracted correctly (${analyzeData.analysis.parsedData.projects.length} projects found)`);

    // 4. Retrieve Current Analysis
    console.log('\n4. Active Session Cache (/api/resume/current)');
    const currentRes = await fetch(`${BASE_URL}/resume/current`);
    const currentData = await currentRes.json();
    assert(currentData.success === true, 'Retrieved active resume analysis');
    assert(currentData.analysis.parsedData.contact.name === 'PRIYA SHARMA', 'Candidate name properly cached as Priya Sharma');

    // 5. Project Verification
    console.log('\n5. Project Verification (/api/projects/verify)');
    const projRes = await fetch(`${BASE_URL}/projects/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: 'Cloud-Native Healthcare Records Management System',
        githubUrl: 'https://github.com/priya-dev/healthcare-records',
        hasDb: true,
        hasApi: true,
        hasAuth: true,
        hasTesting: true,
        hasDeploy: true
      })
    });
    const projData = await projRes.json();
    assert(projRes.status === 200 && projData.success === true, 'Project verification ran successfully');
    assert(projData.verification.classification.includes('Production-Oriented'), 'Classified as Production-Oriented');
    assert(projData.verification.scores.deploymentReady === 95, 'High deployment readiness score verified');

    // 6. Job Description Matcher
    console.log('\n6. Job Description Matcher (/api/jd/match)');
    const sampleJD = `
      We are looking for a Junior Java Developer to join our Cloud Engineering team.
      Requirements:
      - 0-2 years experience with Java, Spring Boot, and RESTful web services.
      - Experience with PostgreSQL or MySQL relational databases.
      - Familiarity with Docker and AWS deployment is a major plus.
      - Strong grasp of Object Oriented Programming and Data Structures.
    `;
    const jdRes = await fetch(`${BASE_URL}/jd/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jdText: sampleJD,
        jobTitle: 'Junior Java Developer',
        companyName: 'CloudScale Systems'
      })
    });
    const jdData = await jdRes.json();
    assert(jdRes.status === 200 && jdData.success === true, 'JD Matcher completed calculation');
    assert(jdData.matchResult.matchScore >= 65, `High JD match score computed (${jdData.matchResult.matchScore}%)`);
    assert(jdData.matchResult.skillsFoundInResume.includes('Java'), 'Java correctly identified as matched skill');

    // 7. Resume Improvement Suggestions
    console.log('\n7. Resume Improvement Suggestions (/api/resume/improve)');
    const improveRes = await fetch(`${BASE_URL}/resume/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetRole: 'Java Developer' })
    });
    const improveData = await improveRes.json();
    assert(improveRes.status === 200 && improveData.success === true, 'Generated resume improvement suggestions');
    assert(improveData.improvements.rewrittenProjects.length > 0, 'Generated enhanced project bullet points with metrics');

    // 8. Interview Preparation Questions
    console.log('\n8. Interview Preparation Questions (/api/interview/questions)');
    const interviewRes = await fetch(`${BASE_URL}/interview/questions?role=Java+Developer`);
    const interviewData = await interviewRes.json();
    assert(interviewRes.status === 200 && interviewData.success === true, 'Generated role and project-specific interview questions');
    assert(interviewData.questions.projectQuestions.length > 0, 'Includes targeted project questions');
    assert(interviewData.questions.javaQuestions.length > 0, 'Includes technical Java questions');

    // 9. Dynamic Learning Roadmap
    console.log('\n9. Dynamic Learning Roadmap (/api/roadmap)');
    const roadmapRes = await fetch(`${BASE_URL}/roadmap?role=Java+Developer`);
    const roadmapData = await roadmapRes.json();
    assert(roadmapRes.status === 200 && roadmapData.success === true, 'Generated customized roadmap');
    assert(roadmapData.roadmap.length >= 3, `Roadmap contains ${roadmapData.roadmap.length} structured learning phases`);

    // 10. Company Directory
    console.log('\n10. Companies Directory (/api/companies)');
    const compRes = await fetch(`${BASE_URL}/companies`);
    const compData = await compRes.json();
    assert(compRes.status === 200 && compData.companies.length >= 5, `Fetched company catalog (${compData.companies.length} companies)`);

    // 11. Target Roles Standards
    console.log('\n11. Target Roles Standards (/api/roles)');
    const rolesRes = await fetch(`${BASE_URL}/roles`);
    const rolesData = await rolesRes.json();
    assert(rolesRes.status === 200 && rolesData.roles.length >= 4, `Fetched industry role standards (${rolesData.roles.length} roles)`);

    // 12. Version Management (Save & Retrieve)
    console.log('\n12. Resume Version History (/api/versions/save & /api/versions)');
    const saveVersionRes = await fetch(`${BASE_URL}/versions/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        versionName: 'v2.0 - Tailored for Cloudscale',
        targetRole: 'Java Developer',
        summary: 'Cloud-focused Java engineer with Spring Boot and AWS background.',
        skills: ['Java', 'Spring Boot', 'AWS', 'Docker', 'PostgreSQL'],
        projects: ['Cloud-Native Healthcare Records Management System'],
        diffNotes: 'Added AWS EC2 metrics and highlighted Docker containerization.'
      })
    });
    const saveVersionData = await saveVersionRes.json();
    assert(saveVersionRes.status === 200 && saveVersionData.success === true, 'Saved custom resume version to SQLite');

    const getVersionsRes = await fetch(`${BASE_URL}/versions`);
    const getVersionsData = await getVersionsRes.json();
    assert(getVersionsData.success === true && getVersionsData.versions.length >= 1, `Retrieved ${getVersionsData.versions.length} saved version(s) from database`);

    // 13. Download Report
    console.log('\n13. Download Formatted Report (/api/report/download)');
    const reportRes = await fetch(`${BASE_URL}/report/download`);
    const reportText = await reportRes.text();
    assert(reportRes.status === 200, 'Report endpoint returns HTTP 200');
    assert(reportText.includes('CAREERLENS AI — CANDIDATE READINESS REPORT'), 'Report header formatted correctly');
    assert(reportText.includes('PRIYA SHARMA'), 'Report contains candidate name');

    console.log(`\n======================================================`);
    console.log(`TOTAL CHECKS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log(`======================================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runComprehensiveIntegrationSuite();
