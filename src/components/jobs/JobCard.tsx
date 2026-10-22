import React from 'react';
import { Job } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { SkillBadge } from '../common/SkillBadge';
import { calculateJobMatch } from '../../utils/matching';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../utils/storage';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  MapPin,
  IndianRupee,
  Bookmark,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export interface JobCardProps {
  job: Job;
  onViewDetails: (job: Job) => void;
  onApply: (job: Job) => void;
  onSaveToggle?: (job: Job, saved: boolean) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onViewDetails,
  onApply,
  onSaveToggle
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const match = calculateJobMatch(job, user);
  const isSaved = StorageService.isJobSaved(job.id);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    const saved = StorageService.toggleSaveJob(job.id);
    showToast(saved ? `Saved ${job.title}` : `Removed ${job.title} from saved`, 'info');
    if (onSaveToggle) {
      onSaveToggle(job, saved);
    }
  };

  // Color logic for match score
  let matchBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (match.matchScore < 70) {
    matchBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (match.matchScore >= 90) {
    matchBadgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  return (
    <Card hoverable className="flex flex-col justify-between transition-all group" padding="md">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="space-y-0.5 min-w-0">
            <h3
              onClick={() => onViewDetails(job)}
              className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer truncate"
            >
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {job.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {job.location} ({job.workMode})
              </span>
            </div>
          </div>

          {/* Match Score Badge & Save Button */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-xl border ${matchBadgeColor}`}
            >
              <Sparkles className="w-3 h-3" />
              {match.matchScore}% Match
            </span>
            <button
              type="button"
              onClick={handleToggleSave}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label={isSaved ? 'Remove from saved' : 'Save job'}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600 text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Salary and Experience pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold">
            <IndianRupee className="w-3 h-3" />
            {job.salaryRange}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
            {job.experienceLevel}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
            {job.roleCategory}
          </span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {job.description}
        </p>

        {/* Skills match section */}
        <div className="space-y-2 border-t border-slate-100 pt-3 mb-4">
          {/* Matching Skills */}
          {match.matchingSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-700 mr-1">Matches:</span>
              {match.matchingSkills.slice(0, 4).map(skill => (
                <SkillBadge key={skill} name={skill} variant="matched" size="sm" />
              ))}
              {match.matchingSkills.length > 4 && (
                <span className="text-[10px] text-slate-400 font-bold">+{match.matchingSkills.length - 4} more</span>
              )}
            </div>
          )}

          {/* Missing Skills */}
          {match.missingSkills.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-rose-700 mr-1">Missing:</span>
              {match.missingSkills.slice(0, 3).map(skill => (
                <SkillBadge key={skill} name={skill} variant="missing" size="sm" />
              ))}
              {match.missingSkills.length > 3 && (
                <span className="text-[10px] text-slate-400 font-bold">+{match.missingSkills.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(job)}
        >
          View Details
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onApply(job)}
        >
          Apply
        </Button>
      </div>
    </Card>
  );
};
