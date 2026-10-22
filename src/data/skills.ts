import { UserSkill } from '../types';

export interface SkillDefinition {
  id: string;
  name: string;
  category: 'Programming' | 'Cloud' | 'Tools' | 'Database' | 'Soft Skills' | 'Enterprise';
  industryDemand: 'High' | 'Very High' | 'Moderate';
  description: string;
  defaultIndustryLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export const ALL_SKILLS: SkillDefinition[] = [
  { id: '1', name: 'Python', category: 'Programming', industryDemand: 'Very High', defaultIndustryLevel: 'Advanced', description: 'Core programming language for data analysis, scripting, and backend development.' },
  { id: '2', name: 'SQL', category: 'Database', industryDemand: 'Very High', defaultIndustryLevel: 'Advanced', description: 'Structured Query Language for querying and managing relational databases.' },
  { id: '3', name: 'Power BI', category: 'Tools', industryDemand: 'Very High', defaultIndustryLevel: 'Intermediate', description: 'Business intelligence and interactive dashboard visualization tool by Microsoft.' },
  { id: '4', name: 'Excel', category: 'Tools', industryDemand: 'High', defaultIndustryLevel: 'Advanced', description: 'Spreadsheet tool with VLOOKUP, pivot tables, macros, and analytical functions.' },
  { id: '5', name: 'AWS', category: 'Cloud', industryDemand: 'Very High', defaultIndustryLevel: 'Intermediate', description: 'Amazon Web Services cloud computing infrastructure (S3, EC2, Lambda, IAM).' },
  { id: '6', name: 'ServiceNow Administration', category: 'Enterprise', industryDemand: 'Very High', defaultIndustryLevel: 'Intermediate', description: 'Configuring user forms, lists, workflows, ACLs, and service catalog in ServiceNow.' },
  { id: '7', name: 'ITSM', category: 'Enterprise', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'IT Service Management frameworks (Incident, Problem, Change management).' },
  { id: '8', name: 'JavaScript', category: 'Programming', industryDemand: 'Very High', defaultIndustryLevel: 'Advanced', description: 'Web client and server runtime language, critical for web apps and client scripts.' },
  { id: '9', name: 'React', category: 'Programming', industryDemand: 'Very High', defaultIndustryLevel: 'Advanced', description: 'Component-driven front-end library for interactive web user interfaces.' },
  { id: '10', name: 'Flow Designer', category: 'Enterprise', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'No-code process automation and integration workflow engine in ServiceNow.' },
  { id: '11', name: 'IntegrationHub', category: 'Enterprise', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'Connecting ServiceNow with third-party enterprise tools via REST and Spokes.' },
  { id: '12', name: 'REST APIs', category: 'Programming', industryDemand: 'Very High', defaultIndustryLevel: 'Advanced', description: 'Building and consuming stateless HTTP RESTful application programming interfaces.' },
  { id: '13', name: 'Service Portal', category: 'Enterprise', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'Creating user-friendly self-service portals using AngularJS and Bootstrap on ServiceNow.' },
  { id: '14', name: 'Tableau', category: 'Tools', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'Data visualization tool for creating interactive reports and statistical charts.' },
  { id: '15', name: 'Docker', category: 'Cloud', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'Containerization tool for packaging and running applications reliably across environments.' },
  { id: '16', name: 'Git & GitHub', category: 'Tools', industryDemand: 'Very High', defaultIndustryLevel: 'Advanced', description: 'Version control system for tracking code changes and collaborative engineering.' },
  { id: '17', name: 'Machine Learning', category: 'Programming', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'Supervised and unsupervised statistical modeling with scikit-learn and pandas.' },
  { id: '18', name: 'Data Warehousing', category: 'Database', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'Dimensional modeling, ETL pipelines, snowflake and star schemas.' },
  { id: '19', name: 'System Design', category: 'Programming', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'Designing scalable, distributed, reliable software architectures and APIs.' },
  { id: '20', name: 'Business Analysis', category: 'Soft Skills', industryDemand: 'High', defaultIndustryLevel: 'Intermediate', description: 'Translating business stakeholder requirements into technical specifications and user stories.' },
  { id: '21', name: 'Problem Solving', category: 'Soft Skills', industryDemand: 'Very High', defaultIndustryLevel: 'Advanced', description: 'Algorithmic thinking, data structures, and systematic root-cause troubleshooting.' },
  { id: '22', name: 'Communication', category: 'Soft Skills', industryDemand: 'Very High', defaultIndustryLevel: 'Advanced', description: 'Cross-functional presentation, technical documentation, and team collaboration.' },
  { id: '23', name: 'Java', category: 'Programming', industryDemand: 'High', defaultIndustryLevel: 'Advanced', description: 'Object-oriented programming language widely used in enterprise software.' },
  { id: '24', name: 'MongoDB', category: 'Database', industryDemand: 'Moderate', defaultIndustryLevel: 'Intermediate', description: 'Document-oriented NoSQL database for flexible JSON schema storage.' },
  { id: '25', name: 'Pandas & NumPy', category: 'Programming', industryDemand: 'Very High', defaultIndustryLevel: 'Advanced', description: 'Python data manipulation libraries for tabular data cleaning and vector operations.' }
];

export const SKILL_NAMES: string[] = ALL_SKILLS.map(s => s.name);
