'use client';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/api';
import { BarChart3, TrendingUp, Star, Briefcase, Users, CheckCircle, Clock, DollarSign, Eye, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Link from 'next/link';

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary-500' }) {
  return (
    <div className="glass rounded-2xl p-6 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-dark-600 flex items-center justify-center ${color}`}>
          <Icon size={22} />
        </div>
        <span className="text-xs text-gray-500 font-mono">LIVE</span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function AIScoreWidget({ score, analysis }) {
  const color = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const bg = score >= 75 ? 'from-green-500' : score >= 50 ? 'from-yellow-500' : 'from-red-500';

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-primary-500" />
        <span className="font-semibold">AI Creator Score</span>
      </div>
      <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-4">
        <div className="w-full h-full rounded-full border-4 border-dark-600 flex items-center justify-center">
          <div className={`text-4xl font-bold ${color}`}>{score}</div>
        </div>
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r="58" fill="none" stroke="#22223A" strokeWidth="8" />
          <circle
            cx="64" cy="64" r="58" fill="none"
            stroke={score >= 75 ? '#4ade80' : score >= 50 ? '#facc15' : '#f87171'}
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 364} 364`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="text-gray-400 text-xs text-center leading-relaxed">{analysis || 'Complete your profile to get AI score'}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const endpoint = user?.role === 'brand' ? '/analytics/brand' : '/analytics/creator';
        const { data } = await api.get(endpoint);
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchStats();
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isCreator = user?.role === 'creator';
  const profile = isCreator ? user?.creatorProfile : user?.brandProfile;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartData = isCreator
    ? stats?.monthlyData?.map(d => ({
        name: `${monthNames[d._id.month - 1] || 'Month'} '${d._id.year.toString().slice(-2)}`,
        Applications: d.count
      }))
    : stats?.recentCampaigns?.map(c => ({
        name: c.title.length > 15 ? c.title.slice(0, 15) + '...' : c.title,
        Views: c.views || 0
      }));
  const hasChartData = isCreator
    ? stats?.monthlyData?.length > 0
    : stats?.recentCampaigns?.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 
          </h1>
          <p className="text-gray-400 mt-1">
            {isCreator ? 'Track your collaborations and grow your brand deals' : 'Manage your campaigns and find the perfect creators'}
          </p>
        </div>
        <Link
          href={isCreator ? '/campaigns' : '/campaigns/create'}
          className="btn-primary flex items-center gap-2"
        >
          {isCreator ? ' Find Campaigns' : '+ Create Campaign'}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isCreator ? (
          <>
            <StatCard icon={Briefcase} label="Total Applications" value={stats?.stats?.totalApplications || 0} color="text-blue-400" />
            <StatCard icon={CheckCircle} label="Accepted" value={stats?.stats?.acceptedApplications || 0} color="text-green-400" />
            <StatCard icon={Star} label="Completed" value={stats?.stats?.completedCollabs || 0} color="text-yellow-400" />
            <StatCard icon={DollarSign} label="Total Earnings" value={`₹${(stats?.stats?.totalEarnings || 0).toLocaleString()}`} color="text-purple-400" />
          </>
        ) : (
          <>
            <StatCard icon={Megaphone} label="Total Campaigns" value={stats?.stats?.totalCampaigns || 0} color="text-blue-400" />
            <StatCard icon={TrendingUp} label="Active Campaigns" value={stats?.stats?.activeCampaigns || 0} color="text-green-400" />
            <StatCard icon={Users} label="Applications" value={stats?.stats?.totalApplications || 0} color="text-yellow-400" />
            <StatCard icon={DollarSign} label="Total Spend" value={`₹${(stats?.stats?.totalSpend || 0).toLocaleString()}`} color="text-purple-400" />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-500" />
            {isCreator ? 'Application Trend' : 'Campaign Views (Performance)'}
          </h3>
          {hasChartData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#1A1A26', border: '1px solid #22223A', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey={isCreator ? "Applications" : "Views"} fill={isCreator ? "#4F63FF" : "#10B981"} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
              {isCreator 
                ? 'No application data yet. Start applying to campaigns!' 
                : 'No campaigns created yet. Create a campaign to start tracking views!'}
            </div>
          )}
        </div>

        {/* AI Score / Quick Stats */}
        {isCreator ? (
          <AIScoreWidget
            score={user?.creatorProfile?.aiScore || 0}
            analysis={user?.creatorProfile?.aiScore > 0
              ? `Engagement: ${user?.creatorProfile?.engagementRate}% | Fake: ${user?.creatorProfile?.fakeFollowerPercentage}%`
              : 'Add social links to generate your AI score'}
          />
        ) : (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              
            </div>
            {stats?.recentCampaigns?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 font-mono">RECENT CAMPAIGNS</p>
                {stats.recentCampaigns.slice(0, 3).map(c => (
                  <div key={c._id} className="flex items-center justify-between py-2 border-b border-dark-600 last:border-0">
                    <div className="text-sm truncate flex-1">{c.title}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Eye size={12} />
                      {c.views}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Profile Completion */}
      {isCreator && (!profile?.socialLinks?.instagram?.username && !profile?.socialLinks?.youtube?.username) && (
        <div className="glass rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Zap size={22} className="text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Complete Your Profile</h3>
              <p className="text-gray-400 text-sm mb-4">
                Add your social media links to generate your AI authenticity score and get discovered by brands.
              </p>
              <Link href="/dashboard/profile" className="btn-accent text-sm px-4 py-2">
                Setup Profile →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Megaphone({ size, className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}
