import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Briefcase,
  Sparkles,
  MapPin,
  Building2,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { MOCK_JOBS } from '../data/jobs';
import { JobCard } from '../components/jobs/JobCard';
import { JobDetailsModal } from '../components/jobs/JobDetailsModal';
import { ApplicationModal } from '../components/jobs/ApplicationModal';
import { Job } from '../types';
import { calculateJobMatch } from '../utils/matching';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const JobMatch: React.FC = () => {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedWorkMode, setSelectedWorkMode] = useState('All');
  const [selectedExp, setSelectedExp] = useState('All');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);

  const [activeJobForDetails, setActiveJobForDetails] = useState<Job | null>(null);
  const [activeJobForApply, setActiveJobForApply] = useState<Job | null>(null);

  // Filter options
  const roleCategories = ['All', 'Data Analytics', 'ServiceNow', 'Cloud & DevOps', 'Software Engineering', 'Business Analysis', 'AI & ML'];
  const locations = ['All', 'Bengaluru', 'Hyderabad', 'Pune', 'Mumbai', 'Chennai'];
  const workModes = ['All', 'Remote', 'Hybrid', 'On-site'];
  const expLevels = ['All', 'Fresher', 'Entry-Level', '0-1 Years'];

  // Calculate matches and filter
  const filteredJobs = useMemo(() => {
    return MOCK_JOBS.map(job => {
      const match = calculateJobMatch(job, user);
      return { job, match };
    }).filter(({ job, match }) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.requiredSkills.some(s => s.name.toLowerCase().includes(q)) ||
          job.location.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Role Category
      if (selectedRole !== 'All' && job.roleCategory !== selectedRole) {
        return false;
      }

      // Location
      if (selectedLocation !== 'All' && !job.location.includes(selectedLocation)) {
        return false;
      }

      // Work Mode
      if (selectedWorkMode !== 'All' && job.workMode !== selectedWorkMode) {
        return false;
      }

      // Experience
      if (selectedExp !== 'All' && job.experienceLevel !== selectedExp) {
        return false;
      }

      // Match score filter
      if (minMatchScore > 0 && match.matchScore < minMatchScore) {
        return false;
      }

      return true;
    }).sort((a, b) => b.match.matchScore - a.match.matchScore);
  }, [user, searchQuery, selectedRole, selectedLocation, selectedWorkMode, selectedExp, minMatchScore]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRole('All');
    setSelectedLocation('All');
    setSelectedWorkMode('All');
    setSelectedExp('All');
    setMinMatchScore(0);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedRole !== 'All' ||
    selectedLocation !== 'All' ||
    selectedWorkMode !== 'All' ||
    selectedExp !== 'All' ||
    minMatchScore > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Jobs That Match Your Skills
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real openings ranked by AI compatibility score (Skills 60%, Experience 15%, Interests 15%, Education 10%).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            Showing <strong>{filteredJobs.length}</strong> of {MOCK_JOBS.length} Openings
          </span>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs by title, company, skill (e.g. SQL, ServiceNow, Python)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Role Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
            >
              {roleCategories.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
            >
              {locations.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Work Mode */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Work Mode</label>
            <select
              value={selectedWorkMode}
              onChange={e => setSelectedWorkMode(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
            >
              {workModes.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Experience</label>
            <select
              value={selectedExp}
              onChange={e => setSelectedExp(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
            >
              {expLevels.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Match Score */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Match Score</label>
            <select
              value={minMatchScore}
              onChange={e => setMinMatchScore(parseInt(e.target.value, 10))}
              className="w-full px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
            >
              <option value="0">All Match Scores</option>
              <option value="90">90%+ High Match</option>
              <option value="80">80%+ Good Match</option>
              <option value="70">70%+ Fair Match</option>
            </select>
          </div>
        </div>

        {/* Clear Filters CTA */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Filtered active criteria</span>
            <button
              onClick={clearFilters}
              className="font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No matching jobs found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Try resetting your filters or clearing search keywords to view other entry-level engineering roles.
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map(({ job }) => (
            <JobCard
              key={job.id}
              job={job}
              onViewDetails={(j) => setActiveJobForDetails(j)}
              onApply={(j) => setActiveJobForApply(j)}
            />
          ))}
        </div>
      )}

      {/* Reusable Modals */}
      <JobDetailsModal
        job={activeJobForDetails}
        isOpen={!!activeJobForDetails}
        onClose={() => setActiveJobForDetails(null)}
        onApply={(job) => {
          setActiveJobForDetails(null);
          setActiveJobForApply(job);
        }}
      />

      <ApplicationModal
        job={activeJobForApply}
        isOpen={!!activeJobForApply}
        onClose={() => setActiveJobForApply(null)}
      />
    </div>
  );
};
