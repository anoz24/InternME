'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export default function StudentEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const d = await api.get<any>('/api/profile/student/earnings');
        setData(d);
      } catch {
        setData({ totalEarned: 0, gigCount: 0, pending: 0, transactions: [] });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="animate-pulse card h-40" />;

  return (
    <div className="max-w-3xl">
      <h1 className="page-title mb-2">Earnings</h1>
      <p className="text-warm-gray text-sm mb-8">Your payout history from completed gigs</p>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total earned', value: `${(data?.totalEarned || 0).toLocaleString()} EGP`, icon: '💰' },
          { label: 'Gigs completed', value: data?.gigCount || 0, icon: '✅' },
          { label: 'Pending payout', value: `${(data?.pending || 0).toLocaleString()} EGP`, icon: '⏳' },
        ].map((card) => (
          <div key={card.label} className="card">
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="font-display text-2xl font-bold text-ink">{card.value}</div>
            <div className="text-warm-gray text-xs mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* InternMe fee explainer */}
      <div className="card mb-8 border-gold/30 bg-alert-bg">
        <h2 className="font-semibold text-ink mb-3">How payouts work</h2>
        <div className="space-y-2 text-sm text-warm-gray">
          <div className="flex justify-between">
            <span>Company pays</span>
            <span className="text-ink font-medium">Budget × 1.15</span>
          </div>
          <div className="flex justify-between">
            <span>InternMe keeps (B2B fee)</span>
            <span className="text-ink font-medium">15% from company</span>
          </div>
          <div className="flex justify-between">
            <span>InternMe keeps (B2C fee)</span>
            <span className="text-ink font-medium">10% from intern</span>
          </div>
          <div className="flex justify-between border-t border-gold/20 pt-2">
            <span className="font-semibold text-ink">You receive</span>
            <span className="font-bold text-mint-text">Budget × 0.90</span>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      {data?.transactions?.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-4 border-b border-cream">
            <h2 className="font-semibold text-ink">Transaction history</h2>
          </div>
          <table className="w-full">
            <thead className="border-b border-cream bg-cream/30">
              <tr>
                <th className="text-left px-6 py-3 text-warm-gray text-xs font-medium">Date</th>
                <th className="text-left px-6 py-3 text-warm-gray text-xs font-medium">Description</th>
                <th className="text-right px-6 py-3 text-warm-gray text-xs font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {data.transactions.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-cream/20 transition-colors">
                  <td className="px-6 py-4 text-warm-gray text-sm">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-ink text-sm">
                    {tx.type === 'INTERN_PAYOUT' ? 'Payout — Gig completed' : tx.type}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-mint-text">
                    +{tx.amountEGP.toLocaleString()} EGP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card text-center py-16">
          <div className="text-4xl mb-4">📭</div>
          <h2 className="font-semibold text-ink mb-2">No earnings yet</h2>
          <p className="text-warm-gray text-sm">Complete a gig and get paid — your first payout will appear here.</p>
        </div>
      )}
    </div>
  );
}
