import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code2,
  Globe,
  Database,
  Cloud,
  Terminal,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
  Info
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ApiService } from '../services/api';
import { StorageService } from '../utils/storage';

export const SkillsAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await ApiService.getCurrentResume();
        if (res.success && res.analysis) {
          setAnalysis(res.analysis);
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

  const categorized = analysis?.parsedData?.skills || {
    programmingLanguages: [],
    webTechnologies: [],
    frameworks: [],
    databases: [],
    cloudAndDevOps: [],
    toolsAndPlatforms: [],
    enterpriseAndSpecialized: [],
    allSkillsFound: []
  };

  const sections = [
    {
      title: 'Programming Languages',
      icon: Code2,
      skills: categorized.programmingLanguages,
      description: 'Core syntax, OOP concepts, algorithms, and computational problem solving'
    },
    {
      title: 'Web Technologies',
      icon: Globe,
      skills: categorized.webTechnologies,
      description: 'Markup, styling, stateless communication protocols, and client rendering'
    },
    {
      title: 'Frameworks & Libraries',
      icon: Layers,
      skills: categorized.frameworks,
      description: 'Enterprise backend engines, MVC components, and reactive frontend libraries'
    },
    {
      title: 'Databases & Data Storage',
      icon: Database,
      skills: categorized.databases,
      description: 'Relational query engines, NoSQL document stores, caching, and schemas'
    },
    {
      title: 'Cloud & DevOps Infrastructure',
      icon: Cloud,
      skills: categorized.cloudAndDevOps,
      description: 'Containers, cloud infrastructure, deployment pipelines, and Linux runtime'
    },
    {
      title: 'Developer Tools & Platforms',
      icon: Terminal,
      skills: [...categorized.toolsAndPlatforms, ...categorized.enterpriseAndSpecialized],
      description: 'Version control workflows, API testing suites, and enterprise platforms'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Categorized Technical Skills
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {categorized.allSkillsFound.length} Skills Detected
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Structured skill taxonomy extracted from your uploaded resume.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/skill-gap')}
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          View Skill Gap Matrix
        </Button>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          const hasSkills = sec.skills && sec.skills.length > 0;

          return (
            <Card key={idx} padding="md" className="space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">{sec.title}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold">{sec.skills.length} Detected</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 mt-2 mb-3 leading-relaxed">
                  {sec.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {hasSkills ? (
                    sec.skills.map((s: string) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-lg shadow-2xs"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No skills extracted in this category.</span>
                  )}
                </div>
              </div>

              {hasSkills && (
                <div className="pt-2 border-t border-slate-100 text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resume evidence present
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
