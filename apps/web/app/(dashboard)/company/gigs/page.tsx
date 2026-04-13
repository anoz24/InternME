'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-warm-gray bg-cream',
  OPEN: 'text-mint-text bg-mint-bg',
  IN_REVIEW: 'text-alert-text bg-alert-bg',
  IN_PROGRESS: 'text-spark bg-ink',
  SUBMITTED: 'text-spark bg-ink',
  COMPLETED: 'text-warm-white bg-ink',
  DISPUTED: 'text-error-text bg-error-bg',
  CANCELLED: 'text-warm-gray bg-cream',
};

export default function CompanyGigsPage() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGigs = useCallback(async () => {
    try {
      const data: any = await api.get('/api/gigs/mine');
      setGigs(data.data || []);
    } catch {
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGigs(); }, [fetchGigs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">My Gigs</h1>
          <p className="text-warm-gray text-sm mt-1">Manage your active and past gigs</p>
        </div>
        <Link href="/company/post-gig" className="btn-primary">+ Post a gig</Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="card animate-pulse h-20" />)}
        </div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="font-semibold text-ink mb-2">No gigs yet</h2>
          <p className="text-warm-gray text-sm mb-6">Post your first gig to start finding talent</p>
          <Link href="/company/post-gig" className="btn-primary">Post a gig</Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="border-b border-cream">
              <tr>
                <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Title</th>
                <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Status</th>
                <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Applicants</th>
                <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Budget</th>
                <th className="text-right px-6 py-4 text-warm-gray text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream">
              {gigs.map((gig) => (
                <tr key={gig.id} className="hover:bg-cream/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-ink text-sm">{gig.title}</div>
                    <div className="text-warm-gray text-xs mt-0.5">{gig.hoursMin}–{gig.hoursMax} hrs</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-pill ${STATUS_COLORS[gig.status] || 'text-warm-gray bg-cream'}`}>
                      {gig.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ink font-medium">{gig._count?.applications || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-ink font-medium">{gig.budgetEGP.toLocaleString()} EGP</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/company/gigs/${gig.id}/applicants`} className="btn-ghost text-xs py-1.5 px-3">
                        Applicants
                      </Link>
                      {['IN_PROGRESS', 'SUBMITTED'].includes(gig.status) && (
                        <Link href={`/company/gigs/${gig.id}/escrow`} className="btn-primary text-xs py-1.5 px-3">
                          {gig.status === 'SUBMITTED' ? 'Release' : 'Escrow'}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
