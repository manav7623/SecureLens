'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { Users, Shield, Zap, Megaphone, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function AdminStats({ stats }) {
  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, color: 'text-blue-400' },
    { label: 'Creators', value: stats?.totalCreators || 0, color: 'text-yellow-400' },
    { label: 'Brands', value: stats?.totalBrands || 0, color: 'text-purple-400' },
    { label: 'Active Campaigns', value: stats?.activeCampaigns || 0, color: 'text-green-400' },
    { label: 'Total Applications', value: stats?.totalApplications || 0, color: 'text-blue-400' },
    { label: 'Completed Deals', value: stats?.completedDeals || 0, color: 'text-green-400' },
    { label: 'Banned Users', value: stats?.bannedUsers || 0, color: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map(({ label, value, color }) => (
        <div key={label} className="glass rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
          <div className="text-gray-400 text-xs mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useSelector(state => state.auth);
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (err) {
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 page-enter space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Admin Panel</h1>
          <p className="text-gray-400">Overview of platform status and administrative controls</p>
        </div>

        {stats && <AdminStats stats={stats} />}

        {/* Section: Quick Links */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/admin/users" className="glass rounded-2xl p-6 card-hover flex flex-col justify-between h-48 border border-blue-500/20 glow-blue">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-lg mb-1">User Management</h3>
              <p className="text-gray-400 text-sm">Verify new signups, ban violators, and edit accounts</p>
            </div>
            <div className="flex items-center gap-1.5 text-blue-400 text-sm font-semibold">
              Go to Users <ArrowRight size={14} />
            </div>
          </Link>

          <Link href="/admin/campaigns" className="glass rounded-2xl p-6 card-hover flex flex-col justify-between h-48 border border-green-500/20 glow-green">
            <div>
              <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center mb-4">
                <Megaphone size={20} />
              </div>
              <h3 className="font-bold text-lg mb-1">Campaign Management</h3>
              <p className="text-gray-400 text-sm">Track campaign budgets, niches, and active status</p>
            </div>
            <div className="flex items-center gap-1.5 text-green-400 text-sm font-semibold">
              Go to Campaigns <ArrowRight size={14} />
            </div>
          </Link>

          <Link href="/admin/payments" className="glass rounded-2xl p-6 card-hover flex flex-col justify-between h-48 border border-purple-500/20 glow-purple">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <CreditCard size={20} />
              </div>
              <h3 className="font-bold text-lg mb-1">Escrow & Fees</h3>
              <p className="text-gray-400 text-sm">Monitor platform volume, escrow holdings, and payouts</p>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400 text-sm font-semibold">
              Go to Payments <ArrowRight size={14} />
            </div>
          </Link>
        </div>

        {/* Platform Status Log */}
        <div className="glass rounded-2xl p-6 border border-dark-600">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Shield size={18} className="text-primary-400" />
            System Status
          </h3>
          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-2 border-b border-dark-700">
              <span className="text-gray-400">Database Engine</span>
              <span className="text-green-400 font-semibold">MongoDB Atlas (Connected)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-dark-700">
              <span className="text-gray-400">Backend Server Port</span>
              <span className="text-white">5000</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-dark-700">
              <span className="text-gray-400">Session Security</span>
              <span className="text-green-400">JWT Token Enabled</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-400">Database ORM Layer</span>
              <span className="text-green-400">Mongoose Driver Active</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
