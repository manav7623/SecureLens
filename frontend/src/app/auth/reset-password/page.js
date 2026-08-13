'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, Key, Lock, Eye, EyeOff, ArrowLeft, Clock } from 'lucide-react';
import api from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleResendOTP = async () => {
    if (!email.trim()) {
      toast.error('Email address is required to resend OTP.');
      return;
    }
    setResending(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('New OTP sent successfully!');
      if (data.otp) {
        toast.success(`[Mock Mode] Your OTP is: ${data.otp}`, { duration: 10000 });
      }
      setTimeLeft(600); // Reset timer back to 10 minutes
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Email is required.');
      return;
    }

    if (!otp.trim()) {
      toast.error('OTP code is required.');
      return;
    }

    if (otp.trim().length !== 6 || isNaN(otp.trim())) {
      toast.error('OTP must be a 6-digit number.');
      return;
    }

    if (timeLeft <= 0) {
      toast.error('OTP has expired. Please request a new code.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), otp: otp.trim(), password });
      toast.success('Password reset successfully!');
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Cooldown is 60 seconds (from 600 down to 540)
  const canResend = timeLeft <= 540;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Email Address</label>
        <div className="relative">
          <input
            type="email"
            className="input-field"
            style={{ paddingLeft: '2.75rem' }}
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Mail size={18} />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">6-Digit OTP Code</label>
        <div className="relative">
          <input
            type="text"
            maxLength={6}
            className="input-field"
            style={{ paddingLeft: '2.75rem' }}
            placeholder="123456"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            required
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Key size={18} />
          </div>
        </div>

        {/* OTP Countdown & Resend Code Timer */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock size={13} className={timeLeft > 60 ? "text-amber-400" : "text-red-500 animate-pulse"} />
            <span className={timeLeft > 60 ? "text-gray-400 font-medium" : "text-red-400 font-semibold"}>
              {timeLeft > 0 ? `Expires in: ${formatTime(timeLeft)}` : 'OTP Expired'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resending || !canResend}
            className={`text-xs font-semibold transition-colors ${
              !canResend
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-primary-400 hover:text-primary-300'
            }`}
          >
            {resending ? 'Resending...' : !canResend ? `Resend in ${timeLeft - 540}s` : 'Resend OTP'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">New Password</label>
        <div className="relative">
          <input
            type={showPass ? 'text' : 'password'}
            className="input-field"
            style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Lock size={18} />
          </div>
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirmPass ? 'text' : 'password'}
            className="input-field"
            style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            <Lock size={18} />
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmPass(!showConfirmPass)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02]"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 30, background: 'linear-gradient(135deg, #4F63FF, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CreatorLens</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create New Password</h1>
          <p className="text-gray-400 font-medium">Please enter your OTP and new secure password below</p>
        </div>

        <div className="glass rounded-3xl p-8">
          <Suspense fallback={<div className="text-center py-4 text-gray-400 animate-pulse">Loading request parameters...</div>}>
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
