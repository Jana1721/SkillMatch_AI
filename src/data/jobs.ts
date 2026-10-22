import { Job } from '../types';

export const MOCK_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Junior Data Analyst',
    company: 'DataCorp Analytics',
    companyId: 'comp-2',
    location: 'Bengaluru',
    salaryRange: '₹5–8 LPA',
    minSalary: 5,
    maxSalary: 8,
    experienceLevel: 'Fresher',
    workMode: 'Hybrid',
    roleCategory: 'Data Analytics',
    requiredSkills: [
      { name: 'SQL', requiredLevel: 'Advanced' },
      { name: 'Python', requiredLevel: 'Advanced' },
      { name: 'Power BI', requiredLevel: 'Intermediate' },
      { name: 'Excel', requiredLevel: 'Advanced' }
    ],
    description: 'DataCorp is looking for an energetic Junior Data Analyst to transform complex business datasets into clear visualizations and actionable reporting insights.',
    responsibilities: [
      'Write optimized SQL queries to extract data from Snowflake and PostgreSQL databases.',
      'Develop interactive Power BI dashboards for executive leadership.',
      'Automate repetitive data cleaning pipelines using Python and Pandas.',
      'Present weekly performance metrics to cross-functional product teams.'
    ],
    requirements: [
      'Bachelor’s degree in Computer Science, IT, Statistics, or related discipline.',
      'Proficiency in SQL joins, window functions, and indexing.',
      'Hands-on experience with Python data manipulation libraries.',
      'Solid understanding of dashboard UI design in Power BI or Tableau.'
    ],
    benefits: ['Health insurance coverage', 'Hybrid work stipend', 'Annual learning budget ₹30,000', 'Gym membership'],
    postedDate: '2 days ago',
    deadline: 'In 3 weeks',
    department: 'Business Intelligence'
  },
  {
    id: 'job-2',
    title: 'Associate ServiceNow Developer',
    company: 'ServiceFlow Solutions',
    companyId: 'comp-4',
    location: 'Bengaluru',
    salaryRange: '₹5–9 LPA',
    minSalary: 5,
    maxSalary: 9,
    experienceLevel: 'Entry-Level',
    workMode: 'Hybrid',
    roleCategory: 'ServiceNow',
    requiredSkills: [
      { name: 'ServiceNow Administration', requiredLevel: 'Intermediate' },
      { name: 'ITSM', requiredLevel: 'Intermediate' },
      { name: 'JavaScript', requiredLevel: 'Intermediate' },
      { name: 'Flow Designer', requiredLevel: 'Intermediate' }
    ],
    description: 'Join ServiceFlow Solutions as an Associate ServiceNow Developer configuring enterprise workflow automations and ITSM process solutions for Fortune 500 clients.',
    responsibilities: [
      'Configure ServiceNow forms, client scripts, UI policies, and business rules.',
      'Design automated multi-step workflows using Flow Designer.',
      'Participate in ITSM module rollouts (Incident, Request, Change, Problem).',
      'Assist in testing upgrade paths and regression suites on Sub-Prod instances.'
    ],
    requirements: [
      'Degree in Engineering or Computer Applications graduating in 2026/2027.',
      'Strong fundamentals in core JavaScript (ES6) and object-oriented programming.',
      'Familiarity with ServiceNow platform architecture and Now Learning credentials.',
      'ServiceNow Certified System Administrator (CSA) certification is a strong plus.'
    ],
    benefits: ['ServiceNow certification vouchers sponsored', 'Flexible hours', 'Relocation assistance', 'Medical plan'],
    postedDate: '1 day ago',
    deadline: 'In 2 weeks',
    department: 'Enterprise Platforms'
  },
  {
    id: 'job-3',
    title: 'Junior Business Analyst',
    company: 'InfoPulse Consulting',
    companyId: 'comp-5',
    location: 'Hyderabad',
    salaryRange: '₹6–10 LPA',
    minSalary: 6,
    maxSalary: 10,
    experienceLevel: 'Entry-Level',
    workMode: 'On-site',
    roleCategory: 'Business Analysis',
    requiredSkills: [
      { name: 'Business Analysis', requiredLevel: 'Intermediate' },
      { name: 'SQL', requiredLevel: 'Intermediate' },
      { name: 'Excel', requiredLevel: 'Advanced' },
      { name: 'Communication', requiredLevel: 'Advanced' }
    ],
    description: 'Bridge the gap between enterprise business units and engineering teams by eliciting requirements, documenting user stories, and analyzing operational metrics.',
    responsibilities: [
      'Interview stakeholders to map current state vs desired future state business workflows.',
      'Author detailed Functional Specification Documents (FSD) and user stories in Jira.',
      'Validate acceptance criteria and support User Acceptance Testing (UAT).',
      'Analyze customer churn and operational KPIs using Excel and SQL.'
    ],
    requirements: [
      'B.Tech / B.E. / BBA in IT or Systems with strong analytical reasoning.',
      'Exceptional verbal presentation and written documentation skills.',
      'Proficiency in SQL query generation and Microsoft Excel financial models.',
      'Familiarity with Agile Scrum ceremonies and tools.'
    ],
    benefits: ['Quarterly performance bonus', 'Comprehensive health cover', 'Commuter shuttle service'],
    postedDate: '3 days ago',
    deadline: 'In 4 weeks',
    department: 'Consulting Services'
  },
  {
    id: 'job-4',
    title: 'Graduate Cloud & DevOps Engineer',
    company: 'CloudWorks Tech',
    companyId: 'comp-3',
    location: 'Bengaluru',
    salaryRange: '₹6–9.5 LPA',
    minSalary: 6,
    maxSalary: 9.5,
    experienceLevel: 'Fresher',
    workMode: 'Remote',
    roleCategory: 'Cloud & DevOps',
    requiredSkills: [
      { name: 'AWS', requiredLevel: 'Intermediate' },
      { name: 'Docker', requiredLevel: 'Intermediate' },
      { name: 'Git & GitHub', requiredLevel: 'Advanced' },
      { name: 'Python', requiredLevel: 'Intermediate' }
    ],
    description: 'Build and monitor next-generation cloud infrastructure on AWS. Work with Kubernetes, Terraform, and automated CI/CD pipelines in a remote-first culture.',
    responsibilities: [
      'Provision AWS resources using CloudFormation and Terraform.',
      'Maintain GitHub Actions workflows for continuous integration and testing.',
      'Containerize microservices using Docker and monitor health via CloudWatch.',
      'Assist senior SREs in incident response and post-mortem analyses.'
    ],
    requirements: [
      'Foundational understanding of AWS networking (VPC, Subnets, Security Groups).',
      'Knowledge of Linux command-line administration and bash scripting.',
      'Hands-on experience deploying personal projects to public clouds.',
      'AWS Certified Cloud Practitioner or Solutions Architect is preferred.'
    ],
    benefits: ['100% remote flexibility', '₹40,000 home office setup allowance', 'Annual wellness perk'],
    postedDate: 'Just now',
    deadline: 'In 2 weeks',
    department: 'Cloud Operations'
  },
  {
    id: 'job-5',
    title: 'Frontend React Developer',
    company: 'TechNova Labs',
    companyId: 'comp-1',
    location: 'Bengaluru',
    salaryRange: '₹6–9 LPA',
    minSalary: 6,
    maxSalary: 9,
    experienceLevel: '0-1 Years',
    workMode: 'Hybrid',
    roleCategory: 'Software Engineering',
    requiredSkills: [
      { name: 'React', requiredLevel: 'Advanced' },
      { name: 'JavaScript', requiredLevel: 'Advanced' },
      { name: 'REST APIs', requiredLevel: 'Advanced' },
      { name: 'Git & GitHub', requiredLevel: 'Advanced' }
    ],
    description: 'Craft responsive, high-performance web applications using React 19, TypeScript, and modern design systems for our global SaaS platform.',
    responsibilities: [
      'Build reusable UI component systems with clean Tailwind CSS code.',
      'Integrate backend GraphQL and REST APIs with optimistic UI caching.',
      'Optimize web vitals, bundle size, and cross-browser responsiveness.',
      'Collaborate closely with UI/UX designers on Figma prototyping.'
    ],
    requirements: [
      'Strong proficiency in modern JavaScript (ES6+), React Hooks, and TypeScript.',
      'Demonstrated portfolio or GitHub repos featuring production-grade web apps.',
      'Understanding of client-side routing, state management, and async lifecycle.',
      'Good eye for micro-interactions and accessible UI patterns.'
    ],
    benefits: ['Latest MacBook Pro M3', 'Catered lunch & snacks', 'Stock options (ESOPs)'],
    postedDate: '4 days ago',
    deadline: 'In 1 month',
    department: 'Frontend Engineering'
  },
  {
    id: 'job-6',
    title: 'Junior AI/ML Engineer',
    company: 'ApexAI Technologies',
    companyId: 'comp-6',
    location: 'Pune',
    salaryRange: '₹7–11 LPA',
    minSalary: 7,
    maxSalary: 11,
    experienceLevel: 'Entry-Level',
    workMode: 'Hybrid',
    roleCategory: 'AI & ML',
    requiredSkills: [
      { name: 'Python', requiredLevel: 'Advanced' },
      { name: 'Machine Learning', requiredLevel: 'Intermediate' },
      { name: 'Pandas & NumPy', requiredLevel: 'Advanced' },
      { name: 'SQL', requiredLevel: 'Intermediate' }
    ],
    description: 'Develop and evaluate predictive machine learning models and NLP pipelines to power autonomous recommendation systems for enterprise clients.',
    responsibilities: [
      'Perform exploratory data analysis and feature engineering on structured tabular data.',
      'Train, fine-tune, and benchmark classical and neural model architectures.',
      'Deploy inference models as lightweight REST API endpoints using FastAPI.',
      'Monitor model drift and performance metrics in production.'
    ],
    requirements: [
      'B.Tech/M.Tech in CS/AI/Data Science with 8.0+ CGPA.',
      'Solid command over probability, statistics, and linear algebra.',
      'Experience with Scikit-learn, PyTorch, or TensorFlow.',
      'Familiarity with Hugging Face transformers is an added advantage.'
    ],
    benefits: ['Conference travel sponsorships', 'Comprehensive family health insurance', 'Research publication incentives'],
    postedDate: '3 days ago',
    deadline: 'In 3 weeks',
    department: 'AI Research & Engineering'
  },
  {
    id: 'job-7',
    title: 'ServiceNow ITSM Consultant',
    company: 'NextGen Systems',
    companyId: 'comp-7',
    location: 'Hyderabad',
    salaryRange: '₹6.5–10 LPA',
    minSalary: 6.5,
    maxSalary: 10,
    experienceLevel: '0-1 Years',
    workMode: 'Hybrid',
    roleCategory: 'ServiceNow',
    requiredSkills: [
      { name: 'ServiceNow Administration', requiredLevel: 'Intermediate' },
      { name: 'ITSM', requiredLevel: 'Advanced' },
      { name: 'IntegrationHub', requiredLevel: 'Intermediate' },
      { name: 'Communication', requiredLevel: 'Advanced' }
    ],
    description: 'Provide technical consultation and configuration assistance for ServiceNow enterprise clients across banking, retail, and healthcare sectors.',
    responsibilities: [
      'Gather ITIL requirement specifications directly from enterprise IT leaders.',
      'Build custom catalog items, approval workflows, and notification rules.',
      'Set up third-party REST integrations utilizing IntegrationHub spokes.',
      'Conduct train-the-trainer workshops and author handover documentation.'
    ],
    requirements: [
      'Clear grasp of ITIL v4 fundamentals and Service Lifecycle concepts.',
      'Hands-on experience administering ServiceNow instances and developer sandboxes.',
      'Strong problem-solving capability and client advisory presence.',
      'Excellent interpersonal communication and documentation discipline.'
    ],
    benefits: ['Fast-track consultant career ladder', 'Annual health checkups', 'Client engagement incentives'],
    postedDate: '5 days ago',
    deadline: 'In 2 weeks',
    department: 'IT Transformation'
  },
  {
    id: 'job-8',
    title: 'Junior Full Stack Developer',
    company: 'TechNova Labs',
    companyId: 'comp-1',
    location: 'Bengaluru',
    salaryRange: '₹6–9 LPA',
    minSalary: 6,
    maxSalary: 9,
    experienceLevel: 'Fresher',
    workMode: 'Hybrid',
    roleCategory: 'Software Engineering',
    requiredSkills: [
      { name: 'JavaScript', requiredLevel: 'Advanced' },
      { name: 'React', requiredLevel: 'Intermediate' },
      { name: 'REST APIs', requiredLevel: 'Advanced' },
      { name: 'SQL', requiredLevel: 'Intermediate' }
    ],
    description: 'Work on end-to-end features across our React frontend and Node.js microservices, shipping scalable code directly to thousands of active users.',
    responsibilities: [
      'Design RESTful endpoints with input validation and authentication middleware.',
      'Implement responsive dashboard pages and form interactions in React.',
      'Write automated unit and integration tests using Jest and Vitest.',
      'Participate in daily standups and peer code reviews.'
    ],
    requirements: [
      'Solid command of JavaScript/TypeScript across client and Node.js environments.',
      'Familiarity with SQL database querying (PostgreSQL / MySQL).',
      'Knowledge of asynchronous programming, promises, and event loop.',
      'Active GitHub profile showing full stack personal projects.'
    ],
    benefits: ['Mentorship from Staff Engineers', 'Generous PTO', 'Free cafeteria meals'],
    postedDate: '1 day ago',
    deadline: 'In 3 weeks',
    department: 'Product Engineering'
  },
  {
    id: 'job-9',
    title: 'BI & Reporting Analyst',
    company: 'DataCorp Analytics',
    companyId: 'comp-2',
    location: 'Mumbai',
    salaryRange: '₹5.5–8.5 LPA',
    minSalary: 5.5,
    maxSalary: 8.5,
    experienceLevel: 'Entry-Level',
    workMode: 'Hybrid',
    roleCategory: 'Data Analytics',
    requiredSkills: [
      { name: 'Power BI', requiredLevel: 'Advanced' },
      { name: 'SQL', requiredLevel: 'Advanced' },
      { name: 'Excel', requiredLevel: 'Advanced' },
      { name: 'Data Warehousing', requiredLevel: 'Intermediate' }
    ],
    description: 'Drive data-informed decision making across finance and logistics by designing high-impact business intelligence dashboards and automated ETL reports.',
    responsibilities: [
      'Construct scalable DAX calculations and data models in Power BI.',
      'Consolidate disjointed data sources into scheduled SQL reporting marts.',
      'Troubleshoot dashboard performance and optimize refresh runtimes.',
      'Create executive KPI dashboards used daily by leadership.'
    ],
    requirements: [
      'Proficiency in DAX formulas, star schema modeling, and Power Query (M).',
      'Strong relational database foundations and complex query tuning.',
      'Bachelor’s degree in Computer Science, Statistics, or related discipline.',
      'Attention to visual hierarchy and data storytelling.'
    ],
    benefits: ['Performance bonus', 'Continuous learning reimbursement', 'Comprehensive medical cover'],
    postedDate: '2 days ago',
    deadline: 'In 2 weeks',
    department: 'Enterprise Reporting'
  },
  {
    id: 'job-10',
    title: 'Junior ServiceNow Administrator',
    company: 'Krypton Enterprise',
    companyId: 'comp-8',
    location: 'Chennai',
    salaryRange: '₹4.8–7.5 LPA',
    minSalary: 4.8,
    maxSalary: 7.5,
    experienceLevel: 'Fresher',
    workMode: 'On-site',
    roleCategory: 'ServiceNow',
    requiredSkills: [
      { name: 'ServiceNow Administration', requiredLevel: 'Intermediate' },
      { name: 'ITSM', requiredLevel: 'Intermediate' },
      { name: 'Excel', requiredLevel: 'Intermediate' },
      { name: 'Problem Solving', requiredLevel: 'Intermediate' }
    ],
    description: 'Provide core administration, user provisioning, access management, and catalog maintenance across our production and sandbox ServiceNow instances.',
    responsibilities: [
      'Manage user accounts, roles, groups, and Access Control Lists (ACLs).',
      'Configure email notifications, SLA triggers, and survey mechanisms.',
      'Import bulk enterprise data using Transform Maps and staging tables.',
      'Resolve L1/L2 platform tickets submitted by internal department users.'
    ],
    requirements: [
      'Strong orientation toward IT Service Management concepts (Incident & Request).',
      'Knowledge of ServiceNow table structures and dictionary configurations.',
      'Systematic troubleshooting mindset and high attention to detail.',
      'Eagerness to complete ServiceNow CSA certification within 3 months.'
    ],
    benefits: ['Full certification sponsorship', 'Annual corporate insurance', 'Weekend off policy'],
    postedDate: '6 days ago',
    deadline: 'In 3 weeks',
    department: 'IT Infrastructure'
  },
  {
    id: 'job-11',
    title: 'Cloud Infrastructure Associate',
    company: 'CloudWorks Tech',
    companyId: 'comp-3',
    location: 'Hyderabad',
    salaryRange: '₹5.5–8 LPA',
    minSalary: 5.5,
    maxSalary: 8,
    experienceLevel: 'Fresher',
    workMode: 'Hybrid',
    roleCategory: 'Cloud & DevOps',
    requiredSkills: [
      { name: 'AWS', requiredLevel: 'Intermediate' },
      { name: 'Python', requiredLevel: 'Intermediate' },
      { name: 'System Design', requiredLevel: 'Beginner' },
      { name: 'Problem Solving', requiredLevel: 'Advanced' }
    ],
    description: 'Support core AWS cloud deployments, monitoring alerts, cost optimization audits, and automation scripting for high-availability enterprise services.',
    responsibilities: [
      'Assist in provisioning and managing EC2 instances, S3 buckets, and RDS databases.',
      'Configure CloudWatch alarms, SNS notifications, and backup routines.',
      'Script automated snapshot routines and cost-optimization jobs with Python.',
      'Document disaster recovery playbooks and architecture diagrams.'
    ],
    requirements: [
      'Understanding of core AWS primitives: IAM, VPC, EC2, S3, Route53.',
      'Basic scripting skill in Python or Bash for system automation.',
      'Strong conceptual grounding in TCP/IP networking, DNS, and security.',
      'Curiosity for cloud architectures and distributed systems.'
    ],
    benefits: ['AWS exam fee vouchers', 'WFH setup grant', 'Paid time off'],
    postedDate: '4 days ago',
    deadline: 'In 1 month',
    department: 'Cloud Services'
  },
  {
    id: 'job-12',
    title: 'Data Operations Engineer',
    company: 'InfoPulse Consulting',
    companyId: 'comp-5',
    location: 'Bengaluru',
    salaryRange: '₹5.2–8.2 LPA',
    minSalary: 5.2,
    maxSalary: 8.2,
    experienceLevel: 'Entry-Level',
    workMode: 'Hybrid',
    roleCategory: 'Data Analytics',
    requiredSkills: [
      { name: 'SQL', requiredLevel: 'Advanced' },
      { name: 'Python', requiredLevel: 'Intermediate' },
      { name: 'Data Warehousing', requiredLevel: 'Intermediate' },
      { name: 'Git & GitHub', requiredLevel: 'Intermediate' }
    ],
    description: 'Maintain data warehouse reliability, validate ETL pipeline integrity, and support ad-hoc SQL extract queries for client delivery teams.',
    responsibilities: [
      'Monitor scheduled data loading jobs and resolve batch failure exceptions.',
      'Perform data quality checks, schema anomaly detection, and deduplication.',
      'Write optimized SQL views and materialized aggregates for client analysts.',
      'Document ETL data flow diagrams and data dictionary catalogs.'
    ],
    requirements: [
      'High proficiency in relational query syntax (Postgres, MySQL, or SQL Server).',
      'Experience handling CSV/JSON data ingestion via Python scripts.',
      'Strong logical deduction and error debugging skill.',
      'B.Tech in Computer Science or IT.'
    ],
    benefits: ['Hybrid work model', 'Health insurance', 'Skill upgrade allowances'],
    postedDate: '3 days ago',
    deadline: 'In 3 weeks',
    department: 'Data Management'
  },
  {
    id: 'job-13',
    title: 'Junior ServiceNow Portal Developer',
    company: 'ServiceFlow Solutions',
    companyId: 'comp-4',
    location: 'Pune',
    salaryRange: '₹5.5–9 LPA',
    minSalary: 5.5,
    maxSalary: 9,
    experienceLevel: '0-1 Years',
    workMode: 'Remote',
    roleCategory: 'ServiceNow',
    requiredSkills: [
      { name: 'Service Portal', requiredLevel: 'Intermediate' },
      { name: 'JavaScript', requiredLevel: 'Advanced' },
      { name: 'React', requiredLevel: 'Intermediate' },
      { name: 'REST APIs', requiredLevel: 'Intermediate' }
    ],
    description: 'Design intuitive, branded self-service employee portals and custom widgets on the ServiceNow platform utilizing modern web technologies.',
    responsibilities: [
      'Build responsive Service Portal widgets using HTML, CSS/Sass, and client controllers.',
      'Consume ServiceNow Table API and Scripted REST APIs asynchronously.',
      'Implement mobile-friendly catalog checkout experiences for enterprise employees.',
      'Collaborate with UX designers to align portal themes with corporate branding.'
    ],
    requirements: [
      'Strong command of HTML5, CSS3, and JavaScript (ES6+).',
      'Knowledge of single-page application concepts and RESTful API consumption.',
      'Hands-on experience with ServiceNow Service Portal architecture.',
      'Ability to translate design wireframes into pixel-perfect web interfaces.'
    ],
    benefits: ['Remote first culture', 'Flexible work hours', 'Learning stipend'],
    postedDate: '5 days ago',
    deadline: 'In 2 weeks',
    department: 'Digital Experience'
  },
  {
    id: 'job-14',
    title: 'Product Analyst',
    company: 'TechNova Labs',
    companyId: 'comp-1',
    location: 'Bengaluru',
    salaryRange: '₹6.5–10.5 LPA',
    minSalary: 6.5,
    maxSalary: 10.5,
    experienceLevel: 'Fresher',
    workMode: 'On-site',
    roleCategory: 'Business Analysis',
    requiredSkills: [
      { name: 'SQL', requiredLevel: 'Advanced' },
      { name: 'Python', requiredLevel: 'Intermediate' },
      { name: 'Business Analysis', requiredLevel: 'Intermediate' },
      { name: 'Communication', requiredLevel: 'Advanced' }
    ],
    description: 'Analyze user behavior telemetry, funnel conversion rates, and retention cohorts to provide actionable product development recommendations.',
    responsibilities: [
      'Query user event streams using SQL to evaluate feature adoption metrics.',
      'Design and evaluate A/B test experiments with statistical rigor.',
      'Synthesize customer survey feedback with quantitative telemetry.',
      'Co-author Product Requirement Documents (PRDs) with Product Managers.'
    ],
    requirements: [
      'Data-driven mindset with strong curiosity for user psychology and SaaS metrics.',
      'Fluency in complex SQL window functions, aggregations, and cohort queries.',
      'Comfortable presenting visual insights to executive stakeholders.',
      'B.Tech or equivalent degree with excellent academic record.'
    ],
    benefits: ['Stock options', 'Free breakfast & lunch', 'Gym on-campus'],
    postedDate: '2 days ago',
    deadline: 'In 3 weeks',
    department: 'Product Growth'
  },
  {
    id: 'job-15',
    title: 'Graduate Software Engineer',
    company: 'ApexAI Technologies',
    companyId: 'comp-6',
    location: 'Bengaluru',
    salaryRange: '₹6.5–10 LPA',
    minSalary: 6.5,
    maxSalary: 10,
    experienceLevel: 'Fresher',
    workMode: 'Hybrid',
    roleCategory: 'Software Engineering',
    requiredSkills: [
      { name: 'Python', requiredLevel: 'Advanced' },
      { name: 'JavaScript', requiredLevel: 'Intermediate' },
      { name: 'REST APIs', requiredLevel: 'Advanced' },
      { name: 'Git & GitHub', requiredLevel: 'Advanced' }
    ],
    description: 'Kickstart your software engineering career building resilient backend services and high-throughput data processing endpoints.',
    responsibilities: [
      'Write clean, modular Python and TypeScript code following best practices.',
      'Implement API endpoints with proper error handling and validation.',
      'Write comprehensive unit tests with high code coverage.',
      'Collaborate with Senior Engineers through structured code reviews.'
    ],
    requirements: [
      'Strong conceptual foundation in Data Structures, Algorithms, and OOP.',
      'Familiarity with git version control and GitHub pull request workflows.',
      'B.Tech / B.E. in Computer Science or related branch.',
      'Eager to learn modern cloud and microservices architectures.'
    ],
    benefits: ['Sign-on bonus ₹50,000', 'Mentorship program', 'Health insurance'],
    postedDate: '1 day ago',
    deadline: 'In 2 weeks',
    department: 'Platform Engineering'
  },
  {
    id: 'job-16',
    title: 'Junior Cloud Security Analyst',
    company: 'Krypton Enterprise',
    companyId: 'comp-8',
    location: 'Hyderabad',
    salaryRange: '₹5.5–8.5 LPA',
    minSalary: 5.5,
    maxSalary: 8.5,
    experienceLevel: 'Entry-Level',
    workMode: 'Hybrid',
    roleCategory: 'Cloud & DevOps',
    requiredSkills: [
      { name: 'AWS', requiredLevel: 'Intermediate' },
      { name: 'System Design', requiredLevel: 'Beginner' },
      { name: 'Problem Solving', requiredLevel: 'Advanced' },
      { name: 'Communication', requiredLevel: 'Intermediate' }
    ],
    description: 'Monitor cloud security postures, audit IAM permissions, investigate security alerts, and ensure compliance across cloud workloads.',
    responsibilities: [
      'Audit AWS IAM roles, policies, and least-privilege configurations.',
      'Triage security alerts generated by GuardDuty and Security Hub.',
      'Assist in vulnerability scanning of container images and EC2 instances.',
      'Document remediation workflows for common configuration drifts.'
    ],
    requirements: [
      'Basic knowledge of cybersecurity principles and cloud architecture.',
      'Hands-on exposure to AWS services and identity management.',
      'Analytical problem-solving and rigorous attention to detail.',
      'Degree in Computer Science, Cyber Security, or Information Systems.'
    ],
    benefits: ['Security certifications paid', 'Health policy', 'Yearly appraisal'],
    postedDate: '5 days ago',
    deadline: 'In 4 weeks',
    department: 'Information Security'
  },
  {
    id: 'job-17',
    title: 'ServiceNow Flow Automation Specialist',
    company: 'ServiceFlow Solutions',
    companyId: 'comp-4',
    location: 'Bengaluru',
    salaryRange: '₹6–9.5 LPA',
    minSalary: 6,
    maxSalary: 9.5,
    experienceLevel: '0-1 Years',
    workMode: 'Hybrid',
    roleCategory: 'ServiceNow',
    requiredSkills: [
      { name: 'Flow Designer', requiredLevel: 'Advanced' },
      { name: 'IntegrationHub', requiredLevel: 'Intermediate' },
      { name: 'ServiceNow Administration', requiredLevel: 'Intermediate' },
      { name: 'REST APIs', requiredLevel: 'Intermediate' }
    ],
    description: 'Build enterprise-grade automated workflows in ServiceNow Flow Designer connecting HR, IT, and Customer Operations seamlessly.',
    responsibilities: [
      'Author custom Flow Designer actions, subflows, and error handlers.',
      'Integrate third-party SaaS applications via REST spokes in IntegrationHub.',
      'Replace legacy workflow editor configurations with modern Flow Designer processes.',
      'Optimize execution duration and monitor flow context transactions.'
    ],
    requirements: [
      'Practical familiarity with ServiceNow platform automation capabilities.',
      'Comfortable with JSON payload manipulation and REST HTTP methods.',
      'Understanding of enterprise approvals, timers, and conditional branching.',
      'Solid analytical aptitude and process-oriented mindset.'
    ],
    benefits: ['Now Learning certification vouchers', 'Gym reimbursement', 'Flexible hours'],
    postedDate: '4 days ago',
    deadline: 'In 3 weeks',
    department: 'Workflow Automation'
  },
  {
    id: 'job-18',
    title: 'Associate Machine Learning Analyst',
    company: 'NextGen Systems',
    companyId: 'comp-7',
    location: 'Hyderabad',
    salaryRange: '₹6.2–9.8 LPA',
    minSalary: 6.2,
    maxSalary: 9.8,
    experienceLevel: 'Fresher',
    workMode: 'Hybrid',
    roleCategory: 'AI & ML',
    requiredSkills: [
      { name: 'Python', requiredLevel: 'Advanced' },
      { name: 'Machine Learning', requiredLevel: 'Intermediate' },
      { name: 'SQL', requiredLevel: 'Intermediate' },
      { name: 'Problem Solving', requiredLevel: 'Advanced' }
    ],
    description: 'Support enterprise data science teams by cleaning raw datasets, training baseline ML algorithms, and writing automated evaluation scripts.',
    responsibilities: [
      'Preprocess large unstructured and semi-structured dataset feeds.',
      'Train regression, classification, and clustering models using Scikit-learn.',
      'Visualize model validation metrics, ROC curves, and confusion matrices.',
      'Prepare presentations summarizing model findings for business sponsors.'
    ],
    requirements: [
      'Strong grasp of Python (NumPy, Pandas, Scikit-learn, Matplotlib).',
      'Solid foundations in linear algebra, multivariable calculus, and probability.',
      'Proven projects on Kaggle or GitHub demonstrating machine learning workflow.',
      'B.Tech / M.Sc in CS, AI, Math, or related STEM field.'
    ],
    benefits: ['Fast growth potential', 'Health benefits', 'Quarterly hackathons'],
    postedDate: '3 days ago',
    deadline: 'In 2 weeks',
    department: 'Applied Data Science'
  },
  {
    id: 'job-19',
    title: 'Junior DevOps Associate',
    company: 'TechNova Labs',
    companyId: 'comp-1',
    location: 'Bengaluru',
    salaryRange: '₹6–9 LPA',
    minSalary: 6,
    maxSalary: 9,
    experienceLevel: 'Entry-Level',
    workMode: 'Hybrid',
    roleCategory: 'Cloud & DevOps',
    requiredSkills: [
      { name: 'Docker', requiredLevel: 'Intermediate' },
      { name: 'Git & GitHub', requiredLevel: 'Advanced' },
      { name: 'AWS', requiredLevel: 'Intermediate' },
      { name: 'REST APIs', requiredLevel: 'Intermediate' }
    ],
    description: 'Assist in building automated release pipelines, containerizing internal services, and maintaining developer productivity tooling.',
    responsibilities: [
      'Write Dockerfiles following caching and minimal surface area best practices.',
      'Create and tune GitHub Actions CI workflows for automated linting and tests.',
      'Monitor application metrics on AWS CloudWatch and log aggregation tools.',
      'Participate in release deployments and configuration management.'
    ],
    requirements: [
      'Hands-on familiarity with Linux CLI, bash, and git version control.',
      'Basic knowledge of containerization concepts and Docker commands.',
      'Understanding of continuous integration and continuous delivery principles.',
      'Degree in Computer Science or IT.'
    ],
    benefits: ['WFH allowances', 'Health coverage', 'Snacks & beverages'],
    postedDate: '6 days ago',
    deadline: 'In 3 weeks',
    department: 'Engineering Operations'
  },
  {
    id: 'job-20',
    title: 'Financial & Data Analyst',
    company: 'InfoPulse Consulting',
    companyId: 'comp-5',
    location: 'Mumbai',
    salaryRange: '₹6–9.2 LPA',
    minSalary: 6,
    maxSalary: 9.2,
    experienceLevel: '0-1 Years',
    workMode: 'Hybrid',
    roleCategory: 'Data Analytics',
    requiredSkills: [
      { name: 'Excel', requiredLevel: 'Advanced' },
      { name: 'SQL', requiredLevel: 'Intermediate' },
      { name: 'Power BI', requiredLevel: 'Intermediate' },
      { name: 'Business Analysis', requiredLevel: 'Intermediate' }
    ],
    description: 'Combine financial acumen with modern data analysis tools to produce financial forecasts, budget tracking dashboards, and variance reports.',
    responsibilities: [
      'Build financial models, forecasting projections, and cost-variance analyses.',
      'Extract transaction datasets from SQL databases into Power BI dashboards.',
      'Automate monthly reconciliation reports using advanced Excel formulas.',
      'Deliver executive presentations on quarterly operating cash flows.'
    ],
    requirements: [
      'B.Tech / B.Com / MBA in Finance or Systems with strong quantitative skills.',
      'Advanced Excel (Index/Match, XLOOKUP, pivot charts, financial functions).',
      'Solid working knowledge of SQL querying and Power BI visualizations.',
      'High degree of integrity and accuracy when managing confidential figures.'
    ],
    benefits: ['Annual bonus', 'Medical insurance for parents', 'Tuition support'],
    postedDate: '1 week ago',
    deadline: 'In 2 weeks',
    department: 'Financial Advisory'
  },
  {
    id: 'job-21',
    title: 'Associate ITIL & ServiceNow Analyst',
    company: 'Krypton Enterprise',
    companyId: 'comp-8',
    location: 'Bengaluru',
    salaryRange: '₹5–7.8 LPA',
    minSalary: 5,
    maxSalary: 7.8,
    experienceLevel: 'Fresher',
    workMode: 'Hybrid',
    roleCategory: 'ServiceNow',
    requiredSkills: [
      { name: 'ITSM', requiredLevel: 'Intermediate' },
      { name: 'ServiceNow Administration', requiredLevel: 'Intermediate' },
      { name: 'Communication', requiredLevel: 'Advanced' },
      { name: 'Problem Solving', requiredLevel: 'Intermediate' }
    ],
    description: 'Ensure seamless operation of enterprise IT services by managing incident routing, change advisory board schedules, and service catalog requests.',
    responsibilities: [
      'Coordinate critical incident bridges and dispatch resolver group tasks in ServiceNow.',
      'Audit Change Requests for compliance before CAB meetings.',
      'Generate weekly incident SLA compliance reports using platform metrics.',
      'Collaborate with system admins to resolve recurring process bottlenecks.'
    ],
    requirements: [
      'Familiarity with IT Service Management and ITIL foundation framework.',
      'Working knowledge of ServiceNow incident, change, and request tables.',
      'Confident presentation and clear verbal communication skills.',
      'Graduate in Engineering, Science, or Computer Applications.'
    ],
    benefits: ['ITIL certification sponsorship', 'Health benefits', 'Cab facility'],
    postedDate: '2 days ago',
    deadline: 'In 3 weeks',
    department: 'IT Service Delivery'
  },
  {
    id: 'job-22',
    title: 'Junior Web Application Developer',
    company: 'ApexAI Technologies',
    companyId: 'comp-6',
    location: 'Pune',
    salaryRange: '₹5.8–8.8 LPA',
    minSalary: 5.8,
    maxSalary: 8.8,
    experienceLevel: 'Entry-Level',
    workMode: 'Remote',
    roleCategory: 'Software Engineering',
    requiredSkills: [
      { name: 'JavaScript', requiredLevel: 'Advanced' },
      { name: 'React', requiredLevel: 'Intermediate' },
      { name: 'REST APIs', requiredLevel: 'Intermediate' },
      { name: 'Git & GitHub', requiredLevel: 'Intermediate' }
    ],
    description: 'Join a dynamic team building customer-facing web dashboards, data ingestion forms, and interactive analytics views for our AI platform.',
    responsibilities: [
      'Develop clean and modular React components utilizing standard hook architectures.',
      'Connect frontend client state with asynchronous REST backend endpoints.',
      'Implement form validation, error states, and responsive CSS styling.',
      'Write integration tests and maintain high quality codebase documentation.'
    ],
    requirements: [
      'Sound knowledge of JavaScript ES6+, HTML5 semantic markup, and CSS3.',
      'Working experience building at least two full React applications.',
      'Familiarity with git branching, merges, and pull request reviews.',
      'Bachelor’s degree in Computer Science, Information Technology, or similar.'
    ],
    benefits: ['Remote stipend', 'Flexible hours', 'Wellness allowance'],
    postedDate: '3 days ago',
    deadline: 'In 1 month',
    department: 'Frontend Engineering'
  }
];
