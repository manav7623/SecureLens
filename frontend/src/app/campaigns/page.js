'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Search, Filter, DollarSign, Calendar, Users, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';

const NICHES = ['Tech', 'Fashion', 'Travel', 'Food', 'Fitness', 'Beauty', 'Gaming', 'Education', 'Finance', 'Lifestyle'];

function CampaignCard({ campaign }) {
  const [applying, setApplying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [proposal, setProposal] = useState({ proposal: '', proposedRate: '', timeline: '' });
  const { user } = useSelector(state => state.auth);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post('/applications', {
        campaignId: campaign._id,
        ...proposal,
        proposedRate: parseInt(proposal.proposedRate)
      });
      toast.success('Application submitted!');
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <div className="glass rounded-2xl p-6 card-hover">
        {/* Brand info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(campaign.brand?.name || 'B')}&background=4F63FF&color=fff&size=40`}
              className="w-10 h-10 rounded-xl"
            />
            <div>
              <div className="font-semibold text-sm">{campaign.brand?.brandProfile?.companyName || campaign.brand?.name}</div>
              <div className="text-gray-500 text-xs">{campaign.brand?.brandProfile?.industry || 'Brand'}</div>
            </div>
          </div>
          {campaign.isBoosted && (
            <span className="text-xs bg-accent-500/20 text-accent-400 px-2 py-1 rounded-lg flex items-center gap-1">
              <Zap size={10} /> Boosted
            </span>
          )}
        </div>

        <h3 className="font-bold text-lg mb-2">{campaign.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{campaign.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {campaign.niche?.slice(0, 3).map(n => (
            <span key={n} className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-lg">{n}</span>
          ))}
          {campaign.platforms?.slice(0, 2).map(p => (
            <span key={p} className="text-xs bg-dark-600 text-gray-400 px-2 py-1 rounded-lg capitalize">{p}</span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-dark-700 rounded-xl p-3 text-center">
            <div className="text-sm font-bold text-green-400">
              ₹{campaign.budget?.min?.toLocaleString()} - ₹{campaign.budget?.max?.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Budget</div>
          </div>
          <div className="bg-dark-700 rounded-xl p-3 text-center">
            <div className="text-sm font-bold text-blue-400">{campaign.requirements?.minFollowers?.toLocaleString()}+</div>
            <div className="text-xs text-gray-500">Min Followers</div>
          </div>
          <div className="bg-dark-700 rounded-xl p-3 text-center">
            <div className="text-sm font-bold text-purple-400">{campaign.applications?.length || 0}</div>
            <div className="text-xs text-gray-500">Applied</div>
          </div>
        </div>

        {campaign.deadline && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Calendar size={12} />
            Deadline: {new Date(campaign.deadline).toLocaleDateString()}
          </div>
        )}

        {user?.role === 'creator' && (
          <button onClick={() => setShowModal(true)} className="btn-primary w-full text-sm">
            Apply Now →
          </button>
        )}
      </div>

      {/* Apply Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-xl mb-2">Apply to Campaign</h3>
            <p className="text-gray-400 text-sm mb-6">{campaign.title}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Your Proposal</label>
                <textarea
                  className="input-field h-28 resize-none"
                  placeholder="Explain why you're the perfect fit for this campaign..."
                  value={proposal.proposal}
                  onChange={e => setProposal({ ...proposal, proposal: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Proposed Rate (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="10000"
                    value={proposal.proposedRate}
                    onChange={e => setProposal({ ...proposal, proposedRate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Timeline</label>
                  <input
                    className="input-field"
                    placeholder="e.g. 7 days"
                    value={proposal.timeline}
                    onChange={e => setProposal({ ...proposal, timeline: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleApply} disabled={applying || !proposal.proposal || !proposal.proposedRate} className="btn-primary flex-1">
                {applying ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ niche: '', platform: '', minBudget: '' });
  const [total, setTotal] = useState(0);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, ...filters });
      const { data } = await api.get(`/campaigns?${params}`);
      setCampaigns(data.campaigns);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchCampaigns, 400);
    return () => clearTimeout(t);
  }, [search, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Browse Campaigns</h1>
        <p className="text-gray-400">{total} active campaigns waiting for you</p>
      </div>

      {/* Search & Filters */}
      <div className="glass rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-field py-2.5 text-sm"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input-field py-2.5 text-sm w-40"
          value={filters.niche}
          onChange={e => setFilters({ ...filters, niche: e.target.value })}
        >
          <option value="">All Niches</option>
          {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>

        <select
          className="input-field py-2.5 text-sm w-40"
          value={filters.platform}
          onChange={e => setFilters({ ...filters, platform: e.target.value })}
        >
          <option value="">All Platforms</option>
          {['instagram', 'youtube', 'twitter', 'tiktok'].map(p => (
            <option key={p} value={p} className="capitalize">{p}</option>
          ))}
        </select>

        <input
          type="number"
          className="input-field py-2.5 text-sm w-36"
          placeholder="Min Budget ₹"
          value={filters.minBudget}
          onChange={e => setFilters({ ...filters, minBudget: e.target.value })}
        />
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Filter size={40} className="mx-auto mb-4 opacity-30" />
          <p>No campaigns found matching your criteria</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign._id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
