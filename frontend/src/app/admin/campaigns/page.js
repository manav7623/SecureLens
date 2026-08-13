'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { Megaphone, Search, Trash2, Calendar, Globe, CreditCard } from 'lucide-react';

export default function AdminCampaignsPage() {
  const { user } = useSelector(state => state.auth);
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchCampaigns();
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const { data } = await api.get('/admin/campaigns');
      setCampaigns(data.campaigns || []);
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (campaignId) => {
    if (!confirm('Permanently delete this campaign?')) return;
    try {
      await api.delete(`/admin/campaigns/${campaignId}`);
      toast.success('Campaign deleted');
      setCampaigns(prev => prev.filter(c => c._id !== campaignId));
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  const filteredCampaigns = campaigns.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.brand?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 page-enter space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Campaign Management</h1>
          <p className="text-gray-400">View and manage all campaigns hosted on the platform</p>
        </div>

        {/* Search */}
        <div className="glass rounded-2xl p-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="input-field py-2.5 text-sm w-full"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by title or brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Campaigns List */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  {['Campaign', 'Brand', 'Budget', 'Niche', 'Platforms', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {filteredCampaigns.map(c => (
                  <tr key={c._id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-white">
                      {c.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {c.brand?.name || 'Unknown Brand'}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-400 font-mono">
                      ₹{c.budget?.min?.toLocaleString()} - ₹{c.budget?.max?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(c.niche) ? c.niche : typeof c.niche === 'string' ? JSON.parse(c.niche) : [])?.map(n => (
                          <span key={n} className="bg-dark-700 px-2 py-0.5 rounded">{n}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-300">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(c.platforms) ? c.platforms : typeof c.platforms === 'string' ? JSON.parse(c.platforms) : [])?.map(p => (
                          <span key={p} className="bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded capitalize">{p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        c.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="Delete Campaign"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCampaigns.length === 0 && (
              <div className="text-center py-12 text-gray-400">No campaigns found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
