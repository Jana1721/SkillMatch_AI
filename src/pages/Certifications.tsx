import React, { useState } from 'react';
import {
  Award,
  Clock,
  Sparkles,
  BookOpen,
  Plus,
  CheckCircle2,
  ExternalLink,
  Coins
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CertificationDetailsModal } from '../components/certifications/CertificationDetailsModal';
import { MOCK_CERTIFICATIONS } from '../data/certifications';
import { Certification, LearningPhase } from '../types';
import { StorageService } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export const Certifications: React.FC = () => {
  const { showToast } = useToast();
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('All');

  const filteredCerts = MOCK_CERTIFICATIONS.filter(cert => {
    if (filterDifficulty === 'All') return true;
    return cert.difficulty.toLowerCase() === filterDifficulty.toLowerCase();
  });

  const handleAddToPlan = (cert: Certification) => {
    const roadmap = StorageService.getLearningRoadmap();
    const existing = roadmap.find(p => p.title.toLowerCase().includes(cert.name.toLowerCase()));

    if (!existing) {
      const newPhase: LearningPhase = {
        id: 'phase-cert-' + Date.now(),
        phaseNumber: roadmap.length + 1,
        title: `Certification: ${cert.name}`,
        duration: cert.prepTime,
        description: `Targeted certification syllabus preparation for ${cert.provider} credentials.`,
        skills: cert.skillsCovered,
        status: 'not_started',
        progress: 0,
        tasks: [
          { id: `t1-${Date.now()}`, title: `Complete official ${cert.provider} study guide modules`, completed: false },
          { id: `t2-${Date.now()}`, title: `Build capstone project covering ${cert.skillsCovered.slice(0, 2).join(' & ')}`, completed: false },
          { id: `t3-${Date.now()}`, title: `Score 85%+ on two full-length practice exams`, completed: false }
        ],
        recommendedCourses: []
      };

      StorageService.setLearningRoadmap([...roadmap, newPhase]);
      showToast(`Added "${cert.name}" to your Learning Path!`, 'success');
    } else {
      showToast(`"${cert.name}" is already in your Learning Path.`, 'info');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Certifications That Matter For You
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Top global credentials calibrated to maximize your interview shortlist rate and starting compensation.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map(diff => (
            <button
              key={diff}
              onClick={() => setFilterDifficulty(diff)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterDifficulty === diff
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Certifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCerts.map(cert => (
          <Card key={cert.id} hoverable padding="lg" className="flex flex-col justify-between group">
            <div className="space-y-4">
              {/* Header with Provider & Relevance */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {cert.provider}
                    </span>
                    <h3
                      onClick={() => setSelectedCert(cert)}
                      className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug"
                    >
                      {cert.name}
                    </h3>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold rounded-xl">
                    <Sparkles className="w-3 h-3" />
                    {cert.relevanceScore}% Match
                  </span>
                </div>
              </div>

              {/* Why It Matters */}
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Why It Matters</h4>
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {cert.whyItMatters}
                </p>
              </div>

              {/* Metadata Badges */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prep: <strong>{cert.prepTime}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span className="truncate">Cost: <strong>{cert.examCost.split('(')[0]}</strong></span>
                </div>
              </div>

              {/* Skills Covered */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Skills Covered</h4>
                <div className="flex flex-wrap gap-1.5">
                  {cert.skillsCovered.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCert(cert)}
              >
                View Certification
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={<BookOpen className="w-3.5 h-3.5" />}
                onClick={() => handleAddToPlan(cert)}
              >
                Add to Learning Plan
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Details Modal */}
      <CertificationDetailsModal
        certification={selectedCert}
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
};
