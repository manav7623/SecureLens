'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { CheckCircle, Clock, XCircle, Star, DollarSign } from 'lucide-react';

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  shortlisted: { label: 'Shortlisted', icon: Star, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-purple-400', bg: 'bg-purple-500/20' },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/applications/my');
        setApplications(data.applications);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">My Applications</h1>
        <p className="text-gray-400">Track all your campaign applications</p>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'shortlisted', 'accepted', 'rejected', 'completed'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-4 py-2 rounded-xl capitalize transition-all ${
              filter === s ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-gray-400">
          <Clock size={40} className="mx-auto mb-4 opacity-30" />
          <p>No applications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(app => {
            const config = statusConfig[app.status] || statusConfig.pending;
            const Icon = config.icon;
            return (
              <div key={app._id} className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{app.campaign?.title || 'Campaign'}</h3>
                      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${config.bg} ${config.color}`}>
                        <Icon size={12} /> {config.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(app.brand?.name || 'B')}&background=4F63FF&color=fff&size=32`}
                        className="w-7 h-7 rounded-lg"
                      />
                      <span className="text-gray-400 text-sm">{app.brand?.name || 'Brand'}</span>
                    </div>

                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">{app.proposal}</p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-green-400">
                        <DollarSign size={14} />
                        <span>₹{app.proposedRate?.toLocaleString()}</span>
                      </div>
                      {app.timeline && (
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock size={14} />
                          <span>{app.timeline}</span>
                        </div>
                      )}
                      {app.dealAmount && (
                        <div className="flex items-center gap-1 text-accent-400 font-semibold">
                          <CheckCircle size={14} />
                          <span>Deal: ₹{app.dealAmount?.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs text-gray-500">
                    {new Date(app.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
