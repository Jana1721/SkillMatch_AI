import { Course, LearningPhase } from '../types';

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-1',
    title: 'Python for Data Analytics & Visualization Bootcamp',
    platform: 'Coursera / DeepLearning.AI',
    duration: '18 hours (3 weeks)',
    difficulty: 'Intermediate',
    rating: 4.8,
    skillsGained: ['Python', 'Pandas & NumPy', 'Matplotlib', 'Data Cleaning'],
    url: 'https://coursera.org/learn/python-data-analysis'
  },
  {
    id: 'course-2',
    title: 'Advanced SQL for Data Analytics & Warehousing',
    platform: 'Udemy / 365 Data Science',
    duration: '14 hours (2 weeks)',
    difficulty: 'Advanced',
    rating: 4.9,
    skillsGained: ['SQL', 'Window Functions', 'Query Optimization', 'Data Warehousing'],
    url: 'https://udemy.com/course/advanced-sql-analytics'
  },
  {
    id: 'course-3',
    title: 'Microsoft Power BI: Desktop & Service Masterclass',
    platform: 'Microsoft Learn',
    duration: '22 hours (3 weeks)',
    difficulty: 'Intermediate',
    rating: 4.8,
    skillsGained: ['Power BI', 'DAX', 'Data Modeling', 'Power Query'],
    url: 'https://learn.microsoft.com/power-bi'
  },
  {
    id: 'course-4',
    title: 'AWS Cloud Practitioner Essentials',
    platform: 'AWS Skill Builder',
    duration: '12 hours (2 weeks)',
    difficulty: 'Beginner',
    rating: 4.7,
    skillsGained: ['AWS', 'Cloud Architecture', 'Security & IAM', 'EC2 & S3'],
    url: 'https://explore.skillbuilder.aws'
  },
  {
    id: 'course-5',
    title: 'ServiceNow Fundamentals & Administrator Path',
    platform: 'ServiceNow Now Learning',
    duration: '24 hours (4 weeks)',
    difficulty: 'Intermediate',
    rating: 4.9,
    skillsGained: ['ServiceNow Administration', 'ITSM', 'Flow Designer', 'User Roles'],
    url: 'https://nowlearning.servicenow.com'
  },
  {
    id: 'course-6',
    title: 'ITIL 4 Foundation Complete IT Service Management Course',
    platform: 'Udemy',
    duration: '8 hours (1 week)',
    difficulty: 'Beginner',
    rating: 4.6,
    skillsGained: ['ITSM', 'Incident Management', 'Change Management', 'Problem Solving'],
    url: 'https://udemy.com/course/itil-4-foundation'
  },
  {
    id: 'course-7',
    title: 'ServiceNow Scripting & Automated Workflows',
    platform: 'ServiceNow Now Learning',
    duration: '16 hours (3 weeks)',
    difficulty: 'Advanced',
    rating: 4.8,
    skillsGained: ['JavaScript', 'ServiceNow Scripting', 'Flow Designer', 'IntegrationHub'],
    url: 'https://nowlearning.servicenow.com/scripting'
  },
  {
    id: 'course-8',
    title: 'Full Stack React 19 & Modern Web Architecture',
    platform: 'Frontend Masters',
    duration: '20 hours (3 weeks)',
    difficulty: 'Intermediate',
    rating: 4.9,
    skillsGained: ['React', 'JavaScript', 'REST APIs', 'State Management'],
    url: 'https://frontendmasters.com/courses/react'
  },
  {
    id: 'course-9',
    title: 'Docker & Containerization for Modern DevOps',
    platform: 'Coursera',
    duration: '10 hours (2 weeks)',
    difficulty: 'Intermediate',
    rating: 4.7,
    skillsGained: ['Docker', 'Containers', 'Git & GitHub', 'CI/CD'],
    url: 'https://coursera.org/learn/docker-basics'
  },
  {
    id: 'course-10',
    title: 'Business Analysis Foundations & Stakeholder Mapping',
    platform: 'LinkedIn Learning',
    duration: '9 hours (1.5 weeks)',
    difficulty: 'Beginner',
    rating: 4.6,
    skillsGained: ['Business Analysis', 'Communication', 'Agile Jira', 'User Stories'],
    url: 'https://linkedin.com/learning/business-analysis'
  },
  {
    id: 'course-11',
    title: 'Data Structures & Algorithmic Problem Solving',
    platform: 'freeCodeCamp',
    duration: '30 hours (4 weeks)',
    difficulty: 'Advanced',
    rating: 4.9,
    skillsGained: ['Problem Solving', 'Python', 'Algorithms', 'System Design'],
    url: 'https://freecodecamp.org/learn'
  },
  {
    id: 'course-12',
    title: 'Tableau Desktop for Data Analytics Specialists',
    platform: 'Coursera',
    duration: '15 hours (2.5 weeks)',
    difficulty: 'Beginner',
    rating: 4.7,
    skillsGained: ['Tableau', 'Data Visualization', 'Storytelling', 'Excel'],
    url: 'https://coursera.org/learn/analytics-tableau'
  },
  {
    id: 'course-13',
    title: 'REST API Design & Integration with Python & Node',
    platform: 'Udemy',
    duration: '11 hours (2 weeks)',
    difficulty: 'Intermediate',
    rating: 4.8,
    skillsGained: ['REST APIs', 'JavaScript', 'Python', 'System Design'],
    url: 'https://udemy.com/course/rest-api-design'
  },
  {
    id: 'course-14',
    title: 'Applied Machine Learning in Python with Scikit-Learn',
    platform: 'Coursera / University of Michigan',
    duration: '22 hours (3 weeks)',
    difficulty: 'Intermediate',
    rating: 4.8,
    skillsGained: ['Machine Learning', 'Pandas & NumPy', 'Python', 'Model Evaluation'],
    url: 'https://coursera.org/learn/python-machine-learning'
  },
  {
    id: 'course-15',
    title: 'Microsoft Excel: Advanced Formulas, Macros & Pivot Tables',
    platform: 'Udemy',
    duration: '12 hours (2 weeks)',
    difficulty: 'Advanced',
    rating: 4.8,
    skillsGained: ['Excel', 'Data Modeling', 'Business Analysis', 'Reporting'],
    url: 'https://udemy.com/course/excel-advanced-formulas'
  },
  {
    id: 'course-16',
    title: 'Tech Interview Mastery: Systems, Coding & Behavioral',
    platform: 'Tech Interview Pro',
    duration: '14 hours (2 weeks)',
    difficulty: 'Intermediate',
    rating: 4.9,
    skillsGained: ['Communication', 'Problem Solving', 'System Design', 'Resume Building'],
    url: 'https://techinterviewpro.com'
  }
];

