import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Hash,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';
import { StorageService } from '../utils/storage';

export const TargetRoles: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleTitle, setSelectedRoleTitle] = useState<string>('Java Developer');
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const rolesRes = await ApiService.getRoles();
        if (rolesRes.success && rolesRes.roles) {
          setRoles(rolesRes.roles);
        }

        const resumeRes = await ApiService.getCurrentResume();
        if (resumeRes.success && resumeRes.analysis) {
          setAnalysis(resumeRes.analysis);
          if (resumeRes.analysis.targetRole) {
            setSelectedRoleTitle(resumeRes.analysis.targetRole);
          }
        } else {
          const local = StorageService.getResumeAnalysis();
          if (local) setAnalysis(local);
        }
      } catch {
        const local = StorageService.getResumeAnalysis();
        if (local) setAnalysis(local);
      }
    }
    loadData();
  }, []);

  const activeRole = roles.find(r => r.title.toLowerCase().includes(selectedRoleTitle.toLowerCase())) || roles[0] || {
    title: 'Java Developer',
    coreSkills: ['Java', 'Spring Boot', 'SQL', 'REST APIs', 'Git', 'Data Structures', 'OOP'],
    recommendedSkills: ['Hibernate', 'Docker', 'PostgreSQL', 'System Design'],
    commonInterviewTopics: ['Java Collections & Multithreading', 'Spring Boot Dependency Injection', 'SQL Normalization & Indexing'],
    keywords: ['Java 17/21', 'Spring Boot', 'RESTful API', 'Microservices', 'PostgreSQL']
  };

  const candidateSkills = analysis?.parsedData?.skills?.allSkillsFound || [
    'Java', 'SQL', 'Git', 'Data Structures', 'Python'
  ];
  const candidateLower = candidateSkills.map((s: string) => s.toLowerCase());

  const presentSkills = activeRole.coreSkills.filter((s: string) => candidateLower.includes(s.toLowerCase()));
  const missingSkills = activeRole.coreSkills.filter((s: string) => !candidateLower.includes(s.toLowerCase()));

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Target Role Benchmarks & Skill Alignment
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Role Matching Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Examine how your resume skills match entry-level screening rubrics across primary software roles.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/companies')}
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Explore Matching Companies
        </Button>
      </div>

      {/* Role Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {roles.map((r: any) => {
          const isSelected = activeRole.title === r.title;
          return (
            <button
              key={r.title}
              onClick={() => setSelectedRoleTitle(r.title)}
              className={`p-3 rounded-2xl text-xs font-bold transition-all text-center cursor-pointer border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {r.title}
            </button>
          );
        })}
      </div>

      {/* Main Role Matching Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Role Diagnostics */}
        <div className="lg:col-span-7 space-y-6">
          <Card padding="lg" className="space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
                  Target Evaluation
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">{activeRole.title}</h2>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-indigo-600">
                  {Math.round((presentSkills.length / Math.max(1, activeRole.coreSkills.length)) * 100)}%
                </span>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Core Alignment</p>
              </div>
            </div>

            {/* Current Present Skills */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Current Skills Verified in Resume ({presentSkills.length})
              </h4>

              <div className="flex flex-wrap gap-1.5">
                {presentSkills.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">
                    ✓ {s}
                  </span>
                ))}
                {presentSkills.length === 0 && (
                  <p className="text-xs text-slate-400 italic">None of the primary core skills were detected in the uploaded resume.</p>
                )}
              </div>
            </div>

            {/* Needs Improvement / Missing Skills */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Needs Improvement / Gaps Identified ({missingSkills.length})
              </h4>

              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((s: string) => (
                  <span key={s} className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-lg">
                    ⚠ {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Recommended Learning Topics */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <strong className="text-slate-700 uppercase tracking-wider text-[11px] block">
                Recommended Structured Preparation Sequence:
              </strong>
              <ol className="list-decimal list-inside space-y-1 text-slate-800 font-medium leading-relaxed">
                {activeRole.coreSkills.map((s: string, idx: number) => (
                  <li key={idx}>Master {s} through dedicated practice tasks and mini-projects</li>
                ))}
              </ol>
            </div>
          </Card>
        </div>

        {/* Right: Interview Topics & Keywords */}
        <div className="lg:col-span-5 space-y-6">
          {/* Keywords */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800">
              <Hash className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                ATS Requisition Keywords for {activeRole.title}
              </h4>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {activeRole.keywords?.map((kw: string) => (
                <span key={kw} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg">
                  {kw}
                </span>
              ))}
            </div>
          </Card>

          {/* Common Interview Topics */}
          <Card padding="md" className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider">
                Common Interview Focus Areas
              </h4>
            </div>

            <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
              {activeRole.commonInterviewTopics?.map((topic: string, i: number) => (
                <li key={i} className="leading-relaxed">{topic}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
