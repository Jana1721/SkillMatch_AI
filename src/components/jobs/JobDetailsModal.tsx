import React from 'react';
import { Job } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { SkillBadge } from '../common/SkillBadge';
import { useAuth } from '../../context/AuthContext';
import { calculateJobMatch } from '../../utils/matching';
import { StorageService } from '../../utils/storage';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  MapPin,
  IndianRupee,
  Briefcase,
  Clock,
  Bookmark,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: Job) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  onApply
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  if (!job) return null;

  const match = calculateJobMatch(job, user);
  const isSaved = StorageService.isJobSaved(job.id);

  const handleToggleSave = () => {
    const saved = StorageService.toggleSaveJob(job.id);
    showToast(saved ? `Saved ${job.title}` : `Removed ${job.title} from saved`, 'info');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={job.title}
      subtitle={`${job.company} • ${job.location}`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Header Metadata Chips */}
        <div className="flex flex-wrap gap-2.5 pb-4 border-b border-slate-100">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg">
            <Building2 className="w-3.5 h-3.5" />
            {job.company}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            {job.location} ({job.workMode})
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            {job.salaryRange}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg">
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            {job.experienceLevel}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg ml-auto">
            {match.matchScore}% Match
          </span>
        </div>

        {/* AI Match Overview Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border border-indigo-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">AI Matching Analysis</h4>
            <p className="text-xs text-indigo-800 mt-0.5">
              You match <strong>{match.matchingSkills.length}</strong> of {job.requiredSkills.length} core technical requirements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-indigo-600">{match.matchScore}%</span>
            <span className="text-[11px] text-slate-500 font-semibold leading-tight">Career<br/>Readiness</span>
          </div>
        </div>

        {/* Skills Compatibility Section */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Skills Compatibility</h4>
          <div className="space-y-2">
            {/* Matching */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-emerald-700 mr-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Your Skills:
              </span>
              {match.matchingSkills.length > 0 ? (
                match.matchingSkills.map(skill => (
                  <SkillBadge key={skill} name={skill} variant="matched" size="sm" />
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">None yet</span>
              )}
            </div>

            {/* Missing */}
            {match.missingSkills.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-semibold text-rose-700 mr-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Missing:
                </span>
                {match.missingSkills.map(skill => (
                  <SkillBadge key={skill} name={skill} variant="missing" size="sm" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* About the Role */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Role Overview</h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{job.description}</p>
        </div>

        {/* Responsibilities */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Responsibilities</h4>
          <ul className="space-y-1.5">
            {job.responsibilities.map((resp, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Requirements</h4>
          <ul className="space-y-1.5">
            {job.requirements.map((req, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-600 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                <span>{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Perks & Benefits</h4>
          <div className="flex flex-wrap gap-2">
            {job.benefits.map((benefit, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                ✓ {benefit}
              </span>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            icon={<Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600 text-indigo-600' : ''}`} />}
            onClick={handleToggleSave}
          >
            {isSaved ? 'Saved' : 'Save Job'}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onApply(job);
              }}
            >
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
