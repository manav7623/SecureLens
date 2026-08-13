'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { CreditCard, Search, DollarSign, RefreshCw, Layers } from 'lucide-react';

export default function AdminPaymentsPage() {
  const { user } = useSelector(state => state.auth);
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [totalVolume, setTotalVolume] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data } = await api.get('/payments/admin/all');
      setPayments(data.payments || []);
      setTotalVolume(data.totalVolume || 0);
      setTotalFees(data.totalFees || 0);
    } catch (err) {
      toast.error('Failed to load platform payments');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    (p.brand?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.creator?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.campaign?.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 page-enter space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-1">Escrow & Payments</h1>
          <p className="text-gray-400">Monitor deal transactions, platform fees, and escrow status</p>
        </div>

        {/* Stats Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <CreditCard size={24} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Total Platform Volume</div>
              <div className="text-2xl font-bold text-white font-mono">₹{totalVolume.toLocaleString()}</div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Platform Fee Revenue (10%)</div>
              <div className="text-2xl font-bold text-green-400 font-mono">₹{totalFees.toLocaleString()}</div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Layers size={24} />
            </div>
            <div>
              <div className="text-gray-400 text-sm">Total Transactions</div>
              <div className="text-2xl font-bold text-white font-mono">{payments.length}</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="glass rounded-2xl p-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              className="input-field py-2.5 text-sm w-full"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by brand, creator, or campaign..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  {['Campaign', 'Brand', 'Creator', 'Amount', 'Fee', 'Creator Payout', 'Escrow Status', 'Paid Date'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {filteredPayments.map(p => (
                  <tr key={p._id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-white">
                      {p.campaign?.title || 'Unknown Campaign'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {p.brand?.name || 'Unknown Brand'}
                      <span className="block text-xs text-gray-500">{p.brand?.email}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {p.creator?.name || 'Unknown Creator'}
                      <span className="block text-xs text-gray-500">{p.creator?.email}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-white font-mono">
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-yellow-500 font-mono">
                      ₹{p.platformFee?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-400 font-mono">
                      ₹{p.creatorAmount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className={`px-2 py-0.5 rounded-full ${
                        p.status === 'released' ? 'bg-green-500/20 text-green-400' :
                        p.status === 'held' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {p.paidAt ? new Date(p.paidAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <div className="text-center py-12 text-gray-400">No payment records found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
