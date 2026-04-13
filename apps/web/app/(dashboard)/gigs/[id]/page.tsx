'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function MatchCircle({ score }: { score: number }) {
  const color = score >= 70 ? '#0D9E75' : score >= 40 ? '#C4A000' : '#7A7A6A';
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="36" fill="none" stroke="#E8E0C8" strokeWidth="6" />
          <circle cx="48" cy="48" r="36" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-2xl font-bold" style={{ color }}>{score}%</span>
        </div>
      </div>
      <span className="text-warm-gray text-xs">match score</span>
    </div>
  );
}

export default function GigDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [coverNote, setCoverNote] = useState('');

  useEffect(() => {
    api.get<any>(`/api/gigs/${id}`)
      .then(setGig)
      .catch(() => toast.error('Failed to load gig'))
      .finally(() => setLoading(false));
  }, [id]);

  async function apply() {
    setApplying(true);
    try {
      await api.post(`/api/gigs/${id}/apply`, { coverNote: coverNote || undefined });
      setApplied(true);
      setModalOpen(false);
      toast.success('Application submitted!');
    } catch (err: any) {
      if (err.status === 409) setApplied(true);
      toast.error(err.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  }

  if (loading) return (
    <div className="max-w-4xl animate-pulse">
      <div className="skeleton h-8 w-3/4 mb-4 rounded" />
      <div className="skeleton h-4 w-full mb-2 rounded" />
      <div className="skeleton h-4 w-full mb-2 rounded" />
      <div className="skeleton h-4 w-2/3 rounded" />
    </div>
  );

  if (!gig) return (
    <div className="text-center py-20">
      <p className="font-semibold text-ink">Gig not found</p>
      <Link href="/gigs" className="text-gold text-sm mt-2 block hover:text-spark">← Back to gigs</Link>
    </div>
  );

  return (
    <div className="max-w-4xl">
      <Link href="/gigs" className="text-warm-gray text-sm hover:text-ink transition-colors mb-6 inline-block">
        ← Back to gigs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {gig.skills.map((s: string) => (
                <span key={s} className="tag-category">{s}</span>
              ))}
            </div>
            <h1 className="font-display text-3xl text-ink font-bold leading-tight">{gig.title}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm text-warm-gray">
              <span>{gig.budgetEGP.toLocaleString()} EGP</span>
              <span>·</span>
              <span>{gig.hoursMin}–{gig.hoursMax} hours</span>
              <span>·</span>
              <span>{new Date(gig.createdAt).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-ink mb-3">About this gig</h2>
            <p className="text-warm-gray text-sm leading-relaxed whitespace-pre-wrap">{gig.description}</p>
          </div>

          <div className="card">
            <h2 className="font-semibold text-ink mb-3">Skills needed</h2>
            <div className="flex flex-wrap gap-2">
              {gig.skills.map((s: string) => (
                <span key={s} className="tag-skill">{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky sidebar */}
        <div className="lg:sticky lg:top-8 space-y-4 h-fit">
          <div className="card text-center">
            {user?.role === 'STUDENT' && gig.matchScore != null && (
              <div className="mb-6">
                <MatchCircle score={gig.matchScore} />
              </div>
            )}

            <div className="text-2xl font-display font-bold text-ink mb-1">
              {gig.budgetEGP.toLocaleString()} EGP
            </div>
            <div className="text-warm-gray text-sm mb-1">{gig.hoursMin}–{gig.hoursMax} hours</div>
            <div className="text-warm-gray text-xs mb-6">{gig._count?.applications || 0} applicants</div>

            {user?.role === 'STUDENT' && (
              applied || gig.status !== 'OPEN' ? (
                <button className="btn-ghost w-full justify-center cursor-default" disabled>
                  {applied ? '✓ Applied' : 'Not accepting applications'}
                </button>
              ) : (
                <button className="btn-primary w-full justify-center" onClick={() => setModalOpen(true)}>
                  Apply now
                </button>
              )
            )}

            {user?.role === 'COMPANY' && (
              <Link href={`/company/gigs/${gig.id}/applicants`} className="btn-primary w-full justify-center block text-center">
                View applicants
              </Link>
            )}
          </div>

          <div className="card">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-gray">Status</span>
                <span className="font-medium text-ink">{gig.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Budget</span>
                <span className="font-medium text-ink">{gig.budgetEGP.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Duration</span>
                <span className="font-medium text-ink">{gig.hoursMin}–{gig.hoursMax} hrs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-gray">Posted</span>
                <span className="font-medium text-ink">{new Date(gig.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-ink/70 flex items-center justify-center z-50 px-4">
          <div className="bg-warm-white rounded-modal p-8 max-w-md w-full">
            <h2 className="font-display text-2xl text-ink font-bold mb-2">Apply to this gig</h2>
            <p className="text-warm-gray text-sm mb-6">{gig.title}</p>
            <div className="mb-6">
              <label className="block text-warm-gray text-xs font-medium mb-2">
                Cover note <span className="text-warm-gray/60">(optional, max 500 chars)</span>
              </label>
              <textarea
                className="input-field h-36 resize-none pt-3"
                placeholder="Tell them why you're the right fit for this gig…"
                maxLength={500}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
              />
              <div className="text-right text-warm-gray text-xs mt-1">{coverNote.length}/500</div>
            </div>
            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary flex-1 justify-center" onClick={apply} disabled={applying}>
                {applying ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
