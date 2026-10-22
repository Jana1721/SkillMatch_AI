import { SalaryBenchmark } from '../types';

export const SALARY_BENCHMARKS: SalaryBenchmark[] = [
  {
    role: 'Data Analyst',
    entryLevelMin: 5.0,
    entryLevelMax: 7.5,
    midLevelMin: 7.5,
    midLevelMax: 12.0,
    seniorMin: 12.0,
    seniorMax: 18.5,
    topSkills: ['SQL', 'Python', 'Power BI', 'Excel', 'Data Warehousing'],
    demandTrend: 'Very High',
    description: 'Data analysts interpret complex metrics and build dashboards. High demand across e-commerce, banking, healthcare, and SaaS companies.'
  },
  {
    role: 'Business Analyst',
    entryLevelMin: 5.5,
    entryLevelMax: 8.0,
    midLevelMin: 8.0,
    midLevelMax: 13.0,
    seniorMin: 13.0,
    seniorMax: 20.0,
    topSkills: ['Business Analysis', 'SQL', 'Excel', 'Communication', 'Power BI'],
    demandTrend: 'High',
    description: 'Bridges business requirements and engineering teams. Excellent compensation growth as domain expertise and leadership scale.'
  },
  {
    role: 'ServiceNow Developer',
    entryLevelMin: 5.2,
    entryLevelMax: 9.0,
    midLevelMin: 9.0,
    midLevelMax: 15.5,
    seniorMin: 15.5,
    seniorMax: 24.0,
    topSkills: ['ServiceNow Administration', 'JavaScript', 'Flow Designer', 'ITSM', 'IntegrationHub'],
    demandTrend: 'Very High',
    description: 'High enterprise demand due to worldwide digital transformation and shortage of certified ServiceNow professionals.'
  },
  {
    role: 'Cloud & DevOps Engineer',
    entryLevelMin: 6.0,
    entryLevelMax: 9.5,
    midLevelMin: 9.5,
    midLevelMax: 16.0,
    seniorMin: 16.0,
    seniorMax: 25.0,
    topSkills: ['AWS', 'Docker', 'Git & GitHub', 'Python', 'Linux', 'Kubernetes'],
    demandTrend: 'Very High',
    description: 'Critical role maintaining resilient cloud infrastructure, microservice deployments, and CI/CD automation pipelines.'
  },
  {
    role: 'Frontend Developer (React)',
    entryLevelMin: 5.5,
    entryLevelMax: 8.5,
    midLevelMin: 8.5,
    midLevelMax: 14.5,
    seniorMin: 14.5,
    seniorMax: 22.0,
    topSkills: ['React', 'JavaScript', 'TypeScript', 'REST APIs', 'CSS/Tailwind'],
    demandTrend: 'High',
    description: 'Crafts responsive user experiences, interactive web applications, and customer-facing software interfaces.'
  },
  {
    role: 'AI / ML Engineer',
    entryLevelMin: 7.0,
    entryLevelMax: 11.0,
    midLevelMin: 11.0,
    midLevelMax: 18.0,
    seniorMin: 18.0,
    seniorMax: 28.0,
    topSkills: ['Python', 'Machine Learning', 'Pandas & NumPy', 'SQL', 'Deep Learning'],
    demandTrend: 'Very High',
    description: 'Designs predictive algorithms, neural architectures, and intelligent automation systems. Commands premium compensation packages.'
  }
];
