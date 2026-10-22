import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  UserX,
  FileCheck2,
  Video,
  Clock,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Award,
  Layers,
  FileText,
  Activity,
  History,
  X
} from 'lucide-react';
import { GithubIcon } from '../components/common/GithubIcon';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  AdminStats,
  AdminCandidateSummary,
  CandidateDetailData
} from '../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [candidates, setCandidates] = useState<AdminCandidateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [collegeIdentityFilter, setCollegeIdentityFilter] = useState('all');
  const [interviewFilter, setInterviewFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected candidate drilldown
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<CandidateDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'resumes' | 'interviews' | 'github'>('overview');

  // Rejection modal state
  const [rejectModalCandidate, setRejectModalCandidate] = useState<AdminCandidateSummary | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Dashboard views: Student Verification Management is primary
  const [activeView, setActiveView] = useState<'verification' | 'candidates' | 'audit_logs'>('verification');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Protect Admin route client-side as well
  useEffect(() => {
    if (user && user.role !== 'admin') {
      showToast('Administrator privileges required to access this portal', 'error');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      const res = await ApiService.getAdminStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load platform analytics', 'error');
    }
  };

  const loadCandidates = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getAdminCandidates({
        search: searchTerm,
        department: departmentFilter,
        verificationStatus: verificationFilter,
        collegeIdentityStatus: collegeIdentityFilter,
        interviewStatus: interviewFilter,
        page: currentPage,
        limit: 10
      });
      if (res.success) {
        setCandidates(res.candidates);
        setTotalPages(res.pagination.totalPages);
        setTotalCount(res.pagination.total);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load candidates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await ApiService.getAdminAuditLogs();
      if (res.success) {
        setAuditLogs(res.logs);
      }
    } catch (err: any) {}
  };

  useEffect(() => {
    loadStats();
    loadCandidates();
    loadAuditLogs();
  }, [departmentFilter, verificationFilter, collegeIdentityFilter, interviewFilter, currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadCandidates();
  };

  const openCandidateDetail = async (id: string) => {
    setSelectedCandidateId(id);
    setDetailLoading(true);
    try {
      const res = await ApiService.getAdminCandidateDetail(id);
      if (res.success) {
        setCandidateDetail(res);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch candidate details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleManualEmailVerification = async (candidateId: string) => {
    try {
      const res = await ApiService.adminVerifyCandidateEmail(candidateId);
      showToast(res.message || 'Candidate email manually verified by Administrator', 'success');
      loadCandidates();
      loadStats();
      if (selectedCandidateId === candidateId) {
        openCandidateDetail(candidateId);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to verify candidate', 'error');
    }
  };

  const handleApproveIdentity = async (candidateId: string, candidateName: string) => {
    try {
      const res = await ApiService.adminVerifyCandidateIdentity(candidateId, 'approve');
      showToast(res.message || `College identity for ${candidateName} verified.`, 'success');
      loadCandidates();
      loadStats();
      loadAuditLogs();
      if (selectedCandidateId === candidateId) {
        openCandidateDetail(candidateId);
      }
    } catch (err: any) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const handleOpenRejectModal = (candidate: AdminCandidateSummary) => {
    setRejectModalCandidate(candidate);
    setRejectReason('');
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalCandidate) return;
    if (!rejectReason.trim()) {
      showToast('A specific review reason is required when rejecting a candidate', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await ApiService.adminVerifyCandidateIdentity(rejectModalCandidate.id, 'reject', rejectReason.trim());
      showToast(res.message || 'Candidate college identity marked as Rejected.', 'success');
      setRejectModalCandidate(null);
      setRejectReason('');
      loadCandidates();
      loadStats();
      loadAuditLogs();
      if (selectedCandidateId === rejectModalCandidate.id) {
        openCandidateDetail(rejectModalCandidate.id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to reject candidate', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const departments = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Artificial Intelligence & Data Science',
    'MCA / BCA'
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Administrative Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Candidate Readiness & Placement Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Live institution-wide analytics, student verification management, AI interview scoring, and security audits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={ApiService.getAdminExportUrl('csv')}
              download="candidates_roster.csv"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV Roster</span>
            </a>
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveView('verification')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeView === 'verification' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Student Verification
              </button>
              <button
                onClick={() => setActiveView('candidates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeView === 'candidates' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Candidates Directory
              </button>
              <button
                onClick={() => setActiveView('audit_logs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeView === 'audit_logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Audit Logs ({auditLogs.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Candidates */}
        <Card className="p-5 border-slate-200/80 bg-white shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Candidates</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats?.totalCandidates ?? 0}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-600 font-bold">{stats?.verifiedCandidates ?? 0} verified</span>
            <span>&bull;</span>
            <span className="text-amber-600 font-bold">{stats?.unverifiedCandidates ?? 0} pending</span>
          </div>
        </Card>

        {/* Interviews Completed */}
        <Card className="p-5 border-slate-200/80 bg-white shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interviews Completed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{stats?.completedInterviews ?? 0}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-indigo-600 font-bold">{stats?.pendingInterviews ?? 0} in progress</span>
          </div>
        </Card>

        {/* Average Resume Score */}
        <Card className="p-5 border-slate-200/80 bg-white shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Resume Score</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900">{stats?.avgResumeScore ?? 75}</span>
            <span className="text-sm font-bold text-slate-400">/100</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Based on active parsing & ATS rubrics
          </div>
        </Card>

        {/* Candidates Requiring Improvement */}
        <Card className="p-5 border-slate-200/80 bg-white shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Needs Work (&lt;70)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-600">{stats?.candidatesNeedingImprovement ?? 0}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Assigned priority remediation roadmap
          </div>
        </Card>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card className="p-6 bg-white border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Department Representation Breakdown
          </h3>
          <div className="space-y-3">
            {(stats?.departmentDistribution || [
              { department: 'Computer Science & Engineering', count: 6 },
              { department: 'Information Technology', count: 3 },
              { department: 'Artificial Intelligence & Data Science', count: 2 }
            ]).map((item, idx) => {
              const total = stats?.totalCandidates || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{item.department}</span>
                    <span className="text-indigo-600 font-mono">{item.count} candidates ({pct}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(10, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Score Distribution */}
        <Card className="p-6 bg-white border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Candidate Score Distribution
          </h3>
          <div className="space-y-3">
            {(stats?.scoreRanges || [
              { range: '85-100 (Exceptional)', count: 3 },
              { range: '70-84 (Job Ready)', count: 6 },
              { range: '50-69 (Needs Work)', count: 2 },
              { range: '<50 (Early Prep)', count: 1 }
            ]).map((rangeItem, idx) => {
              const total = stats?.totalCandidates || 1;
              const pct = Math.round((rangeItem.count / total) * 100);
              const color = rangeItem.range.includes('85')
                ? 'bg-emerald-500'
                : rangeItem.range.includes('70')
                ? 'bg-blue-500'
                : rangeItem.range.includes('50')
                ? 'bg-amber-500'
                : 'bg-rose-500';

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">{rangeItem.range}</span>
                    <span className="text-slate-900 font-mono">{rangeItem.count} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Main View: Student Verification Management OR Candidates Directory OR Audit Logs */}
      {activeView === 'verification' ? (
        <Card className="bg-white border-slate-200/80 shadow-sm overflow-hidden">
          {/* Section Header & Filters */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Student Verification Management
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutional identity validation, official college student roster checks, and administrative approval/rejection decisions.
                </p>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by student name or roll number..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-indigo-600 outline-none"
                />
              </form>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={verificationFilter}
                  onChange={(e) => {
                    setVerificationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Email Status</option>
                  <option value="verified">Email: Verified</option>
                  <option value="unverified">Email: Unverified</option>
                </select>

                <select
                  value={collegeIdentityFilter}
                  onChange={(e) => {
                    setCollegeIdentityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All College Identity</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Verified">Verified</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Verification Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">College Roll Number</th>
                  <th className="py-3 px-4">SkillMatch Login ID</th>
                  <th className="py-3 px-4">College Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Email Verification</th>
                  <th className="py-3 px-4 text-center">College Identity</th>
                  <th className="py-3 px-4 text-center">Registered</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading verification roster...
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No candidate records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {c.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {c.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 font-semibold">
                        {c.credentialId}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {c.email}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[150px] truncate" title={c.department}>
                        {c.department}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.emailVerified || c.emailStatus === 'Verified' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <XCircle className="w-3 h-3 text-amber-600" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          c.collegeIdentityStatus === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.collegeIdentityStatus === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {c.collegeIdentityStatus || 'Pending Verification'}
                        </span>
                        {c.collegeRejectedReason && (
                          <div className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[140px]" title={c.collegeRejectedReason}>
                            Reason: {c.collegeRejectedReason}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.collegeIdentityStatus !== 'Verified' && (
                            <button
                              onClick={() => handleApproveIdentity(c.id, c.name)}
                              title="Approve College Identity"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition inline-flex items-center gap-1 border border-emerald-200 cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Approve</span>
                            </button>
                          )}
                          {c.collegeIdentityStatus !== 'Rejected' && (
                            <button
                              onClick={() => handleOpenRejectModal(c)}
                              title="Reject College Identity with Reason"
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition inline-flex items-center gap-1 border border-rose-200 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Reject</span>
                            </button>
                          )}
                          <button
                            onClick={() => openCandidateDetail(c.id)}
                            title="View Full Candidate Dossier"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {candidates.length} of {totalCount} total students
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      ) : activeView === 'candidates' ? (
        <Card className="bg-white border-slate-200/80 shadow-sm overflow-hidden">
          {/* Filters Bar */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, roll number, Login ID, email, or department..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:border-indigo-600 outline-none"
                />
              </form>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={departmentFilter}
                  onChange={(e) => {
                    setDepartmentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <select
                  value={verificationFilter}
                  onChange={(e) => {
                    setVerificationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Verification Status</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Unverified Only</option>
                </select>

                <select
                  value={interviewFilter}
                  onChange={(e) => {
                    setInterviewFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Interview Status</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="not started">Not Started</option>
                </select>
              </div>
            </div>
          </div>

          {/* Candidate Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Candidate & Login ID</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Email Verification</th>
                  <th className="py-3 px-4 text-center">Resume Score</th>
                  <th className="py-3 px-4 text-center">GitHub Status</th>
                  <th className="py-3 px-4 text-center">Interview</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading candidate records...
                    </td>
                  </tr>
                ) : candidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No candidate records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="font-mono text-[11px] text-indigo-600 font-semibold">{c.credentialId}</div>
                        <div className="text-[11px] text-slate-400">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {c.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate" title={c.department}>
                        {c.department}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {c.emailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <XCircle className="w-3 h-3 text-amber-600" />
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-bold font-mono px-2 py-0.5 rounded ${
                            c.resumeScore >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.resumeScore >= 70
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.resumeScore}/100
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            c.githubStatus === 'Verified'
                              ? 'success'
                              : c.githubStatus === 'Partially Verified'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {c.githubStatus}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div>
                          <span className="font-semibold text-slate-800">{c.interviewStatus}</span>
                          {c.latestInterviewScore !== null && (
                            <div className="text-[11px] font-mono text-emerald-600 font-bold">
                              Score: {c.latestInterviewScore}%
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openCandidateDetail(c.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {candidates.length} of {totalCount} total candidates
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      ) : (
        /* Audit Logs View */
        <Card className="bg-white border-slate-200/80 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            Administrative Security Audit Trail
          </h3>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No administrative actions logged yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-500 ml-2">by {log.adminName} ({log.adminId})</span>
                    <p className="text-slate-600 mt-1 font-mono text-[11px]">
                      Target: {log.targetType} {log.targetId} &bull; Details: {JSON.stringify(log.details)}
                    </p>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Rejection Modal with Mandatory Reason */}
      {rejectModalCandidate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold">
                <XCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Reject College Identity Verification</h3>
              </div>
              <button
                onClick={() => setRejectModalCandidate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div><strong>Candidate:</strong> {rejectModalCandidate.name}</div>
              <div><strong>Roll Number:</strong> <span className="font-mono font-bold text-indigo-700">{rejectModalCandidate.rollNumber}</span></div>
              <div><strong>Email:</strong> {rejectModalCandidate.email}</div>
              <div><strong>Department:</strong> {rejectModalCandidate.department}</div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Required Review Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this student cannot be verified (e.g. Roll number not found in authorized college CSE 2026 database, email does not match official college roster record)."
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This reason will be displayed to the student so they can correct permitted details and resubmit.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectModalCandidate(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview || !rejectReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Drilldown Modal / Drawer */}
      {selectedCandidateId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Full Candidate Dossier
                </span>
                <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
                  {candidateDetail?.candidate?.name || 'Candidate Details'}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                  <span>ID: {candidateDetail?.candidate?.credentialId}</span>
                  <span>&bull;</span>
                  <span>Roll: {candidateDetail?.candidate?.rollNumber}</span>
                  <span>&bull;</span>
                  <span>Dept: {candidateDetail?.candidate?.department}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedCandidateId(null);
                  setCandidateDetail(null);
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-bold">
              <button
                onClick={() => setDetailTab('overview')}
                className={`py-3 px-4 border-b-2 transition ${
                  detailTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Profile & Contacts
              </button>
              <button
                onClick={() => setDetailTab('resumes')}
                className={`py-3 px-4 border-b-2 transition ${
                  detailTab === 'resumes'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Resumes & JD Matches ({candidateDetail?.resumes?.length || 0})
              </button>
              <button
                onClick={() => setDetailTab('interviews')}
                className={`py-3 px-4 border-b-2 transition ${
                  detailTab === 'interviews'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                AI Interviews ({candidateDetail?.interviews?.length || 0})
              </button>
              <button
                onClick={() => setDetailTab('github')}
                className={`py-3 px-4 border-b-2 transition ${
                  detailTab === 'github'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                GitHub Verifications ({candidateDetail?.githubVerifications?.length || 0})
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {detailLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading dossier...
                </div>
              ) : (
                <>
                  {detailTab === 'overview' && candidateDetail && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Email Status</span>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-semibold text-slate-900 text-sm">{candidateDetail.candidate.email}</span>
                            {candidateDetail.candidate.emailVerified ? (
                              <Badge variant="success">Verified</Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleManualEmailVerification(candidateDetail.candidate.id)}
                                className="text-xs bg-amber-600 hover:bg-amber-700 py-1 px-3"
                              >
                                Manual Verify
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Phone</span>
                          <div className="font-semibold text-slate-900 text-sm mt-1">
                            {candidateDetail.candidate.phone || 'N/A'}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Degree & College</span>
                          <div className="font-semibold text-slate-900 text-sm mt-1">
                            {candidateDetail.candidate.degree} &bull; {candidateDetail.candidate.college}
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">Target Role</span>
                          <div className="font-semibold text-slate-900 text-sm mt-1">
                            {candidateDetail.candidate.targetRole || 'Software Engineer'}
                          </div>
                        </div>

                        {/* College Identity Verification Decision Card */}
                        <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">College Identity Verification</span>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                candidateDetail.candidate.collegeIdentityStatus === 'Verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : candidateDetail.candidate.collegeIdentityStatus === 'Rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {candidateDetail.candidate.collegeIdentityStatus || 'Pending Verification'}
                              </span>
                              <span className="text-xs text-slate-500">
                                Roll Number: <strong className="font-mono text-slate-800">{candidateDetail.candidate.rollNumber}</strong>
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {candidateDetail.candidate.collegeIdentityStatus !== 'Verified' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveIdentity(candidateDetail.candidate.id, candidateDetail.candidate.name)}
                                  className="text-xs bg-emerald-600 hover:bg-emerald-700 py-1 px-3"
                                >
                                  Approve Identity
                                </Button>
                              )}
                              {candidateDetail.candidate.collegeIdentityStatus !== 'Rejected' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenRejectModal({
                                    id: candidateDetail.candidate.id,
                                    name: candidateDetail.candidate.name,
                                    rollNumber: candidateDetail.candidate.rollNumber || '',
                                    email: candidateDetail.candidate.email,
                                    department: candidateDetail.candidate.department,
                                    credentialId: candidateDetail.candidate.credentialId || '',
                                    phone: candidateDetail.candidate.phone,
                                    college: candidateDetail.candidate.college,
                                    emailVerified: Boolean(candidateDetail.candidate.emailVerified),
                                    resumeScore: 70,
                                    githubStatus: '',
                                    latestInterviewScore: null,
                                    interviewStatus: '',
                                    createdAt: candidateDetail.candidate.createdAt || ''
                                  })}
                                  className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50 py-1 px-3"
                                >
                                  Reject Identity
                                </Button>
                              )}
                            </div>
                          </div>

                          {candidateDetail.candidate.collegeRejectedReason && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl mt-3 text-xs text-rose-900">
                              <strong>Official Rejection Reason:</strong> {candidateDetail.candidate.collegeRejectedReason}
                            </div>
                          )}

                          {candidateDetail.candidate.collegeReviewedBy && (
                            <p className="text-[11px] text-slate-500 mt-2">
                              Reviewed by: <strong>{candidateDetail.candidate.collegeReviewedBy}</strong> {candidateDetail.candidate.collegeVerifiedAt ? `on ${new Date(candidateDetail.candidate.collegeVerifiedAt).toLocaleDateString()}` : ''}
                            </p>
                          )}
                        </div>

                        {/* Audit Trail of Reviews */}
                        {candidateDetail.identityReviews && candidateDetail.identityReviews.length > 0 && (
                          <div className="col-span-1 sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Verification Review Audit History</span>
                            <div className="space-y-2 divide-y divide-slate-100">
                              {candidateDetail.identityReviews.map((rev: any) => (
                                <div key={rev.id} className="pt-2 text-xs flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        rev.action === 'approve' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}>
                                        {rev.action.toUpperCase()}
                                      </span>
                                      <span className="font-semibold text-slate-800">{rev.admin_name}</span>
                                    </div>
                                    {rev.reason && (
                                      <p className="text-slate-600 mt-1 italic font-mono text-[11px]">
                                        "{rev.reason}"
                                      </p>
                                    )}
                                  </div>
                                  <span className="text-slate-400 font-mono text-[10px] shrink-0">
                                    {new Date(rev.reviewed_at).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {detailTab === 'resumes' && candidateDetail && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Uploaded Resumes</h4>
                      {candidateDetail.resumes.length === 0 ? (
                        <p className="text-xs text-slate-400">No resumes uploaded yet.</p>
                      ) : (
                        candidateDetail.resumes.map((r) => (
                          <div key={r.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                {r.fileName}
                              </div>
                              <div className="text-xs text-slate-500 mt-1">
                                Role: {r.targetRole} &bull; Uploaded: {new Date(r.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <span className="text-lg font-black font-mono text-emerald-600">{r.score}/100</span>
                          </div>
                        ))
                      )}

                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-3">Job Description Matches</h4>
                      {candidateDetail.jdMatches.length === 0 ? (
                        <p className="text-xs text-slate-400">No JD match records submitted.</p>
                      ) : (
                        candidateDetail.jdMatches.map((j) => (
                          <div key={j.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">{j.jobTitle} ({j.companyName})</span>
                              <span className="font-mono font-bold text-indigo-600">Match: {j.matchScore}%</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {j.matchedSkills.map((s) => (
                                <span key={s} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'interviews' && candidateDetail && (
                    <div className="space-y-4">
                      {candidateDetail.interviews.length === 0 ? (
                        <p className="text-xs text-slate-400">No AI interview evaluations on record.</p>
                      ) : (
                        candidateDetail.interviews.map((i) => (
                          <div key={i.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-900 text-sm">{i.targetRole} ({i.interviewType})</span>
                                <div className="text-xs text-slate-400 font-mono mt-0.5">Session: {i.sessionId}</div>
                              </div>
                              <span className="text-xl font-black font-mono text-indigo-600">{i.overallScore}%</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                              <div className="p-2 bg-white rounded border border-slate-200">
                                <div className="text-slate-400 text-[10px]">Technical</div>
                                <div className="font-bold text-emerald-600">{i.technicalScore}%</div>
                              </div>
                              <div className="p-2 bg-white rounded border border-slate-200">
                                <div className="text-slate-400 text-[10px]">Communication</div>
                                <div className="font-bold text-blue-600">{i.communicationScore}%</div>
                              </div>
                              <div className="p-2 bg-white rounded border border-slate-200">
                                <div className="text-slate-400 text-[10px]">Problem Solving</div>
                                <div className="font-bold text-purple-600">{i.problemSolvingScore}%</div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {detailTab === 'github' && candidateDetail && (
                    <div className="space-y-4">
                      {candidateDetail.githubVerifications.length === 0 ? (
                        <p className="text-xs text-slate-400">No GitHub repositories submitted for verification.</p>
                      ) : (
                        candidateDetail.githubVerifications.map((g) => (
                          <div key={g.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <a
                                href={g.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
                              >
                                <GithubIcon className="w-4 h-4" />
                                {g.repoUrl}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <Badge variant={g.status === 'Verified' ? 'success' : 'warning'}>{g.status}</Badge>
                            </div>
                            <p className="text-xs text-slate-600">{g.relevanceAnalysis?.evidenceSummary}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
