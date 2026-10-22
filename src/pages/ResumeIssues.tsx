import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  Target
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StorageService } from '../utils/storage';
import { ApiService } from '../services/api';

export const ResumeIssues: React.FC = () => {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Critical' | 'Important' | 'Improvement' | 'Good'>('All');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await ApiService.getCurrentResume();
        if (res.success && res.analysis) {
          setAnalysis(res.analysis);
        } else {
          // Fallback to local storage
          const local = StorageService.getResumeAnalysis();
          if (local) setAnalysis(local);
        }
      } catch {
        const local = StorageService.getResumeAnalysis();
        if (local) setAnalysis(local);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const issues = analysis?.issues || [];

  const filteredIssues = issues.filter((iss: any) => {
    if (activeFilter === 'All') return true;
    return iss.severity === activeFilter;
  });

  const countBySeverity = {
    Critical: issues.filter((i: any) => i.severity === 'Critical').length,
    Important: issues.filter((i: any) => i.severity === 'Important').length,
    Improvement: issues.filter((i: any) => i.severity === 'Improvement').length,
    Good: issues.filter((i: any) => i.severity === 'Good').length
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Resume Issues & Mistake Detection
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {issues.length} Items Flagged
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Deterministic audit grounded exclusively in your uploaded resume content.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/upload')}
          >
            Upload New Resume
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => navigate('/improve')}
          >
            Apply Fixes
          </Button>
        </div>
      </div>

      {/* Severity Filter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveFilter('Critical')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeFilter === 'Critical'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
            🔴 Critical
          </span>
          <div className="text-2xl font-black text-rose-900 mt-1">{countBySeverity.Critical}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">High-risk ATS blockers</p>
        </button>

        <button
          onClick={() => setActiveFilter('Important')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeFilter === 'Important'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
            🟠 Important
          </span>
          <div className="text-2xl font-black text-amber-900 mt-1">{countBySeverity.Important}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Key quality improvements</p>
        </button>

        <button
          onClick={() => setActiveFilter('Improvement')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeFilter === 'Improvement'
              ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200'
              : 'bg-white border-slate-200 hover:border-yellow-200'
          }`}
        >
          <span className="text-xs font-bold text-yellow-700 flex items-center gap-1.5">
            🟡 Improvement
          </span>
          <div className="text-2xl font-black text-yellow-900 mt-1">{countBySeverity.Improvement}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Competitive optimizations</p>
        </button>

        <button
          onClick={() => setActiveFilter('Good')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeFilter === 'Good'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            🟢 Good
          </span>
          <div className="text-2xl font-black text-emerald-900 mt-1">{countBySeverity.Good}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Compliant strengths</p>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold">
          Showing {filteredIssues.length} of {issues.length} detected points ({activeFilter} view)
        </span>

        {activeFilter !== 'All' && (
          <button
            onClick={() => setActiveFilter('All')}
            className="text-indigo-600 font-bold hover:underline cursor-pointer"
          >
            Show All Severities
          </button>
        )}
      </div>

      {/* Issues List */}
      <div className="space-y-4">
        {filteredIssues.map((issue: any, index: number) => {
          const isCritical = issue.severity === 'Critical';
          const isImportant = issue.severity === 'Important';
          const isImprovement = issue.severity === 'Improvement';
          const isGood = issue.severity === 'Good';

          return (
            <Card
              key={index}
              padding="lg"
              className={`border-l-4 transition-all ${
                isCritical
                  ? 'border-l-rose-500 bg-white'
                  : isImportant
                  ? 'border-l-amber-500 bg-white'
                  : isImprovement
                  ? 'border-l-yellow-400 bg-white'
                  : 'border-l-emerald-500 bg-white'
              }`}
            >
              <div className="space-y-3">
                {/* Header badge & Problem */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800'
                          : isImportant
                          ? 'bg-amber-100 text-amber-800'
                          : isImprovement
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {issue.badge}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {issue.problem}
                    </h3>
                  </div>
                </div>

                {/* Why it matters */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block">
                    Why it matters
                  </span>
                  <p className="leading-relaxed">{issue.whyItMatters}</p>
                </div>

                {/* Recommended Fix */}
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
                  <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" /> Recommended Fix
                  </span>
                  <p className="leading-relaxed font-medium">{issue.recommendedFix}</p>
                </div>
              </div>
            </Card>
          );
        })}

        {filteredIssues.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-900">No issues in this category</h4>
            <p className="text-xs text-slate-500">
              Clear filters to view all audit findings or upload an updated document version.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
