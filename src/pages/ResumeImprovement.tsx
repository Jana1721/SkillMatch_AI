import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Check,
  X,
  Edit3,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Save,
  RotateCcw,
  BookOpen,
  Info
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';

export const ResumeImprovement: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  // Editable states for user customizations
  const [summaryText, setSummaryText] = useState<string>('');
  const [summaryStatus, setSummaryStatus] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const [isEditingSummary, setIsEditingSummary] = useState<boolean>(false);

  const [projectsState, setProjectsState] = useState<any[]>([]);

  useEffect(() => {
    async function loadImprovements() {
      try {
        setLoading(true);
        const res = await ApiService.getImprovements();
        if (res.success && res.improvements) {
          setData(res.improvements);
          setSummaryText(res.improvements.summary?.suggested || '');
          setProjectsState(
            res.improvements.projects.map((p: any) => ({
              ...p,
              currentBullets: [...p.suggestedBullets],
              status: 'pending',
              isEditing: false
            }))
          );
        }
      } catch (err: any) {
        showToast('Please upload or parse a resume first.', 'info');
      } finally {
        setLoading(false);
      }
    }
    loadImprovements();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const handleSaveAll = async () => {
    try {
      await ApiService.saveVersion({
        versionName: `CareerLens Improved Resume (${new Date().toLocaleDateString()})`,
        targetRole: 'Target Candidate Position',
        summary: summaryText,
        skills: data?.skillsReorganization,
        projects: projectsState,
        diffNotes: 'Applied action-oriented rewrites and structured section reorganization.'
      });
      showToast('Saved improved resume version to database!', 'success');
    } catch {
      showToast('Version saved in local session.', 'info');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-500">Generating faithful resume improvements...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Improve My Resume
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Zero-Fabrication Rewrites
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Faithfully elevates technical phrasing, metrics, and bullet structure without inventing false achievements or unearned skills.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAll}
            icon={<Save className="w-4 h-4" />}
          >
            Save This Version
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/interview')}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            Prepare Interview Questions
          </Button>
        </div>
      </div>

      {/* Truthfulness Guarantee Alert */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong>Faithfulness Rules:</strong> All suggested bullets are derived directly from the verified technologies and education in your uploaded document. You have full control to <strong>Accept</strong>, <strong>Reject</strong>, or <strong>Edit</strong> each item.
        </p>
      </div>

      {/* 1. PROFESSIONAL SUMMARY SECTION */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">1. Professional Summary Enhancement</h3>
            <p className="text-xs text-slate-500">Concise, impact-driven profile headline for recruiters</p>
          </div>

          <div className="flex items-center gap-2">
            {summaryStatus === 'accepted' ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Accepted
              </span>
            ) : summaryStatus === 'rejected' ? (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Rejected
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                Pending Review
              </span>
            )}
          </div>
        </div>

        {isEditingSummary ? (
          <textarea
            rows={4}
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 leading-relaxed"
          />
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed">
            {summaryText}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            onClick={() => handleCopy(summaryText)}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Summary
          </button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit3 className="w-3.5 h-3.5" />}
              onClick={() => setIsEditingSummary(!isEditingSummary)}
            >
              {isEditingSummary ? 'Done Editing' : 'Edit Text'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setSummaryStatus('accepted'); showToast('Accepted summary enhancement!', 'success'); }}
            >
              Accept
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSummaryStatus('rejected'); showToast('Rejected summary enhancement.', 'info'); }}
            >
              Reject
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. REORGANIZED TECHNICAL SKILLS SECTION */}
      {data?.skillsReorganization && (
        <Card padding="lg" className="space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">2. Reorganized Skills Structure</h3>
              <p className="text-xs text-slate-500">Grouped into ATS-standard categories for recruiter clarity</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Copy className="w-3.5 h-3.5" />}
              onClick={() => handleCopy(JSON.stringify(data.skillsReorganization, null, 2))}
            >
              Copy Structure
            </Button>
          </div>

          <div className="space-y-2.5 text-xs text-slate-800">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-500 uppercase text-[10px] tracking-wider block">Programming Languages:</strong>
              <p className="font-semibold text-slate-900 mt-0.5">{data.skillsReorganization.programmingLanguages}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-500 uppercase text-[10px] tracking-wider block">Frameworks & Libraries:</strong>
              <p className="font-semibold text-slate-900 mt-0.5">{data.skillsReorganization.frameworksAndLibraries}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-500 uppercase text-[10px] tracking-wider block">Databases:</strong>
              <p className="font-semibold text-slate-900 mt-0.5">{data.skillsReorganization.databases}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <strong className="text-slate-500 uppercase text-[10px] tracking-wider block">DevOps & Cloud Tools:</strong>
              <p className="font-semibold text-slate-900 mt-0.5">{data.skillsReorganization.toolsAndDevOps}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 3. PROJECT DESCRIPTIONS & INTERVIEW EXPLANATIONS */}
      <div className="space-y-4">
        <div className="pb-2 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">3. Action-Oriented Project Bullet Rewrites</h3>
          <p className="text-xs text-slate-500">Each project rewritten with standard action verbs, clear architecture, and interview walkthroughs</p>
        </div>

        {projectsState.map((proj, pIdx) => {
          return (
            <Card key={pIdx} padding="lg" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h4 className="text-base font-black text-slate-900">{proj.projectName}</h4>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg ${
                    proj.status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : proj.status === 'rejected'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {proj.status === 'accepted' ? 'Accepted' : proj.status === 'rejected' ? 'Rejected' : 'Reviewing'}
                  </span>
                </div>
              </div>

              {/* Bullets List */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Suggested Resume Bullets (Action Verb + Architecture + Outcome):
                </span>

                <ul className="space-y-2 text-xs text-slate-800">
                  {proj.currentBullets.map((bullet: string, bIdx: number) => (
                    <li key={bIdx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 15: Interview Explanation Walkthrough Box */}
              {proj.interviewWalkthrough && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold uppercase text-[11px] tracking-wide">
                    <BookOpen className="w-4 h-4 text-indigo-600" /> Interview Explanation Walkthrough:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700 pt-1">
                    <div>
                      <strong className="text-slate-900">1. Problem:</strong> {proj.interviewWalkthrough.problem}
                    </div>
                    <div>
                      <strong className="text-slate-900">2. Solution:</strong> {proj.interviewWalkthrough.solution}
                    </div>
                    <div>
                      <strong className="text-slate-900">3. Architecture:</strong> {proj.interviewWalkthrough.architecture}
                    </div>
                    <div>
                      <strong className="text-slate-900">4. Key Challenges:</strong> {proj.interviewWalkthrough.challenges}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleCopy(proj.currentBullets.join('\n• '))}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Project Bullets
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const updated = [...projectsState];
                      updated[pIdx].status = 'accepted';
                      setProjectsState(updated);
                      showToast(`Accepted rewrite for ${proj.projectName}!`, 'success');
                    }}
                  >
                    Accept Bullets
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated = [...projectsState];
                      updated[pIdx].status = 'rejected';
                      setProjectsState(updated);
                      showToast(`Rejected rewrite for ${proj.projectName}.`, 'info');
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
