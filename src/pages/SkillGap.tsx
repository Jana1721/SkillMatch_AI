import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { SkillRadarChart } from '../components/charts/SkillRadarChart';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { calculateSkillGaps } from '../utils/skillGap';
import { StorageService } from '../utils/storage';
import { LearningPhase } from '../types';

export const SkillGap: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState(user.targetRole || 'Data Analyst');
  const [activeFilter, setActiveFilter] = useState('All');

  const gaps = calculateSkillGaps(user, selectedRole);

  const filters = ['All', 'Programming', 'Database', 'Tools', 'Cloud', 'Soft Skills', 'Enterprise'];

  const filteredGaps = gaps.filter(item => {
    if (activeFilter === 'All') return true;
    return item.category.toLowerCase() === activeFilter.toLowerCase();
  });

  // Recharts radar data for current role
  const chartData = gaps.slice(0, 6).map(g => ({
    skill: g.skill,
    student: Math.round((g.userLevelNumber / 4) * 100),
    industry: Math.round((g.industryLevelNumber / 4) * 100)
  }));

  const handleGenerateLearningPlan = () => {
    const largestGaps = gaps.filter(g => g.gapLevel === 'High' || g.gapLevel === 'Medium');
    const roadmap = StorageService.getLearningRoadmap();

    // Create tailored milestone phase
    const dynamicPhase: LearningPhase = {
      id: 'phase-ai-gen-' + Date.now(),
      phaseNumber: roadmap.length + 1,
      title: `AI Priority Sprint: Close ${largestGaps.slice(0, 2).map(g => g.skill).join(' & ')} Gaps`,
      duration: '3 weeks',
      description: `Personalized fast-track syllabus generated to bridge your critical gaps for ${selectedRole}.`,
      skills: largestGaps.slice(0, 3).map(g => g.skill),
      status: 'in_progress',
      progress: 0,
      tasks: largestGaps.slice(0, 3).map((g, idx) => ({
        id: `gen-task-${Date.now()}-${idx}`,
        title: `Complete intensive project in ${g.skill} to achieve ${g.industryLevel} proficiency`,
        completed: false
      })),
      recommendedCourses: []
    };

    StorageService.setLearningRoadmap([...roadmap, dynamicPhase]);
    showToast('Personalized learning roadmap generated based on your largest skill gaps!', 'success');
    navigate('/learning');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Skill Gap Analysis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Where You Stand vs Industry Demand for <strong className="text-slate-700">{selectedRole}</strong>.
          </p>
        </div>

        {/* Role Switcher & Action */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value)}
            className="px-3.5 py-2 bg-white text-xs font-bold border border-slate-200 rounded-xl focus:border-indigo-500 outline-none shadow-xs"
          >
            <option value="Data Analyst">Data Analyst</option>
            <option value="ServiceNow Developer">ServiceNow Developer</option>
            <option value="Business Analyst">Business Analyst</option>
            <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="AI / ML Engineer">AI / ML Engineer</option>
          </select>

          <Button
            variant="primary"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={handleGenerateLearningPlan}
          >
            Generate Learning Plan
          </Button>
        </div>
      </div>

      {/* Overview Chart Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Chart Card */}
        <Card className="lg:col-span-6" padding="lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Your Skills vs Industry Demand</h3>
              <p className="text-xs text-slate-500 mt-0.5">Direct comparison across key role competencies</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
              {selectedRole}
            </span>
          </div>

          <SkillRadarChart data={chartData} />

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Your Level
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> Industry Standard
            </span>
          </div>
        </Card>

        {/* AI Gap Diagnosis Summary */}
        <Card className="lg:col-span-6 flex flex-col justify-between" padding="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Diagnosis Summary</h3>
                <p className="text-xs text-slate-500">Key roadblocks preventing placement shortlists</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 text-rose-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> High Priority Gap: Power BI & AWS
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Your current level is <strong>Beginner</strong>, while entry-level jobs require <strong>Intermediate</strong> proficiency. This gap explains ~40% of recruiter drop-offs.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200/80 text-indigo-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Solid Foundation: Python & Excel
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Your Python proficiency is at <strong>Advanced</strong>, which satisfies top tier requirements. Keep this sharp with live LeetCode/portfolio proofs.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              icon={<BookOpen className="w-4 h-4" />}
              onClick={handleGenerateLearningPlan}
            >
              Generate Tailored 3-Week Bridge Plan
            </Button>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        <span className="text-xs font-bold text-slate-400 uppercase mr-2 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Category:
        </span>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 cursor-pointer ${
              activeFilter === filter
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Skill Cards Table / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGaps.map(item => (
          <Card key={item.skill} hoverable padding="md" className="flex flex-col justify-between">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.skill}</h3>
                  <span className="text-[10px] text-slate-400 font-medium">{item.category}</span>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                    item.gapLevel === 'High'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : item.gapLevel === 'Medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {item.gapLevel} Gap
                </span>
              </div>

              {/* Levels & Numbers */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Your Level:</span>
                  <span className="font-bold text-slate-800">{item.userLevel}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Industry Level:</span>
                  <span className="font-bold text-indigo-600">{item.industryLevel}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>Match Alignment</span>
                  <span>{100 - item.gapPercentage}%</span>
                </div>
                <ProgressBar
                  progress={100 - item.gapPercentage}
                  color={item.gapLevel === 'High' ? 'rose' : item.gapLevel === 'Medium' ? 'amber' : 'emerald'}
                  height="sm"
                />
              </div>

              {/* Action Tip */}
              <p className="text-xs text-slate-600 leading-relaxed italic bg-indigo-50/40 p-2 rounded-lg border border-indigo-100/60">
                💡 {item.actionTip}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
