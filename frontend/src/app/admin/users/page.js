'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { Users, Shield, Zap, Ban, CheckCircle, Star, Search, Trash2 } from 'lucide-react';

export default function AdminUsersPage() {
  const { user } = useSelector(state => state.auth);
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({ search, role: roleFilter });
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const handleBan = async (userId, isBanned) => {
    try {
      await api.put(`/admin/users/${userId}/ban`, { isBanned });
      toast.success(`User ${isBanned ? 'banned' : 'unbanned'}`);
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const handleVerify = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/verify`);
      toast.success('User verified');
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const handleFeature = async (userId, isFeatured) => {
    try {
      await api.put(`/admin/users/${userId}/feature`, { isFeatured });
      toast.success(`Creator ${isFeatured ? 'featured' : 'unfeatured'}`);
      fetchUsers();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 page-enter space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">User Management</h1>
          <p className="text-gray-400">View and manage all registered brands and creators</p>
        </div>

        {/* Users Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-dark-600">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  className="input-field py-2.5 text-sm"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Search users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                className="input-field py-2.5 text-sm w-40"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="creator">Creators</option>
                <option value="brand">Brands</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  {['User', 'Role', 'AI Score', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=22223A&color=4F63FF&size=32`}
                          className="w-8 h-8 rounded-lg"
                        />
                        <div>
                          <div className="font-medium text-sm">{u.name}</div>
                          <div className="text-gray-500 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-mono ${
                        u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                        u.role === 'brand' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'creator' ? (
                        <span className={`text-sm font-bold ${
                          (u.creatorProfile?.aiScore || 0) >= 75 ? 'text-green-400' :
                          (u.creatorProfile?.aiScore || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {u.creatorProfile?.aiScore || 0}/100
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.isVerified && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✓ Verified</span>
                        )}
                        {u.isBanned && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Banned</span>
                        )}
                        {!u.isVerified && !u.isBanned && (
                          <span className="text-xs text-gray-500">Active</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {!u.isVerified && u.role !== 'admin' && (
                          <button
                            onClick={() => handleVerify(u._id)}
                            className="text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                          >
                            <CheckCircle size={12} /> Verify
                          </button>
                        )}
                        {u.role === 'creator' && !u.creatorProfile?.isFeatured && (
                          <button
                            onClick={() => handleFeature(u._id, true)}
                            className="text-xs bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 px-2 py-1 rounded-lg transition-all"
                            title="Feature Creator"
                          >
                            <Star size={12} />
                          </button>
                        )}
                        {u.role === 'creator' && u.creatorProfile?.isFeatured && (
                          <button
                            onClick={() => handleFeature(u._id, false)}
                            className="text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-2 py-1 rounded-lg transition-all"
                            title="Unfeature Creator"
                          >
                            <Star size={12} fill="currentColor" />
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleBan(u._id, !u.isBanned)}
                            className={`text-xs px-2 py-1 rounded-lg transition-all ${
                              u.isBanned
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                          >
                            {u.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        )}
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(u._id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Delete User"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="text-center py-12 text-gray-400">No users found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
