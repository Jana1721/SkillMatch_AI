import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Target,
  Briefcase,
  TrendingUp,
  Award,
  Layers,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  UploadCloud,
  FileText,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Building2,
  Code2
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  const supportedRoles = [
    { title: 'Java Developer', desc: 'Java 17/21, Spring Boot, SQL, REST APIs, Collections, Microservices', icon: Code2 },
    { title: 'Software Developer / SDE', desc: 'Data Structures, Algorithms, Problem Solving, OOP, System Design', icon: Target },
    { title: 'ServiceNow Developer', desc: 'ITSM, GlideRecord, Flow Designer, Client Scripts, Business Rules', icon: Layers },
    { title: 'Full Stack Developer', desc: 'React, Node.js, TypeScript, SQL, REST APIs, Tailwind CSS', icon: Briefcase },
    { title: 'Cloud & DevOps Engineer', desc: 'AWS, Docker, CI/CD, Kubernetes, Linux, Terraform, Python', icon: Award },
    { title: 'Data Analyst', desc: 'Python, SQL, Power BI, Advanced Excel, Data Modeling, ETL', icon: TrendingUp }
  ];

  const features = [
    {
      title: 'Real Document Parsing',
      desc: 'Deep multi-format text extraction from searchable PDF, DOCX, and TXT files without fake simulations.',
      icon: FileCheck,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Mistake & Issue Detection',
      desc: 'Pinpoints Critical (🔴), Important (🟠), and Improvement (🟡) issues grounded strictly in your resume.',
      icon: AlertCircle,
      color: 'bg-rose-50 text-rose-600'
    },
    {
      title: 'Project Architecture Audit',
      desc: 'Analyzes project layers (Frontend, Backend, Database, Auth) and verifies Working Phase (Prototype vs Production).',
      icon: Layers,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Skill Gap Matrix',
      desc: 'Side-by-side comparison of candidate resume evidence vs industry entry-level screening rubrics.',
      icon: Target,
      color: 'bg-amber-50 text-amber-600'
    },
    {
      title: 'Job Description Matcher',
      desc: 'Paste any job posting to detect matching skills, missing keywords, and custom interview topics.',
      icon: Briefcase,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      title: 'Resume Improvement Engine',
      desc: 'Generates faithful professional summaries and project bullets without inventing false achievements or metrics.',
      icon: Sparkles,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      title: 'Resume-Grounded Interview Prep',
      desc: 'Tailored questions covering Resume, Projects, Java, DSA, SQL, ServiceNow, and Behavioral rounds.',
      icon: HelpCircle,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Dynamic Learning Roadmap',
      desc: 'Generates a custom 6-week syllabus based strictly on your individual technical gaps.',
      icon: BookOpen,
      color: 'bg-teal-50 text-teal-600'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Top SaaS Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                CareerLens<span className="text-indigo-600 font-black">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-400 font-bold ml-2 uppercase tracking-wider">
                Career Readiness Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/upload')}
            >
              Upload Resume
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              onClick={() => navigate('/upload')}
            >
              Analyze My Resume
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Production Career Readiness Engine for CSE Students & Freshers
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Analyze your resume. <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Discover your gaps.</span> Prepare for the right opportunities.
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          CareerLens AI audits your actual resume document against industry hiring rubrics for Java, ServiceNow, Full-Stack, and Software Engineering roles — with zero fabricated metrics.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button
            variant="primary"
            size="lg"
            icon={<UploadCloud className="w-5 h-5" />}
            onClick={() => navigate('/upload')}
            className="w-full sm:w-auto"
          >
            Upload Resume (PDF, DOCX, TXT)
          </Button>

          <Button
            variant="outline"
            size="lg"
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto"
          >
            Explore Dashboard Demo
          </Button>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-500 font-semibold">
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real PDF & DOCX Extraction</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Grounded Mistake Detection</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Project Working-Phase Audit</span>
          <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Target Role Matching</span>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">The 4-Step Pipeline</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">How CareerLens AI Works</h2>
            <p className="text-xs sm:text-sm text-slate-500">From uploaded document to interview readiness without guessing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">1</span>
              <h3 className="text-base font-bold text-slate-900">Upload Resume</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload your original resume in PDF, DOCX, or plain text. Real parsers extract contact details, education, skills, and projects.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">2</span>
              <h3 className="text-base font-bold text-slate-900">Detect Issues & Gaps</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Flags Critical (🔴), Important (🟠), and Improvement (🟡) issues. Compares resume evidence against role screening rubrics.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">3</span>
              <h3 className="text-base font-bold text-slate-900">Verify Projects</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Audits project architecture across frontend, backend, database, and authentication. Classifies Prototype vs Production-ready.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">4</span>
              <h3 className="text-base font-bold text-slate-900">Prepare & Improve</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Generates faithful resume rewrites, matches real job postings, and creates customized technical interview questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Roles Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Specialized Hiring Tracks</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Supported Engineering Roles</h2>
          <p className="text-xs sm:text-sm text-slate-500">Each role features customized skill gap taxonomies and interview questions.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {supportedRoles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{role.title}</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{role.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comprehensive Features Grid */}
      <section className="py-16 bg-slate-100/60 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Engineered for Technical Rigor</span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Platform Capabilities</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5">
                  <div className={`w-9 h-9 rounded-xl ${feat.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <footer className="py-16 max-w-5xl mx-auto px-4 text-center space-y-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-indigo-900 to-violet-900 text-white space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to test your resume against real industry rubrics?
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-xl mx-auto leading-relaxed">
            Upload your document now to receive your personalized audit report, gap matrix, and tailored interview questions.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/upload')}
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-black shadow-md"
            >
              Upload Resume (PDF, DOCX, TXT)
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          CareerLens AI • Built for Computer Science Engineering students & graduates.
        </p>
      </footer>
    </div>
  );
};
