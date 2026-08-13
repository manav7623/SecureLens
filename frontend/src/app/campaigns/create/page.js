'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Briefcase, DollarSign, Calendar, Target, Plus, X } from 'lucide-react';

const NICHES = ['Tech', 'Fashion', 'Travel', 'Food', 'Fitness', 'Beauty', 'Gaming', 'Education', 'Finance', 'Lifestyle'];
const PLATFORMS = ['instagram', 'youtube', 'twitter', 'tiktok', 'all'];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deliverable, setDeliverable] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    niche: [],
    platforms: [],
    budget: { min: '', max: '' },
    requirements: { minFollowers: 1000, minEngagement: 1, location: [] },
    deliverables: [],
    deadline: '',
    tags: []
  });

  const toggleItem = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(i => i !== value)
        : [...prev[field], value]
    }));
  };

  const addDeliverable = () => {
    if (!deliverable.trim()) return;
    setForm(prev => ({ ...prev, deliverables: [...prev.deliverables, deliverable.trim()] }));
    setDeliverable('');
  };

  const removeDeliverable = (i) => {
    setForm(prev => ({ ...prev, deliverables: prev.deliverables.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.budget.min || !form.budget.max) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/campaigns', {
        ...form,
        budget: { min: parseInt(form.budget.min), max: parseInt(form.budget.max) },
        deadline: form.deadline ? new Date(form.deadline) : null,
      });
      toast.success('Campaign created!');
      router.push('/campaigns/manage');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Create Campaign</h1>
        <p className="text-gray-400">Launch a new brand collaboration campaign</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Briefcase size={18} className="text-primary-500" /> Campaign Details
          </h3>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Campaign Title *</label>
            <input
              className="input-field"
              placeholder="Summer Collection Launch 2024"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description *</label>
            <textarea
              className="input-field h-32 resize-none"
              placeholder="Describe your campaign, product, and what you're looking for in a creator..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Niche & Platforms */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Target size={18} className="text-primary-500" /> Target & Platforms
          </h3>

          <div>
            <label className="block text-sm text-gray-400 mb-3">Content Niche</label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map(niche => (
                <button
                  key={niche} type="button"
                  onClick={() => toggleItem('niche', niche)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-all ${
                    form.niche.includes(niche) ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                  }`}
                >{niche}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(platform => (
                <button
                  key={platform} type="button"
                  onClick={() => toggleItem('platforms', platform)}
                  className={`text-sm px-3 py-1.5 rounded-lg capitalize transition-all ${
                    form.platforms.includes(platform) ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                  }`}
                >{platform}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Followers Required</label>
              <input
                type="number"
                className="input-field"
                value={form.requirements.minFollowers}
                onChange={e => setForm({ ...form, requirements: { ...form.requirements, minFollowers: parseInt(e.target.value) } })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Min Engagement Rate (%)</label>
              <input
                type="number"
                step="0.1"
                className="input-field"
                value={form.requirements.minEngagement}
                onChange={e => setForm({ ...form, requirements: { ...form.requirements, minEngagement: parseFloat(e.target.value) } })}
              />
            </div>
          </div>
        </div>

        {/* Budget & Deadline */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <DollarSign size={18} className="text-primary-500" /> Budget & Timeline
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Minimum Budget (₹) *</label>
              <input
                type="number"
                className="input-field"
                placeholder="5000"
                value={form.budget.min}
                onChange={e => setForm({ ...form, budget: { ...form.budget, min: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Maximum Budget (₹) *</label>
              <input
                type="number"
                className="input-field"
                placeholder="50000"
                value={form.budget.max}
                onChange={e => setForm({ ...form, budget: { ...form.budget, max: e.target.value } })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1">
              <Calendar size={14} /> Application Deadline
            </label>
            <input
              type="date"
              className="input-field"
              value={form.deadline}
              onChange={e => setForm({ ...form, deadline: e.target.value })}
            />
          </div>
        </div>

        {/* Deliverables */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-lg">Deliverables</h3>
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="e.g. 1 Instagram Reel, 3 Stories"
              value={deliverable}
              onChange={e => setDeliverable(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addDeliverable())}
            />
            <button type="button" onClick={addDeliverable} className="btn-secondary px-4">
              <Plus size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.deliverables.map((d, i) => (
              <span key={i} className="flex items-center gap-1 bg-dark-700 text-sm px-3 py-1.5 rounded-lg">
                {d}
                <button type="button" onClick={() => removeDeliverable(i)}>
                  <X size={14} className="text-gray-500 hover:text-red-400" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : 'Launch Campaign'}
        </button>
      </form>
    </div>
  );
}
