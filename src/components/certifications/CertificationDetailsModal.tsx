import React from 'react';
import { Certification, LearningPhase } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StorageService } from '../../utils/storage';
import { useToast } from '../../context/ToastContext';
import {
  Award,
  Clock,
  Coins,
  CheckCircle2,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export interface CertificationDetailsModalProps {
  certification: Certification | null;
  isOpen: boolean;
  onClose: () => void;
  onAddedToPlan?: () => void;
}

export const CertificationDetailsModal: React.FC<CertificationDetailsModalProps> = ({
  certification,
  isOpen,
  onClose,
  onAddedToPlan
}) => {
  const { showToast } = useToast();

  if (!certification) return null;

  const handleAddToLearningPlan = () => {
    const roadmap = StorageService.getLearningRoadmap();
    const existing = roadmap.find(p => p.title.toLowerCase().includes(certification.name.toLowerCase()));

    if (!existing) {
      const newPhase: LearningPhase = {
        id: 'phase-cert-' + Date.now(),
        phaseNumber: roadmap.length + 1,
        title: `Certification: ${certification.name}`,
        duration: certification.prepTime,
        description: `Targeted certification syllabus preparation for ${certification.provider} credentials.`,
        skills: certification.skillsCovered,
        status: 'not_started',
        progress: 0,
        tasks: [
          { id: `t1-${Date.now()}`, title: `Complete official ${certification.provider} study guide modules`, completed: false },
          { id: `t2-${Date.now()}`, title: `Build capstone project covering ${certification.skillsCovered.slice(0, 2).join(' & ')}`, completed: false },
          { id: `t3-${Date.now()}`, title: `Score 85%+ on two full-length practice exams`, completed: false }
        ],
        recommendedCourses: []
      };

      StorageService.setLearningRoadmap([...roadmap, newPhase]);
      showToast(`Added "${certification.name}" to your Learning Path!`, 'success');
      if (onAddedToPlan) onAddedToPlan();
    } else {
      showToast(`"${certification.name}" is already in your Learning Path.`, 'info');
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={certification.name}
      subtitle={`Offered by ${certification.provider}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Banner with Relevance */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Student Profile Match</p>
              <h4 className="text-base font-extrabold text-slate-900">{certification.relevanceScore}% Career Relevance</h4>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-indigo-700 shadow-xs">
            {certification.difficulty}
          </span>
        </div>

        {/* Why it matters */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Why It Matters</h4>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{certification.whyItMatters}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Prep Duration
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">{certification.prepTime}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
              <Coins className="w-3.5 h-3.5 text-amber-500" /> Exam Cost
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">{certification.examCost}</p>
          </div>
        </div>

        {/* Skills Covered */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Skills Validated</h4>
          <div className="flex flex-wrap gap-1.5">
            {certification.skillsCovered.map(skill => (
              <span
                key={skill}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Target Roles */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Relevant Career Paths</h4>
          <div className="flex flex-wrap gap-1.5">
            {certification.targetRoles.map(role => (
              <span key={role} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            icon={<BookOpen className="w-4 h-4" />}
            onClick={handleAddToLearningPlan}
          >
            Add to Learning Plan
          </Button>
        </div>
      </div>
    </Modal>
  );
};
