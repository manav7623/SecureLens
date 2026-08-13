'use client';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, Link2, Plus, X, CheckCircle, Clock, RefreshCw, AlertCircle, FileImage } from 'lucide-react';

const statusConfig = {
  submitted:         { label: 'Under Review', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  under_review:      { label: 'Under Review', color: 'text-blue-400',   bg: 'bg-blue-500/20',   icon: Clock },
  approved:          { label: 'Approved',   color: 'text-green-400',  bg: 'bg-green-500/20',  icon: CheckCircle },
  revision_requested:{ label: 'Revision',   color: 'text-orange-400', bg: 'bg-orange-500/20', icon: RefreshCw },
  rejected:          { label: 'Rejected',   color: 'text-red-400',    bg: 'bg-red-500/20',    icon: X },
};

function SubmitModal({ application, onClose, onSuccess }) {
  const [form, setForm] = useState({ title: '', description: '', deliverable: '' });
  const [links, setLinks] = useState([{ platform: 'instagram', url: '', type: 'reel' }]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  const addLink = () => setLinks([...links, { platform: 'instagram', url: '', type: 'post' }]);
  const removeLink = (i) => setLinks(links.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Add a title'); return; }
    if (links.every(l => !l.url) && files.length === 0) {
      toast.error('Add at least one content link or file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('applicationId', application._id);
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('deliverable', form.deliverable);
      formData.append('contentLinks', JSON.stringify(links.filter(l => l.url)));
      files.forEach(f => formData.append('files', f));

      await api.post('/content/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Content submitted! Brand will review it 🎉');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Submit Content</h2>
            <p className="text-gray-400 text-sm mt-1">Upload your work for brand verification</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Submission Title *</label>
            <input className="input-field" placeholder="e.g. Instagram Reel for Summer Campaign" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Which Deliverable?</label>
            <input className="input-field" placeholder="e.g. 1 Instagram Reel (as per requirement)" value={form.deliverable} onChange={e => setForm({ ...form, deliverable: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Description</label>
            <textarea className="input-field h-20 resize-none" placeholder="Tell the brand what you created..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Content Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Content Links (Instagram/YouTube/etc.)</label>
              <button onClick={addLink} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                <Plus size={13} /> Add Link
              </button>
            </div>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-center bg-dark-700/60 border border-dark-600 rounded-xl overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all duration-200 w-full">
                  {/* Platform Select */}
                  <select
                    className="bg-transparent text-xs py-2.5 px-3 text-white focus:outline-none w-28 border-r border-dark-600 cursor-pointer"
                    value={link.platform}
                    onChange={e => { const l = [...links]; l[i].platform = e.target.value; setLinks(l); }}
                  >
                    <option value="instagram" className="bg-dark-800">Instagram</option>
                    <option value="youtube" className="bg-dark-800">YouTube</option>
                    <option value="twitter" className="bg-dark-800">Twitter</option>
                    <option value="tiktok" className="bg-dark-800">TikTok</option>
                    <option value="other" className="bg-dark-800">Other</option>
                  </select>

                  {/* Type Select */}
                  <select
                    className="bg-transparent text-xs py-2.5 px-3 text-white focus:outline-none w-20 border-r border-dark-600 cursor-pointer"
                    value={link.type}
                    onChange={e => { const l = [...links]; l[i].type = e.target.value; setLinks(l); }}
                  >
                    <option value="post" className="bg-dark-800">Post</option>
                    <option value="reel" className="bg-dark-800">Reel</option>
                    <option value="story" className="bg-dark-800">Story</option>
                    <option value="video" className="bg-dark-800">Video</option>
                    <option value="other" className="bg-dark-800">Other</option>
                  </select>

                  {/* URL Input */}
                  <input
                    className="bg-transparent flex-1 text-xs py-2.5 px-3 text-white placeholder-gray-500 focus:outline-none min-w-0"
                    placeholder="Paste URL here..."
                    value={link.url}
                    onChange={e => { const l = [...links]; l[i].url = e.target.value; setLinks(l); }}
                  />

                  {/* Delete button inside the box */}
                  {links.length > 1 && (
                    <button
                      onClick={() => removeLink(i)}
                      className="text-gray-500 hover:text-red-400 p-2.5 border-l border-dark-600 transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Upload Files (Screenshots / Videos)</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-dark-600 hover:border-primary-500 rounded-xl p-6 text-center cursor-pointer transition-all"
            >
              <FileImage size={28} className="mx-auto mb-2 text-gray-500" />
              <p className="text-gray-400 text-sm">Click to upload screenshots or proof</p>
              <p className="text-gray-600 text-xs mt-1">Max 50MB • Images & Videos</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf"
              className="hidden"
              onChange={e => setFiles(Array.from(e.target.files || []))}
            />
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-dark-700 rounded-lg px-3 py-2 text-sm">
                    <FileImage size={14} className="text-primary-400" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-gray-500 text-xs">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                      <X size={14} className="text-gray-500 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Upload size={16} />}
            Submit Content
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreatorContentPage() {
  const [submissions, setSubmissions] = useState([]);
  const [acceptedApps, setAcceptedApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  const fetchData = async () => {
    try {
      const [subRes, appRes] = await Promise.all([
        api.get('/content/creator/all'),
        api.get('/applications/my')
      ]);
      setSubmissions(subRes.data.submissions || []);
      setAcceptedApps(appRes.data.applications?.filter(a => a.status === 'accepted') || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">My Content Submissions</h1>
        <p className="text-gray-400">Upload and track your submitted content</p>
      </div>

      {/* Accepted campaigns ready to submit */}
      {acceptedApps.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-green-500/20">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            Ready to Submit ({acceptedApps.length} active deals)
          </h3>
          <div className="space-y-3">
            {acceptedApps.map(app => (
              <div key={app._id} className="bg-dark-700 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{app.campaign?.title || 'Campaign'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Brand: {app.brand?.name} • Deal: ₹{app.dealAmount?.toLocaleString() || app.proposedRate?.toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedApp(app); setShowModal(true); }}
                  className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap"
                >
                  <Upload size={14} /> Submit Content
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submitted content list */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-dark-600">
          <h3 className="font-bold text-lg">Submission History</h3>
        </div>

        {submissions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Upload size={40} className="mx-auto mb-4 opacity-20" />
            <p>No submissions yet. Submit content for your accepted campaigns.</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-600">
            {submissions.map(sub => {
              const cfg = statusConfig[sub.status] || statusConfig.submitted;
              const Icon = cfg.icon;
              return (
                <div key={sub._id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h4 className="font-semibold">{sub.title}</h4>
                      <div className="text-xs text-gray-400 mt-0.5">{sub.campaign?.title}</div>
                      <div className="text-xs text-gray-500">Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</div>
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium whitespace-nowrap ${cfg.bg} ${cfg.color}`}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                  </div>

                  {sub.description && (
                    <p className="text-gray-400 text-sm mb-3">{sub.description}</p>
                  )}

                  {/* Links */}
                  {sub.contentLinks?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {sub.contentLinks.map((l, i) => (
                        <a
                          key={i}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-primary-500/20 text-primary-400 px-3 py-1.5 rounded-lg hover:bg-primary-500/30 transition-all"
                        >
                          <Link2 size={12} />
                          {l.platform} {l.type}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Files */}
                  {sub.files?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {sub.files.map((f, i) => (
                        <span key={i} className="text-xs bg-dark-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                          <FileImage size={12} className="text-primary-400" />
                          {f.filename}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Brand feedback */}
                  {sub.brandFeedback && (
                    <div className={`p-3 rounded-xl text-sm ${
                      sub.status === 'approved' ? 'bg-green-500/10 text-green-300' :
                      sub.status === 'rejected' ? 'bg-red-500/10 text-red-300' :
                      'bg-orange-500/10 text-orange-300'
                    }`}>
                      <strong>Brand Feedback:</strong> {sub.brandFeedback}
                    </div>
                  )}

                  {sub.revisionNote && (
                    <div className="mt-2 p-3 rounded-xl text-sm bg-orange-500/10 text-orange-300">
                      <strong>Revision Needed:</strong> {sub.revisionNote}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && selectedApp && (
        <SubmitModal
          application={selectedApp}
          onClose={() => { setShowModal(false); setSelectedApp(null); }}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
