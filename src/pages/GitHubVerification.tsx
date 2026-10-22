import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  ExternalLink,
  Search,
  Star,
  GitFork,
  FileCode,
  Layers,
  History,
  ShieldCheck,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { GithubIcon } from '../components/common/GithubIcon';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ApiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { GitHubVerificationItem } from '../types';

export const GitHubVerification: React.FC = () => {
  const { showToast } = useToast();

  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeVerification, setActiveVerification] = useState<GitHubVerificationItem | null>(null);
  const [pastVerifications, setPastVerifications] = useState<GitHubVerificationItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadPastVerifications = async () => {
    setHistoryLoading(true);
    try {
      const res = await ApiService.getGitHubVerifications();
      if (res.success) {
        setPastVerifications(res.verifications);
      }
    } catch (err: any) {
      console.warn('Could not load past verifications', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadPastVerifications();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) {
      showToast('Please enter a GitHub repository URL', 'error');
      return;
    }

    setLoading(true);
    setActiveVerification(null);

    try {
      const res = await ApiService.verifyGitHubRepo(repoUrl.trim());
      if (res.success && res.verification) {
        setActiveVerification(res.verification);
        showToast(`Repository verification result: ${res.verification.status}`, 'success');
        loadPastVerifications();
      }
    } catch (err: any) {
      showToast(err.message || 'GitHub verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Verified — Public & Accessible
          </span>
        );
      case 'Partially Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Partially Verified — Minimal Content
          </span>
        );
      case 'Private or Inaccessible':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Lock className="w-3.5 h-3.5 text-purple-600" />
            Private or Inaccessible
          </span>
        );
      case 'Not Found':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Not Found
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
            Verification Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 w-fit">
          <GithubIcon className="w-4 h-4 text-emerald-400" />
          Technical Evidence Verifier
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          GitHub Project Link Verification
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Validate public source code repository claims via official GitHub REST APIs. Compare repo tech stacks against skills claimed on your resume to confirm project authenticity.
        </p>
      </div>

      {/* Verification Input Card */}
      <Card className="p-6 sm:p-8 bg-white border-slate-200/80 shadow-sm rounded-2xl">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Enter GitHub Repository URL
            </label>
            <div className="relative">
              <GithubIcon className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repository-name"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Accepts public GitHub repository URLs under <code className="text-indigo-600 font-mono">github.com</code>. Tokens or passwords are never requested.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Inspecting Repository...' : 'Verify Repository via GitHub API'}</span>
            </Button>

            <button
              type="button"
              onClick={() => setRepoUrl('https://github.com/expressjs/express')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Test with public sample (expressjs/express)
            </button>
          </div>
        </form>
      </Card>

      {/* Active Verification Result Card */}
      {activeVerification && (
        <Card className="p-6 sm:p-8 bg-white border-slate-200/80 shadow-md rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Verification Verdict
              </span>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {activeVerification.repoDetails?.fullName || activeVerification.repoUrl}
                </h2>
                <a
                  href={activeVerification.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded text-slate-400 hover:text-indigo-600"
                  title="Open in GitHub"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>{getStatusBadge(activeVerification.status)}</div>
          </div>

          {/* Repo Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Language</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {activeVerification.repoDetails?.language || 'Not specified'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                <Star className="w-3 h-3 text-amber-500" /> Stars
              </span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {activeVerification.repoDetails?.stars ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                <GitFork className="w-3 h-3 text-indigo-500" /> Forks
              </span>
              <div className="text-sm font-bold text-slate-900 mt-0.5 font-mono">
                {activeVerification.repoDetails?.forks ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                <BookOpen className="w-3 h-3 text-emerald-500" /> README
              </span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">
                {activeVerification.repoDetails?.hasReadme ? 'Available' : 'Missing'}
              </div>
            </div>
          </div>

          {/* Description */}
          {activeVerification.repoDetails?.description && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                {activeVerification.repoDetails.description}
              </p>
            </div>
          )}

          {/* Topics */}
          {activeVerification.repoDetails?.topics && activeVerification.repoDetails.topics.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Repository Topics & Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeVerification.repoDetails.topics.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resume Skills Alignment Analysis */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Technical Relevance to Candidate Resume
              </span>
              <span className="text-sm font-mono font-bold text-indigo-700">
                Fit Score: {activeVerification.relevanceScore}/100
              </span>
            </div>

            <p className="text-xs text-indigo-950 leading-relaxed">
              {activeVerification.relevanceAnalysis?.evidenceSummary}
            </p>

            {activeVerification.relevanceAnalysis?.matchingTechnologies &&
              activeVerification.relevanceAnalysis.matchingTechnologies.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-indigo-800 uppercase block mb-1.5">
                    Demonstrated Technologies Matched to Resume:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeVerification.relevanceAnalysis.matchingTechnologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Important Ownership Disclaimer */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Academic Integrity Notice:</strong> A public repository existing confirms accessibility and technical keywords, but does not prove sole authorship or intellectual ownership. Administrators review commit histories and project explanations during technical interviews.
            </div>
          </div>
        </Card>
      )}

      {/* Past GitHub Verifications Roster */}
      <Card className="p-6 bg-white border-slate-200/80 shadow-sm rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          Candidate Verification History ({pastVerifications.length})
        </h3>

        {historyLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">Loading history...</div>
        ) : pastVerifications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No repositories verified yet. Submit a repository link above to begin inspection.
          </div>
        ) : (
          <div className="space-y-3">
            {pastVerifications.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <GithubIcon className="w-4 h-4 text-slate-700" />
                    <span>{item.repoUrl}</span>
                    <a
                      href={item.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1">
                    Language: {item.repoDetails?.language || 'N/A'} &bull; Stars: {item.repoDetails?.stars ?? 0} &bull; Matched: {item.relevanceAnalysis?.matchingTechnologies?.join(', ') || 'General'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-indigo-600">
                    Fit: {item.relevanceScore}%
                  </span>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
