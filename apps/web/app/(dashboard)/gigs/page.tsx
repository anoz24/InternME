'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

const SKILLS_LIST = ['React', 'Node.js', 'TypeScript', 'Python', 'Figma', 'UI/UX', 'PostgreSQL', 'MongoDB', 'Express', 'Next.js', 'Flutter', 'Java', 'C++', 'Marketing', 'SEO', 'Copywriting', 'Video Editing', 'Motion Graphics', 'Data Analysis'];

function statusColor(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'text-warm-gray bg-cream',
    OPEN: 'text-mint-text bg-mint-bg',
    IN_REVIEW: 'text-alert-text bg-alert-bg',
    IN_PROGRESS: 'text-spark bg-ink',
    SUBMITTED: 'text-spark bg-ink',
    COMPLETED: 'text-warm-white bg-ink',
    DISPUTED: 'text-error-text bg-error-bg',
  };
  return map[status] || 'text-warm-gray bg-cream';
}

function MatchBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const color = score >= 70 ? 'text-mint-text bg-mint-bg' : score >= 40 ? 'text-alert-text bg-alert-bg' : 'text-warm-gray bg-cream';
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-pill ${color}`}>
      {score}% match
    </span>
  );
}

function GigCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="skeleton h-5 w-3/4 mb-3 rounded" />
      <div className="skeleton h-4 w-full mb-2 rounded" />
      <div className="skeleton h-4 w-2/3 mb-4 rounded" />
      <div className="flex gap-2 mb-4">
        <div className="skeleton h-5 w-16 rounded-pill" />
        <div className="skeleton h-5 w-20 rounded-pill" />
      </div>
      <div className="flex justify-between">
        <div className="skeleton h-4 w-24 rounded" />
        <div className="skeleton h-4 w-20 rounded" />
      </div>
    </div>
  );
}

export default function GigsPage() {
  const [gigs, setGigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (selectedSkills.length) params.set('skills', selectedSkills.join(','));
      if (minBudget) params.set('minBudget', minBudget);
      if (maxBudget) params.set('maxBudget', maxBudget);

      const data: any = await api.get(`/api/gigs?${params}`);
      setGigs(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [page, selectedSkills, minBudget, maxBudget]);

  useEffect(() => { fetchGigs(); }, [fetchGigs]);

  function toggleSkill(s: string) {
    setSelectedSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title mb-1">Browse Gigs</h1>
        <p className="text-warm-gray text-sm">
          {pagination ? `${pagination.total} open gig${pagination.total !== 1 ? 's' : ''}` : 'Loading…'}
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {SKILLS_LIST.slice(0, 12).map((s) => (
            <button key={s}
              onClick={() => toggleSkill(s)}
              className={`text-xs px-3 py-1.5 rounded-pill border transition-colors ${selectedSkills.includes(s) ? 'bg-ink text-spark border-ink' : 'bg-warm-white text-warm-gray border-cream hover:border-ink/40'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-warm-gray text-xs">Budget:</label>
            <input className="input-field w-24 text-sm" placeholder="Min EGP" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />
            <span className="text-warm-gray text-xs">to</span>
            <input className="input-field w-24 text-sm" placeholder="Max EGP" value={maxBudget} onChange={(e) => setMaxBudget(e.target.value)} />
          </div>
          {(selectedSkills.length > 0 || minBudget || maxBudget) && (
            <button className="text-gold text-xs hover:text-spark" onClick={() => { setSelectedSkills([]); setMinBudget(''); setMaxBudget(''); setPage(1); }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {loading
          ? Array(6).fill(0).map((_, i) => <GigCardSkeleton key={i} />)
          : gigs.length > 0
            ? gigs.map((gig) => (
              <Link key={gig.id} href={`/gigs/${gig.id}`} className="card hover:border-ink transition-colors group block">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-semibold text-ink text-base leading-tight group-hover:text-gold transition-colors line-clamp-2">
                    {gig.title}
                  </h2>
                  {gig.matchScore != null && <MatchBadge score={gig.matchScore} />}
                </div>
                <p className="text-warm-gray text-sm line-clamp-2 mb-4">{gig.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {gig.skills.slice(0, 4).map((s: string) => (
                    <span key={s} className="tag-category text-xs">{s}</span>
                  ))}
                  {gig.skills.length > 4 && <span className="text-warm-gray text-xs">+{gig.skills.length - 4}</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{gig.budgetEGP.toLocaleString()} EGP</span>
                  <span className="text-warm-gray text-xs">{gig.hoursMin}–{gig.hoursMax} hrs</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-warm-gray text-xs">{gig._count?.applications || 0} applicants</span>
                  <span className={`text-xs px-2 py-0.5 rounded-pill ${statusColor(gig.status)}`}>{gig.status}</span>
                </div>
              </Link>
            ))
            : (
              <div className="col-span-3 text-center py-20">
                <div className="text-4xl mb-4">🔍</div>
                <p className="font-semibold text-ink mb-1">No gigs match your filters</p>
                <p className="text-warm-gray text-sm">Try removing some filters or check back later</p>
              </div>
            )
        }
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-ghost text-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="text-warm-gray text-sm">Page {page} of {pagination.pages}</span>
          <button className="btn-ghost text-sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
