'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function EscrowPage() {
  const { id } = useParams<{ id: string }>();
  const [gig, setGig] = useState<any>(null);
  const [escrow, setEscrow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [releasing, setReleasing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const gigData = await api.get<any>(`/api/gigs/${id}`);
      setGig(gigData);
      const escrowData = await api.get<any>(`/api/escrow/${id}`);
      setEscrow(escrowData);
    } catch {
      // escrow might not exist yet
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function createEscrow() {
    setCreating(true);
    try {
      const data = await api.post<any>('/api/escrow/create', { gigId: id });
      toast.success('Escrow created!');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create escrow');
    } finally {
      setCreating(false);
    }
  }

  async function mockPay() {
    if (!escrow) return;
    setPaying(true);
    try {
      await api.post(`/api/escrow/mock-pay/${escrow.id}`);
      toast.success('Payment simulated — funds held in escrow!');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Mock pay failed');
    } finally {
      setPaying(false);
    }
  }

  async function releaseFunds() {
    setReleasing(true);
    try {
      await api.post(`/api/escrow/release/${id}`);
      toast.success('Payment released to intern!');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Release failed');
    } finally {
      setReleasing(false);
    }
  }

  if (loading) return <div className="animate-pulse card h-60" />;

  const step = !escrow ? 1 : escrow.status === 'PENDING' ? 2 : escrow.status === 'HELD' ? 3 : 4;

  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-2">Escrow & Payment</h1>
      {gig && <p className="text-warm-gray text-sm mb-8">{gig.title}</p>}

      {/* Steps indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: 'Create escrow' },
          { n: 2, label: 'Fund escrow' },
          { n: 3, label: 'Review & release' },
          { n: 4, label: 'Completed' },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step > s.n ? 'bg-mint-text text-warm-white' : step === s.n ? 'bg-ink text-spark' : 'bg-cream text-warm-gray'}`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <div className="min-w-0">
              <div className={`text-xs font-medium truncate ${step >= s.n ? 'text-ink' : 'text-warm-gray'}`}>{s.label}</div>
            </div>
            {i < 3 && <div className={`h-px flex-1 ${step > s.n ? 'bg-mint-text' : 'bg-cream'}`} />}
          </div>
        ))}
      </div>

      {/* Step cards */}
      {!escrow && (
        <div className="card mb-4">
          <h2 className="font-semibold text-ink mb-4">Create Escrow</h2>
          {gig && (
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-warm-gray">Intern budget</span>
                <span className="font-medium">{gig.budgetEGP.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">InternMe fee (15%)</span>
                <span className="font-medium">{Math.round(gig.budgetEGP * 0.15).toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between border-t border-cream pt-2">
                <span className="text-ink font-semibold">Total charged</span>
                <span className="font-bold text-ink">{Math.round(gig.budgetEGP * 1.15).toLocaleString()} EGP</span>
              </div>
            </div>
          )}
          <button onClick={createEscrow} disabled={creating} className="btn-primary">
            {creating ? 'Creating…' : 'Create escrow'}
          </button>
        </div>
      )}

      {escrow && (
        <div className="space-y-4">
          {/* Breakdown card */}
          <div className="card">
            <h2 className="font-semibold text-ink mb-4">Escrow Breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-gray">Total charged</span>
                <span className="font-medium">{escrow.totalCharged.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">InternMe B2B fee</span>
                <span className="font-medium">- {escrow.platformFeeB2B.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between border-t border-cream pt-2">
                <span className="text-ink font-semibold">Intern payout (after our 10% fee)</span>
                <span className="font-bold text-mint-text">{escrow.internPayout.toLocaleString()} EGP</span>
              </div>
            </div>
            <div className={`mt-4 px-3 py-2 rounded text-xs font-medium ${escrow.status === 'HELD' ? 'text-mint-text bg-mint-bg' : escrow.status === 'RELEASED' ? 'text-warm-white bg-ink' : escrow.status === 'REFUNDED' ? 'text-error-text bg-error-bg' : 'text-alert-text bg-alert-bg'}`}>
              Status: {escrow.status}
            </div>
          </div>

          {/* Fund / Release */}
          {escrow.status === 'PENDING' && (
            <div className="card">
              <h2 className="font-semibold text-ink mb-2">Fund Escrow (Demo)</h2>
              <p className="text-warm-gray text-sm mb-4">In production, this redirects to Paymob. For this demo, click the button to simulate payment.</p>
              <button onClick={mockPay} disabled={paying} className="btn-primary">
                {paying ? 'Processing…' : '💳 Simulate Payment (Mock Pay)'}
              </button>
            </div>
          )}

          {escrow.status === 'HELD' && gig?.status === 'SUBMITTED' && (
            <div className="card">
              <h2 className="font-semibold text-ink mb-2">Release Payment</h2>
              <p className="text-warm-gray text-sm mb-4">The intern has submitted their deliverable. Review it, then release payment to complete the gig.</p>
              {gig.deliverable && (
                <div className="bg-cream/50 rounded-btn p-4 mb-4">
                  <p className="text-warm-gray text-xs font-medium mb-1">Deliverable submitted:</p>
                  <p className="text-ink text-sm break-words">{gig.deliverable}</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={releaseFunds} disabled={releasing} className="btn-primary">
                  {releasing ? 'Releasing…' : `✓ Release ${escrow.internPayout.toLocaleString()} EGP`}
                </button>
              </div>
            </div>
          )}

          {escrow.status === 'RELEASED' && (
            <div className="card border-mint-text/30 bg-mint-bg/20">
              <h2 className="text-mint-text font-semibold mb-2">✓ Payment Released</h2>
              <p className="text-warm-gray text-sm">The gig is complete. {escrow.internPayout.toLocaleString()} EGP was sent to the intern.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
