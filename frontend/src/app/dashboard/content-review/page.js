'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, RefreshCw, X, Link2, FileImage, Eye, CreditCard } from 'lucide-react';

const getFileUrl = (filePath) => {
  if (!filePath) return '';
  const cleanPath = filePath.replace(/\\/g, '/');
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) return cleanPath;
  return `http://localhost:5000/${cleanPath}`;
};

const statusConfig = {
  submitted:          { label: 'New Submission', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  under_review:       { label: 'Under Review',   color: 'text-blue-400',   bg: 'bg-blue-500/20' },
  approved:           { label: 'Approved',     color: 'text-green-400',  bg: 'bg-green-500/20' },
  revision_requested: { label: 'Revision',     color: 'text-orange-400', bg: 'bg-orange-500/20' },
  rejected:           { label: 'Rejected',     color: 'text-red-400',    bg: 'bg-red-500/20' },
};

function ReviewModal({ submission, onClose, onAction }) {
  const [action, setAction] = useState('');
  const [feedback, setFeedback] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!feedback && action !== 'approve') { toast.error('Please add feedback'); return; }
    setLoading(true);
    try {
      if (action === 'approve') {
        const res = await api.put(`/content/approve/${submission._id}`, { feedback: feedback || 'Great work!' });
        toast.success('Content approved!');
        if (res.data.paymentReady) {
          toast('Payment is ready to release! Go to Payments page.', { icon: '💳' });
        }
      } else if (action === 'revision') {
        await api.put(`/content/revision/${submission._id}`, { note: revisionNote, feedback });
        toast.success('Revision requested. Creator notified.');
      } else if (action === 'reject') {
        await api.put(`/content/reject/${submission._id}`, { feedback });
        toast.success('Content rejected.');
      }
      onAction();
      onClose();
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Review Content</h2>
          <button onClick={onClose}><X size={22} className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="bg-dark-700 rounded-2xl p-4 mb-5">
          <h4 className="font-semibold mb-1">{submission.title}</h4>
          <div className="text-xs text-gray-400 mb-2">by {submission.creator?.name}</div>
          {submission.description && <p className="text-sm text-gray-300">{submission.description}</p>}

          {/* Links */}
          {submission.contentLinks?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {submission.contentLinks.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-primary-500/20 text-primary-400 px-3 py-1.5 rounded-lg hover:bg-primary-500/30">
                  <Link2 size={12} /> {l.platform} — {l.type} ↗
                </a>
              ))}
            </div>
          )}
          {submission.files?.length > 0 && (
            <div className="space-y-3 mt-3 mb-5">
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Submitted Attachments ({submission.files.length})</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {submission.files.map((f, i) => {
                  const url = getFileUrl(f.filePath);
                  const isImage = f.fileType?.startsWith('image');
                  const isVideo = f.fileType?.startsWith('video');

                  return (
                    <div key={i} className="bg-dark-600 rounded-xl p-3 border border-dark-500 hover:border-dark-400 transition-all flex flex-col justify-between">
                      <div className="flex items-center gap-2 mb-2 justify-between">
                        <span className="text-xs text-gray-300 truncate font-medium flex-1">{f.filename}</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" 
                          className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 whitespace-nowrap">
                          Open ↗
                        </a>
                      </div>
                      {isImage ? (
                        <div className="rounded-lg overflow-hidden border border-white/5 bg-black/45 flex items-center justify-center h-28">
                          <img src={url} alt={f.filename} className="h-full w-full object-contain hover:scale-105 transition-all cursor-pointer" onClick={() => window.open(url, '_blank')} />
                        </div>
                      ) : isVideo ? (
                        <div className="rounded-lg overflow-hidden border border-white/5 bg-black/45">
                          <video src={url} controls className="w-full h-28 object-cover" />
                        </div>
                      ) : (
                        <div className="bg-dark-800/40 rounded-lg p-2 flex items-center justify-center text-xs text-gray-400 h-28">
                          📎 Document File
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { id: 'approve', label: 'Approve', bg: 'bg-green-500/20 border-green-500/50 text-green-400' },
            { id: 'revision', label: 'Revision', bg: 'bg-orange-500/20 border-orange-500/50 text-orange-400' },
            { id: 'reject', label: 'Reject', bg: 'bg-red-500/20 border-red-500/50 text-red-400' },
          ].map(a => (
            <button key={a.id} onClick={() => setAction(a.id)}
              className={`py-3 rounded-xl border-2 font-medium transition-all ${a.bg} ${action === a.id ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-80'}`}>
              {a.label}
            </button>
          ))}
        </div>

        {action && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                {action === 'approve' ? 'Feedback (optional)' : 'Feedback for Creator *'}
              </label>
              <textarea
                className="input-field h-20 resize-none"
                placeholder={
                  action === 'approve' ? 'Great work! The content was perfect.' :
                  action === 'revision' ? 'Please make these changes...' :
                  'Unfortunately this content does not meet our requirements because...'
                }
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
              />
            </div>

            {action === 'revision' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">Specific Revision Notes</label>
                <textarea
                  className="input-field h-20 resize-none"
                  placeholder="Change the background music, add our logo at the end..."
                  value={revisionNote}
                  onChange={e => setRevisionNote(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Submit Review'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContentReviewPage() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchData = async () => {
    try {
      const { data } = await api.get('/content/brand/all');
      setSubmissions(data.submissions || []);
    } catch (err) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = filter === 'all' ? submissions :
    submissions.filter(s => s.status === filter);

  const pendingCount = submissions.filter(s => s.status === 'submitted').length;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Review Content</h1>
          <p className="text-gray-400">Verify creator submissions before releasing payment</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium">
            <Eye size={16} /> {pendingCount} new submission{pendingCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-5 border border-primary-500/20">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-semibold text-2xl">1. Review</div>
            <div className="text-gray-400 text-xs">Check the submitted content links and files</div>
          </div>
          <div>
            <div className="font-semibold text-2xl">2. Approve</div>
            <div className="text-gray-400 text-xs">If satisfied, approve the submission</div>
          </div>
          <div>
            <div className="font-semibold text-2xl">3. Release Payment</div>
            <div className="text-gray-400 text-xs">Go to Payments page to release held funds</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'submitted', 'approved', 'revision_requested', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-sm px-4 py-2 rounded-xl capitalize transition-all ${
              filter === s ? 'bg-primary-500 text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
            {s === 'submitted' && pendingCount > 0 && (
              <span className="ml-2 bg-yellow-400 text-dark-900 text-xs px-1.5 py-0.5 rounded-full font-bold">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Submissions list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-gray-400">
            <Eye size={40} className="mx-auto mb-4 opacity-20" />
            <p>No submissions yet. Creators will submit content here after you hire them.</p>
          </div>
        ) : (
          filtered.map(sub => {
            const cfg = statusConfig[sub.status] || statusConfig.submitted;
            return (
              <div key={sub._id} className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(sub.creator?.name || 'C')}&background=4F63FF&color=fff&size=44`}
                      className="w-11 h-11 rounded-xl flex-shrink-0"
                    />
                    <div>
                      <div className="font-bold text-lg">{sub.title}</div>
                      <div className="text-gray-400 text-sm">by {sub.creator?.name} • {sub.campaign?.title}</div>
                      <div className="text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-xl font-mono whitespace-nowrap ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>

                {sub.deliverable && (
                  <div className="text-sm text-primary-400 mb-2">📦 Deliverable: {sub.deliverable}</div>
                )}
                {sub.description && (
                  <p className="text-gray-300 text-sm mb-4">{sub.description}</p>
                )}

                {sub.contentLinks?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {sub.contentLinks.map((l, i) => (
                      <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm bg-primary-500/20 text-primary-400 px-3 py-2 rounded-xl hover:bg-primary-500/30 transition-all">
                        <Link2 size={14} /> {l.platform} — {l.type} ↗
                      </a>
                    ))}
                  </div>
                )}

                 {sub.files?.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider font-semibold">Submitted Attachments ({sub.files.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {sub.files.map((f, i) => {
                        const url = getFileUrl(f.filePath);
                        const isImage = f.fileType?.startsWith('image');
                        const isVideo = f.fileType?.startsWith('video');

                        return (
                          <div key={i} className="bg-dark-700/50 rounded-xl p-3 border border-dark-600 hover:border-dark-500 transition-all flex flex-col justify-between">
                            <div className="flex items-center gap-2 mb-2 justify-between">
                              <span className="text-xs text-gray-300 truncate font-medium flex-1">{f.filename}</span>
                              <a href={url} target="_blank" rel="noopener noreferrer" 
                                className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 whitespace-nowrap">
                                Open ↗
                              </a>
                            </div>
                            {isImage ? (
                              <div className="rounded-lg overflow-hidden border border-white/5 bg-black/45 flex items-center justify-center h-28">
                                <img src={url} alt={f.filename} className="h-full w-full object-contain hover:scale-105 transition-all cursor-pointer" onClick={() => window.open(url, '_blank')} />
                              </div>
                            ) : isVideo ? (
                              <div className="rounded-lg overflow-hidden border border-white/5 bg-black/45">
                                <video src={url} controls className="w-full h-28 object-cover" />
                              </div>
                            ) : (
                              <div className="bg-dark-800/40 rounded-lg p-2 flex items-center justify-center text-xs text-gray-400 h-28">
                                📎 Document File
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sub.brandFeedback && (
                  <div className="bg-dark-700 rounded-xl p-3 text-sm text-gray-300 mb-3">
                    <span className="text-gray-500">Your feedback: </span>{sub.brandFeedback}
                  </div>
                )}

                {(sub.status === 'submitted' || sub.status === 'under_review') && (
                  <button
                    onClick={() => setReviewing(sub)}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <Eye size={15} /> Review This Content
                  </button>
                )}

                {sub.status === 'approved' && (
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 text-sm flex items-center gap-1"><CheckCircle size={15} /> Approved</span>
                    <button
                      onClick={() => window.location.href = '/dashboard/payments'}
                      className="text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 px-4 py-2 rounded-xl transition-all flex items-center gap-1"
                    >
                      <CreditCard size={14} /> Release Payment →
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {reviewing && (
        <ReviewModal
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onAction={fetchData}
        />
      )}
    </div>
  );
}
