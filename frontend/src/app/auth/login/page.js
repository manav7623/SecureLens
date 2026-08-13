'use client';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, user } = useSelector(state => state.auth);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') router.push('/admin');
      else router.push('/dashboard');
    }
  }, [user]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Welcome back!');
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
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-400">Sign in to your account</p>
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
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail size={18} />
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-gray-400">Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-primary-500 hover:text-primary-400 font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Sign In'}
            </button>
          </form>


          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary-500 hover:text-primary-400 font-semibold">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
