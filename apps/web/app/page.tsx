import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink text-warm-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-ink border border-spark rounded-logo flex items-center justify-center">
            <span className="font-display text-spark font-bold text-lg" style={{ letterSpacing: '-1px' }}>Me</span>
          </div>
          <span className="font-display text-2xl font-bold" style={{ letterSpacing: '-1px' }}>
            <span className="text-warm-white">Intern</span>
            <span className="text-spark">Me</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-warm-gray text-sm hover:text-warm-white transition-colors">Sign in</Link>
          <Link href="/auth/register" className="btn-primary">Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <p className="section-label text-warm-gray mb-6">Egypt's first micro-internship marketplace</p>
        <h1 className="font-display text-6xl md:text-7xl font-bold leading-tight" style={{ letterSpacing: '-2px' }}>
          Skills speak.<br />
          <span className="text-spark">Prestige stays quiet.</span>
        </h1>
        <p className="mt-8 text-warm-gray text-xl max-w-2xl leading-relaxed">
          Students get paid 5–20 hour gigs based on ability, not university name.
          Companies find vetted talent at a fraction of the cost.
        </p>
        <div className="flex items-center gap-4 mt-12">
          <Link href="/auth/register" className="btn-primary text-base px-8 py-3">
            Find your first gig
          </Link>
          <Link href="/auth/register" className="text-warm-gray hover:text-warm-white text-sm transition-colors">
            Post a gig for free →
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-12 mt-20 border-t border-white/10 pt-12">
          {[
            { value: '600,000+', label: 'graduates per year in Egypt' },
            { value: '40%+', label: 'youth unemployment rate' },
            { value: '250 EGP', label: 'InternMe earns per gig' },
          ].map((stat) => (
            <div key={stat.value} className="text-center">
              <div className="font-display text-4xl text-spark font-bold">{stat.value}</div>
              <div className="text-warm-gray text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-warm-white py-24 px-8">
        <div className="max-w-5xl mx-auto">
          <p className="section-label text-warm-gray mb-4">Simple by design</p>
          <h2 className="font-display text-5xl text-ink font-bold mb-16" style={{ letterSpacing: '-1px' }}>
            How InternMe works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Build your profile', body: 'Add skills, projects, and experience. No GPA, no institution name — just what you can do.' },
              { num: '02', title: 'Match to open gigs', body: 'Our blind algorithm ranks you on skills only. Companies see your ability, not your address.' },
              { num: '03', title: 'Earn while you build', body: 'Complete the gig, get paid via escrow — 15% stays with InternMe, 90% goes straight to you.' },
            ].map((step) => (
              <div key={step.num} className="card border-cream">
                <div className="text-gold font-display text-5xl font-bold mb-4">{step.num}</div>
                <h3 className="font-semibold text-lg text-ink mb-2">{step.title}</h3>
                <p className="text-warm-gray text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-ink text-center py-8 border-t border-white/10">
        <p className="text-warm-gray text-sm">© 2026 InternMe · Built for Rally · Omar Emad El-Habashy</p>
      </footer>
    </main>
  );
}
