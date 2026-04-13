'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function DashboardHome() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink font-bold">
          Good morning, {user.name.split(' ')[0]} 👋
        </h1>
        <p className="text-warm-gray mt-1">
          {user.role === 'STUDENT' ? "Here's what's happening with your gigs." : "Here's your hiring overview."}
        </p>
      </div>

      {user.role === 'STUDENT' && (
        <div className="space-y-6">
          {!user.studentProfile?.headline && (
            <div className="card border border-gold/30 bg-alert-bg">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-ink">Complete your profile</h2>
                  <p className="text-warm-gray text-sm mt-1">Add your skills and projects to get matched to gigs.</p>
                </div>
                <Link href="/profile" className="btn-primary text-xs whitespace-nowrap">
                  Complete profile
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Profile complete', value: user.studentProfile ? '60%' : '0%', sub: 'Add more to improve matches', href: '/profile' },
              { label: 'Open gigs', value: '12', sub: 'Matching your skills', href: '/gigs' },
              { label: 'Earnings', value: '0 EGP', sub: 'Complete a gig to start', href: '/student/earnings' },
            ].map((card) => (
              <Link key={card.label} href={card.href} className="card hover:border-ink transition-colors group">
                <div className="text-warm-gray text-xs font-medium mb-1">{card.label}</div>
                <div className="font-display text-2xl text-ink font-bold">{card.value}</div>
                <div className="text-warm-gray text-xs mt-1 group-hover:text-gold transition-colors">{card.sub} →</div>
              </Link>
            ))}
          </div>

          <div className="card">
            <h2 className="font-semibold text-ink mb-4">Quick actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/gigs" className="btn-secondary justify-center">Browse gigs</Link>
              <Link href="/profile" className="btn-secondary justify-center">Update profile</Link>
              <Link href="/cv" className="btn-ghost justify-center">Generate CV</Link>
              <Link href="/student/earnings" className="btn-ghost justify-center">View earnings</Link>
            </div>
          </div>
        </div>
      )}

      {user.role === 'COMPANY' && (
        <div className="space-y-6">
          <div className="card bg-ink text-warm-white border-ink">
            <h2 className="font-display text-2xl font-bold mb-2">Ready to find talent?</h2>
            <p className="text-warm-gray text-sm mb-6">Post a micro-internship gig and get ranked applicants based on skills — no university filtering.</p>
            <Link href="/company/post-gig" className="btn-primary">Post your first gig</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Active gigs', value: '0', href: '/company/gigs' },
              { label: 'Total applicants', value: '0', href: '/company/gigs' },
              { label: 'Gigs completed', value: '0', href: '/company/gigs' },
            ].map((card) => (
              <Link key={card.label} href={card.href} className="card hover:border-ink transition-colors group">
                <div className="text-warm-gray text-xs font-medium mb-1">{card.label}</div>
                <div className="font-display text-3xl text-ink font-bold">{card.value}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {user.role === 'ADMIN' && (
        <div className="card">
          <h2 className="font-semibold mb-4">Admin panel</h2>
          <Link href="/admin" className="btn-primary">Go to Admin Panel</Link>
        </div>
      )}
    </div>
  );
}
