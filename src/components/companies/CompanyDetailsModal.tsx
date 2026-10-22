import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Company } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StorageService } from '../../utils/storage';
import { useToast } from '../../context/ToastContext';
import {
  Building2,
  MapPin,
  Users,
  Star,
  Globe,
  CheckCircle2,
  Bookmark,
  Briefcase
} from 'lucide-react';

export interface CompanyDetailsModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  company,
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  if (!company) return null;

  const isSaved = StorageService.isCompanySaved(company.id);

  const handleToggleSave = () => {
    const saved = StorageService.toggleSaveCompany(company.id);
    showToast(saved ? `Saved ${company.name}` : `Removed ${company.name} from saved`, 'info');
  };

  const handleViewJobs = () => {
    onClose();
    navigate('/jobs');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company.name}
      subtitle={company.industry}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Top Header Card */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-700 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
            {company.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">{company.name}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {company.headquarters}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {company.size}
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {company.rating} Rating
              </span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">About Company</h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{company.about}</p>
        </div>

        {/* Tech Stack */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tech Stack & Tools</h4>
          <div className="flex flex-wrap gap-1.5">
            {company.techStack.map(tech => (
              <span
                key={tech}
                className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold rounded-lg"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Culture Highlights */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Culture & Values</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {company.cultureHighlights.map((cult, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{cult}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Perks & Benefits</h4>
          <div className="flex flex-wrap gap-1.5">
            {company.benefits.map((b, i) => (
              <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg">
                ✓ {b}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            icon={<Bookmark className={`w-4 h-4 ${isSaved ? 'fill-indigo-600 text-indigo-600' : ''}`} />}
            onClick={handleToggleSave}
          >
            {isSaved ? 'Saved' : 'Save Company'}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              icon={<Briefcase className="w-4 h-4" />}
              onClick={handleViewJobs}
            >
              View Open Jobs ({company.openRolesCount})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