export const INITIAL_LEARNING_ROADMAP: LearningPhase[] = [
  {
    id: 'phase-1',
    phaseNumber: 1,
    title: 'Strengthen Fundamentals',
    duration: '2 weeks',
    description: 'Master core programming fundamentals, structured data manipulation with Python, and clean relational database querying.',
    skills: ['Python', 'SQL', 'Git & GitHub'],
    status: 'completed',
    progress: 100,
    tasks: [
      { id: 'task-1-1', title: 'Complete Python syntax, data structures and OOP refresher', completed: true },
      { id: 'task-1-2', title: 'Solve 25 SQL query problems involving multi-table joins and aggregations', completed: true },
      { id: 'task-1-3', title: 'Setup GitHub repository portfolio with README markdown guides', completed: true }
    ],
    recommendedCourses: [MOCK_COURSES[0], MOCK_COURSES[1]]
  },
  {
    id: 'phase-2',
    phaseNumber: 2,
    title: 'Advanced SQL & Data Modeling',
    duration: '3 weeks',
    description: 'Upgrade your SQL knowledge to industry level: window functions, CTEs, indexing, execution plans, and dimensional modeling.',
    skills: ['SQL', 'Data Warehousing'],
    status: 'in_progress',
    progress: 60,
    tasks: [
      { id: 'task-2-1', title: 'Master ROW_NUMBER(), RANK(), DENSE_RANK() and LAG/LEAD window functions', completed: true },
      { id: 'task-2-2', title: 'Construct Star Schema dimensional models for e-commerce datasets', completed: true },
      { id: 'task-2-3', title: 'Analyze SQL query execution plans (EXPLAIN ANALYZE) and add indexes', completed: false }
    ],
    recommendedCourses: [MOCK_COURSES[1]]
  },
  {
    id: 'phase-3',
    phaseNumber: 3,
    title: 'Power BI & Visual Analytics',
    duration: '2 weeks',
    description: 'Bridge your biggest technical gap by developing interactive dashboards, calculating DAX business measures, and publishing reports.',
    skills: ['Power BI', 'Excel'],
    status: 'in_progress',
    progress: 25,
    tasks: [
      { id: 'task-3-1', title: 'Learn Power Query ETL transformations and data cleaning steps', completed: true },
      { id: 'task-3-2', title: 'Write core DAX measures: CALCULATE, FILTER, SAMEPERIODLASTYEAR', completed: false },
      { id: 'task-3-3', title: 'Design an executive sales performance dashboard with drill-down filters', completed: false }
    ],
    recommendedCourses: [MOCK_COURSES[2], MOCK_COURSES[14]]
  },
  {
    id: 'phase-4',
    phaseNumber: 4,
    title: 'Cloud Foundations & Portfolio Project',
    duration: '3 weeks',
    description: 'Learn foundational AWS cloud services and build a production-grade end-to-end data pipeline project to showcase on your resume.',
    skills: ['AWS', 'Python', 'Power BI'],
    status: 'not_started',
    progress: 0,
    tasks: [
      { id: 'task-4-1', title: 'Configure AWS IAM roles, S3 buckets, and RDS PostgreSQL database', completed: false },
      { id: 'task-4-2', title: 'Build automated Python ETL script uploading processed data to S3', completed: false },
      { id: 'task-4-3', title: 'Connect Power BI live to cloud database and publish public portfolio report', completed: false }
    ],
    recommendedCourses: [MOCK_COURSES[3]]
  },
  {
    id: 'phase-5',
    phaseNumber: 5,
    title: 'Interview Preparation & Mock Screening',
    duration: '2 weeks',
    description: 'Prepare for technical assessments, SQL live coding tests, portfolio defense presentations, and behavioral STAR questions.',
    skills: ['Communication', 'Problem Solving'],
    status: 'not_started',
    progress: 0,
    tasks: [
      { id: 'task-5-1', title: 'Complete 3 mock technical interviews on live SQL and data case studies', completed: false },
      { id: 'task-5-2', title: 'Refine resume with ATS keywords and quantifiable metrics', completed: false },
      { id: 'task-5-3', title: 'Draft 5 STAR method behavioral responses for leadership & conflict questions', completed: false }
    ],
    recommendedCourses: [MOCK_COURSES[15]]
  }
];
