'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent successfully!');
      if (data.otp) {
        toast.success(`[Mock Mode] Your OTP is: ${data.otp}`, { duration: 10000 });
      }
      
      // Immediately redirect to reset password page with email pre-filled
      router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 30, background: 'linear-gradient(135deg, #4F63FF, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CreatorLens</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-gray-400 font-medium">We will send a 6-digit OTP code to your email</p>
        </div>

        <div className="glass rounded-3xl p-8">
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Send OTP Code'}
            </button>
          </form>

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
