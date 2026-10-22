import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  KeyRound,
  X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ApiService } from '../services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithDemo, loginWithAdmin } = useAuth();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('demo@skillmatch.ai');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your Login ID / Email and password.');
      return;
    }

    setLoading(true);
    try {
      const success = await login(identifier.trim(), password);
      if (success) {
        showToast('Welcome back to SkillMatch AI!', 'success');
        if (identifier.toLowerCase().includes('admin')) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid Login ID, Email, or password.');
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoStudentLogin = async () => {
    setLoading(true);
    try {
      await loginWithDemo();
      showToast('Logged in as Verified Candidate [ID: SKM-2026-DEMO01]', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminPortalLogin = async () => {
    setLoading(true);
    try {
      await loginWithAdmin();
      showToast('Administrator privileges verified [ID: SKM-ADMIN-01]', 'success');
      navigate('/admin');
    } catch (err: any) {
      showToast(err.message || 'Admin login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Please enter your registered Email or Login ID', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await ApiService.forgotPassword(forgotEmail.trim());
      showToast(res.message || 'Password reset code dispatched', 'success');
      setForgotStep('reset');
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch reset code', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken.trim() || !newPassword || newPassword.length < 6) {
      showToast('Please enter reset token and a password with at least 6 characters', 'error');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await ApiService.resetPassword(forgotEmail.trim(), resetToken.trim(), newPassword);
      showToast(res.message || 'Password reset successfully!', 'success');
      setShowForgotModal(false);
      setPassword(newPassword);
      setIdentifier(forgotEmail);
    } catch (err: any) {
      showToast(err.message || 'Password reset failed', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">
              SkillMatch<span className="text-emerald-400 font-black">AI</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Account Sign In</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Sign in using your permanent Login ID or registered Email
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 bg-white shadow-2xl rounded-2xl border-slate-100 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Login ID, Roll Number, or Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="SKM-2026-XXXXXX or student@college.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-xs uppercase tracking-wider font-bold text-slate-400">
              Instant Access
            </span>
          </div>

          {/* Quick Demo & Admin Portals */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleDemoStudentLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Demo Student Candidate (SKM-2026-DEMO01)</span>
            </button>

            <button
              type="button"
              onClick={handleAdminPortalLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Admin Management Portal (SKM-ADMIN-01)</span>
            </button>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-600">
              New to SkillMatch AI?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 underline">
                Register as Student & Get Login ID
              </Link>
            </p>
          </div>
        </Card>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Reset Account Password</h3>
                <p className="text-xs text-slate-500">Secure recovery via verified email</p>
              </div>
            </div>

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Enter your registered Student Email or Login ID. We will dispatch a 6-digit recovery code.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Registered Email or Login ID
                  </label>
                  <input
                    type="text"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@college.edu or SKM-2026-..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <Button type="submit" disabled={forgotLoading} className="w-full font-bold">
                  {forgotLoading ? 'Dispatching Code...' : 'Send Recovery Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-slate-600">
                  Enter the 6-digit code received in your email along with your new password.
                </p>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    6-Digit Recovery Code
                  </label>
                  <input
                    type="text"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    New Password (min 6 characters)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <Button type="submit" disabled={forgotLoading} className="w-full font-bold">
                  {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
