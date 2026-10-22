import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Target,
  Briefcase,
  TrendingUp,
  Award,
  Layers,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Mic,
  Copy,
  MailCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { MetricCard } from '../components/dashboard/MetricCard';
import { ReadinessDonut } from '../components/charts/ReadinessDonut';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';
import { StorageService } from '../utils/storage';
import { calculateSkillGaps } from '../utils/skillGap';
import { MOCK_JOBS } from '../data/jobs';
import { calculateJobMatch } from '../utils/matching';
import { DEFAULT_USER } from '../data/defaultUser';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const safeUser = user || DEFAULT_USER;
  const { showToast } = useToast();

  const [activeResume, setActiveResume] = useState<any>(null);
  const [interviewHistory, setInterviewHistory] = useState<any[]>([]);
  const [learningPhases, setLearningPhases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Load latest resume
        const resumeRes = await ApiService.getCurrentResume().catch(() => null);
        if (resumeRes?.success && resumeRes.analysis) {
          setActiveResume(resumeRes.analysis);
        } else {
          setActiveResume(StorageService.getResumeAnalysis());
        }

        // Load interview history
        const historyRes = await ApiService.getInterviewHistory().catch(() => null);
        if (historyRes?.success && historyRes.evaluations) {
          setInterviewHistory(historyRes.evaluations);
        }

        // Load learning roadmap
        setLearningPhases(StorageService.getLearningRoadmap() || []);
      } catch (err) {
        console.error('[Dashboard Load Error]', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const skillGaps = calculateSkillGaps(safeUser, safeUser.targetRole || 'Java Developer');
  const criticalGaps = skillGaps.filter((g) => g.gapLevel === 'High' || g.gapLevel === 'Medium');

  // Match jobs
  const matchingJobs = MOCK_JOBS.map((j) => ({ job: j, match: calculateJobMatch(j, safeUser) }))
    .sort((a, b) => b.match.matchScore - a.match.matchScore)
    .slice(0, 3);

  // Overall readiness calculation
  const resumeScore = activeResume?.scorecard?.overallScore || activeResume?.atsScore || 65;
  const latestInterviewScore = interviewHistory[0]?.overallScore || 0;
  const verifiedSkillsCount = safeUser.skills?.length || 0;
  const roadmapProgress = learningPhases.length > 0
    ? Math.round(learningPhases.reduce((acc, p) => acc + (p.progress || 0), 0) / learningPhases.length)
    : 0;

  const readinessScore = Math.min(
    100,
    Math.round(
      resumeScore * 0.35 +
      (latestInterviewScore > 0 ? latestInterviewScore * 0.35 : 25) +
      Math.min(30, verifiedSkillsCount * 4) +
      roadmapProgress * 0.1
    )
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Credential Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-950 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
              Candidate Readiness Hub
            </span>
            {safeUser.emailVerified ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Verified Account
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Unverified Email
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {safeUser.name}!
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200">
            Target Role: <strong className="text-white">{safeUser.targetRole || 'Java Developer'}</strong> &bull; {safeUser.college || 'Engineering College'}
          </p>
        </div>

        {/* Permanent Credential ID Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex flex-col items-start md:items-end justify-center shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
            Candidate ID
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white">
              {safeUser.credentialId && safeUser.credentialId.startsWith('KCE-')
                ? safeUser.credentialId
                : `KCE-${safeUser.graduationYear || '2026'}-${(safeUser.rollNumber || '2024CS01').toUpperCase().replace(/\s+/g, '')}`}
            </span>
            <button
              onClick={() => {
                const cid = safeUser.credentialId && safeUser.credentialId.startsWith('KCE-')
                  ? safeUser.credentialId
                  : `KCE-${safeUser.graduationYear || '2026'}-${(safeUser.rollNumber || '2024CS01').toUpperCase().replace(/\s+/g, '')}`;
                navigator.clipboard.writeText(cid);
                showToast('Candidate ID copied to clipboard!', 'info');
              }}
              className="p-1.5 hover:bg-white/20 rounded-lg text-indigo-200 hover:text-white transition-colors"
              title="Copy Candidate ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] text-indigo-200/80 mt-0.5">Permanent Candidate Evaluation ID</span>
        </div>
      </div>

      {/* Unverified Email Warning Banner */}
      {!safeUser.emailVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
              <MailCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Your personal email address ({safeUser.email}) is not yet verified.</p>
              <p className="text-amber-700">Verify your email to ensure official interview evaluation reports are delivered to your inbox.</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/verify-email')}
            variant="outline"
            className="text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100 self-start sm:self-auto shrink-0"
          >
            Verify Email Now
          </Button>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Career Readiness"
          value={`${readinessScore}%`}
          subtitle="Based on skills, resume & voice interview"
          accentColor="indigo"
          icon={<Award className="w-5 h-5" />}
        />
        <MetricCard
          title="Resume ATS Health"
          value={activeResume ? `${activeResume.atsScore || activeResume.scorecard?.overallScore || 78}/100` : 'Not Parsed'}
          subtitle={activeResume ? activeResume.fileName || 'Parsed Resume' : 'Upload your resume'}
          accentColor="emerald"
          icon={<FileCheck className="w-5 h-5" />}
          onClick={() => navigate('/resume')}
        />
        <MetricCard
          title="Latest Voice Interview"
          value={latestInterviewScore > 0 ? `${latestInterviewScore}/100` : 'No Sessions'}
          subtitle={latestInterviewScore > 0 ? 'AI Competency Score' : 'Start your first simulation'}
          accentColor="purple"
          icon={<Mic className="w-5 h-5" />}
          onClick={() => navigate('/interview')}
        />
        <MetricCard
          title="Learning Roadmap"
          value={`${roadmapProgress}%`}
          subtitle={`${learningPhases.length} Milestones active`}
          accentColor="amber"
          icon={<BookOpen className="w-5 h-5" />}
          onClick={() => navigate('/learning')}
        />
      </div>

      {/* Main Content Grid: Readiness Donut & Resume Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Career Readiness Gauge */}
        <Card className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Career Competency & Readiness Index</h2>
              <p className="text-xs text-slate-500">Holistic multi-dimensional evaluation for {user.targetRole || 'Java Developer'}</p>
            </div>
            <Button onClick={() => navigate('/interview')} className="text-xs py-2 px-3 flex items-center gap-1.5 font-bold">
              <Mic className="w-3.5 h-3.5" />
              <span>Launch Voice Interview</span>
            </Button>
          </div>

          <ReadinessDonut
            score={readinessScore}
            breakdown={{
              technicalSkills: Math.min(100, verifiedSkillsCount * 12),
              softSkills: latestInterviewScore > 0 ? latestInterviewScore : 70,
              experience: activeResume ? 75 : 45,
              certifications: 60,
              resumeQuality: resumeScore
            }}
          />
        </Card>

        {/* AI Resume Analyzer Summary Card */}
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Resume Analyzer</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                {activeResume ? 'Parsed' : 'Action Required'}
              </span>
            </div>

            {activeResume ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-800 block truncate">{activeResume.fileName || 'Resume Document'}</span>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span>ATS Score: <strong className="text-emerald-600">{activeResume.atsScore || 78}/100</strong></span>
                    <span>Role: {activeResume.targetRole || user.targetRole}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Detected Skills:</span>
                    <strong className="text-slate-800">{activeResume.parsedData?.skills?.allSkillsFound?.length || activeResume.detectedSkills?.length || 8}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Extracted Projects:</span>
                    <strong className="text-slate-800">{activeResume.parsedData?.projects?.length || 2}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2 border-2 border-dashed border-slate-200 rounded-xl">
                <FileCheck className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">No resume document uploaded yet.</p>
                <p className="text-[11px] text-slate-400">Upload your PDF or DOCX to unlock ATS scoring & verified skill extraction.</p>
              </div>
            )}
          </div>

          <Button onClick={() => navigate('/resume')} variant="outline" className="w-full text-xs font-bold py-2 mt-4">
            {activeResume ? 'Open Resume Studio & Issues →' : 'Upload Resume Document →'}
          </Button>
        </Card>
      </div>

      {/* Secondary Grid: Skill Gaps & Recommended Matching Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identified Skill Gaps Card */}
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Identified Critical Skill Gaps</h3>
              <p className="text-xs text-slate-500">Benchmark comparison against {user.targetRole || 'Java Developer'} industry openings</p>
            </div>
            <button
              onClick={() => navigate('/skill-gap')}
              className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>View Full Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {criticalGaps.slice(0, 4).map((gap) => (
              <div key={gap.skill} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{gap.skill}</span>
                  <span className="text-[10px] text-slate-400 block">{gap.category} &bull; Required: {gap.industryLevel}</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${gap.gapLevel === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {gap.gapLevel} Gap
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => navigate('/learning')} variant="outline" className="w-full py-2 text-xs font-bold text-indigo-700">
            Generate Dynamic Learning Roadmap to Bridge Gaps →
          </Button>
        </Card>

        {/* Curated Career & Job Matches */}
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recommended Job Openings</h3>
              <p className="text-xs text-slate-500">Ranked by real candidate skill overlap percentage</p>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Browse All Jobs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {matchingJobs.map(({ job, match }) => (
              <div
                key={job.id}
                onClick={() => navigate('/jobs')}
                className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{job.title}</h4>
                  <p className="text-[11px] text-slate-500">{job.company} &bull; {job.location} ({job.workMode})</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
                    {match.matchScore}% Match
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => navigate('/jobs')} className="w-full py-2 text-xs font-bold">
            Explore Open Vacancies & Match External JDs →
          </Button>
        </Card>
      </div>

      {/* Recent Voice Interview Sessions */}
      <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent AI Voice Interview Sessions</h3>
            <p className="text-xs text-slate-500">Your historical spoken simulation evaluations stored against your account ID</p>
          </div>
          <Button onClick={() => navigate('/interview')} className="text-xs py-1.5 px-3 font-bold flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5" />
            <span>Practice Another Session</span>
          </Button>
        </div>

        {interviewHistory.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl space-y-2">
            <Mic className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">You haven't completed an AI Voice Interview yet.</p>
            <p className="text-[11px] text-slate-400">Launch a 3-question simulation to test your voice response clarity and get evidence-based scoring.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interviewHistory.slice(0, 3).map((sess) => (
              <div key={sess.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{sess.targetRole}</span>
                  <span className="text-sm font-black text-indigo-700">{sess.overallScore}/100</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{sess.interviewType}</span>
                  <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-600">
                  <span>Comm: <strong>{sess.communicationScore}%</strong></span>
                  <span>Tech: <strong>{sess.technicalScore}%</strong></span>
                  <span>Problem: <strong>{sess.problemSolvingScore}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
