import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { SkillBadge } from '../components/common/SkillBadge';
import { ALL_SKILLS } from '../data/skills';
import { ProficiencyLevel, UserSkill } from '../types';
import { ApiService } from '../services/api';
import {
  User,
  School,
  Target,
  Heart,
  Briefcase,
  Save,
  Plus,
  Check,
  X,
  AlertCircle,
  Copy,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  RefreshCw,
  MailCheck
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, addSkill, removeSkill, updateSkillProficiency } = useAuth();
  const { showToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    bio: user.bio || '',
    college: user.college,
    degree: user.degree,
    department: user.department,
    cgpa: user.cgpa,
    graduationYear: user.graduationYear,
    targetRole: user.targetRole,
    preferredLocation: user.preferredLocation,
    workMode: user.workMode,
    expectedSalary: user.expectedSalary
  });

  const [selectedInterests, setSelectedInterests] = useState<string[]>(user.interests);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<ProficiencyLevel>('Intermediate');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Identity resubmission modal state
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitRoll, setResubmitRoll] = useState(user.rollNumber || '');
  const [resubmitDept, setResubmitDept] = useState(user.department || 'Computer Science & Engineering');
  const [isResubmitting, setIsResubmitting] = useState(false);

  const emailStatus = user.emailStatus || (user.emailVerified ? 'Verified' : 'Unverified');
  const collegeStatus = user.collegeIdentityStatus || 'Pending Verification';

  const handleResubmitIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitRoll.trim()) {
      showToast('College roll number is required', 'error');
      return;
    }
    setIsResubmitting(true);
    try {
      const res = await ApiService.resubmitIdentity({
        rollNumber: resubmitRoll.trim(),
        department: resubmitDept.trim(),
        name: formData.name,
        phone: formData.phone
      });
      showToast(res.message || 'Details resubmitted for verification!', 'success');
      updateProfile({
        rollNumber: resubmitRoll.trim(),
        department: resubmitDept.trim(),
        collegeIdentityStatus: res.collegeIdentityStatus || 'Pending Verification',
        collegeRejectedReason: undefined
      });
      setShowResubmitModal(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to resubmit details', 'error');
    } finally {
      setIsResubmitting(false);
    }
  };

  const availableInterests = [
    'Data Analytics',
    'AI/ML',
    'Cloud',
    'Cybersecurity',
    'Web Development',
    'ServiceNow',
    'DevOps',
    'Business Analysis'
  ];

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleAddSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    const skillDef = ALL_SKILLS.find(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase());
    addSkill({
      name: skillDef ? skillDef.name : newSkillName.trim(),
      proficiency: newSkillProficiency,
      category: skillDef ? (skillDef.category as any) : 'Tools'
    });

    showToast(`Added ${newSkillName.trim()} (${newSkillProficiency})`, 'success');
    setNewSkillName('');
    setIsAddingSkill(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...formData,
      interests: selectedInterests
    });
    showToast('Profile updated successfully! AI matching scores refreshed.', 'success');
  };

  const computeCandidateId = () => {
    if (user.credentialId && user.credentialId.startsWith('KCE-')) {
      return user.credentialId;
    }
    const roll = user.rollNumber || '2024CS01';
    const rollYearMatch = roll.match(/20\d{2}/);
    const year = rollYearMatch ? rollYearMatch[0] : (user.graduationYear || '2026');
    const sanitizedRoll = roll.toUpperCase().replace(/\s+/g, '');
    return `KCE-${year}-${sanitizedRoll}`;
  };

  const candidateId = computeCandidateId();

  const copyCandidateId = () => {
    navigator.clipboard.writeText(candidateId);
    showToast('Candidate ID copied to clipboard!', 'success');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal details, academic standings, skills, and target career preferences.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<Save className="w-4 h-4" />}
          onClick={handleSaveProfile}
        >
          Save Profile
        </Button>
      </div>

      {/* Candidate Credential ID Card (Format: KCE-<respective_year>-<respective_roll_number>) */}
      <Card padding="md" className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl shadow-xl border border-indigo-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Candidate Identity
              </span>
              {/* Email Status Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                emailStatus === 'Verified'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                <MailCheck className="w-3 h-3" />
                Email: {emailStatus}
              </span>
              {/* College Identity Status Badge */}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                collegeStatus === 'Verified'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : collegeStatus === 'Rejected'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                College Identity: {collegeStatus}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-400 tracking-wider">
                {candidateId}
              </span>
              <button
                type="button"
                onClick={copyCandidateId}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Copy Candidate ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              SkillMatch AI Permanent Login ID &bull; Roll Number: <span className="font-mono text-slate-200">{user.rollNumber || 'N/A'}</span>
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-col gap-2 text-xs">
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400">College: </span>
              <span className="font-bold text-white">{formData.college || 'Karpagam College of Engineering'}</span>
            </div>
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
              <span className="text-slate-400">Department: </span>
              <span className="font-bold text-white">{formData.department || 'Computer Science & Engineering'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* College Identity Status Notice Banner */}
      {collegeStatus === 'Rejected' && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">College Identity Verification Rejected</h3>
              <p className="text-xs text-rose-800 mt-1">
                An administrator reviewed your college credentials and rejected the identity check.
              </p>
              {user.collegeRejectedReason && (
                <div className="bg-white/80 border border-rose-200 rounded-xl p-3 mt-2 text-xs text-rose-950 font-medium">
                  <strong>Reason provided:</strong> {user.collegeRejectedReason}
                </div>
              )}
              {user.collegeReviewedBy && (
                <p className="text-[11px] text-rose-700 mt-1.5">
                  Reviewed by: {user.collegeReviewedBy}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResubmitRoll(user.rollNumber || '');
                setResubmitDept(user.department || '');
                setShowResubmitModal(true);
              }}
              className="text-xs font-bold border-rose-300 text-rose-800 hover:bg-rose-100"
            >
              Correct Details & Resubmit for Review
            </Button>
          </div>
        </div>
      )}

      {collegeStatus === 'Pending Verification' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold">College Identity Status: Pending Verification</p>
            <p className="text-amber-700 mt-0.5">
              Your college roll number ({user.rollNumber || 'Submitted'}) is pending verification against authorized institutional records or administrative approval.
            </p>
          </div>
        </div>
      )}

      {/* Resubmit Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Resubmit College Identity</h3>
              <button
                onClick={() => setShowResubmitModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Please double-check and correct your official college roll number and department as recorded in your college portal.
            </p>
            <form onSubmit={handleResubmitIdentity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  College Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resubmitRoll}
                  onChange={(e) => setResubmitRoll(e.target.value)}
                  placeholder="e.g. 717823P121"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Department
                </label>
                <input
                  type="text"
                  required
                  value={resubmitDept}
                  onChange={(e) => setResubmitDept(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResubmitModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isResubmitting || !resubmitRoll.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  {isResubmitting ? 'Submitting...' : 'Resubmit for Review'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Section 1: Personal Information */}
        <Card padding="lg">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              <p className="text-xs text-slate-500">Your core contact information shown on applications</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio / Profile Summary</label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none leading-relaxed"
                placeholder="Brief summary of your academic interests and career goals..."
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Academic Information */}
        <Card padding="lg">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <School className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Academic Information</h2>
              <p className="text-xs text-slate-500">Your university background, degree, and GPA benchmark</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">College / University</label>
              <input
                type="text"
                required
                value={formData.college}
                onChange={e => setFormData({ ...formData, college: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Degree</label>
              <input
                type="text"
                required
                value={formData.degree}
                onChange={e => setFormData({ ...formData, degree: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department / Branch</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CGPA (Out of 10.0)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={formData.cgpa}
                onChange={e => setFormData({ ...formData, cgpa: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Graduation Year</label>
              <input
                type="number"
                min="2024"
                max="2030"
                required
                value={formData.graduationYear}
                onChange={e => setFormData({ ...formData, graduationYear: parseInt(e.target.value, 10) || 2027 })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Skills Management */}
        <Card padding="lg">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Skills Management</h2>
                <p className="text-xs text-slate-500">Add, remove, or modify your verified technical proficiency</p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddingSkill(!isAddingSkill)}
            >
              {isAddingSkill ? 'Cancel' : 'Add Skill'}
            </Button>
          </div>

          {/* Add Skill Form Popover */}
          {isAddingSkill && (
            <div className="p-4 mb-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 animate-slide-up">
              <div className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-2">
                Add Technical Skill
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Skill Name</label>
                  <input
                    type="text"
                    list="skills-datalist"
                    placeholder="e.g. AWS, Power BI, Python..."
                    value={newSkillName}
                    onChange={e => setNewSkillName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                  />
                  <datalist id="skills-datalist">
                    {ALL_SKILLS.map(s => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Proficiency Level</label>
                  <select
                    value={newSkillProficiency}
                    onChange={e => setNewSkillProficiency(e.target.value as ProficiencyLevel)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none"
                  >
                    <option value="Beginner">Beginner (Foundational understanding)</option>
                    <option value="Intermediate">Intermediate (Project experience)</option>
                    <option value="Advanced">Advanced (Production & problem solving)</option>
                    <option value="Expert">Expert (Architecture & deep mastery)</option>
                  </select>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAddSkillSubmit}
                  disabled={!newSkillName.trim()}
                >
                  Confirm Add
                </Button>
              </div>
            </div>
          )}

          {/* Existing Skills List */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.skills.map(skill => (
                <div
                  key={skill.name}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-white hover:shadow-xs transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{skill.name}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{skill.category || 'Technical'}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={skill.proficiency}
                      onChange={e => updateSkillProficiency(skill.name, e.target.value as ProficiencyLevel)}
                      className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        removeSkill(skill.name);
                        showToast(`Removed ${skill.name}`, 'info');
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                      aria-label="Remove skill"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Section 4: Interests & Career Preferences */}
        <Card padding="lg">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Career Preferences & Interests</h2>
              <p className="text-xs text-slate-500">Calibrates role recommendations and expected salary benchmarking</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Interests Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Domains of Interest</label>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map(interest => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestToggle(interest)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 inline mr-1 text-indigo-600" />}
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Career Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Role</label>
                <select
                  value={formData.targetRole}
                  onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="ServiceNow Developer">ServiceNow Developer</option>
                  <option value="Business Analyst">Business Analyst</option>
                  <option value="Cloud & DevOps Engineer">Cloud & DevOps Engineer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="AI / ML Engineer">AI / ML Engineer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Location</label>
                <select
                  value={formData.preferredLocation}
                  onChange={e => setFormData({ ...formData, preferredLocation: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Pune">Pune</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Work Mode</label>
                <select
                  value={formData.workMode}
                  onChange={e => setFormData({ ...formData, workMode: e.target.value as any })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                >
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Any">Any / Flexible</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expected Salary</label>
                <input
                  type="text"
                  value={formData.expectedSalary}
                  onChange={e => setFormData({ ...formData, expectedSalary: e.target.value })}
                  placeholder="e.g. ₹6–10 LPA"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={<Save className="w-4 h-4" />}
          >
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
