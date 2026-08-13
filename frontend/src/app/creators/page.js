'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, Shield, Zap, Users, TrendingUp, MapPin, Instagram, Youtube, Twitter } from 'lucide-react';

const NICHES = ['Tech', 'Fashion', 'Travel', 'Food', 'Fitness', 'Beauty', 'Gaming', 'Education', 'Finance', 'Lifestyle'];

function CreatorCard({ creator }) {
  const [showDetail, setShowDetail] = useState(false);
  const p = creator.creatorProfile || {};
  const score = p.aiScore || 0;
  const scoreColor = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = score >= 75 ? 'bg-green-500/20' : score >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20';

  return (
    <>
      <div className="glass rounded-2xl p-6 card-hover cursor-pointer" onClick={() => setShowDetail(true)}>
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <img
            src={creator.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=4F63FF&color=fff&size=64`}
            className="w-14 h-14 rounded-2xl object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg">{creator.name}</span>
              {creator.isVerified && <Shield size={14} className="text-green-400" />}
              {p.isFeatured && (
                <span className="text-xs bg-accent-500/20 text-accent-400 px-2 py-0.5 rounded-full">Featured</span>
              )}
            </div>
            {p.location && (
              <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                <MapPin size={12} /> {p.location}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-1">
              {p.niche?.slice(0, 3).map(n => (
                <span key={n} className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">{n}</span>
              ))}
            </div>
          </div>
          <div className={`text-center px-3 py-2 rounded-xl ${scoreBg}`}>
            <div className={`text-2xl font-bold ${scoreColor}`}>{score}</div>
            <div className="text-xs text-gray-400">AI Score</div>
          </div>
        </div>

        {p.bio && <p className="text-gray-400 text-sm mb-4 line-clamp-2">{p.bio}</p>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-dark-700 rounded-xl p-2.5 text-center">
            <div className="text-sm font-bold">{(p.totalFollowers || 0).toLocaleString()}</div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div className="bg-dark-700 rounded-xl p-2.5 text-center">
            <div className={`text-sm font-bold ${(p.engagementRate || 0) >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
              {p.engagementRate || 0}%
            </div>
            <div className="text-xs text-gray-500">Engagement</div>
          </div>
          <div className="bg-dark-700 rounded-xl p-2.5 text-center">
            <div className={`text-sm font-bold ${(p.fakeFollowerPercentage || 0) < 20 ? 'text-green-400' : 'text-red-400'}`}>
              {p.fakeFollowerPercentage || 0}%
            </div>
            <div className="text-xs text-gray-500">Fake Flwrs</div>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-3 items-center text-gray-400">
          {p.socialLinks?.instagram?.username && (
            <div className="flex items-center gap-1 text-xs">
              <Instagram size={12} className="text-pink-400" />
              @{p.socialLinks.instagram.username}
            </div>
          )}
          {p.socialLinks?.youtube?.username && (
            <div className="flex items-center gap-1 text-xs">
              <Youtube size={12} className="text-red-400" />
              {p.socialLinks.youtube.username}
            </div>
          )}
        </div>

        {p.rateCard?.postRate > 0 && (
          <div className="mt-3 pt-3 border-t border-dark-600 flex gap-4 text-xs text-gray-400">
            <span>Post: <span className="text-accent-400 font-semibold">₹{p.rateCard.postRate?.toLocaleString()}</span></span>
            {p.rateCard.videoRate > 0 && (
              <span>Video: <span className="text-accent-400 font-semibold">₹{p.rateCard.videoRate?.toLocaleString()}</span></span>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(false)}>
          <div className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-6">
              <img
                src={creator.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=4F63FF&color=fff&size=80`}
                className="w-20 h-20 rounded-2xl"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">{creator.name}</h2>
                  {creator.isVerified && <Shield size={18} className="text-green-400" />}
                </div>
                {p.location && <div className="text-gray-400 text-sm flex items-center gap-1"><MapPin size={14} />{p.location}</div>}
                <p className="text-gray-300 text-sm mt-2">{p.bio}</p>
              </div>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'AI Score', value: `${p.aiScore || 0}/100`, color: scoreColor },
                { label: 'Total Followers', value: (p.totalFollowers || 0).toLocaleString(), color: 'text-blue-400' },
                { label: 'Engagement', value: `${p.engagementRate || 0}%`, color: 'text-green-400' },
                { label: 'Fake Followers', value: `${p.fakeFollowerPercentage || 0}%`, color: (p.fakeFollowerPercentage || 0) < 20 ? 'text-green-400' : 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-dark-700 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>

            {/* Audience Locations */}
            {p.audienceLocations?.length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-sm text-gray-400">AUDIENCE LOCATIONS</h4>
                <div className="space-y-2">
                  {p.audienceLocations.slice(0, 4).map(loc => (
                    <div key={loc.country} className="flex items-center gap-3">
                      <span className="text-sm w-16 text-gray-400">{loc.country}</span>
                      <div className="flex-1 bg-dark-700 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${loc.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-8">{loc.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Platforms */}
            <div className="mb-4">
              <h4 className="font-semibold mb-3 text-sm text-gray-400">SOCIAL PLATFORMS</h4>
              <div className="grid grid-cols-2 gap-2">
                {p.socialLinks?.instagram?.username && (
                  <div className="bg-dark-700 rounded-xl p-3 flex items-center gap-2">
                    <Instagram size={18} className="text-pink-400" />
                    <div>
                      <div className="text-sm">@{p.socialLinks.instagram.username}</div>
                      <div className="text-xs text-gray-400">{(p.socialLinks.instagram.followers || 0).toLocaleString()} followers</div>
                    </div>
                  </div>
                )}
                {p.socialLinks?.youtube?.username && (
                  <div className="bg-dark-700 rounded-xl p-3 flex items-center gap-2">
                    <Youtube size={18} className="text-red-400" />
                    <div>
                      <div className="text-sm">{p.socialLinks.youtube.username}</div>
                      <div className="text-xs text-gray-400">{(p.socialLinks.youtube.subscribers || 0).toLocaleString()} subscribers</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setShowDetail(false)} className="btn-secondary w-full">Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    niche: '', minFollowers: '', maxFollowers: '', minEngagement: '', location: '', sort: 'aiScore'
  });

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, ...filters });
      const { data } = await api.get(`/users/creators?${params}`);
      setCreators(data.creators);
      setTotal(data.total);
    } catch (err) {
      toast.error('Failed to load creators');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchCreators, 400);
    return () => clearTimeout(t);
  }, [search, filters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Find Creators</h1>
        <p className="text-gray-400">{total} verified creators ready to collaborate</p>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="input-field py-2.5 text-sm"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search creators..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <select className="input-field py-2.5 text-sm w-40" value={filters.niche} onChange={e => setFilters({ ...filters, niche: e.target.value })}>
            <option value="">All Niches</option>
            {NICHES.map(n => <option key={n}>{n}</option>)}
          </select>

          <input type="number" className="input-field py-2.5 text-sm w-36" placeholder="Min Followers" value={filters.minFollowers} onChange={e => setFilters({ ...filters, minFollowers: e.target.value })} />
          <input type="number" className="input-field py-2.5 text-sm w-36" placeholder="Min Engagement%" value={filters.minEngagement} onChange={e => setFilters({ ...filters, minEngagement: e.target.value })} />

          <select className="input-field py-2.5 text-sm w-40" value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
            <option value="aiScore">Sort: AI Score</option>
            <option value="followers">Sort: Followers</option>
            <option value="engagement">Sort: Engagement</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : creators.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users size={40} className="mx-auto mb-4 opacity-30" />
          <p>No creators found. Try adjusting filters.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {creators.map(creator => (
            <CreatorCard key={creator._id} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
}
