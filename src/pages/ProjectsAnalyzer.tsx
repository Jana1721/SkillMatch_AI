import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Code2,
  Database,
  Shield,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Zap,
  Check,
  X,
  FileCheck,
  Send,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { StorageService } from '../utils/storage';
import { ApiService } from '../services/api';

export const ProjectsAnalyzer: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(0);

  // Verification modal / panel state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [documentation, setDocumentation] = useState<string>('');
  const [architectureNotes, setArchitectureNotes] = useState<string>('');
  const [hasDb, setHasDb] = useState<boolean>(true);
  const [hasApi, setHasApi] = useState<boolean>(true);
  const [hasAuth, setHasAuth] = useState<boolean>(false);
  const [hasTesting, setHasTesting] = useState<boolean>(false);
  const [hasDeploy, setHasDeploy] = useState<boolean>(false);

  const [verificationResult, setVerificationResult] = useState<any>(null);

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

  const projects = analysis?.parsedData?.projects || [];
  const currentProject = projects[selectedProjectIndex] || null;

  const handleVerifyWorkingPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) return;

    try {
      setIsVerifying(true);
      const res = await ApiService.verifyProject({
        projectName: currentProject.name,
        githubUrl,
        documentation,
        architectureNotes,
        hasDb,
        hasApi,
        hasAuth,
        hasTesting,
        hasDeploy
      });

      setVerificationResult(res.verification);
      showToast(`Classified as: ${res.verification.classification}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Project Architecture & Working-Phase Analyzer
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {projects.length} Projects Identified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Evaluates architectural tiers, real-world utility, and verifies working phase (Prototype vs Production-Oriented).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/issues')}
        >
          View All Issues
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card padding="lg" className="text-center py-16 space-y-4">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Projects Extracted</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please upload a resume containing a dedicated Projects section to audit technical stack layers.
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate('/upload')}>
            Upload Resume Now
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Project Selector Tabs */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Select Extracted Project
            </h3>

            {projects.map((proj: any, idx: number) => {
              const isSelected = selectedProjectIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => { setSelectedProjectIndex(idx); setVerificationResult(null); }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {proj.name}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      Tier: {proj.complexity?.split('/')[0]}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {proj.technologies.slice(0, 4).join(', ')}
                  </p>
                </button>
              );
            })}

            {/* Truthfulness Banner */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="block text-[11px] uppercase tracking-wide">Verification Rule</strong>
              <p className="leading-relaxed text-[11px]">
                Do not claim a project handles live users or high concurrency unless supported by code repository evidence and production logs.
              </p>
            </div>
          </div>

          {/* Right Column: Detailed Architectural Breakdown & Working Phase */}
          <div className="lg:col-span-8 space-y-6">
            {currentProject && (
              <>
                {/* Project Header Card */}
                <Card padding="lg" className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">{currentProject.name}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Extracted directly from resume text blocks
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Status: {currentProject.workingPhaseClassification}
                    </span>
                  </div>

                  {/* Problem & Users */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Problem Solved</span>
                      <p className="text-slate-800 leading-relaxed">{currentProject.problemSolved}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">Target Users</span>
                      <p className="text-slate-800 leading-relaxed">{currentProject.targetUsers}</p>
                    </div>
                  </div>

                  {/* Architecture Matrix */}
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Architectural Tiers Detected
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Frontend</span>
                        <p className="font-bold text-slate-800 mt-0.5">{currentProject.architecture.frontend}</p>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Backend Service</span>
                        <p className="font-bold text-slate-800 mt-0.5">{currentProject.architecture.backend}</p>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Database</span>
                        <p className="font-bold text-slate-800 mt-0.5">{currentProject.architecture.database}</p>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">APIs / Protocol</span>
                        <p className="font-bold text-slate-800 mt-0.5">{currentProject.architecture.apis}</p>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Authentication</span>
                        <p className="font-bold text-slate-800 mt-0.5">{currentProject.architecture.authentication}</p>
                      </div>

                      <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Deployment</span>
                        <p className="font-bold text-slate-800 mt-0.5">{currentProject.architecture.deployment}</p>
                      </div>
                    </div>
                  </div>

                  {/* Four Diagnostic Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* What is strong */}
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> What is strong?
                      </div>
                      <ul className="text-xs text-emerald-950 space-y-1 list-disc list-inside">
                        {currentProject.whatIsStrong.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* What is missing */}
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> What is missing?
                      </div>
                      <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                        {currentProject.whatIsMissing.map((m: string, i: number) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    {/* What should be added */}
                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> What should be added?
                      </div>
                      <p className="text-xs text-indigo-950 leading-relaxed">
                        Add unit testing coverage (JUnit/Jest), structured input validation, and containerized Docker setup instructions.
                      </p>
                    </div>

                    {/* What should NOT be claimed */}
                    <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wider">
                        <X className="w-3.5 h-3.5 text-rose-600" /> What NOT to claim
                      </div>
                      <ul className="text-xs text-rose-950 space-y-1 list-disc list-inside">
                        {currentProject.whatShouldNotBeClaimed.map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* Section 8: PROJECT WORKING-PHASE CHECK FORM */}
                <Card padding="lg" className="space-y-5 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20">
                  <div className="pb-3 border-b border-slate-100">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      Step 8 Verification
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      Verify Real Working Phase for "{currentProject.name}"
                    </h3>
                    <p className="text-xs text-slate-500">
                      Provide additional evidence to verify whether this project is a Prototype, Partially Functional, Functional, or Production-Oriented.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyWorkingPhase} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">GitHub Repository Link</label>
                      <input
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/yourhandle/project-repo"
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Architecture & Module Notes</label>
                      <textarea
                        rows={2}
                        value={architectureNotes}
                        onChange={(e) => setArchitectureNotes(e.target.value)}
                        placeholder="Describe controller layers, database schemas, or routing logic implemented..."
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>

                    {/* Checkboxes */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-2">Verified Capabilities Implemented in Code:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                          <input type="checkbox" checked={hasDb} onChange={(e) => setHasDb(e.target.checked)} className="rounded text-indigo-600" />
                          <span>Database Connected</span>
                        </label>

                        <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                          <input type="checkbox" checked={hasApi} onChange={(e) => setHasApi(e.target.checked)} className="rounded text-indigo-600" />
                          <span>RESTful APIs</span>
                        </label>

                        <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                          <input type="checkbox" checked={hasAuth} onChange={(e) => setHasAuth(e.target.checked)} className="rounded text-indigo-600" />
                          <span>Authentication / JWT</span>
                        </label>

                        <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                          <input type="checkbox" checked={hasTesting} onChange={(e) => setHasTesting(e.target.checked)} className="rounded text-indigo-600" />
                          <span>Automated Tests</span>
                        </label>

                        <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer">
                          <input type="checkbox" checked={hasDeploy} onChange={(e) => setHasDeploy(e.target.checked)} className="rounded text-indigo-600" />
                          <span>Cloud Deployment</span>
                        </label>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      loading={isVerifying}
                      icon={<FileCheck className="w-4 h-4" />}
                    >
                      Audit Project Working Phase
                    </Button>
                  </form>

                  {/* Verification Results Panel */}
                  {verificationResult && (
                    <div className="p-4 bg-white rounded-2xl border border-indigo-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Evidence-Based Verdict</span>
                          <h4 className="text-base font-black text-indigo-900">{verificationResult.classification}</h4>
                        </div>
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      </div>

                      <div className="space-y-1 text-xs text-slate-700">
                        {verificationResult.evidenceNotes.map((ev: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
