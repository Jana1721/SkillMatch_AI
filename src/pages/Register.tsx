import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Check,
  User,
  Mail,
  Lock,
  School,
  GraduationCap,
  Phone,
  Hash,
  Building2,
  ArrowRight,
  ShieldCheck,
  MailCheck,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [college, setCollege] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [degree, setDegree] = useState('B.Tech / B.E.');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    loginId: string;
    credentialId: string;
    email: string;
    rollNumber: string;
    verificationCode?: string;
    emailPreview?: string;
  } | null>(null);

  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');

  const departmentsList = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Artificial Intelligence & Data Science',
    'MCA / BCA',
    'Other Engineering'
  ];

  const yearsOfStudyList = [
    '1st Year',
    '2nd Year',
    '3rd Year',
    '4th Year'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!rollNumber.trim()) newErrors.rollNumber = 'College roll number is required.';
    if (!email.trim()) newErrors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Enter a valid student email address.';
    if (!phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!department) newErrors.department = 'Department is required.';
    if (!college.trim()) newErrors.college = 'College name is required.';
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
    if (password !== passwordConfirm) newErrors.passwordConfirm = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await register({
        name: fullName.trim(),
        rollNumber: rollNumber.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        department,
        college: college.trim(),
        degree,
        yearOfStudy,
        password,
        confirmPassword: passwordConfirm
      });

      const generatedId = res.loginId || res.credentialId;
      setSuccessData({
        loginId: generatedId,
        credentialId: generatedId,
        email: email.trim().toLowerCase(),
        rollNumber: rollNumber.trim(),
        verificationCode: res.verificationCode,
        emailPreview: res.emailPreview
      });
      if (res.verificationCode) {
        setVerificationCode(res.verificationCode);
      }
      showToast(`Account created! Your unique Login ID is ${generatedId}`, 'success');
    } catch (err: any) {
      setErrors({ form: err.message || 'Registration failed. Please try again.' });
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      showToast('Please enter the 6-digit code received in your email', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await ApiService.verifyEmail(
        verificationCode.trim(),
        successData?.loginId,
        successData?.email
      );
      if (res.success) {
        showToast('Email verified successfully! Welcome to SkillMatch AI.', 'success');
        setVerifyMessage('Email verified! Redirecting to Dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      }
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyLoginId = () => {
    if (successData?.loginId) {
      navigator.clipboard.writeText(successData.loginId);
      showToast('Login ID copied to clipboard!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Verified Career Readiness Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Student Registration
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Create your individual SkillMatch AI student account & receive your unique Login ID
          </p>
        </div>

        {/* Success Card with Login ID */}
        {successData ? (
          <Card className="p-8 bg-white shadow-2xl rounded-2xl border-emerald-500/30">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <MailCheck className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Registration Successful!</h2>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Your student account has been created. A 6-digit OTP verification code has been dispatched to{' '}
                <strong className="text-slate-900">{successData.email}</strong>.
              </p>

              {/* Login ID Box */}
              <div className="bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-xl p-5 my-4">
                <span className="text-xs uppercase font-bold tracking-wider text-emerald-800">
                  Your Permanent SkillMatch AI Login ID
                </span>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <span className="font-mono text-2xl font-black text-emerald-700 tracking-wider">
                    {successData.loginId}
                  </span>
                  <button
                    onClick={copyLoginId}
                    className="p-2 rounded-lg bg-emerald-200/60 hover:bg-emerald-200 text-emerald-800 transition"
                    title="Copy Login ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-emerald-700 mt-2">
                  Keep this Login ID safe. You can log in using either this Login ID or your email address.
                </p>
              </div>

              {/* OTP Code Display Banner */}
              {successData.verificationCode && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 my-3 text-center">
                  <span className="text-[11px] uppercase font-bold text-amber-800 tracking-wider">
                    Official Email Verification OTP Code
                  </span>
                  <div className="font-mono text-2xl font-black text-amber-900 tracking-[0.25em] mt-1">
                    {successData.verificationCode}
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Dispatched to your student Gmail (<strong className="text-amber-900">{successData.email}</strong>). Enter code below to activate.
                  </p>
                </div>
              )}

              {/* In-app preview for dev */}
              {successData.emailPreview && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5">
                  <span>Development Mailer Preview:</span>
                  <a
                    href={successData.emailPreview}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    View Dispatched Email <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* OTP Input Form */}
              <form onSubmit={handleVerifyOtp} className="pt-4 border-t border-slate-100 space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Enter 6-Digit Email Verification Code
                </label>
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder=""
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono font-bold py-3 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none"
                  />
                </div>

                {verifyMessage && (
                  <p className="text-xs font-bold text-emerald-600">{verifyMessage}</p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    type="submit"
                    disabled={isVerifying || verificationCode.length !== 6}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify Email & Activate'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/verify-email')}
                    className="py-3 px-6"
                  >
                    Go to Verification Screen
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        ) : (
          /* Registration Form */
          <Card className="p-6 sm:p-8 bg-white shadow-2xl rounded-2xl border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.form && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {errors.form}
                </div>
              )}

              {/* Section 1: Candidate Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Candidate & College Identity</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder=""
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                    {errors.fullName && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      College Roll Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder=""
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                    {errors.rollNumber && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.rollNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Student Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=""
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder=""
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.phone}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Department / Specialization <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 outline-none transition"
                    >
                      {departmentsList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Account Security */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Account Security Password</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder=""
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                    {errors.password && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        placeholder=""
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                    {errors.passwordConfirm && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.passwordConfirm}</p>}
                  </div>
                </div>
              </div>

              {/* Section 3: College Details (Removed Target Role) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">3</span>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">College Details</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      College Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                        placeholder=""
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition"
                      />
                    </div>
                    {errors.college && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.college}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Year of Studying <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 outline-none transition"
                      >
                        {yearsOfStudyList.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    'Creating Student Account & Generating Login ID...'
                  ) : (
                    <>
                      <span>Complete Registration & Generate Login ID</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-slate-500 mt-3">
                  Every account receives a permanent Candidate ID (<span className="font-mono text-indigo-600 font-semibold">KCE-&lt;year&gt;-&lt;rollNumber&gt;</span>).
                </p>
              </div>

              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Already registered?{' '}
                  <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 underline">
                    Log in with Login ID or Email
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
