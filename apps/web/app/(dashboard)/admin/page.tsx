'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

type Tab = 'overview' | 'users' | 'escrows' | 'disputes';

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="card">
      <div className="text-warm-gray text-xs font-medium mb-1">{label}</div>
      <div className={`font-display text-3xl font-bold ${color || 'text-ink'}`}>{value}</div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any>(null);
  const [escrows, setEscrows] = useState<any>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const d = await api.get<any>('/api/admin/stats');
      setStats(d);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load stats');
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<any>('/api/admin/users?limit=50');
      setUsers(d);
    } finally { setLoading(false); }
  }, []);

  const loadEscrows = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<any>('/api/admin/escrows?limit=30');
      setEscrows(d);
    } finally { setLoading(false); }
  }, []);

  const loadDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api.get<any[]>('/api/admin/disputes');
      setDisputes(d);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    if (tab === 'users') loadUsers();
    else if (tab === 'escrows') loadEscrows();
    else if (tab === 'disputes') loadDisputes();
  }, [tab, loadUsers, loadEscrows, loadDisputes]);

  async function resolveDispute(gigId: string, resolution: 'RELEASE' | 'REFUND') {
    const note = prompt(`Note for ${resolution === 'RELEASE' ? 'releasing to intern' : 'refunding company'}:`);
    if (note === null) return;
    try {
      await api.post(`/api/admin/disputes/${gigId}/resolve`, { resolution, note });
      toast.success('Dispute resolved');
      loadDisputes();
      loadStats();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve');
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title mb-1">Admin Panel</h1>
        <p className="text-warm-gray text-sm">InternMe platform operations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-cream">
        {(['overview', 'users', 'escrows', 'disputes'] as Tab[]).map((t) => (
          <button key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-ink text-ink' : 'border-transparent text-warm-gray hover:text-ink'}`}>
            {t === 'disputes' && disputes.length > 0 ? `Disputes (${disputes.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div>
          {!stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(7).fill(0).map((_, i) => <div key={i} className="card animate-pulse h-24" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total users" value={stats.totalUsers} />
                <StatCard label="Students" value={stats.totalStudents} color="text-gold" />
                <StatCard label="Companies" value={stats.totalCompanies} />
                <StatCard label="Total gigs" value={stats.totalGigs} />
                <StatCard label="Escrows created" value={stats.totalEscrows} />
                <StatCard label="Platform revenue" value={`${(stats.totalRevenue || 0).toLocaleString()} EGP`} color="text-mint-text" />
                <StatCard label="Active disputes" value={stats.activeDisputes} color={stats.activeDisputes > 0 ? 'text-error-text' : 'text-ink'} />
              </div>

              {stats.activeDisputes > 0 && (
                <div className="card border-error-text/30 bg-error-bg mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-error-text">{stats.activeDisputes} active dispute{stats.activeDisputes > 1 ? 's' : ''}</h3>
                      <p className="text-warm-gray text-sm">Require your attention</p>
                    </div>
                    <button onClick={() => setTab('disputes')} className="btn-primary text-sm">
                      View disputes →
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="font-semibold text-ink mb-3">Revenue breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-warm-gray">Total platform revenue</span>
                      <span className="font-semibold text-mint-text">{(stats.totalRevenue || 0).toLocaleString()} EGP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-warm-gray">From {stats.totalEscrows} escrow(s)</span>
                      <span className="text-ink">~{stats.totalEscrows > 0 ? Math.round(stats.totalRevenue / stats.totalEscrows).toLocaleString() : 0} EGP avg</span>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <h3 className="font-semibold text-ink mb-3">User mix</h3>
                  <div className="flex items-end gap-4 h-20">
                    {[
                      { label: 'Students', value: stats.totalStudents, total: stats.totalUsers, color: 'bg-gold' },
                      { label: 'Companies', value: stats.totalCompanies, total: stats.totalUsers, color: 'bg-ink' },
                    ].map((bar) => (
                      <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-warm-gray text-xs">{bar.value}</span>
                        <div className="w-full rounded-t" style={{ height: `${Math.max(4, (bar.value / Math.max(bar.total, 1)) * 60)}px`, background: bar.color === 'bg-gold' ? '#C4A000' : '#1A1A14' }} />
                        <span className="text-warm-gray text-xs">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Users ── */}
      {tab === 'users' && (
        <div>
          {loading ? (
            <div className="animate-pulse space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="h-12 bg-cream rounded" />)}</div>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead className="border-b border-cream">
                  <tr>
                    <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Name</th>
                    <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Email</th>
                    <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Role</th>
                    <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Activity</th>
                    <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream">
                  {(users?.data || []).map((u: any) => (
                    <tr key={u.id} className="hover:bg-cream/20 transition-colors">
                      <td className="px-6 py-3 font-medium text-ink text-sm">{u.name}</td>
                      <td className="px-6 py-3 text-warm-gray text-sm">{u.personalEmail}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-1 rounded-pill font-medium ${u.role === 'STUDENT' ? 'bg-alert-bg text-alert-text' : u.role === 'COMPANY' ? 'bg-mint-bg text-mint-text' : 'bg-ink text-spark'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-warm-gray text-xs">
                        {u._count.gigsPosted > 0 && `${u._count.gigsPosted} gig${u._count.gigsPosted > 1 ? 's' : ''} posted`}
                        {u._count.applications > 0 && `${u._count.applications} application${u._count.applications > 1 ? 's' : ''}`}
                        {u._count.gigsPosted === 0 && u._count.applications === 0 && '—'}
                      </td>
                      <td className="px-6 py-3 text-warm-gray text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!users?.data?.length && (
                <div className="text-center py-12 text-warm-gray">No users found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Escrows ── */}
      {tab === 'escrows' && (
        <div>
          {loading ? (
            <div className="animate-pulse space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="h-12 bg-cream rounded" />)}</div>
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead className="border-b border-cream">
                  <tr>
                    <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Gig</th>
                    <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Company</th>
                    <th className="text-left px-6 py-4 text-warm-gray text-xs font-medium">Status</th>
                    <th className="text-right px-6 py-4 text-warm-gray text-xs font-medium">Total Charged</th>
                    <th className="text-right px-6 py-4 text-warm-gray text-xs font-medium">Intern Payout</th>
                    <th className="text-right px-6 py-4 text-warm-gray text-xs font-medium">Platform</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream">
                  {(escrows?.data || []).map((e: any) => (
                    <tr key={e.id} className="hover:bg-cream/20 transition-colors">
                      <td className="px-6 py-3 text-ink text-sm font-medium max-w-xs truncate">{e.gig?.title}</td>
                      <td className="px-6 py-3 text-warm-gray text-sm">{e.gig?.company?.name}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-1 rounded-pill font-medium ${e.status === 'HELD' ? 'bg-alert-bg text-alert-text' : e.status === 'RELEASED' ? 'bg-mint-bg text-mint-text' : e.status === 'REFUNDED' ? 'bg-error-bg text-error-text' : 'bg-cream text-warm-gray'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-ink text-sm">{e.totalCharged.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-mint-text text-sm font-medium">{e.internPayout.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right text-gold text-sm font-medium">{(e.platformFeeB2B + e.platformFeeB2C).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!escrows?.data?.length && (
                <div className="text-center py-12 text-warm-gray">No escrows yet</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Disputes ── */}
      {tab === 'disputes' && (
        <div>
          {loading ? (
            <div className="animate-pulse space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="card h-32" />)}</div>
          ) : disputes.length === 0 ? (
            <div className="card text-center py-16">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="font-semibold text-ink">No active disputes</h2>
              <p className="text-warm-gray text-sm mt-1">The platform is running smoothly</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((gig) => (
                <div key={gig.id} className="card border-error-text/30">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-ink">{gig.title}</h3>
                      <p className="text-warm-gray text-xs mt-1">
                        Company: {gig.company?.name} · Intern: {gig.intern?.name || 'N/A'}
                      </p>
                    </div>
                    <span className="tag-error">DISPUTED</span>
                  </div>

                  {gig.escrow && (
                    <div className="bg-cream/50 rounded-btn p-3 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-warm-gray">Escrow held</span>
                        <span className="font-semibold text-ink">{gig.escrow.totalCharged.toLocaleString()} EGP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-warm-gray">Intern would receive</span>
                        <span className="text-mint-text font-semibold">{gig.escrow.internPayout.toLocaleString()} EGP</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => resolveDispute(gig.id, 'RELEASE')}
                      className="btn-primary text-sm"
                    >
                      ✓ Release to intern
                    </button>
                    <button
                      onClick={() => resolveDispute(gig.id, 'REFUND')}
                      className="btn-ghost text-sm text-error-text border-error-text/30 hover:bg-error-bg"
                    >
                      ↩ Refund company
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
