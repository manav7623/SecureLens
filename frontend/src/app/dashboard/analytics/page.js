'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { TrendingUp, Zap, Users, DollarSign, Target } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, [user]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isCreator = user?.role === 'creator';
  const profile = user?.creatorProfile;

  const radarData = isCreator && profile ? [
    { metric: 'AI Score', value: profile.aiScore || 0 },
    { metric: 'Engagement', value: Math.min(100, (profile.engagementRate || 0) * 10) },
    { metric: 'Authenticity', value: Math.max(0, 100 - (profile.fakeFollowerPercentage || 0)) },
    { metric: 'Consistency', value: profile.contentConsistency || 0 },
    { metric: 'Collaborations', value: Math.min(100, (profile.collaborationCount || 0) * 10) },
  ] : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Analytics</h1>
        <p className="text-gray-400">Deep insights into your {isCreator ? 'creator' : 'brand'} performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(isCreator ? [
          { label: 'Total Applications', value: stats?.stats?.totalApplications || 0, icon: Target, color: 'text-blue-400' },
          { label: 'Success Rate', value: `${stats?.stats?.successRate || 0}%`, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Completed Deals', value: stats?.stats?.completedCollabs || 0, icon: Users, color: 'text-purple-400' },
          { label: 'Total Earnings', value: `₹${(stats?.stats?.totalEarnings || 0).toLocaleString()}`, icon: DollarSign, color: 'text-accent-400' },
        ] : [
          { label: 'Total Campaigns', value: stats?.stats?.totalCampaigns || 0, icon: Target, color: 'text-blue-400' },
          { label: 'Active Campaigns', value: stats?.stats?.activeCampaigns || 0, icon: TrendingUp, color: 'text-green-400' },
          { label: 'Total Applications', value: stats?.stats?.totalApplications || 0, icon: Users, color: 'text-purple-400' },
          { label: 'Total Spend', value: `₹${(stats?.stats?.totalSpend || 0).toLocaleString()}`, icon: DollarSign, color: 'text-accent-400' },
        ]).map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass rounded-2xl p-5">
            <Icon size={20} className={`${color} mb-3`} />
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-gray-400 text-sm">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Monthly Trend</h3>
          {stats?.monthlyData?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.monthlyData.map(d => ({
                name: `${d._id.month}/${d._id.year}`,
                Applications: d.count
              }))}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1A1A26', border: '1px solid #22223A', borderRadius: 8 }} />
                <Bar dataKey="Applications" fill="#4F63FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
              Not enough data yet
            </div>
          )}
        </div>

        {/* Creator Radar / Brand Campaign Performance */}
        {isCreator && profile?.aiScore > 0 ? (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Zap size={16} className="text-primary-500" /> Creator Performance Radar
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#22223A" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Radar name="Score" dataKey="value" stroke="#4F63FF" fill="#4F63FF" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold mb-4">AI Creator Score Breakdown</h3>
            {profile && (
              <div className="space-y-3">
                {[
                  { label: 'AI Score', value: profile.aiScore || 0, max: 100, color: '#4F63FF' },
                  { label: 'Engagement Rate', value: Math.min(100, (profile.engagementRate || 0) * 10), max: 100, color: '#22c55e' },
                  { label: 'Authenticity', value: Math.max(0, 100 - (profile.fakeFollowerPercentage || 0)), max: 100, color: '#a855f7' },
                  { label: 'Content Consistency', value: profile.contentConsistency || 0, max: 100, color: '#f59e0b' },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{label}</span>
                      <span className="font-semibold">{value}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${value}%`, background: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!profile?.aiScore && (
              <p className="text-gray-500 text-sm">Complete your profile and run AI analysis to see detailed metrics.</p>
            )}
          </div>
        )}
      </div>

      {/* Audience Locations for creators */}
      {isCreator && profile?.audienceLocations?.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Audience Locations</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {profile.audienceLocations.map(loc => (
              <div key={loc.country} className="flex items-center gap-4">
                <span className="text-sm w-16 text-gray-400 flex-shrink-0">{loc.country}</span>
                <div className="flex-1 bg-dark-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-700 h-3 rounded-full transition-all"
                    style={{ width: `${loc.percentage}%` }}
                  />
                </div>
                <span className="text-sm font-semibold w-10 text-right">{loc.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
