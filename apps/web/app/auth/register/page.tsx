'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const SKILLS = ['React', 'Node.js', 'TypeScript', 'Python', 'Figma', 'UI/UX', 'PostgreSQL', 'MongoDB', 'Express', 'Next.js', 'Flutter', 'Java', 'C++', 'Marketing', 'SEO', 'Copywriting', 'Video Editing', 'Motion Graphics', 'Data Analysis'];
const INDUSTRIES = ['SaaS / Tech', 'Fintech', 'Marketing & Creative', 'E-commerce', 'Healthcare', 'Education', 'Media', 'Other'];
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '200+'];
const UNI_EMAIL_SIGNALS = ['.edu', '.ac.', 'student.', 'aast.', 'aastmt.', 'aucegypt.', 'guc.', 'bue.', 'msa.', 'futureuniversity.'];

function isUniEmail(email: string) {
  return UNI_EMAIL_SIGNALS.some((d) => email.toLowerCase().includes(d));
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    role: '' as 'STUDENT' | 'COMPANY' | '',
    name: '', ssn: '', personalEmail: '', uniEmail: '', password: '',
    headline: '',
    skills: [] as string[],
    skillInput: '',
    companyName: '', industry: '', size: '1-10',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  function addSkill(s: string) {
    const trimmed = s.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      set('skills', [...form.skills, trimmed]);
    }
    set('skillInput', '');
  }

  function removeSkill(s: string) {
    set('skills', form.skills.filter((sk) => sk !== s));
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await register({
        name: form.name,
        ssn: form.ssn,
        personalEmail: form.personalEmail,
        uniEmail: form.uniEmail,
        password: form.password,
        role: form.role,
        headline: form.headline || undefined,
        skills: form.skills.length ? form.skills : undefined,
        companyName: form.companyName || undefined,
        industry: form.industry || undefined,
        size: form.size || undefined,
      });
      toast.success('Account created! Welcome to InternMe.');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 bg-ink border border-spark rounded-logo flex items-center justify-center">
          <span className="font-display text-spark font-bold">Me</span>
        </div>
        <span className="font-display text-2xl text-warm-white font-bold" style={{ letterSpacing: '-1px' }}>
          Intern<span className="text-spark">Me</span>
        </span>
      </Link>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${step >= s ? 'bg-spark text-ink' : 'bg-white/10 text-warm-gray'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-px ${step > s ? 'bg-spark' : 'bg-white/20'}`} />}
          </div>
        ))}
      </div>

      <div className="w-full max-w-lg">
        {/* ── Step 1: Role Selection ── */}
        {step === 1 && (
          <div className="text-center">
            <h1 className="font-display text-4xl text-warm-white font-bold mb-3">Create your account</h1>
            <p className="text-warm-gray mb-10">Tell us who you are to get started</p>
            <div className="grid grid-cols-2 gap-4">
              {(['STUDENT', 'COMPANY'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => { set('role', role); setStep(2); }}
                  className={`p-8 rounded-card border-2 transition-all text-left ${form.role === role ? 'border-spark bg-spark/10' : 'border-white/20 bg-white/5 hover:border-white/40'}`}
                >
                  <div className="text-3xl mb-3">{role === 'STUDENT' ? '🎓' : '🏢'}</div>
                  <div className="text-warm-white font-semibold text-lg">
                    {role === 'STUDENT' ? "I'm a Student" : "I'm a Company"}
                  </div>
                  <div className="text-warm-gray text-sm mt-1">
                    {role === 'STUDENT' ? 'Find paid micro-internships' : 'Post gigs, hire talent'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Identity ── */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-3xl text-warm-white font-bold mb-8">Your identity</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-warm-gray text-xs font-medium mb-1">Full name</label>
                <input className="input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark"
                  placeholder="Sara Khalil" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <label className="block text-warm-gray text-xs font-medium mb-1">Personal email (Gmail, Outlook…)</label>
                <input className={`input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark ${errors.personalEmail ? 'border-error-text' : ''}`}
                  type="email" placeholder="sara@gmail.com" value={form.personalEmail}
                  onChange={(e) => {
                    set('personalEmail', e.target.value);
                    if (isUniEmail(e.target.value)) {
                      setErrors((er) => ({ ...er, personalEmail: 'Use your personal email — not your university email' }));
                    } else {
                      setErrors((er) => { const { personalEmail, ...rest } = er; return rest; });
                    }
                  }} />
                {errors.personalEmail && <p className="text-error-text text-xs mt-1">{errors.personalEmail}</p>}
              </div>
              <div>
                <label className="block text-warm-gray text-xs font-medium mb-1">University email (for verification only — never shown publicly)</label>
                <input className="input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark"
                  type="email" placeholder="sara@guc.edu.eg" value={form.uniEmail} onChange={(e) => set('uniEmail', e.target.value)} />
              </div>
              <div>
                <label className="block text-warm-gray text-xs font-medium mb-1">National ID (SSN) — stored as a secure hash, never seen again</label>
                <input className="input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark"
                  type="password" placeholder="14 digits" maxLength={14} value={form.ssn} onChange={(e) => set('ssn', e.target.value.replace(/\D/g, ''))} />
              </div>
              <div>
                <label className="block text-warm-gray text-xs font-medium mb-1">Password</label>
                <input className="input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark"
                  type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => set('password', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button className="btn-ghost flex-1" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary flex-1" onClick={() => {
                if (!form.name || !form.personalEmail || !form.uniEmail || !form.ssn || !form.password) {
                  toast.error('Please fill in all fields'); return;
                }
                if (isUniEmail(form.personalEmail)) {
                  toast.error('Personal email must not be a university email'); return;
                }
                if (form.ssn.length !== 14) {
                  toast.error('SSN must be 14 digits'); return;
                }
                setStep(3);
              }}>Continue</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Profile Basics ── */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-3xl text-warm-white font-bold mb-2">
              {form.role === 'STUDENT' ? 'Your profile' : 'Your company'}
            </h2>
            <p className="text-warm-gray text-sm mb-8">You can always update this later</p>

            {form.role === 'STUDENT' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-warm-gray text-xs font-medium mb-1">Headline</label>
                  <input className="input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark"
                    placeholder="Frontend Developer & UI Designer" value={form.headline} onChange={(e) => set('headline', e.target.value)} />
                </div>
                <div>
                  <label className="block text-warm-gray text-xs font-medium mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.skills.map((s) => (
                      <span key={s} className="tag-skill gap-2">
                        {s}
                        <button onClick={() => removeSkill(s)} className="text-spark/60 hover:text-spark">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="relative">
                    <input className="input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark"
                      placeholder="Type a skill and press Enter…"
                      value={form.skillInput}
                      onChange={(e) => set('skillInput', e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(form.skillInput); } }} />
                    {form.skillInput && (
                      <div className="absolute z-10 top-full left-0 right-0 bg-ink border border-white/20 rounded-btn mt-1 max-h-48 overflow-y-auto">
                        {SKILLS.filter((s) => s.toLowerCase().includes(form.skillInput.toLowerCase()) && !form.skills.includes(s)).map((s) => (
                          <button key={s} className="block w-full text-left px-4 py-2 text-sm text-warm-white hover:bg-white/5"
                            onClick={() => addSkill(s)}>{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-warm-gray text-xs font-medium mb-1">Company name</label>
                  <input className="input-field bg-white/5 border-white/20 text-warm-white placeholder:text-warm-gray/60 focus:border-spark"
                    placeholder="Konnect Labs" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
                </div>
                <div>
                  <label className="block text-warm-gray text-xs font-medium mb-1">Industry</label>
                  <select className="input-field bg-white/5 border-white/20 text-warm-white focus:border-spark"
                    value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-warm-gray text-xs font-medium mb-1">Company size</label>
                  <select className="input-field bg-white/5 border-white/20 text-warm-white focus:border-spark"
                    value={form.size} onChange={(e) => set('size', e.target.value)}>
                    {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button className="btn-ghost flex-1" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary flex-1" disabled={loading} onClick={handleSubmit}>
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-warm-gray text-sm mt-8">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-gold hover:text-spark transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
