'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { DollarSign, Clock, CheckCircle, Lock, TrendingUp, Wallet } from 'lucide-react';

const statusConfig = {
  held:     { label: '🔒 Pending Release', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  released: { label: '✅ Received',         color: 'text-green-400',  bg: 'bg-green-500/20' },
  refunded: { label: '↩ Refunded',          color: 'text-blue-400',   bg: 'bg-blue-500/20' },
};

export default function CreatorEarningsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ earned: 0, pending: 0 });

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/payments/creator/all');
        setPayments(data.payments || []);
        setTotals({ earned: data.totalEarned || 0, pending: data.totalPending || 0 });
      } catch (err) {
        toast.error('Failed to load earnings');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">My Earnings</h1>
        <p className="text-gray-400">Track your payments and pending amounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-6">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle size={22} className="text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-400 mb-1">₹{totals.earned.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">Total Earned</div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-3">
            <Lock size={22} className="text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400 mb-1">₹{totals.pending.toLocaleString()}</div>
          <div className="text-gray-400 text-sm">In Escrow (Pending)</div>
        </div>
        <div className="glass rounded-2xl p-6">
          <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-3">
            <TrendingUp size={22} className="text-primary-400" />
          </div>
          <div className="text-3xl font-bold text-primary-400 mb-1">{payments.length}</div>
          <div className="text-gray-400 text-sm">Total Deals</div>
        </div>
      </div>

      {/* How it works */}
      <div className="glass rounded-2xl p-6 border border-primary-500/20">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Wallet size={18} className="text-primary-500" /> How Payments Work
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Brand Pays', desc: 'Brand pays and amount is held securely on CollabBridge' },
            { step: '2', title: 'You Submit', desc: 'You submit your content/post as per campaign requirements' },
            { step: '3', title: 'You Receive', desc: 'Brand approves your content and payment is released to you' },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="bg-dark-700 rounded-xl p-4">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-semibold mb-1">{title}</div>
              <div className="text-gray-400 text-xs leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment list */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-dark-600">
          <h3 className="font-bold text-lg">Payment History</h3>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <DollarSign size={40} className="mx-auto mb-4 opacity-20" />
            <p>No payments yet. Apply to campaigns to start earning!</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-600">
            {payments.map(p => {
              const cfg = statusConfig[p.status] || statusConfig.held;
              return (
                <div key={p._id} className="p-5 flex items-center gap-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.brand?.name || 'B')}&background=22223A&color=4F63FF&size=44`}
                    className="w-11 h-11 rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{p.brand?.brandProfile?.companyName || p.brand?.name}</div>
                    <div className="text-xs text-gray-400">{p.campaign?.title}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{p.transactionId}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xl text-green-400">₹{p.creatorAmount?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">of ₹{p.amount?.toLocaleString()} total</div>
                  </div>
                  <span className={`text-xs px-3 py-1.5 rounded-xl font-mono whitespace-nowrap ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
