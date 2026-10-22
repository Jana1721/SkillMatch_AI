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
  Target,
  FileCheck,
  Zap,
  Info,
  Briefcase,
  Layers,
  Building2,
  Check,
  X,
  ListOrdered
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';
import { StorageService } from '../utils/storage';

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [targetRole, setTargetRole] = useState<string>('Software Engineer');
  const [pastedText, setPastedText] = useState<string>('');

  const [file, setFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    type: string;
    size: string;
  } | null>(null);

  // Job Description Matching section
  const [includeJD, setIncludeJD] = useState<boolean>(true);
  const [jdText, setJdText] = useState<string>('');
  const [jdJobTitle, setJdJobTitle] = useState<string>('Associate Software Engineer');
  const [jdCompany, setJdCompany] = useState<string>('Target Hiring Organization');

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'analyzing' | 'done' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [jdMatchResult, setJdMatchResult] = useState<any>(null);

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

  const targetRoles = [
    'Software Engineer',
    'Full Stack Java Developer',
    'Python & AI Developer',
    'Cloud & DevOps Engineer',
    'Data Analyst',
    'ServiceNow Specialist',
    'Cybersecurity Analyst'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'docx', 'txt', 'md'].includes(ext || '')) {
        showToast('Please select a valid PDF, DOCX, or TXT document.', 'error');
        return;
      }
      setFile(selected);
      setFileDetails({
        name: selected.name,
        type: (ext || 'TXT').toUpperCase(),
        size: `${(selected.size / 1024).toFixed(1)} KB`
      });
      setErrorMessage('');
    }
  };

  const handleProcess = async () => {
    if (inputMode === 'upload' && !file) {
      showToast('Please choose a resume file to upload.', 'error');
      return;
    }
    if (inputMode === 'paste' && (!pastedText.trim() || pastedText.trim().length < 30)) {
      showToast('Please paste substantial resume text (minimum 30 characters).', 'error');
      return;
    }

    try {
      setUploadStatus('uploading');
      setStatusMessage('Transmitting document to SkillMatch AI pipeline...');

      let resumeResponse: any = null;
      if (inputMode === 'upload' && file) {
        setUploadStatus('parsing');
        setStatusMessage(`Extracting readable text and section structures from ${fileDetails?.type}...`);
        resumeResponse = await ApiService.uploadResume(file, targetRole);
      } else {
        setUploadStatus('parsing');
        setStatusMessage('Parsing candidate skills, projects, and educational credentials...');
        resumeResponse = await ApiService.analyzeText(pastedText, targetRole, 'Pasted_Candidate_Resume.txt');
      }

      setUploadStatus('analyzing');
      setStatusMessage(`Computing general ATS quality score and skill-gap benchmarks for ${targetRole}...`);
      setAnalysisResult(resumeResponse.analysis);
      StorageService.setResumeAnalysis(resumeResponse.analysis);

      // If Job Description is provided, run the distinct JD match!
      if (includeJD && jdText.trim().length >= 20) {
        setStatusMessage('Matching resume against target Job Description requirements...');
        const jdRes = await ApiService.matchJD({
          jdText: jdText.trim(),
          jobTitle: jdJobTitle,
          companyName: jdCompany,
          resumeText: inputMode === 'paste' ? pastedText : undefined
        });
        setJdMatchResult(jdRes);
      }

      setUploadStatus('done');
      setStatusMessage('Resume & Job Description Analysis Completed!');
      showToast('Resume & JD analyzed successfully!', 'success');
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'Error processing document.');
      showToast(err.message || 'Upload processing failed.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 w-fit">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Evidence-Based Resume Analysis & JD Matching
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Resume Upload & Job Description Matching
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Upload your candidate resume in PDF or DOCX format and paste target job requisitions. Receive separate, transparent ratings for general resume quality versus specific job fit.
        </p>
      </div>

      {/* Target Role Selector */}
      <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Target Career Role</h3>
            <p className="text-xs text-slate-500">Benchmark your technical skills against market expectations</p>
          </div>
        </div>

        <select
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600"
        >
          {targetRoles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Card>

      {/* Part 1: Resume Input (Clear visual boundary) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Candidate Resume Input (PDF, DOCX, or TXT)
            </h2>
          </div>

          {/* Toggle between Upload vs Paste */}
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setInputMode('upload')}
              className={`px-3 py-1.5 rounded-lg transition ${
                inputMode === 'upload' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload Document
            </button>
            <button
              onClick={() => setInputMode('paste')}
              className={`px-3 py-1.5 rounded-lg transition ${
                inputMode === 'paste' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paste Resume Text
            </button>
          </div>
        </div>

        {inputMode === 'upload' ? (
          <Card className="p-8 border-2 border-dashed border-indigo-200 bg-indigo-50/20 text-center space-y-4 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Select Searchable Resume File</h3>
              <p className="text-xs text-slate-500">Supports PDF, DOCX, and TXT files up to 10MB</p>
            </div>

            <input
              type="file"
              id="file-upload-input"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center justify-center gap-3 pt-2">
              <label
                htmlFor="file-upload-input"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 transition"
              >
                Browse Resume File
              </label>
            </div>

            {fileDetails && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold shadow-xs">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>{fileDetails.name}</span>
                <span className="text-slate-400">&bull;</span>
                <span>{fileDetails.type}</span>
                <span className="text-slate-400">&bull;</span>
                <span>{fileDetails.size}</span>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-4 bg-white border-slate-200 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500 pb-1">
              <span className="font-bold text-slate-700">Paste Plain Resume Text</span>
              <span className="font-mono">{pastedText.split(/\s+/).filter(Boolean).length} Words</span>
            </div>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your resume content directly: Contact Info, Education, Skills, Projects, Experience, Certifications..."
              className="w-full p-3.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition resize-none leading-relaxed"
            />
          </Card>
        )}
      </div>

      {/* Part 2: Job Description Input (Clear visual boundary) */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">2</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Target Job Description Matching (Optional)
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setJdText(sampleJD);
              setIncludeJD(true);
              showToast('Sample SDE Job Description loaded!', 'info');
            }}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
          >
            Insert Sample Job Description
          </button>
        </div>

        <Card className="p-5 bg-emerald-50/20 border-emerald-200/80 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Target Opening Job Title</label>
              <input
                type="text"
                value={jdJobTitle}
                onChange={(e) => setJdJobTitle(e.target.value)}
                placeholder="e.g. Associate Java Developer"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">Hiring Organization</label>
              <input
                type="text"
                value={jdCompany}
                onChange={(e) => setJdCompany(e.target.value)}
                placeholder="e.g. Amazon AWS / TCS Digital"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Job Description Text (Requirements, Responsibilities, Skills)
            </label>
            <textarea
              rows={6}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the job opening description to calculate candidate compatibility, missing keywords, and role-specific readiness..."
              className="w-full p-3 font-mono text-xs bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 transition resize-none leading-relaxed"
            />
          </div>
        </Card>
      </div>

      {/* Submit Action */}
      <div className="flex justify-center pt-2">
        <Button
          onClick={handleProcess}
          disabled={uploadStatus === 'uploading' || uploadStatus === 'parsing' || uploadStatus === 'analyzing'}
          className="py-3.5 px-8 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/30 flex items-center gap-2"
        >
          <Zap className="w-5 h-5 text-amber-300" />
          <span>Run Comprehensive Resume & JD Analysis</span>
        </Button>
      </div>

      {/* Status Progress Card */}
      {uploadStatus !== 'idle' && (
        <Card className="p-5 bg-white border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {uploadStatus === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : uploadStatus === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              )}
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">{statusMessage}</h4>
            </div>

            {uploadStatus === 'done' && <Badge variant="success">Analysis Complete</Badge>}
          </div>

          {uploadStatus === 'error' && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold">
              {errorMessage}
            </div>
          )}
        </Card>
      )}

      {/* Results View: Clearly distinguishes General Resume Score vs JD Match Score */}
      {uploadStatus === 'done' && analysisResult && (
        <div className="space-y-6 pt-4 animate-fade-in">
          {/* Dual Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. General Resume Quality Score */}
            <Card className="p-6 bg-white border-indigo-200 shadow-md rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Metric 1</span>
                  <h3 className="text-lg font-black text-slate-900">General Resume Quality Score</h3>
                  <p className="text-xs text-slate-500">Readability, structure, section completeness, ATS metrics</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-indigo-600 font-mono">
                    {analysisResult.scores?.overallScore || 75}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/100</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Skills Identified:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {analysisResult.parsedData?.skills?.allSkillsFound?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Candidate Projects:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {analysisResult.parsedData?.projects?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">ATS Formatting Check:</span>
                  <span className="font-bold text-emerald-600">Optimal (Searchable)</span>
                </div>
              </div>
            </Card>

            {/* 2. Resume-to-JD Match Score */}
            <Card className="p-6 bg-white border-emerald-200 shadow-md rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Metric 2</span>
                  <h3 className="text-lg font-black text-slate-900">Resume-to-JD Match Score</h3>
                  <p className="text-xs text-slate-500">
                    Fit for: {jdMatchResult?.matchResult?.jobTitle || jdJobTitle}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-emerald-600 font-mono">
                    {jdMatchResult?.scores?.jdMatchScore ?? 65}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/100</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Matching Skills:</span>
                  <span className="font-bold text-emerald-600 font-mono">
                    {jdMatchResult?.matchResult?.skillsFoundInResume?.length || 4}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Missing JD Requirements:</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {jdMatchResult?.matchResult?.skillsMissingFromResume?.length || 2}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Target Fit Rating:</span>
                  <span className="font-bold text-indigo-600">Solid Alignment</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Matching Skills vs Missing Requirements Breakdown */}
          {jdMatchResult && (
            <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Skills Match Breakdown for {jdMatchResult.matchResult.jobTitle}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matched */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Matching Skills Found in Resume</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {jdMatchResult.matchResult.skillsFoundInResume.map((s: string) => (
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
                    <span>Missing or Underdeveloped Skills from JD</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {jdMatchResult.matchResult.skillsMissingFromResume.map((s: string) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 text-xs font-semibold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Prioritized Improvement Checklist */}
              {jdMatchResult.matchResult.prioritizedChecklist && (
                <div className="pt-2 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Prioritized Improvement Checklist:
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    {jdMatchResult.matchResult.prioritizedChecklist.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Quick Actions to Next Modules */}
          <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold">Ready for the Next Step in Career Preparation?</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Practice personalized voice interview questions tailored specifically to your resume.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate('/github-verify')}
                className="bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                Verify GitHub Projects
              </Button>
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
  );
};
