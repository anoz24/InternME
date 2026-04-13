'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

const studentNav = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/gigs', label: 'Browse Gigs', icon: '🔍' },
  { href: '/profile', label: 'My Profile', icon: '👤' },
  { href: '/cv', label: 'My CV', icon: '📄' },
  { href: '/student/earnings', label: 'Earnings', icon: '💰' },
];

const companyNav = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/company/post-gig', label: 'Post a Gig', icon: '➕' },
  { href: '/company/gigs', label: 'My Gigs', icon: '📋' },
];

const adminNav = [
  { href: '/admin', label: 'Overview', icon: '⊞' },
  { href: '/admin?tab=users', label: 'Users', icon: '👥' },
  { href: '/admin?tab=escrows', label: 'Escrows', icon: '🔐' },
  { href: '/admin?tab=disputes', label: 'Disputes', icon: '⚠️' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warm-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 bg-ink rounded-logo mx-auto mb-4 animate-pulse" />
          <p className="text-warm-gray text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const nav = user.role === 'STUDENT' ? studentNav : user.role === 'COMPANY' ? companyNav : adminNav;

  return (
    <div className="min-h-screen bg-warm-white flex">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 bg-ink min-h-screen sticky top-0 border-r border-white/10">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-ink border border-spark rounded-logo flex items-center justify-center">
              <span className="font-display text-spark font-bold text-sm">Me</span>
            </div>
            <span className="font-display text-xl text-warm-white font-bold" style={{ letterSpacing: '-1px' }}>
              Intern<span className="text-spark">Me</span>
            </span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm transition-colors ${isActive ? 'bg-spark text-ink font-semibold' : 'text-warm-gray hover:text-warm-white hover:bg-white/5'}`}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User + Notifications at bottom */}
        <div className="p-4 border-t border-white/10">
          <NotificationBell />
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-8 bg-spark rounded-full flex items-center justify-center text-ink font-semibold text-sm flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-warm-white text-sm font-medium truncate">{user.name}</div>
              <div className="text-warm-gray text-xs truncate">{user.role}</div>
            </div>
            <button onClick={() => { logout(); router.push('/'); }} className="text-warm-gray hover:text-error-text transition-colors text-xs">
              Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-h-screen">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-ink border-b border-white/10">
          <Link href="/" className="font-display text-warm-white font-bold">
            Intern<span className="text-spark">Me</span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-warm-gray">
              ☰
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-ink p-4 border-b border-white/10">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-warm-gray hover:text-warm-white text-sm">
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button onClick={() => { logout(); router.push('/'); }} className="block px-3 py-2.5 text-error-text text-sm mt-2">
              Sign out
            </button>
          </div>
        )}

        <div className="p-6 md:p-8">
          {children}
        </div>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-ink border-t border-white/10 flex">
          {nav.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className={`flex-1 flex flex-col items-center py-3 text-xs transition-colors ${isActive ? 'text-spark' : 'text-warm-gray'}`}>
                <span className="text-lg mb-0.5">{item.icon}</span>
                {item.label.split(' ')[0]}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
