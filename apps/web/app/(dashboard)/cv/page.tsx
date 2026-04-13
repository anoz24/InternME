'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CVPage() {
  const { user, refreshUser } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = user?.studentProfile?.cvPdfUrl;
    if (url) setCvUrl(url);
  }, [user]);

  async function generateCV() {
    setGenerating(true);
    try {
      const data: any = await api.post('/api/cv/generate');
      const url = data.url || data.base64 || null;
      setCvUrl(url);
      await refreshUser();
      toast.success('CV generated!');
    } catch (err: any) {
      toast.error(err.message || 'CV generation failed. Make sure LaTeX (pdflatex) is installed on the server.');
    } finally {
      setGenerating(false);
    }
  }

  const profile = user?.studentProfile;
  const isProfileComplete = profile && (profile.skills?.length >= 1 || profile.projects?.length >= 1);

  return (
    <div className="max-w-2xl">
      <h1 className="page-title mb-2">My CV</h1>
      <p className="text-warm-gray text-sm mb-8">
        Auto-generated from your profile — bias-free layout (no university name, just skills).
      </p>

      {/* Profile completeness check */}
      {!isProfileComplete && (
        <div className="card border-gold/30 bg-alert-bg mb-6">
          <h2 className="font-semibold text-ink mb-1">Complete your profile first</h2>
          <p className="text-warm-gray text-sm mb-4">Add at least 1 skill or project to generate a meaningful CV.</p>
          <a href="/profile" className="btn-primary text-sm">Go to profile →</a>
        </div>
      )}

      {/* CV Template preview */}
      <div className="card mb-6">
        <h2 className="font-semibold text-ink mb-4">What's included in your CV</h2>
        <div className="space-y-3 text-sm">
          {[
            { icon: '✓', label: 'Your name & contact email', desc: 'Uses your personal display email' },
            { icon: '✓', label: 'Technical skills', desc: 'All skills from your profile' },
            { icon: '✓', label: 'Projects', desc: 'Title, tech stack, and description' },
            { icon: '✓', label: 'Experience', desc: 'Role, dates, bullet points — no company name' },
            { icon: '✓', label: 'Education', desc: 'Field & degree only — institution is hidden' },
            { icon: '✓', label: 'Links', desc: 'GitHub, Portfolio, LinkedIn' },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-3">
              <span className="text-mint-text font-bold">{row.icon}</span>
              <div>
                <div className="text-ink font-medium">{row.label}</div>
                <div className="text-warm-gray text-xs">{row.desc}</div>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-3 mt-2 pt-3 border-t border-cream">
            <span className="text-error-text font-bold">✕</span>
            <div>
              <div className="text-ink font-medium">University / Institution name</div>
              <div className="text-warm-gray text-xs">Never included — this is the blind matching advantage</div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical note */}
      <div className="card mb-6 border-cream bg-cream/40">
        <h3 className="font-semibold text-ink text-sm mb-1">Technical requirement</h3>
        <p className="text-warm-gray text-xs leading-relaxed">
          CV generation uses LaTeX (<code className="font-mono bg-cream/80 px-1 rounded">pdflatex</code>).{' '}
          On Railway deployments this is pre-installed via <code className="font-mono bg-cream/80 px-1 rounded">nixpacks.toml</code>.{' '}
          For local development on Windows, install{' '}
          <a href="https://miktex.org/download" target="_blank" rel="noopener noreferrer" className="text-gold underline">MiKTeX</a>.
        </p>
      </div>

      {/* Generate / Download */}
      <div className="card">
        <h2 className="font-semibold text-ink mb-4">Your CV</h2>

        {cvUrl ? (
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-12 bg-ink rounded flex items-center justify-center text-spark text-xl flex-shrink-0">
              📄
            </div>
            <div className="flex-1">
              <div className="font-medium text-ink text-sm">resume.pdf</div>
              <div className="text-warm-gray text-xs">Generated from your profile</div>
            </div>
            <a
              href={cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
              download="InternMe_CV.pdf"
            >
              Download
            </a>
          </div>
        ) : (
          <p className="text-warm-gray text-sm mb-6">No CV generated yet.</p>
        )}

        <button
          onClick={generateCV}
          disabled={generating || !isProfileComplete}
          className="btn-primary w-full justify-center py-3"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-spark border-t-transparent rounded-full animate-spin" />
              Compiling LaTeX…
            </span>
          ) : cvUrl ? '🔄 Regenerate CV' : '📄 Generate CV'}
        </button>
        <p className="text-warm-gray text-xs text-center mt-2">This may take 5–10 seconds</p>
      </div>
    </div>
  );
}
