import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Building2,
  MapPin,
  IndianRupee,
  Trash2,
  Sparkles,
  ArrowRight,
  Briefcase
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { JobDetailsModal } from '../components/jobs/JobDetailsModal';
import { ApplicationModal } from '../components/jobs/ApplicationModal';
import { MOCK_JOBS } from '../data/jobs';
import { StorageService } from '../utils/storage';
import { calculateJobMatch } from '../utils/matching';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Job } from '../types';

export const SavedJobs: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => StorageService.getSavedJobs());
  const [activeJobForDetails, setActiveJobForDetails] = useState<Job | null>(null);
  const [activeJobForApply, setActiveJobForApply] = useState<Job | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setSavedJobIds(StorageService.getSavedJobs());
    };
    window.addEventListener('skillmatch-storage-change', handleStorageChange);
    return () => window.removeEventListener('skillmatch-storage-change', handleStorageChange);
  }, []);

  const savedJobs = MOCK_JOBS.filter(job => savedJobIds.includes(job.id));

  const handleRemove = (job: Job) => {
    StorageService.toggleSaveJob(job.id);
    showToast(`Removed "${job.title}" from saved jobs`, 'info');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Saved Jobs</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track and apply to your bookmarked engineering opportunities.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/jobs')}
          icon={<Briefcase className="w-4 h-4" />}
        >
          Explore More Jobs
        </Button>
      </div>

      {/* Empty State vs List */}
      {savedJobs.length === 0 ? (
        <Card padding="lg" className="text-center py-16 space-y-4 border-dashed border-2">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">You haven't saved any jobs yet.</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Save promising positions from the Job Match page to track requirements, compare compensation, and apply when ready.
            </p>
          </div>
          <Button
            variant="primary"
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
            onClick={() => navigate('/jobs')}
          >
            Explore Jobs
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedJobs.map(job => {
            const match = calculateJobMatch(job, user);

            return (
              <Card key={job.id} hoverable padding="md" className="flex flex-col justify-between group">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3
                        onClick={() => setActiveJobForDetails(job)}
                        className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer truncate"
                      >
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {job.company}
                        </span>
                        <span>•</span>
                        <span>{job.location}</span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-lg shrink-0">
                      <Sparkles className="w-3 h-3" />
                      {match.matchScore}%
                    </span>
                  </div>

                  {/* Salary & Meta */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-bold">
                      <IndianRupee className="w-3 h-3" />
                      {job.salaryRange}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {job.workMode}
                    </span>
                  </div>

                  {/* Required Skills Badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {job.requiredSkills.map(s => (
                      <span
                        key={s.name}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          match.matchingSkills.includes(s.name)
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleRemove(job)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveJobForDetails(job)}
                    >
                      View
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveJobForApply(job)}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
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
