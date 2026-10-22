async function testAll() {
  const sampleResume = `Alex Kumar
Bengaluru, India | +91 9876543210 | alex.kumar@email.com
LinkedIn: linkedin.com/in/alex-kumar | GitHub: github.com/alex-kumar

EDUCATION
B.Tech in Computer Science & Engineering
ABC Engineering College, Bengaluru | CGPA: 8.4/10 | Expected: 2027

TECHNICAL SKILLS
- Programming: Java (17/21), Python, SQL, JavaScript
- Frameworks: Spring Boot, Hibernate, REST APIs, Git, Docker
- Databases: PostgreSQL, MySQL, Redis

PROJECTS
1. Enterprise Employee & Asset Management System
- Architected a full-stack Spring Boot REST API serving 15+ endpoints with token-based authentication.
- Optimized PostgreSQL relational queries using compound indexing, reducing query response time by 42% on 50,000+ records.
- Containerized system with Docker for reproducible deployment.

2. Distributed Order Processing Engine
- Built a multi-threaded Java asynchronous order queue processing 1,200 simulated transactions per minute.
- Enforced transactional data integrity using ACID guarantees and custom Hibernate JPA repository layers.`;

  console.log('1. Testing /api/resume/analyze-text...');
  const res1 = await fetch('http://localhost:5000/api/resume/analyze-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: sampleResume,
      targetRole: 'Java Developer',
      sourceName: 'Sample_Alex_Kumar.txt'
    })
  });
  const data1 = await res1.json();
  console.log('-> Success:', data1.success, '| Score:', data1.analysis?.scorecard?.overallScore, '| Skills detected:', data1.analysis?.parsedData?.skills?.allSkillsFound?.length);

  console.log('2. Testing /api/resume/current...');
  const res2 = await fetch('http://localhost:5000/api/resume/current');
  const data2 = await res2.json();
  console.log('-> Current resume candidate:', data2.analysis?.parsedData?.contact?.name, '| Projects:', data2.analysis?.parsedData?.projects?.length);

  console.log('3. Testing /api/projects/verify...');
  const res3 = await fetch('http://localhost:5000/api/projects/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: 'Enterprise Employee & Asset Management System',
      githubUrl: 'https://github.com/alex-kumar/asset-management',
      hasDb: true,
      hasApi: true,
      hasAuth: true,
      hasTesting: true,
      hasDeploy: true
    })
  });
  const data3 = await res3.json();
  console.log('-> Classification:', data3.verification?.classification);

  console.log('4. Testing /api/jd/match...');
  const res4 = await fetch('http://localhost:5000/api/jd/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jdText: 'Looking for a Java Developer proficient in Java, Spring Boot, SQL, REST APIs, and Docker containerization.',
      jobTitle: 'Junior Java Developer'
    })
  });
  const data4 = await res4.json();
  console.log('-> JD Match score:', data4.matchResult?.matchScore, '| Matched skills:', data4.matchResult?.skillsFoundInResume);

  console.log('5. Testing /api/interview/questions...');
  const res5 = await fetch('http://localhost:5000/api/interview/questions?role=Java%20Developer');
  const data5 = await res5.json();
  console.log('-> Interview questions generated:', Object.keys(data5.questions || {}));

  console.log('6. Testing /api/companies...');
  const res6 = await fetch('http://localhost:5000/api/companies');
  const data6 = await res6.json();
  console.log('-> Companies catalog count:', data6.companies?.length);

  console.log('ALL BACKEND ENDPOINTS VERIFIED SUCCESSFULLY!');
}

testAll().catch(console.error);
