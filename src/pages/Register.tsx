import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, Check, User, Mail, Lock, School, GraduationCap, Briefcase, Plus, X, ArrowRight, ShieldCheck, MailCheck, Copy } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';
import { UserSkill } from '../types';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [targetRole, setTargetRole] = useState('Java Developer');
  const [college, setCollege] = useState('');
  const [degree, setDegree] = useState('B.Tech');
  const [graduationYear, setGraduationYear] = useState('2027');

  // Selected Skills
  const [selectedSkills, setSelectedSkills] = useState<UserSkill[]>([
    { name: 'Python', proficiency: 'Advanced', category: 'Programming' },
    { name: 'SQL', proficiency: 'Intermediate', category: 'Database' }
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Selected Interests
  const availableInterests = ['Data Analytics', 'AI/ML', 'Cloud', 'Cybersecurity', 'Web Development', 'ServiceNow', 'DevOps', 'Business Analysis'];
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Data Analytics', 'Cloud']);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ credentialId: string; email: string; emailPreview?: string } | null>(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const availableRoles = [
    'Java Developer',
    'Software Developer / SDE',
    'ServiceNow Developer',
    'Full Stack Developer',
    'Cloud & DevOps Engineer',
    'Data Analyst'
  ];

  const availableSkillPills = ['Java', 'Python', 'SQL', 'React', 'Node.js', 'Spring Boot', 'AWS', 'Docker', 'Git', 'Data Structures'];

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const addSkillPill = (skillName: string) => {
    if (!selectedSkills.some(s => s.name.toLowerCase() === skillName.toLowerCase())) {
      setSelectedSkills([...selectedSkills, { name: skillName, proficiency: 'Intermediate' }]);
    }
  };

  const removeSkillPill = (skillName: string) => {
    setSelectedSkills(selectedSkills.filter(s => s.name !== skillName));
  };

  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkillInput.trim() && !selectedSkills.some(s => s.name.toLowerCase() === customSkillInput.trim().toLowerCase())) {
      setSelectedSkills([...selectedSkills, { name: customSkillInput.trim(), proficiency: 'Intermediate' }]);
      setCustomSkillInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!email.trim()) newErrors.email = 'Personal email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address.';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== passwordConfirm) newErrors.passwordConfirm = 'Passwords do not match.';
    if (!college.trim()) newErrors.college = 'College/University is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await register({
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        passwordConfirm,
        college: college.trim(),
        degree,
        targetRole
      });

      showToast('Registration successful! Verification email dispatched.', 'success');
      setSuccessData({
        credentialId: res.user?.credentialId || 'SKM-2026-ACTIVE',
        email: email.trim().toLowerCase(),
        emailPreview: res.emailPreview
      });
    } catch (err: any) {
      setErrors({ form: err.message || 'Registration failed. Please try again.' });
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickVerify = async () => {
    if (!verificationInput.trim()) {
      showToast('Please enter the 6-digit code received in your email', 'error');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await ApiService.verifyEmail(successData?.email, verificationInput.trim());
      showToast(res.message || 'Email verified successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Verification failed. Check the code.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex items-center justify-center selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-slate-900 tracking-tight">
              SkillMatch<span className="text-indigo-600 font-black">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Candidate Registration</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create your individual profile, generate your unique credential ID, and activate voice interview preparation.
          </p>
        </div>

        {/* Success Modal / Banner */}
        {successData ? (
          <Card className="p-8 border-2 border-emerald-500 bg-white shadow-xl rounded-2xl space-y-6 animate-in fade-in">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Account Created Successfully!</h2>
              <p className="text-sm text-slate-600">
                A confirmation message has been dispatched to your personal email address:{' '}
                <strong className="text-slate-900">{successData.email}</strong>
              </p>
            </div>

            {/* Credential ID Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Your Permanent Credential ID</span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-2xl font-black text-emerald-700 tracking-widest">{successData.credentialId}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(successData.credentialId);
                    showToast('Credential ID copied to clipboard!', 'info');
                  }}
                  className="p-1.5 hover:bg-emerald-200 rounded-lg text-emerald-700 transition-colors"
                  title="Copy Credential ID"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-emerald-600">This permanent ID is required for all official interview scorecards and reports.</p>
            </div>

            {/* Email Verification Box */}
            <div className="border border-slate-200 bg-slate-50 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <MailCheck className="w-4 h-4 text-indigo-600" />
                <span>Verify Your Personal Email Address</span>
              </div>
              <p className="text-xs text-slate-500">
                Enter the 6-digit verification code sent to your inbox to instantly activate all voice interview and resume features.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="px-4 py-2.5 font-mono text-center tracking-widest text-lg font-bold border border-slate-300 rounded-xl bg-white w-48 focus:border-indigo-600 outline-none"
                />
                <Button onClick={handleQuickVerify} disabled={isVerifying} className="flex-1 py-2.5">
                  {isVerifying ? 'Verifying...' : 'Verify Now'}
                </Button>
              </div>

              {successData.emailPreview && (
                <div className="pt-2 text-center">
                  <a
                    href={successData.emailPreview}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline font-semibold"
                  >
                    ↗ View Ethereal Email Dispatch Preview
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Skip for now & go to Dashboard →
              </button>
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="text-xs">
                Enter Platform
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 sm:p-8 bg-white shadow-xl shadow-slate-200/50 border-slate-200/80 rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.form && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {errors.form}
                </div>
              )}

              {/* Basic Candidate Info */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">1. Personal & Contact Credentials</h2>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Personal Email Address <span className="text-indigo-600">(Verification link & reports sent here)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. candidate@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      />
                    </div>
                    {errors.password && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      />
                    </div>
                    {errors.passwordConfirm && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.passwordConfirm}</p>}
                  </div>
                </div>
              </div>

              {/* Academic & Target Career */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">2. Academic Background & Target Role</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Engineering Role</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 outline-none"
                      >
                        {availableRoles.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Degree</label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 outline-none"
                      >
                        <option value="B.Tech Computer Science">B.Tech Computer Science</option>
                        <option value="B.Tech Information Technology">B.Tech Information Technology</option>
                        <option value="BCA / MCA">BCA / MCA</option>
                        <option value="B.Sc Computer Science">B.Sc Computer Science</option>
                        <option value="Other Engineering">Other Engineering</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">College / University</label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="e.g. National Institute of Technology"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                    />
                  </div>
                  {errors.college && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.college}</p>}
                </div>
              </div>

              {/* Skills Tags */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">3. Select Initial Technical Skills</h2>

                <div className="flex flex-wrap gap-2">
                  {availableSkillPills.map((s) => {
                    const isSelected = selectedSkills.some((sk) => sk.name.toLowerCase() === s.toLowerCase());
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => (isSelected ? removeSkillPill(s) : addSkillPill(s))}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button type="submit" disabled={loading} className="w-full py-3.5 text-base font-bold flex items-center justify-center gap-2">
                  {loading ? (
                    'Creating Account & Generating Credential ID...'
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-slate-400 mt-3">
                  By registering, your account will receive a permanent SkillMatch AI Credential ID.
                </p>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Already registered?{' '}
                  <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700">
                    Sign in to your account
                  </Link>
                </p>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};
