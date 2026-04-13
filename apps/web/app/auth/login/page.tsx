'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-ink border border-spark rounded-logo flex items-center justify-center">
          <span className="font-display text-spark font-bold">Me</span>
        </div>
        <span className="font-display text-2xl text-warm-white font-bold" style={{ letterSpacing: '-1px' }}>
          Intern<span className="text-spark">Me</span>
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl text-warm-white font-bold mb-2">Welcome back</h1>
        <p className="text-warm-gray text-sm mb-10">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-warm-gray text-xs font-medium mb-1">Personal email</label>
            <input
              className="input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark"
              type="email" placeholder="sara@gmail.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-warm-gray text-xs font-medium mb-1">Password</label>
            <input
              className="input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark"
              type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full justify-center py-3 mt-2" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo shortcut */}
        <div className="mt-8 p-4 rounded-card border border-white/10 bg-white/5">
          <p className="text-warm-gray text-xs font-medium mb-3">Demo accounts</p>
          {[
            { label: 'Student', email: 'sara@gmail.com', pw: 'Test123!' },
            { label: 'Company', email: 'hiring@konnect.co', pw: 'Test123!' },
            { label: 'Admin', email: 'admin@internme.co', pw: 'Admin123!' },
          ].map((demo) => (
            <button key={demo.email}
              className="block w-full text-left px-3 py-2 rounded hover:bg-white/5 transition-colors mb-1"
              onClick={() => { setEmail(demo.email); setPassword(demo.pw); }}>
              <span className="text-spark text-xs font-medium">{demo.label}</span>
              <span className="text-warm-gray text-xs ml-2">{demo.email}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-warm-gray text-sm mt-8">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-gold hover:text-spark transition-colors">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
