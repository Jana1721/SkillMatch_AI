import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Info
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';
import { StorageService } from '../utils/storage';

export const UploadResume: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [targetRole, setTargetRole] = useState<string>('Java Developer');
  const [pastedText, setPastedText] = useState<string>('');

  const [file, setFile] = useState<File | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    type: string;
    size: string;
  } | null>(null);

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'parsing' | 'analyzing' | 'done' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const targetRoles = [
    'Java Developer',
    'Software Developer / SDE',
    'ServiceNow Developer',
    'Full Stack Developer',
    'Cloud & DevOps Engineer',
    'Data Analyst'
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

  const handleProcessUpload = async () => {
    if (!file) {
      showToast('Please choose a resume file to upload.', 'error');
      return;
    }

    try {
      setUploadStatus('uploading');
      setStatusMessage('Transmitting document to CareerLens processing pipeline...');
      await new Promise(r => setTimeout(r, 400));

      setUploadStatus('parsing');
      setStatusMessage(`Parsing document structure and extracting text from ${fileDetails?.type}...`);

      const response = await ApiService.uploadResume(file, targetRole);

      setUploadStatus('analyzing');
      setStatusMessage(`Running ATS checks, skill categorization, and role alignment for ${targetRole}...`);
      await new Promise(r => setTimeout(r, 400));

      setUploadStatus('done');
      setStatusMessage('Resume analysis complete!');
      setAnalysisResult(response.analysis);

      // Save to local session
      StorageService.setResumeAnalysis(response.analysis);
      showToast('Resume processed and analyzed successfully!', 'success');
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'Error parsing document.');
      showToast(err.message || 'Upload processing failed.', 'error');
    }
  };

  const handleProcessPastedText = async () => {
    if (!pastedText.trim() || pastedText.trim().length < 25) {
      showToast('Please paste substantial resume text (minimum 25 characters).', 'error');
      return;
    }

    try {
      setUploadStatus('parsing');
      setStatusMessage('Parsing pasted resume sections, education, and skills...');
      setFileDetails({
        name: 'Pasted_Resume_Content.txt',
        type: 'TXT',
        size: `${(pastedText.length / 1024).toFixed(1)} KB`
      });

      const response = await ApiService.analyzeText(pastedText, targetRole, 'Pasted_Resume_Content.txt');

      setUploadStatus('analyzing');
      setStatusMessage(`Evaluating project complexity, mistake detection, and ATS compatibility...`);
      await new Promise(r => setTimeout(r, 400));

      setUploadStatus('done');
      setStatusMessage('Resume analysis complete!');
      setAnalysisResult(response.analysis);

      StorageService.setResumeAnalysis(response.analysis);
      showToast('Pasted resume evaluated successfully!', 'success');
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'Error processing pasted text.');
      showToast(err.message || 'Text analysis failed.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          Production Document Parser
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Upload Your Original Resume
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          CareerLens AI extracts raw text, detects structural mistakes, identifies technical skill gaps, and prepares you for real technical interviews.
        </p>
      </div>

      {/* Target Role Selector */}
      <Card padding="md" className="bg-white border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Role Benchmark</h3>
            <p className="text-xs text-slate-600">ATS filters, skill gaps, and interview questions will calibrate to this role.</p>
          </div>
        </div>

        <select
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          className="px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
        >
          {targetRoles.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </Card>

      {/* Mode Tabs */}
      <div className="flex items-center justify-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setInputMode('upload'); setUploadStatus('idle'); }}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            inputMode === 'upload'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          Upload Document (PDF, DOCX, TXT)
        </button>

        <button
          onClick={() => { setInputMode('paste'); setUploadStatus('idle'); }}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            inputMode === 'paste'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clipboard className="w-4 h-4" />
          Paste Plain Text
        </button>
      </div>

      {/* Upload Document Box */}
      {inputMode === 'upload' ? (
        <Card padding="lg" className="border-2 border-dashed border-slate-200 bg-white text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">Select your resume file</h3>
            <p className="text-xs text-slate-500">
              Supports searchable PDF, DOCX, and TXT (Max 10MB).
            </p>
          </div>

          <input
            type="file"
            id="file-upload-input"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex items-center justify-center gap-3">
            <label
              htmlFor="file-upload-input"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs cursor-pointer transition-all"
            >
              Browse Resume File
            </label>

            {file && (
              <Button
                variant="secondary"
                size="md"
                disabled={uploadStatus === 'uploading' || uploadStatus === 'parsing' || uploadStatus === 'analyzing'}
                onClick={handleProcessUpload}
              >
                Analyze Document Now
              </Button>
            )}
          </div>

          {fileDetails && (
            <div className="inline-flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span className="font-bold">{fileDetails.name}</span>
              <span className="text-slate-400">•</span>
              <span>{fileDetails.type}</span>
              <span className="text-slate-400">•</span>
              <span>{fileDetails.size}</span>
            </div>
          )}
        </Card>
      ) : (
        /* Paste Plain Text Box */
        <Card padding="md" className="space-y-3 bg-white border-slate-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
            <span className="font-bold text-slate-700">Paste Full Resume Text</span>
            <span className="text-slate-400">{pastedText.split(/\s+/).filter(Boolean).length} Words</span>
          </div>

          <textarea
            rows={10}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste your resume content directly (Contact Info, Summary, Education, Skills, Projects, Experience, Certifications)..."
            className="w-full p-4 font-mono text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 leading-relaxed"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              icon={<Zap className="w-4 h-4" />}
              disabled={uploadStatus === 'parsing' || uploadStatus === 'analyzing'}
              onClick={handleProcessPastedText}
            >
              Analyze Pasted Text
            </Button>
          </div>
        </Card>
      )}

      {/* Progress & Status Indicators */}
      {uploadStatus !== 'idle' && (
        <Card padding="md" className="bg-slate-50 border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {uploadStatus === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : uploadStatus === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              )}
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {statusMessage}
              </h4>
            </div>

            {uploadStatus === 'done' && (
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Verified Extraction
              </span>
            )}
          </div>

          {/* Status Pipeline Chips */}
          <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
            <div className={`p-2 rounded-lg ${uploadStatus !== 'idle' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-500'}`}>
              1. Document Upload
            </div>
            <div className={`p-2 rounded-lg ${['parsing', 'analyzing', 'done'].includes(uploadStatus) ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-500'}`}>
              2. Text Parsing
            </div>
            <div className={`p-2 rounded-lg ${['analyzing', 'done'].includes(uploadStatus) ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-500'}`}>
              3. AI Analysis
            </div>
            <div className={`p-2 rounded-lg ${uploadStatus === 'done' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
              4. Readiness Ready
            </div>
          </div>

          {uploadStatus === 'error' && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}

          {/* Post-Analysis Action Navigation */}
          {uploadStatus === 'done' && analysisResult && (
            <div className="pt-4 border-t border-slate-200/80 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    Candidate: {analysisResult.parsedData?.contact?.name} • Score: {analysisResult.scorecard?.overallScore}/100
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Extracted {analysisResult.parsedData?.skills?.allSkillsFound?.length || 0} skills & {analysisResult.parsedData?.projects?.length || 0} projects.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/issues')}
                  >
                    View Resume Issues ({analysisResult.issues?.length || 0})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/projects')}
                  >
                    Analyze Projects
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="w-4 h-4" />}
                    iconPosition="right"
                    onClick={() => navigate('/dashboard')}
                  >
                    Open Career Dashboard
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Truthfulness Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-amber-900 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong>CareerLens Truthfulness Rule:</strong> Analysis is grounded exclusively in the uploaded document. The system will never fabricate experience, invent projects, or claim certifications not present in the source text.
        </p>
      </div>
    </div>
  );
};
