import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Mail,
  RefreshCw,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, verifyEmail, resendVerification } = useAuth();
  const { showToast } = useToast();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || user?.email || '';

  const [tokenInput, setTokenInput] = useState(tokenParam);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
    tokenParam ? 'verifying' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Cooldown countdown for resending (60 seconds)
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState(false);

  // 15-minute expiration timer
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  useEffect(() => {
    if (tokenParam) {
      executeVerification(tokenParam);
    }
  }, [tokenParam]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const cdTimer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(cdTimer);
    }
  }, [resendCooldown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const [dispatchedCode, setDispatchedCode] = useState<string>('');

  const executeVerification = async (codeToVerify: string) => {
    setStatus('verifying');
    setErrorMessage('');
    try {
      await verifyEmail(codeToVerify, user?.credentialId || emailParam);
      setStatus('success');
      showToast('Email verified successfully! Your account is active.', 'success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Verification failed. The code may be incorrect or expired.');
      // Extract remaining attempts if present
      const match = err.message?.match(/(\d+)\s+attempt/i);
      if (match) {
        setRemainingAttempts(parseInt(match[1], 10));
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || tokenInput.trim().length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }
    executeVerification(tokenInput.trim());
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setErrorMessage('');
    try {
      const res = await resendVerification(user?.credentialId || emailParam);
      if (res.verificationCode) {
        setDispatchedCode(res.verificationCode);
        setTokenInput(res.verificationCode);
      }
      showToast(res.message || 'A fresh 6-digit verification code was dispatched!', 'success');
      setResendCooldown(60);
      setTimeLeft(15 * 60);
      setRemainingAttempts(5);
    } catch (err: any) {
      showToast(err.message || 'Failed to resend code', 'error');
      setErrorMessage(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">
              SkillMatch<span className="text-emerald-400 font-black">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">Email Verification</h1>
          <p className="text-xs text-slate-400">Activate your student career account</p>
        </div>

        <Card className="p-6 sm:p-8 bg-white shadow-2xl rounded-2xl border-slate-100 space-y-6">
          {status === 'verifying' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Verifying your 6-digit authorization code...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Account Fully Activated!</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Your email <strong className="text-slate-900">{emailParam}</strong> is verified. AI Voice Interviews, Resume ATS Scoring, and GitHub Project Verification are now fully unlocked.
              </p>

              {user?.credentialId && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Your Permanent Login ID</span>
                  <div className="font-mono text-xl font-black text-emerald-700 tracking-wider mt-0.5">
                    {user.credentialId}
                  </div>
                </div>
              )}

              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
              >
                <span>Go to Student Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {(status === 'idle' || status === 'error') && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Enter Verification Code</h3>
                <p className="text-xs text-slate-500">
                  We sent a 6-digit OTP code to{' '}
                  <strong className="text-slate-700">{emailParam || 'your registered student email'}</strong>.
                </p>
              </div>

              {/* Code Expiry & Timer */}
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Code Expires In:
                </span>
                <span className={`font-mono font-bold ${timeLeft < 180 ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}>
                  {formatTimer(timeLeft)}
                </span>
              </div>

              {dispatchedCode && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Dispatched Verification Code
                  </span>
                  <div className="font-mono text-2xl font-black text-emerald-900 tracking-widest mt-0.5">
                    {dispatchedCode}
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Code has been auto-filled for immediate activation!
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold space-y-1">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                  {remainingAttempts !== null && remainingAttempts <= 3 && (
                    <p className="text-[11px] text-rose-600 font-bold">
                      Warning: After 5 incorrect attempts, you will need to request a new code.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 text-center">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono text-2xl font-black tracking-[0.4em] outline-none focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100 transition"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={tokenInput.length !== 6}
                className="w-full py-3.5 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Verify & Activate Account
              </Button>

              {/* Resend Action */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending || resendCooldown > 0}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : 'Did not receive code? Resend OTP'}
                </button>
              </div>

              <div className="text-center pt-2 border-t border-slate-100">
                <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 underline">
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
