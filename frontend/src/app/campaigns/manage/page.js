'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Eye, Users, Calendar, Edit2, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';

function ApplicationCard({ app, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  const handleStatus = async (status, dealAmount) => {
    setUpdating(true);
    try {
      await api.put(`/applications/${app._id}/status`, { status, dealAmount });
      toast.success(`Application ${status}!`);
      onStatusChange();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const creator = app.creator;
  const profile = creator?.creatorProfile;

  const scoreColor = (profile?.aiScore || 0) >= 75 ? 'text-green-400' :
    (profile?.aiScore || 0) >= 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-dark-700 rounded-xl p-4">
      <div className="flex items-start gap-4">
        <img
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(creator?.name || 'C')}&background=22223A&color=4F63FF&size=48`}
          className="w-12 h-12 rounded-xl flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold">{creator?.name}</span>
            <span className={`text-xs font-mono font-bold ${scoreColor}`}>
              AI: {profile?.aiScore || 0}/100
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-gray-400 mb-2">
            <span> {(profile?.totalFollowers || 0).toLocaleString()} followers</span>
            <span> {profile?.engagementRate || 0}% engagement</span>
            <span> {profile?.fakeFollowerPercentage || 0}% fake</span>
            {profile?.niche?.slice(0,2).map(n => (
              <span key={n} className="bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">{n}</span>
            ))}
          </div>
          <p className="text-sm text-gray-300 mb-2 line-clamp-2">{app.proposal}</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="text-green-400 font-semibold">₹{app.proposedRate?.toLocaleString()}</span>
            <span>Timeline: {app.timeline || 'Not specified'}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          {app.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatus('shortlisted')}
                disabled={updating}
                className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg transition-all"
              >
                Shortlist
              </button>
              <button
                onClick={() => handleStatus('accepted', app.proposedRate)}
                disabled={updating}
                className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded-lg transition-all"
              >
                Accept
              </button>
              <button
                onClick={() => handleStatus('rejected')}
                disabled={updating}
                className="text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition-all"
              >
                Reject
              </button>
            </>
          )}
          {app.status === 'shortlisted' && (
            <button
              onClick={() => handleStatus('accepted', app.proposedRate)}
              disabled={updating}
              className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded-lg transition-all"
            >
              Accept Deal
            </button>
          )}
          {app.status === 'accepted' && (
            <button
              onClick={() => handleStatus('completed')}
              disabled={updating}
              className="text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-3 py-1.5 rounded-lg transition-all"
            >
              Mark Complete
            </button>
          )}
          {app.status === 'completed' && (
            <button
              onClick={() => handleStatus('accepted')}
              disabled={updating}
              className="text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 px-3 py-1.5 rounded-lg transition-all"
            >
              Cancel Complete
            </button>
          )}
          <span className={`text-xs text-center px-2 py-1 rounded-lg font-mono ${
            app.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
            app.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
            app.status === 'completed' ? 'bg-purple-500/20 text-purple-400' :
            app.status === 'shortlisted' ? 'bg-blue-500/20 text-blue-400' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {app.status}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ManageCampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const { data } = await api.get('/campaigns/my');
      setCampaigns(data.campaigns);
    } catch (err) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (campaignId) => {
    try {
      const { data } = await api.get(`/applications/campaign/${campaignId}`);
      setApplications(data.applications);
    } catch (err) {
      toast.error('Failed to load applications');
    }
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const selectCampaign = (campaign) => {
    setSelected(campaign);
    fetchApplications(campaign._id);
  };

  const deleteCampaign = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      toast.success('Campaign deleted');
      setCampaigns(prev => prev.filter(c => c._id !== id));
      if (selected?._id === id) setSelected(null);
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">My Campaigns</h1>
          <p className="text-gray-400">Manage your brand campaigns</p>
        </div>
        <Link href="/campaigns/create" className="btn-primary">+ New Campaign</Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Campaign List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center text-gray-400">
              <p className="mb-4">No campaigns yet</p>
              <Link href="/campaigns/create" className="btn-primary text-sm">Create First Campaign</Link>
            </div>
          ) : campaigns.map(c => (
            <div
              key={c._id}
              onClick={() => selectCampaign(c)}
              className={`glass rounded-xl p-4 cursor-pointer transition-all ${
                selected?._id === c._id ? 'border-primary-500 border' : 'hover:bg-dark-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm flex-1 pr-2">{c.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono flex-shrink-0 ${
                  c.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  c.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>{c.status}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><Users size={10} />{c.applications?.length || 0} apps</span>
                <span className="flex items-center gap-1"><Eye size={10} />{c.views} views</span>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCampaign(c._id); }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Applications Panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="glass rounded-2xl p-6 space-y-6">
              {/* Campaign Header & Details */}
              <div className="border-b border-dark-600 pb-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-2xl mb-1">{selected.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Status:</span>
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                        selected.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        selected.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>{selected.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-green-400 block">
                      Budget: ₹{selected.budget?.min?.toLocaleString()} - ₹{selected.budget?.max?.toLocaleString()}
                    </span>
                    {selected.deadline && (
                      <span className="text-xs text-gray-500">
                        Deadline: {new Date(selected.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-300 text-sm leading-relaxed">{selected.description}</p>

                {/* Campaign tags & requirements grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dark-800/40 rounded-xl p-4 border border-dark-600 text-xs">
                  <div>
                    <p className="text-gray-500 mb-2 font-semibold uppercase tracking-wider">Campaign Requirements</p>
                    <div className="space-y-1.5 text-gray-300">
                      <div>Min Followers: <span className="text-blue-400 font-semibold">{selected.requirements?.minFollowers?.toLocaleString()}</span></div>
                      <div>Min Engagement: <span className="text-blue-400 font-semibold">{selected.requirements?.minEngagement}%</span></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-2 font-semibold uppercase tracking-wider">Target Niches & Platforms</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.niche?.map(n => (
                        <span key={n} className="bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded font-medium">{n}</span>
                      ))}
                      {selected.platforms?.map(p => (
                        <span key={p} className="bg-dark-600 text-gray-400 px-2 py-0.5 rounded capitalize font-medium">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Users size={18} className="text-primary-500" />
                  Applications Received ({applications.length})
                </h4>

                {applications.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users size={32} className="mx-auto mb-3 opacity-30" />
                    <p>No applications yet. Share your campaign!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map(app => (
                      <ApplicationCard
                        key={app._id}
                        app={app}
                        onStatusChange={() => fetchApplications(selected._id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center text-gray-400">
              <Eye size={40} className="mx-auto mb-4 opacity-20" />
              <p>Select a campaign to view applications and campaign details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
