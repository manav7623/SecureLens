'use client';
import { useState, useEffect, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '@/store/authSlice';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, User, Briefcase, Star } from 'lucide-react';

function RegisterForm() {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loading, error, user } = useSelector(state => state.auth);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: searchParams.get('role') || 'creator'
  });

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    const result = await dispatch(register(form));
    if (result.meta.requestStatus === 'fulfilled') {
      toast.success('Account created! Welcome to CollabBridge 🎉');
    }
  };

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            
            <span style={{ fontFamily: 'var(--font-syne)', fontWeight: 800, fontSize: 30, background: 'linear-gradient(135deg, #4F63FF, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CreatorLens</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-400">Join the AI-powered creator marketplace</p>
        </div>

        <div className="glass rounded-3xl p-8">
          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'creator', label: 'Creator', icon: Star, desc: 'Get brand deals' },
              { value: 'brand', label: 'Brand', icon: Briefcase, desc: 'Find creators' }
            ].map(({ value, label, icon: Icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm({ ...form, role: value })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  form.role === value
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 bg-dark-700 hover:border-dark-500'
                }`}
              >
                <Icon size={20} className={form.role === value ? 'text-primary-500' : 'text-gray-400'} />
                <div className="font-semibold mt-2">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Virat Kohli"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <User size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="virat@example.com"
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
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock size={18} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary-500 hover:text-primary-400 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen mesh-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>}>
      <RegisterForm />
    </Suspense>
  );
}
