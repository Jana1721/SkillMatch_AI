import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Zap,
  Info,
  Briefcase,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';
import { StorageService } from '../utils/storage';

export const JobDescriptionMatcher: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [jdText, setJdText] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('Associate Software Engineer');
  const [companyName, setCompanyName] = useState<string>('Target Enterprise / Startup');
  const [isMatching, setIsMatching] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  const sampleJD = `Role: Associate Java Developer / Software Engineer
Location: Bengaluru / Hyderabad | Experience: 0-1 Years

Job Overview:
We are looking for an ambitious Computer Science fresher or early-career engineer to build scalable RESTful backend services. 

Key Responsibilities:
- Design and maintain microservices and REST APIs using Java, Spring Boot, and PostgreSQL.
- Write optimized SQL queries, handle transaction lifecycles, and implement database indexing.
- Collaborate with frontend teams using Git and GitHub Actions for CI/CD pipelines.
- Write unit tests with JUnit to ensure code stability and maintain zero-defect deployments.

Requirements:
- Strong foundations in Java 17+, Object-Oriented Programming (OOP), and Data Structures.
- Hands-on experience with Spring Boot, Hibernate, and RESTful architectures.
- Experience with Docker containers and AWS cloud primitives is a strong plus.
- Excellent analytical problem-solving and communication skills.`;

  const handleRunMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim() || jdText.trim().length < 25) {
      showToast('Please paste a substantial job description to match.', 'error');
      return;
    }

    try {
      setIsMatching(true);
      const res = await ApiService.matchJD(jdText, jobTitle, companyName);
      setMatchResult(res.matchResult);
      showToast(`Matched against resume! Compatibility: ${res.matchResult.matchScore}%`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Matching failed', 'error');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Job Description Matcher
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Paste & Audit
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare any live job requisition against your uploaded resume to identify matching skills, real gaps, and customized interview questions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setJdText(sampleJD);
            showToast('Sample Java SDE Job Description loaded!', 'info');
          }}
        >
          Load Sample JD
        </Button>
      </div>

      {/* Input Form */}
      <Card padding="lg" className="space-y-4 bg-white border-slate-200">
        <form onSubmit={handleRunMatch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Position Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Associate Java Developer"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Company / Organization</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. TCS Digital, ServiceNow, or Razorpay"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs">
              Paste Complete Job Description Text *
            </label>
            <textarea
              rows={8}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job posting duties, required qualifications, and technical tech stack here..."
              className="w-full p-4 font-mono text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isMatching}
              icon={<Zap className="w-4 h-4" />}
            >
              Analyze Requisition Match
            </Button>
          </div>
        </form>
      </Card>

      {/* Results View */}
      {matchResult && (
        <div className="space-y-6">
          {/* Match Score Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card padding="md" className="bg-indigo-50/60 border-indigo-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">JD Match Score</span>
              <div className="text-4xl font-black text-indigo-700 mt-1">{matchResult.matchScore}%</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Based on required skill taxonomy</p>
            </Card>

            <Card padding="md" className="bg-emerald-50/60 border-emerald-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skills Found in Resume</span>
              <div className="text-4xl font-black text-emerald-700 mt-1">{matchResult.skillsFoundInResume.length}</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Direct resume evidence verified</p>
            </Card>

            <Card padding="md" className="bg-rose-50/60 border-rose-200 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skills Missing from Resume</span>
              <div className="text-4xl font-black text-rose-700 mt-1">{matchResult.skillsMissingFromResume.length}</div>
              <p className="text-[11px] text-slate-600 mt-0.5">Gaps to bridge before applying</p>
            </Card>
          </div>

          {/* Side-by-Side Skills Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Found */}
            <Card padding="md" className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Matching Skills Found</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.skillsFoundInResume.map((s: string) => (
                  <span key={s} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">
                    ✓ {s}
                  </span>
                ))}
              </div>
            </Card>

            {/* Missing */}
            <Card padding="md" className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-rose-800">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Missing Skills Not Found</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.skillsMissingFromResume.map((s: string) => (
                  <span key={s} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg">
                    ✗ {s}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* Truthfulness Rule: Keyword Guidance */}
          <Card padding="md" className="space-y-3 border-amber-200 bg-amber-50/40">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-200 text-amber-900">
              <Info className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Keyword Advice — The Truthfulness Principle
              </h4>
            </div>

            <div className="space-y-2 text-xs text-slate-800">
              {matchResult.keywordAdvice.map((kw: any, idx: number) => (
                <div key={idx} className="p-3 bg-white rounded-xl border border-amber-200/70 flex items-start gap-2.5">
                  <span className="font-bold text-amber-800 shrink-0">{kw.keyword}:</span>
                  <span className="leading-relaxed text-slate-700">{kw.advice}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Relevant Projects Matching this JD */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Relevant Projects from Your Resume for this JD
              </h4>
            </div>

            {matchResult.relevantProjects.length > 0 ? (
              <div className="space-y-2">
                {matchResult.relevantProjects.map((p: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    <span className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-md">
                      Matches: {p.matchedTech.join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No existing resume projects feature the exact primary skills requested in this requisition.</p>
            )}
          </Card>

          {/* Expected Interview Topics for this specific JD */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800">
              <HelpCircle className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Requisition-Specific Interview Topics
              </h4>
            </div>

            <ul className="text-xs text-slate-700 space-y-1.5 list-disc list-inside">
              {matchResult.interviewTopics.map((topic: string, idx: number) => (
                <li key={idx}>{topic}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
};
