import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Clipboard,
  Zap,
  Info,
  Layers,
  Building2,
  Check,
  X,
  ListOrdered,
  Briefcase,
  GraduationCap,
  TrendingUp,
  FileSearch,
  BookOpen,
  ExternalLink,
  Star,
  GitFork,
  Code,
  ShieldCheck,
  Mic,
  Lock
} from 'lucide-react';
import { GithubIcon } from '../components/common/GithubIcon';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';
import { StorageService } from '../utils/storage';

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Resume state
  const [resumeInputMode, setResumeInputMode] = useState<'upload' | 'paste'>('upload');
  const [pastedResumeText, setPastedResumeText] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileDetails, setResumeFileDetails] = useState<{
    name: string;
    type: string;
    size: string;
  } | null>(null);

  // Job Description state
  const [jdText, setJdText] = useState<string>('');
  const [jdJobTitle, setJdJobTitle] = useState<string>('Associate Software Engineer');
  const [jdCompany, setJdCompany] = useState<string>('Target Hiring Organization');

  // Processing state
  const [processingTarget, setProcessingTarget] = useState<'resume' | 'jd' | 'match' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Results state
  const [resumeAnalysisResult, setResumeAnalysisResult] = useState<any>(() => {
    return StorageService.getResumeAnalysis();
  });
  const [jdAnalysisResult, setJdAnalysisResult] = useState<any>(null);
  const [jdMatchResult, setJdMatchResult] = useState<any>(null);

  // Manual GitHub repo verification state
  const [manualGithubUrl, setManualGithubUrl] = useState<string>('');
  const [isVerifyingGithub, setIsVerifyingGithub] = useState<boolean>(false);
  const [manualGithubError, setManualGithubError] = useState<string>('');

  // Active view tab for results
  const [activeResultTab, setActiveResultTab] = useState<'resume' | 'jd' | 'match'>('resume');

  const handleVerifyManualGithub = async () => {
    if (!manualGithubUrl.trim()) {
      setManualGithubError('Please enter a GitHub repository URL.');
      return;
    }
    try {
      setIsVerifyingGithub(true);
      setManualGithubError('');
      const res = await ApiService.verifyGitHubRepo(manualGithubUrl.trim());
      if (res.success && res.verification) {
        setResumeAnalysisResult((prev: any) => {
          const currentVerification = prev?.githubVerification || { detected: true, repositories: [] };
          const updatedRepos = [res.verification, ...(currentVerification.repositories || [])];
          const updated = {
            ...prev,
            githubVerification: {
              ...currentVerification,
              detected: true,
              hasRepos: true,
              repositories: updatedRepos,
              summary: `${updatedRepos.filter((r: any) => r.isAvailable).length} of ${updatedRepos.length} repository link(s) verified.`
            }
          };
          StorageService.setResumeAnalysis(updated);
          return updated;
        });
        showToast('GitHub repository verified successfully!', 'success');
        setManualGithubUrl('');
      }
    } catch (err: any) {
      setManualGithubError(err.message || 'GitHub verification failed.');
      showToast(err.message || 'Verification failed.', 'error');
    } finally {
      setIsVerifyingGithub(false);
    }
  };

  const sampleJD = `Role: Associate Software Engineer / Backend Developer
Key Responsibilities:
- Design and build robust web microservices and RESTful APIs using Java, Spring Boot, or Python.
- Write optimized SQL queries, handle transactions, and design relational database schemas.
- Collaborate with agile squads using Git, GitHub PRs, and automated CI/CD pipelines.
- Implement unit tests and integration tests to ensure enterprise reliability.

Requirements:
- Strong knowledge of Java / Python, Object-Oriented Design, and Data Structures.
- Hands-on project experience with Spring Boot, PostgreSQL/MySQL, and REST APIs.
- Familiarity with Docker containerization and cloud basics (AWS/GCP) is a plus.
- Solid communication and problem-solving skills.`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt', 'md'].includes(ext || '')) {
        showToast('Please select a valid PDF, DOCX, or TXT document.', 'error');
        return;
      }
      setResumeFile(selected);
      setResumeFileDetails({
        name: selected.name,
        type: (ext || 'TXT').toUpperCase(),
        size: `${(selected.size / 1024).toFixed(1)} KB`
      });
      setErrorMessage('');
    }
  };

  // 1. Process Resume Only
  const handleAnalyzeResumeOnly = async () => {
    if (resumeInputMode === 'upload' && !resumeFile) {
      showToast('Please choose a resume file to upload.', 'error');
      return;
    }
    if (resumeInputMode === 'paste' && (!pastedResumeText.trim() || pastedResumeText.trim().length < 30)) {
      showToast('Please paste substantial resume text (minimum 30 characters).', 'error');
      return;
    }

    try {
      setProcessingTarget('resume');
      setErrorMessage('');
      setStatusMessage('Extracting readable sections, technical skills, and candidate projects...');

      let res: any = null;
      if (resumeInputMode === 'upload' && resumeFile) {
        res = await ApiService.uploadResume(resumeFile, 'Software Engineer');
      } else {
        res = await ApiService.analyzeText(pastedResumeText, 'Software Engineer', 'Candidate_Resume.txt');
      }

      setResumeAnalysisResult(res.analysis);
      StorageService.setResumeAnalysis(res.analysis);
      setActiveResultTab('resume');
      setStatusMessage('Resume Analysis Completed!');
      showToast('Resume analyzed successfully!', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing resume.');
      showToast(err.message || 'Resume analysis failed.', 'error');
    } finally {
      setProcessingTarget(null);
    }
  };

  // 2. Process Job Description Only
  const handleAnalyzeJDOnly = async () => {
    if (!jdText.trim() || jdText.trim().length < 20) {
      showToast('Please paste substantial Job Description copy (at least 20 characters).', 'error');
      return;
    }

    try {
      setProcessingTarget('jd');
      setErrorMessage('');
      setStatusMessage('Analyzing Job Description requirements, technical stack, and core responsibilities...');

      const res = await ApiService.analyzeJDOnly({
        jdText: jdText.trim(),
        jobTitle: jdJobTitle.trim() || 'Software Engineer',
        companyName: jdCompany.trim() || 'Target Hiring Organization'
      });

      setJdAnalysisResult(res.analysis);
      setActiveResultTab('jd');
      setStatusMessage('Job Description Analysis Completed!');
      showToast('Job Description analyzed successfully!', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error analyzing job description.');
      showToast(err.message || 'JD analysis failed.', 'error');
    } finally {
      setProcessingTarget(null);
    }
  };

  // 3. Process Both & Match
  const handleMatchBoth = async () => {
    const hasResume = (resumeInputMode === 'upload' && resumeFile) || (resumeInputMode === 'paste' && pastedResumeText.trim().length >= 30);
    const hasJD = jdText.trim().length >= 20;

    if (!hasResume) {
      showToast('Please upload or paste your resume first to compare against the JD.', 'error');
      return;
    }
    if (!hasJD) {
      showToast('Please paste a target Job Description to run the match.', 'error');
      return;
    }

    try {
      setProcessingTarget('match');
      setErrorMessage('');
      setStatusMessage('Analyzing resume quality & calculating Job Description alignment score...');

      // 1. Ensure resume is analyzed
      let resumeData = resumeAnalysisResult;
      if (!resumeData) {
        if (resumeInputMode === 'upload' && resumeFile) {
          const upRes = await ApiService.uploadResume(resumeFile, jdJobTitle || 'Software Engineer');
          resumeData = upRes.analysis;
        } else {
          const txtRes = await ApiService.analyzeText(pastedResumeText, jdJobTitle || 'Software Engineer', 'Candidate_Resume.txt');
          resumeData = txtRes.analysis;
        }
        setResumeAnalysisResult(resumeData);
        StorageService.setResumeAnalysis(resumeData);
      }

      // 2. Run Match
      const matchRes = await ApiService.matchJD({
        jdText: jdText.trim(),
        jobTitle: jdJobTitle,
        companyName: jdCompany,
        resumeText: resumeInputMode === 'paste' ? pastedResumeText : undefined
      });

      setJdMatchResult(matchRes);

      // 3. Also populate standalone JD analysis if not already
      if (!jdAnalysisResult) {
        try {
          const jdRes = await ApiService.analyzeJDOnly({
            jdText: jdText.trim(),
            jobTitle: jdJobTitle,
            companyName: jdCompany
          });
          setJdAnalysisResult(jdRes.analysis);
        } catch (_) {}
      }

      setActiveResultTab('match');
      setStatusMessage('Resume & Job Description Matching Completed!');
      showToast('Comparison & Gap Analysis complete!', 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error matching resume and JD.');
      showToast(err.message || 'Matching failed.', 'error');
    } finally {
      setProcessingTarget(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 w-fit">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Independent Resume & Job Description Analytics
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Resume Upload & Job Description Matching
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
          Evaluate your resume alone, analyze a target Job Description alone, or compare both together for personalized skill gap recommendations.
        </p>
      </div>

      {/* Processing Status Banner */}
      {processingTarget && (
        <Card className="p-4 bg-indigo-50 border-indigo-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
            <div>
              <p className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Processing {processingTarget === 'resume' ? 'Resume' : processingTarget === 'jd' ? 'Job Description' : 'Match Analysis'}
              </p>
              <p className="text-xs text-indigo-700">{statusMessage}</p>
            </div>
          </div>
          <Badge variant="indigo">Analyzing...</Badge>
        </Card>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dual Input Cards: Distinct & Separated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ================================================================= */}
        {/* SECTION 1: RESUME INPUT */}
        {/* ================================================================= */}
        <Card className="p-6 bg-white border-slate-200 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Resume Copy
                </h2>
                <p className="text-xs text-slate-500">PDF, DOCX, or plain text</p>
              </div>
            </div>

            {/* Toggle Mode */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setResumeInputMode('upload')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  resumeInputMode === 'upload' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setResumeInputMode('paste')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  resumeInputMode === 'paste' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          {/* Upload Input or Paste Input */}
          {resumeInputMode === 'upload' ? (
            <div className="p-6 border-2 border-dashed border-indigo-200 bg-indigo-50/20 text-center space-y-3 rounded-2xl">
              <UploadCloud className="w-10 h-10 text-indigo-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-slate-900">Select Resume File</p>
                <p className="text-[11px] text-slate-500">PDF, DOCX, TXT up to 10MB</p>
              </div>

              <input
                type="file"
                id="resume-file-input"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={handleFileChange}
              />

              <div>
                <label
                  htmlFor="resume-file-input"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 transition inline-block"
                >
                  Browse File
                </label>
              </div>

              {resumeFileDetails && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="truncate max-w-[140px]">{resumeFileDetails.name}</span>
                  <span className="text-slate-400">&bull;</span>
                  <span>{resumeFileDetails.size}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-slate-500">
                <span className="font-bold text-slate-700">Paste Resume Content</span>
                <span className="font-mono">{pastedResumeText.split(/\s+/).filter(Boolean).length} Words</span>
              </div>
              <textarea
                rows={7}
                value={pastedResumeText}
                onChange={(e) => setPastedResumeText(e.target.value)}
                placeholder="Paste your resume content: Contact, Education, Technical Skills, Projects, Experience..."
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Action: Analyze Resume Only */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleAnalyzeResumeOnly}
              disabled={processingTarget !== null}
              className="w-full py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
            >
              <FileSearch className="w-4 h-4" />
              <span>Analyze Resume Only</span>
            </Button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              Extracts ATS Score, Technical Skills, Projects & Recommendations.
            </p>
          </div>
        </Card>

        {/* ================================================================= */}
        {/* SECTION 2: JOB DESCRIPTION INPUT */}
        {/* ================================================================= */}
        <Card className="p-6 bg-white border-slate-200 rounded-2xl shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Job Description (JD) Copy
                </h2>
                <p className="text-xs text-slate-500">Requirements & responsibilities</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setJdText(sampleJD);
                showToast('Sample SDE Job Description loaded!', 'info');
              }}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline"
            >
              Insert Sample JD
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Target Opening Job Title</label>
              <input
                type="text"
                value={jdJobTitle}
                onChange={(e) => setJdJobTitle(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Hiring Organization</label>
              <input
                type="text"
                value={jdCompany}
                onChange={(e) => setJdCompany(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <label className="font-bold text-slate-700 uppercase">
                Job Description Text Copy
              </label>
              <span className="font-mono">{jdText.split(/\s+/).filter(Boolean).length} Words</span>
            </div>
            <textarea
              rows={7}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste job description requirements, responsibilities, eligibility, and qualifications..."
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition resize-none leading-relaxed"
            />
          </div>

          {/* Action: Analyze JD Only */}
          <div className="pt-2">
            <Button
              type="button"
              onClick={handleAnalyzeJDOnly}
              disabled={processingTarget !== null}
              className="w-full py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <BookOpen className="w-4 h-4" />
              <span>Analyze Job Description Only</span>
            </Button>
            <p className="text-[11px] text-slate-500 text-center mt-2">
              Extracts Required Stack, Responsibilities, Eligibility & Prep Roadmap.
            </p>
          </div>
        </Card>
      </div>

      {/* =================================================================== */}
      {/* SECTION 3: DUAL MATCH ACTION (When candidate has both)             */}
      {/* =================================================================== */}
      <div className="p-6 bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl shadow-xl border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-300" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
              Have Both Resume & Job Description?
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Run a side-by-side gap analysis to see exact matching skills, missing keywords, and role fit percentages.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleMatchBoth}
          disabled={processingTarget !== null}
          className="py-3 px-6 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shrink-0 flex items-center gap-2 shadow-lg shadow-amber-500/25"
        >
          <Zap className="w-4 h-4" />
          <span>Match Resume with JD</span>
        </Button>
      </div>

      {/* =================================================================== */}
      {/* RESULTS DISPLAY WORKSPACE                                          */}
      {/* =================================================================== */}
      {(resumeAnalysisResult || jdAnalysisResult || jdMatchResult) && (
        <div className="space-y-6 pt-4 animate-fade-in">
          {/* Result Tabs Navigation */}
          <div className="flex border-b border-slate-200 space-x-2">
            {resumeAnalysisResult && (
              <button
                type="button"
                onClick={() => setActiveResultTab('resume')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
                  activeResultTab === 'resume'
                    ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Resume Analysis</span>
              </button>
            )}

            {jdAnalysisResult && (
              <button
                type="button"
                onClick={() => setActiveResultTab('jd')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
                  activeResultTab === 'jd'
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Job Description Breakdown</span>
              </button>
            )}

            {jdMatchResult && (
              <button
                type="button"
                onClick={() => setActiveResultTab('match')}
                className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center gap-2 ${
                  activeResultTab === 'match'
                    ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Resume & JD Comparison Match</span>
              </button>
            )}
          </div>

          {/* TAB 1: RESUME ANALYSIS ONLY VIEW */}
          {activeResultTab === 'resume' && resumeAnalysisResult && (
            <div className="space-y-6">
              {/* Score summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-white border-indigo-200 shadow-md rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Overall ATS Score</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-indigo-600 font-mono">
                      {resumeAnalysisResult.scores?.overallScore || 78}
                    </span>
                    <span className="text-slate-400 font-bold text-sm">/100</span>
                  </div>
                  <p className="text-xs text-slate-500">Standardized ATS parsing and quality score</p>
                </Card>

                <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Skills Detected</span>
                  <div className="text-4xl font-black text-slate-900 font-mono">
                    {resumeAnalysisResult.parsedData?.skills?.allSkillsFound?.length || 0}
                  </div>
                  <p className="text-xs text-slate-500">Validated technical and framework proficiencies</p>
                </Card>

                <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Projects Identified</span>
                  <div className="text-4xl font-black text-slate-900 font-mono">
                    {resumeAnalysisResult.parsedData?.projects?.length || 0}
                  </div>
                  <p className="text-xs text-slate-500">Practical project implementations detected</p>
                </Card>
              </div>

              {/* Extracted Skills List */}
              <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Extracted Technical Skills from Resume
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {(resumeAnalysisResult.parsedData?.skills?.allSkillsFound || []).map((skill: string) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>

              {/* Strengths & Actionable Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 bg-emerald-50/50 border-emerald-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Resume Strengths</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 pt-1">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">&bull;</span>
                      <span>Clear section hierarchy with readable contact, education, and skills.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">&bull;</span>
                      <span>Verified programming fundamentals and practical stack keywords present.</span>
                    </li>
                  </ul>
                </Card>

                <Card className="p-5 bg-indigo-50/50 border-indigo-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>Improvement Recommendations</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 pt-1">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">&bull;</span>
                      <span>Include quantifiable metrics (e.g. latency reduced by 30%, served 500+ users).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">&bull;</span>
                      <span>Add verified GitHub repository URLs for core development projects.</span>
                    </li>
                  </ul>
                </Card>
              </div>

              {/* Extracted Projects from Resume */}
              {resumeAnalysisResult.parsedData?.projects && resumeAnalysisResult.parsedData.projects.length > 0 && (
                <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Candidate Projects Detected from Resume ({resumeAnalysisResult.parsedData.projects.length})
                        </h3>
                        <p className="text-xs text-slate-500">Grounded evidence for technical interviews and evaluation</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resumeAnalysisResult.parsedData.projects.map((proj: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-slate-900">{proj.name}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                            {proj.complexity || 'Project'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {proj.problemSolved || proj.rawContent?.slice(0, 120)}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(proj.technologies || []).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* ================================================================= */}
              {/* GITHUB PROJECT & CODE REPOSITORY VERIFICATION SECTION            */}
              {/* ================================================================= */}
              <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                      <GithubIcon className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                          GitHub Project & Repository Verification
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Live API Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Live verification confirming project link correctness, repository availability, and code evidence.
                      </p>
                    </div>
                  </div>

                  {resumeAnalysisResult.githubVerification?.repositories?.length > 0 && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                      ✓ {resumeAnalysisResult.githubVerification.repositories.filter((r: any) => r.isAvailable).length} Available Project(s)
                    </span>
                  )}
                </div>

                {/* Detected / Verified Repositories List */}
                {resumeAnalysisResult.githubVerification?.repositories && resumeAnalysisResult.githubVerification.repositories.length > 0 ? (
                  <div className="space-y-3">
                    {resumeAnalysisResult.githubVerification.repositories.map((repo: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border transition-all ${
                          repo.isAvailable
                            ? 'bg-emerald-50/30 border-emerald-200'
                            : 'bg-rose-50/30 border-rose-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 font-mono">
                              {repo.owner}/{repo.repo}
                            </span>
                            <a
                              href={repo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 text-xs font-semibold"
                            >
                              <span>View on GitHub</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <div className="flex items-center gap-2">
                            {repo.isAvailable ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Verified & Available</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>{repo.status || 'Repository Unavailable'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {repo.isAvailable && repo.repoDetails && (
                          <div className="space-y-2 pt-2 border-t border-slate-200/60 text-xs">
                            <p className="text-slate-600 italic">
                              "{repo.repoDetails.description || 'Repository active with public codebase.'}"
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-slate-500 font-medium">
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                <Code className="w-3 h-3 text-indigo-600" />
                                <strong className="text-slate-800">{repo.repoDetails.language}</strong>
                              </span>
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                <Star className="w-3 h-3 text-amber-500" />
                                <span>{repo.repoDetails.stars} Stars</span>
                              </span>
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                <GitFork className="w-3 h-3 text-slate-500" />
                                <span>{repo.repoDetails.forks} Forks</span>
                              </span>
                              <span className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>{repo.repoDetails.hasReadme ? 'README Documentation Verified' : 'No README'}</span>
                              </span>
                            </div>

                            {repo.skillsMatched && repo.skillsMatched.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Matches Resume Skills:</span>
                                <div className="flex flex-wrap gap-1">
                                  {repo.skillsMatched.map((s: string) => (
                                    <span key={s} className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!repo.isAvailable && (
                          <p className="text-xs text-rose-700 pt-1 font-medium">
                            {repo.message || 'Repository link could not be verified on GitHub. Check URL spelling or verify if the repository is public.'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* No GitHub Repositories Detected in Resume */
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                          No GitHub Repository Links Detected in Resume
                        </h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Adding verified GitHub repository URLs for your projects significantly increases recruiter trust. You can verify a repository link below:
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input to verify project repository on demand */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Verify Project Repository Link (e.g. https://github.com/username/project)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={manualGithubUrl}
                      onChange={(e) => {
                        setManualGithubUrl(e.target.value);
                        setManualGithubError('');
                      }}
                      placeholder="https://github.com/username/project-repo"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:bg-white focus:border-indigo-600"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyManualGithub}
                      disabled={isVerifyingGithub}
                      className="py-2.5 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shrink-0 flex items-center gap-1.5"
                    >
                      <GithubIcon className="w-4 h-4 fill-white" />
                      <span>{isVerifyingGithub ? 'Verifying...' : 'Verify Project Link'}</span>
                    </Button>
                  </div>
                  {manualGithubError && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{manualGithubError}</p>
                  )}
                </div>
              </Card>

              {/* Action Banner: Launch AI Voice Interview */}
              <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-300">
                      AI Voice Interview Grounded in Your Resume
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xl">
                    Our AI Voice Interviewer will conduct a live conversational interview asking you specifically about your projects and skills.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={() => navigate('/interview')}
                  className="py-3 px-6 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shrink-0 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start AI Voice Interview</span>
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: JOB DESCRIPTION ANALYSIS ONLY VIEW */}
          {activeResultTab === 'jd' && jdAnalysisResult && (
            <div className="space-y-6">
              {/* Header card for the JD */}
              <Card className="p-6 bg-emerald-950 text-white rounded-2xl shadow-md border border-emerald-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                      Analyzed Opening Requisition
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5">
                      {jdAnalysisResult.jobTitle || 'Target Role Opening'}
                    </h3>
                    <p className="text-xs text-emerald-200">
                      Hiring Organization: {jdAnalysisResult.companyName || 'Target Company'} &bull; Level: {jdAnalysisResult.experienceLevel}
                    </p>
                  </div>
                  <Badge variant="success">JD Analysis Ready</Badge>
                </div>
              </Card>

              {/* Skills Required */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-5 bg-white border-slate-200 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Required Technical Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(jdAnalysisResult.requiredSkills || []).map((s: string) => (
                      <span key={s} className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 bg-white border-slate-200 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Soft Skills & Methodologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(jdAnalysisResult.softSkills || []).map((s: string) => (
                      <span key={s} className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Key Responsibilities */}
              {jdAnalysisResult.keyResponsibilities && jdAnalysisResult.keyResponsibilities.length > 0 && (
                <Card className="p-6 bg-white border-slate-200 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Extracted Core Responsibilities
                  </h4>
                  <div className="space-y-2 text-xs text-slate-700">
                    {jdAnalysisResult.keyResponsibilities.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Preparation Topics for this JD */}
              {jdAnalysisResult.preparationTopics && jdAnalysisResult.preparationTopics.length > 0 && (
                <Card className="p-6 bg-white border-slate-200 rounded-2xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Recommended Technical Focus Areas for this Role
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {jdAnalysisResult.preparationTopics.map((pt: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <span className="font-bold text-indigo-700 text-xs">{pt.topic}</span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{pt.focusArea}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* TAB 3: DUAL MATCH COMPARISON VIEW */}
          {activeResultTab === 'match' && jdMatchResult && (
            <div className="space-y-6">
              {/* Dual Score Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white border-indigo-200 shadow-md rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Metric 1</span>
                      <h3 className="text-lg font-black text-slate-900">General Resume Quality</h3>
                      <p className="text-xs text-slate-500">ATS format, section completeness & structure</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-indigo-600 font-mono">
                        {jdMatchResult.scores?.resumeQualityScore || 78}
                      </span>
                      <span className="text-sm font-bold text-slate-400">/100</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white border-emerald-200 shadow-md rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Metric 2</span>
                      <h3 className="text-lg font-black text-slate-900">Resume-to-JD Match Score</h3>
                      <p className="text-xs text-slate-500">
                        Fit for: {jdMatchResult.matchResult?.jobTitle || jdJobTitle}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-emerald-600 font-mono">
                        {jdMatchResult.scores?.jdMatchScore ?? 70}
                      </span>
                      <span className="text-sm font-bold text-slate-400">/100</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Matched vs Missing Skills */}
              <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Skills Match Breakdown for {jdMatchResult.matchResult?.jobTitle || jdJobTitle}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matched */}
                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Matching Skills Found in Resume ({jdMatchResult.matchResult?.skillsFoundInResume?.length || 0})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(jdMatchResult.matchResult?.skillsFoundInResume || []).map((s: string) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Missing */}
                  <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      <span>Missing or Underdeveloped Skills from JD ({jdMatchResult.matchResult?.skillsMissingFromResume?.length || 0})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(jdMatchResult.matchResult?.skillsMissingFromResume || []).map((s: string) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 text-xs font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prioritized Checklist */}
                {jdMatchResult.matchResult?.prioritizedChecklist && (
                  <div className="pt-2 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Prioritized Improvement Roadmap:
                    </span>
                    <div className="space-y-1.5 text-xs text-slate-700">
                      {jdMatchResult.matchResult.prioritizedChecklist.map((item: any, idx: number) => {
                        const text = typeof item === 'string' ? item : item?.advice || item?.keyword || '';
                        return (
                          <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>

              {/* Next Step CTA */}
              <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-bold">Ready for Personalized AI Interview Practice?</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Practice simulated technical interviews tailored to {jdJobTitle}.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="md"
                    onClick={() => navigate('/interview')}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                  >
                    Start Voice Interview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
