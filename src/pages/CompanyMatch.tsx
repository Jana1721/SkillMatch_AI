import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Sparkles,
  Search,
  BookOpen,
  Info,
  CheckCircle2,
  ArrowRight,
  Target
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ApiService } from '../services/api';

export const CompanyMatch: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadCompanies() {
      try {
        setLoading(true);
        const res = await ApiService.getCompanies();
        if (res.success && res.companies) {
          setCompanies(res.companies);
        }
      } catch (err: any) {
        console.error('Failed to load companies', err);
      } finally {
        setLoading(false);
      }
    }
    loadCompanies();
  }, []);

  const categories = [
    'All',
    'Product Companies',
    'IT Services Companies',
    'Consulting Companies',
    'ServiceNow-Focused Opportunities',
    'Java-Focused Opportunities',
    'Startups & FinTech'
  ];

  const filteredCompanies = companies.filter(c => {
    if (activeCategory !== 'All' && c.category !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.relevantRole.toLowerCase().includes(q) ||
        c.skillsCommonlyRelevant.some((s: string) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Company Discovery & Role Alignment
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              Zero-Fabrication Directory
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore prominent technology employers, role alignment rationale, relevant skills, and specific assessment topics.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/jd-matcher')}
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          Match a Job Description
        </Button>
      </div>

      {/* Truthfulness Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong>Transparency Notice:</strong> CareerLens AI does not rank companies as "best" or "worst", nor do we fabricate vacancies. Information below represents general engineering role expectations, hiring pipelines, and technical assessment areas.
        </p>
      </div>

      {/* Category Filter Pills & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Companies Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCompanies.map((comp: any, idx: number) => {
          return (
            <Card key={idx} padding="lg" className="space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
                      {comp.category}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">{comp.name}</h3>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {comp.relevantRole.split('/')[0]}
                  </span>
                </div>

                {/* Relevant Role */}
                <div className="text-xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Relevant Position:
                  </span>
                  <p className="font-bold text-slate-800">{comp.relevantRole}</p>
                </div>

                {/* Why it may match */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Why Profile Matches:
                  </span>
                  <p className="text-slate-700 leading-relaxed">{comp.whyItMayMatch}</p>
                </div>

                {/* Skills commonly relevant */}
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                    Skills Commonly Relevant:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {comp.skillsCommonlyRelevant.map((s: string) => (
                      <span key={s} className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-semibold rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preparation Areas */}
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-700 tracking-wider block">
                    Key Assessment Preparation Areas:
                  </span>
                  <p className="text-indigo-950 leading-relaxed font-medium">{comp.preparationAreas}</p>
                </div>
              </div>

              {/* Public notice footer */}
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{comp.publicInfoNotice}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
