import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../context/ToastContext';
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Lightbulb,
  FileCheck,
  TrendingUp
} from 'lucide-react';

export interface ResumeImprovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingKeywords: string[];
}

export const ResumeImprovementModal: React.FC<ResumeImprovementModalProps> = ({
  isOpen,
  onClose,
  missingKeywords
}) => {
  const { showToast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const sampleBulletRewrites = [
    {
      before: 'Worked on database queries for a college project.',
      after: 'Engineered optimized SQL queries with multi-table joins and window functions, reducing dataset query execution latency by 35% across 200k+ mock student records.',
      category: 'SQL & Database'
    },
    {
      before: 'Made some charts using Power BI.',
      after: 'Designed 4 interactive Power BI dashboards calculating custom DAX measures (YoY growth, customer churn), delivering actionable KPIs for academic performance tracking.',
      category: 'Power BI & Visualization'
    },
    {
      before: 'Used AWS for our web application.',
      after: 'Provisioned scalable AWS cloud architecture utilizing S3 static hosting, EC2 microservices, and IAM role-based access policies with 99.9% uptime.',
      category: 'AWS Cloud Infrastructure'
    }
  ];

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    showToast('Bullet point copied to clipboard!', 'success');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resume Improvement Guide"
      subtitle="AI-generated recommendations to elevate your ATS score from 82% to 95%+"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Quick Win Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">High-Impact Action Item</h4>
            <p className="text-xs text-indigo-900 leading-relaxed">
              Injecting your missing keywords (<strong className="text-indigo-700">{missingKeywords.join(', ')}</strong>) directly into your Project Experience bullet points gives the highest immediate ATS boost.
            </p>
          </div>
        </div>

        {/* Section 1: Measurable Impact Rewrites */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Before vs After: Action-Oriented Bullets
            </h4>
          </div>

          <div className="space-y-3">
            {sampleBulletRewrites.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{item.category}</span>
                  <button
                    onClick={() => handleCopy(item.after, idx)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Rewrite
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-2 text-rose-700 bg-rose-50/70 p-2 rounded-lg">
                    <span className="font-bold shrink-0">Weak:</span>
                    <span className="line-through opacity-80">{item.before}</span>
                  </div>
                  <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50/70 p-2 rounded-lg">
                    <span className="font-bold shrink-0">Strong:</span>
                    <span>{item.after}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Key Formatting Tips */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">ATS Formatting Checklist</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="p-2.5 rounded-lg bg-slate-50 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Use standard single-column PDF layout</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Avoid tables, columns, or graphic icons</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Spell out full technical skill names</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Include direct GitHub & LinkedIn URLs</span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button variant="primary" onClick={onClose}>
            Got it, Apply to My Resume
          </Button>
        </div>
      </div>
    </Modal>
  );
};
