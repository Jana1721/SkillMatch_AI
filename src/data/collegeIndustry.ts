import { CollegeIndustryBenchmark } from '../types';

export const COLLEGE_INDUSTRY_DATA: CollegeIndustryBenchmark[] = [
  {
    skill: 'Python',
    collegeAvg: 65,
    industryDemand: 88,
    category: 'Programming',
    gap: 23,
    insight: 'Colleges teach syntax and basic scripts, while industry demands modular code, Pandas data manipulation, and API packaging.'
  },
  {
    skill: 'SQL',
    collegeAvg: 58,
    industryDemand: 82,
    category: 'Database',
    gap: 24,
    insight: 'Academic DB courses focus on relational algebra and normalization, but real roles require complex window functions and query tuning.'
  },
  {
    skill: 'Cloud (AWS/Azure)',
    collegeAvg: 42,
    industryDemand: 76,
    category: 'Cloud',
    gap: 34,
    insight: 'Major deficit in syllabus. Most students never deploy to real cloud infrastructure or manage IAM permissions.'
  },
  {
    skill: 'Data Analytics',
    collegeAvg: 63,
    industryDemand: 85,
    category: 'Tools',
    gap: 22,
    insight: 'Theory on statistical tests is taught, but hands-on business intelligence dashboards and KPI tracking are missing.'
  },
  {
    skill: 'Power BI / Tableau',
    collegeAvg: 38,
    industryDemand: 70,
    category: 'Tools',
    gap: 32,
    insight: 'One of the highest demand gaps. Modern corporations run operations on BI tools that are rarely part of university curricula.'
  },
  {
    skill: 'ServiceNow Platform',
    collegeAvg: 25,
    industryDemand: 78,
    category: 'Enterprise',
    gap: 53,
    insight: 'Enterprise platforms represent massive placement opportunities with high salaries, but virtually no college curriculum includes them.'
  },
  {
    skill: 'Docker & DevOps',
    collegeAvg: 30,
    industryDemand: 75,
    category: 'Cloud',
    gap: 45,
    insight: 'Engineering curricula focus on standalone desktop applications; containerization and automated CI/CD pipelines are neglected.'
  },
  {
    skill: 'System Design & APIs',
    collegeAvg: 35,
    industryDemand: 72,
    category: 'Programming',
    gap: 37,
    insight: 'Microservice design, REST principles, and horizontal scaling are vital in hiring rounds but rarely covered in depth.'
  }
];

export const TOP_RECOMMENDED_COLLEGE_UPGRADES = [
  {
    title: 'Deploy to Cloud early',
    description: 'Stop testing only on localhost. Create a free-tier AWS or Azure account and host at least 2 full stack applications with real domains.',
    badge: 'High Impact'
  },
  {
    title: 'Learn Power BI or Tableau',
    description: 'Add real interactive data storytelling to your projects. Transforming raw CSVs into executive dashboards gives immediate interview appeal.',
    badge: 'Quick Win'
  },
  {
    title: 'Explore ServiceNow & Enterprise Systems',
    description: 'Complete the free Now Learning platform modules. Getting the ServiceNow CSA certification opens direct placement pathways.',
    badge: 'Enterprise Demand'
  },
  {
    title: 'Master Window Functions in SQL',
    description: 'Move beyond SELECT * FROM table WHERE. 90% of technical screening rounds test window aggregates and CTE joins.',
    badge: 'Essential'
  }
];
