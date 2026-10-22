import React, { useState } from 'react';
import { Job, JobApplication } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StorageService } from '../../utils/storage';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

export interface ApplicationModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  job,
  isOpen,
  onClose,
  onSubmitted
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [resumeFileName, setResumeFileName] = useState('Alex_Kumar_Resume_2026.pdf');
  const [coverLetter, setCoverLetter] = useState(
    `Dear Hiring Team at ${job?.company || 'the company'},\n\nI am enthusiastic to apply for the ${job?.title || 'position'}. With my hands-on background in ${user.skills.slice(0, 3).map(s => s.name).join(', ')} and my academic training at ${user.college}, I look forward to contributing high value to your team.`
  );
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Synchronize when job changes
  React.useEffect(() => {
    if (job) {
      setFullName(user.name);
      setEmail(user.email);
      setIsSuccess(false);
      setCoverLetter(
        `Dear Hiring Team at ${job.company},\n\nI am enthusiastic to apply for the ${job.title} position. With my background in ${user.skills.slice(0, 3).map(s => s.name).join(', ')} and my coursework at ${user.college}, I look forward to contributing high value to your team.`
      );
    }
  }, [job, user]);

  if (!job) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      const application: JobApplication = {
        id: 'app-' + Date.now(),
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        applicantName: fullName,
        applicantEmail: email,
        resumeName: resumeFileName,
        coverLetter,
        appliedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Submitted'
      };

      StorageService.addApplication(application);
      setSubmitting(false);
      setIsSuccess(true);
      showToast(`Application submitted successfully for ${job.title}!`, 'success');

      if (onSubmitted) {
        onSubmitted();
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    }, 600);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply to ${job.title}`}
      subtitle={`${job.company} • ${job.location}`}
      maxWidth="lg"
    >
      {isSuccess ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-xl font-bold text-slate-900">Application Submitted!</h4>
          <p className="text-sm text-slate-600 max-w-sm mx-auto">
            Your application for <strong>{job.title}</strong> has been transmitted to {job.company}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Resume File</label>
            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50">
              <UploadCloud className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs font-semibold text-slate-800">{resumeFileName}</p>
              <p className="text-[11px] text-slate-400">PDF, DOC, DOCX up to 5MB (Attached from profile)</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                id="resume-file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setResumeFileName(e.target.files[0].name);
                  }
                }}
              />
              <label
                htmlFor="resume-file-input"
                className="mt-2 inline-block text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                Choose different file
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cover Note / Remarks</label>
            <textarea
              rows={4}
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit Application
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
