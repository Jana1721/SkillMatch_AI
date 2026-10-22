import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ApiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, verifyEmail } = useAuth();
  const { showToast } = useToast();

  const tokenParam = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || user?.email || '';

  const [tokenInput, setTokenInput] = useState(tokenParam);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
    tokenParam ? 'verifying' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (tokenParam) {
      executeVerification(tokenParam);
    }
  }, [tokenParam]);

  const executeVerification = async (codeToVerify: string) => {
    setStatus('verifying');
    setErrorMessage('');
    try {
      await verifyEmail(codeToVerify);
      setStatus('success');
      showToast('Email verified successfully!', 'success');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Verification failed. The token may be expired.');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    executeVerification(tokenInput.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Verification</h1>
          <p className="text-xs text-slate-500">Confirm your personal email address</p>
        </div>

        <Card className="p-6 sm:p-8 bg-white shadow-xl shadow-slate-200/50 border-slate-200/80 rounded-2xl space-y-6">
          {status === 'verifying' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Verifying your candidate credentials...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Email Verified Successfully!</h2>
              <p className="text-xs text-slate-600">
                Your personal email <strong>{emailParam}</strong> is now confirmed. All AI voice interview features, evaluations, and resume scoring are fully unlocked.
              </p>

              {user?.credentialId && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">Your Permanent Credential ID</span>
                  <div className="font-mono text-lg font-bold text-indigo-600 tracking-wider mt-0.5">{user.credentialId}</div>
                </div>
              )}

              <Button onClick={() => navigate('/dashboard')} className="w-full py-3 text-sm font-bold flex items-center justify-center gap-2">
                <span>Go to Dashboard</span>
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
                <p className="text-xs text-slate-600">
                  Enter the 6-digit confirmation code dispatched to <strong>{emailParam || 'your registered email'}</strong>.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="123456"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono text-xl font-bold tracking-widest outline-none focus:border-indigo-600 focus:bg-white"
                  required
                />
              </div>

              <Button type="submit" className="w-full py-3 text-sm font-bold">
                Confirm & Verify Account
              </Button>

              <div className="text-center pt-2">
                <Link to="/dashboard" className="text-xs text-slate-500 hover:text-slate-800 underline font-medium">
                  Skip for now and continue to Dashboard
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};
