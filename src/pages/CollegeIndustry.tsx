import React from 'react';
import {
  Compass,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  School,
  Building2
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CollegeIndustryChart } from '../components/charts/CollegeIndustryChart';
import { COLLEGE_INDUSTRY_DATA, TOP_RECOMMENDED_COLLEGE_UPGRADES } from '../data/collegeIndustry';
import { useNavigate } from 'react-router-dom';

export const CollegeIndustry: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How Does Your College Skill Profile Compare?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Analyzing university curriculum syllabus coverage vs modern engineering hiring demands.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<BookOpen className="w-4 h-4" />}
          onClick={() => navigate('/learning')}
        >
          View Bridge Learning Path
        </Button>
      </div>

      {/* Main Insight Alert Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
            Key Academic Finding
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Strong in Fundamentals, Critical Gap in Cloud & Enterprise Platforms
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Your college curriculum is strong in programming fundamentals but has a gap in cloud and analytics tools. Bridging these gaps before graduation yields 2.4x more interview calls.
          </p>
        </div>

        <div className="text-center sm:text-right shrink-0">
          <span className="text-3xl font-black text-indigo-600">+34%</span>
          <p className="text-[11px] text-slate-500 font-semibold">Average Cloud Deficit</p>
        </div>
      </div>

      {/* Recharts Bar Comparison Chart */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">College Syllabus vs Industry Demand Benchmarks</h2>
            <p className="text-xs text-slate-500 mt-0.5">Scale from 0 to 100 representing academic depth vs recruiter expectations</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded-sm bg-slate-400 inline-block" /> College Average
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 font-bold">
              <span className="w-3 h-3 rounded-sm bg-indigo-600 inline-block" /> Industry Demand
            </span>
          </div>
        </div>

        <CollegeIndustryChart />
      </Card>

      {/* Breakdown Grid of Skills and Observations */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Detailed Subject-by-Subject Diagnosis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COLLEGE_INDUSTRY_DATA.map(item => (
            <Card key={item.skill} padding="md" className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">{item.skill}</h4>
                <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  {item.gap}% Gap
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-500">College: <strong className="text-slate-800">{item.collegeAvg}%</strong></span>
                <span className="text-slate-500">Industry: <strong className="text-indigo-600">{item.industryDemand}%</strong></span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                {item.insight}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Skills Students Should Learn */}
      <div className="space-y-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Top Skills Students Should Learn</h2>
          <p className="text-xs text-slate-500">High-leverage recommendations to overcome the university syllabus gap</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOP_RECOMMENDED_COLLEGE_UPGRADES.map((upgrade, idx) => (
            <Card key={idx} padding="md" className="flex flex-col justify-between group hover:border-indigo-200">
              <div className="space-y-2">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                  {upgrade.badge}
                </span>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {upgrade.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {upgrade.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate('/learning')}
                  className="w-full text-left text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-between cursor-pointer"
                >
                  <span>Start learning</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
