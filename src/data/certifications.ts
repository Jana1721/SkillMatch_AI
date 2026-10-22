import { Certification } from '../types';

export const MOCK_CERTIFICATIONS: Certification[] = [
  {
    id: 'cert-1',
    name: 'Microsoft Power BI Data Analyst (PL-300)',
    provider: 'Microsoft',
    relevanceScore: 94,
    whyItMatters: 'Demonstrates industry-standard ability to prepare data, model data, visualize assets, and configure workspaces in Microsoft Power BI. Highly requested by Data Analyst employers.',
    skillsCovered: ['Power BI', 'DAX', 'Data Modeling', 'Power Query', 'Data Warehousing'],
    difficulty: 'Intermediate',
    prepTime: '4–6 weeks',
    examCost: '₹4,800 (~$165 USD)',
    targetRoles: ['Data Analyst', 'BI Developer', 'Business Analyst']
  },
  {
    id: 'cert-2',
    name: 'AWS Certified Cloud Practitioner (CLF-C02)',
    provider: 'Amazon Web Services',
    relevanceScore: 91,
    whyItMatters: 'Validates overall understanding of AWS cloud concepts, core security, architectures, pricing models, and support tiers. Essential baseline for any modern cloud-adjacent role.',
    skillsCovered: ['AWS', 'Cloud Architecture', 'IAM', 'EC2 & S3', 'Cloud Security'],
    difficulty: 'Beginner',
    prepTime: '3–4 weeks',
    examCost: '₹8,200 (~$100 USD)',
    targetRoles: ['Cloud Engineer', 'DevOps Associate', 'Data Analyst', 'Software Engineer']
  },
  {
    id: 'cert-3',
    name: 'Google Data Analytics Professional Certificate',
    provider: 'Google Career Certificates',
    relevanceScore: 90,
    whyItMatters: 'A comprehensive hands-on curriculum developed by Google data scientists covering SQL query design, spreadsheets, R/Python programming, and Tableau dashboards.',
    skillsCovered: ['SQL', 'Spreadsheets', 'Data Cleaning', 'Tableau', 'R Programming'],
    difficulty: 'Beginner',
    prepTime: '6–8 weeks',
    examCost: 'Included in Coursera Subscription (~₹3,200/mo)',
    targetRoles: ['Data Analyst', 'Junior Business Analyst', 'Marketing Analyst']
  },
  {
    id: 'cert-4',
    name: 'ServiceNow Certified System Administrator (CSA)',
    provider: 'ServiceNow',
    relevanceScore: 88,
    whyItMatters: 'The foundational industry gold-standard credential validating your ability to manage, configure, and administer ServiceNow instances, users, tables, and automation rules.',
    skillsCovered: ['ServiceNow Administration', 'ITSM', 'Flow Designer', 'User Administration', 'System Security'],
    difficulty: 'Intermediate',
    prepTime: '5–7 weeks',
    examCost: '₹24,500 (~$300 USD)',
    targetRoles: ['ServiceNow Administrator', 'ServiceNow Developer', 'ITSM Analyst']
  },
  {
    id: 'cert-5',
    name: 'ITIL 4 Foundation',
    provider: 'PeopleCert / AXELOS',
    relevanceScore: 87,
    whyItMatters: 'Global benchmark for IT Service Management (ITSM). Teaches how modern IT organizations deliver value through the Service Value System (SVS) and Guiding Principles.',
    skillsCovered: ['ITSM', 'Incident Management', 'Change Enablement', 'Problem Management', 'Service Delivery'],
    difficulty: 'Beginner',
    prepTime: '2–3 weeks',
    examCost: '₹28,000 (~$380 USD)',
    targetRoles: ['ITSM Consultant', 'ServiceNow Developer', 'Business Analyst']
  },
  {
    id: 'cert-6',
    name: 'AWS Certified Solutions Architect - Associate',
    provider: 'Amazon Web Services',
    relevanceScore: 86,
    whyItMatters: 'Validates deep technical knowledge of how to architect and deploy secure, robust, and cost-effective distributed systems on AWS infrastructure.',
    skillsCovered: ['AWS', 'VPC & Networking', 'System Design', 'Auto-scaling', 'High Availability'],
    difficulty: 'Intermediate',
    prepTime: '8–10 weeks',
    examCost: '₹12,500 (~$150 USD)',
    targetRoles: ['Cloud Engineer', 'DevOps Engineer', 'Solutions Architect']
  },
  {
    id: 'cert-7',
    name: 'ServiceNow Certified Application Developer (CAD)',
    provider: 'ServiceNow',
    relevanceScore: 85,
    whyItMatters: 'Certifies specialized capability to design applications, write Business Rules, Client Scripts, Script Includes, and implement custom REST APIs on the ServiceNow Now Platform.',
    skillsCovered: ['JavaScript', 'ServiceNow Scripting', 'REST APIs', 'Service Portal', 'Flow Designer'],
    difficulty: 'Advanced',
    prepTime: '6–8 weeks',
    examCost: '₹24,500 (~$300 USD)',
    targetRoles: ['ServiceNow Developer', 'Technical Consultant']
  },
  {
    id: 'cert-8',
    name: 'Microsoft Certified: Azure Fundamentals (AZ-900)',
    provider: 'Microsoft',
    relevanceScore: 84,
    whyItMatters: 'Provides foundational proof of cloud computing concepts, Microsoft Azure architectural components, governance models, and security compliance tools.',
    skillsCovered: ['Cloud Computing', 'Azure Services', 'Identity & Security', 'Cost Management'],
    difficulty: 'Beginner',
    prepTime: '3–4 weeks',
    examCost: '₹4,500 (~$99 USD)',
    targetRoles: ['Cloud Engineer', 'Business Analyst', 'Software Engineer']
  },
  {
    id: 'cert-9',
    name: 'Meta Front-End Developer Professional Certificate',
    provider: 'Meta',
    relevanceScore: 82,
    whyItMatters: 'Created by Meta software engineers, this program covers React, JavaScript algorithms, HTML/CSS responsive design, UI testing with Jest, and modern version control.',
    skillsCovered: ['React', 'JavaScript', 'HTML/CSS', 'UI Testing', 'Git & GitHub'],
    difficulty: 'Intermediate',
    prepTime: '7–9 weeks',
    examCost: 'Coursera Subscription (~₹3,200/mo)',
    targetRoles: ['Frontend Developer', 'Full Stack Developer', 'Web Developer']
  },
  {
    id: 'cert-10',
    name: 'Tableau Desktop Specialist',
    provider: 'Salesforce / Tableau',
    relevanceScore: 80,
    whyItMatters: 'Demonstrates core understanding of visual analytics principles, connecting to data sources, building charts, and deploying dashboards in Tableau Desktop.',
    skillsCovered: ['Tableau', 'Data Visualization', 'Calculated Fields', 'Story Points', 'Analytics'],
    difficulty: 'Beginner',
    prepTime: '3–5 weeks',
    examCost: '₹8,200 (~$100 USD)',
    targetRoles: ['Data Analyst', 'BI Analyst', 'Operations Analyst']
  }
];
