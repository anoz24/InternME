'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const SKILLS = ['React', 'Node.js', 'TypeScript', 'Python', 'Figma', 'UI/UX', 'PostgreSQL', 'MongoDB', 'Express', 'Next.js', 'Flutter', 'Java', 'C++', 'Marketing', 'SEO', 'Copywriting', 'Video Editing', 'Motion Graphics', 'Data Analysis'];

function TagInput({ tags, onChange, placeholder }: { tags: string[]; onChange: (tags: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const suggestions = SKILLS.filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s));

  function add(s: string) {
    const t = s.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => (
          <span key={t} className="tag-skill gap-1">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}
              className="text-spark/60 hover:text-spark ml-1">×</button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input className="input-field" placeholder={placeholder || 'Type and press Enter…'}
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }} />
        {input && suggestions.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 bg-warm-white border border-cream rounded-btn mt-1 max-h-48 overflow-y-auto shadow-sm">
            {suggestions.map((s) => (
              <button key={s} type="button" className="block w-full text-left px-4 py-2 text-sm hover:bg-cream/50 transition-colors"
                onClick={() => add(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface Project { title: string; description: string; url: string; tech: string[]; }
interface Experience { role: string; dates: string; bullets: string[]; }
interface Education { degree: string; field: string; gpa: string; }

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    headline: '',
    skills: [] as string[],
    projects: [] as Project[],
    experience: [] as Experience[],
    education: [] as Education[],
    links: { github: '', portfolio: '', linkedin: '' },
  });

  useEffect(() => {
    if (user?.studentProfile) {
      const sp = user.studentProfile;
      setProfile({
        headline: sp.headline || '',
        skills: sp.skills || [],
        projects: (sp.projects as Project[]) || [],
        experience: (sp.experience as Experience[]) || [],
        education: (sp.education as Education[]) || [],
        links: sp.links || { github: '', portfolio: '', linkedin: '' },
      });
      setCvUrl(sp.cvPdfUrl || null);
    }
  }, [user]);

  // Profile completion percentage
  const completion = Math.round(
    ((profile.headline ? 20 : 0) +
      (profile.skills.length >= 2 ? 20 : 0) +
      (profile.projects.length >= 1 ? 20 : 0) +
      (profile.experience.length >= 1 ? 20 : 0) +
      (profile.links.github || profile.links.portfolio ? 20 : 0)) 
  );

  async function save() {
    setLoading(true);
    try {
      await api.put('/api/profile/student', {
        headline: profile.headline,
        skills: profile.skills,
        projects: profile.projects,
        experience: profile.experience,
        education: profile.education,
        links: profile.links,
      });
      await refreshUser();
      toast.success('Profile saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  async function generateCV() {
    setGenerating(true);
    try {
      const data: any = await api.post('/api/cv/generate');
      if (data.url) setCvUrl(data.url);
      else if (data.base64) setCvUrl(data.base64);
      toast.success('CV generated!');
    } catch (err: any) {
      toast.error(err.message || 'CV generation failed. Is LaTeX installed?');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="text-warm-gray text-sm mt-1">This drives your match score — the more complete, the better.</p>
        </div>
        <button onClick={save} disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : 'Save profile'}
        </button>
      </div>

      {/* Completion bar */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink">Profile completion</span>
          <span className="text-gold font-semibold text-sm">{completion}%</span>
        </div>
        <div className="h-2 bg-cream rounded-full overflow-hidden">
          <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${completion}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-4">
          <button onClick={generateCV} disabled={generating} className="btn-primary text-xs">
            {generating ? 'Generating…' : '📄 Generate My CV'}
          </button>
          {cvUrl && (
            <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="text-gold text-sm hover:text-spark transition-colors">
              Download PDF →
            </a>
          )}
        </div>
      </div>

      {/* Headline */}
      <div className="card mb-4">
        <h2 className="font-semibold text-ink mb-4">Headline</h2>
        <input className="input-field" placeholder="Frontend Developer & UI Designer"
          value={profile.headline} onChange={(e) => setProfile((p) => ({ ...p, headline: e.target.value }))} />
      </div>

      {/* Skills */}
      <div className="card mb-4">
        <h2 className="font-semibold text-ink mb-4">Skills</h2>
        <TagInput tags={profile.skills} onChange={(skills) => setProfile((p) => ({ ...p, skills }))} placeholder="Add a skill (React, Figma, Python…)" />
      </div>

      {/* Projects */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink">Projects</h2>
          <button type="button" className="btn-ghost text-xs" onClick={() =>
            setProfile((p) => ({ ...p, projects: [...p.projects, { title: '', description: '', url: '', tech: [] }] }))}>
            + Add project
          </button>
        </div>
        <div className="space-y-6">
          {profile.projects.map((proj, i) => (
            <div key={i} className="border border-cream rounded-btn p-4 relative">
              <button className="absolute top-3 right-3 text-warm-gray hover:text-error-text text-xs"
                onClick={() => setProfile((p) => ({ ...p, projects: p.projects.filter((_, j) => j !== i) }))}>
                Remove
              </button>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-warm-gray text-xs mb-1">Project title</label>
                  <input className="input-field" value={proj.title} placeholder="E-commerce Dashboard"
                    onChange={(e) => setProfile((p) => ({ ...p, projects: p.projects.map((pr, j) => j === i ? { ...pr, title: e.target.value } : pr) }))} />
                </div>
                <div>
                  <label className="block text-warm-gray text-xs mb-1">URL (optional)</label>
                  <input className="input-field" value={proj.url} placeholder="https://github.com/…"
                    onChange={(e) => setProfile((p) => ({ ...p, projects: p.projects.map((pr, j) => j === i ? { ...pr, url: e.target.value } : pr) }))} />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-warm-gray text-xs mb-1">Description</label>
                <textarea className="input-field h-20 resize-none pt-2" value={proj.description} placeholder="What you built and why it matters…"
                  onChange={(e) => setProfile((p) => ({ ...p, projects: p.projects.map((pr, j) => j === i ? { ...pr, description: e.target.value } : pr) }))} />
              </div>
              <div>
                <label className="block text-warm-gray text-xs mb-1">Tech stack</label>
                <TagInput tags={proj.tech} onChange={(tech) => setProfile((p) => ({ ...p, projects: p.projects.map((pr, j) => j === i ? { ...pr, tech } : pr) }))} placeholder="React, Node.js…" />
              </div>
            </div>
          ))}
          {profile.projects.length === 0 && (
            <p className="text-warm-gray text-sm text-center py-4">No projects yet. Add your first one →</p>
          )}
        </div>
      </div>

      {/* Experience */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-ink">Experience</h2>
            <p className="text-warm-gray text-xs mt-0.5">Role / Job Title — no company name needed</p>
          </div>
          <button type="button" className="btn-ghost text-xs" onClick={() =>
            setProfile((p) => ({ ...p, experience: [...p.experience, { role: '', dates: '', bullets: ['', '', ''] }] }))}>
            + Add experience
          </button>
        </div>
        <div className="space-y-6">
          {profile.experience.map((exp, i) => (
            <div key={i} className="border border-cream rounded-btn p-4 relative">
              <button className="absolute top-3 right-3 text-warm-gray hover:text-error-text text-xs"
                onClick={() => setProfile((p) => ({ ...p, experience: p.experience.filter((_, j) => j !== i) }))}>
                Remove
              </button>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-warm-gray text-xs mb-1">Role / Job Title</label>
                  <input className="input-field" value={exp.role} placeholder="Frontend Developer"
                    onChange={(e) => setProfile((p) => ({ ...p, experience: p.experience.map((ex, j) => j === i ? { ...ex, role: e.target.value } : ex) }))} />
                </div>
                <div>
                  <label className="block text-warm-gray text-xs mb-1">Date range</label>
                  <input className="input-field" value={exp.dates} placeholder="Jun 2024 – Aug 2024"
                    onChange={(e) => setProfile((p) => ({ ...p, experience: p.experience.map((ex, j) => j === i ? { ...ex, dates: e.target.value } : ex) }))} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-warm-gray text-xs">Bullet points (what you did)</label>
                {exp.bullets.map((b, bi) => (
                  <input key={bi} className="input-field" value={b} placeholder={`Bullet ${bi + 1}…`}
                    onChange={(e) => setProfile((p) => ({ ...p, experience: p.experience.map((ex, j) => j === i ? { ...ex, bullets: ex.bullets.map((bl, bj) => bj === bi ? e.target.value : bl) } : ex) }))} />
                ))}
              </div>
            </div>
          ))}
          {profile.experience.length === 0 && (
            <p className="text-warm-gray text-sm text-center py-4">No experience yet. Add your first role →</p>
          )}
        </div>
      </div>

      {/* Education */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-ink">Education</h2>
            <p className="text-warm-gray text-xs mt-0.5">Field of Study — no institution name shown to companies</p>
          </div>
          <button type="button" className="btn-ghost text-xs" onClick={() =>
            setProfile((p) => ({ ...p, education: [...p.education, { degree: '', field: '', gpa: '' }] }))}>
            + Add education
          </button>
        </div>
        <div className="space-y-4">
          {profile.education.map((edu, i) => (
            <div key={i} className="border border-cream rounded-btn p-4 relative">
              <button className="absolute top-3 right-3 text-warm-gray hover:text-error-text text-xs"
                onClick={() => setProfile((p) => ({ ...p, education: p.education.filter((_, j) => j !== i) }))}>
                Remove
              </button>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-warm-gray text-xs mb-1">Degree</label>
                  <input className="input-field" value={edu.degree} placeholder="BSc"
                    onChange={(e) => setProfile((p) => ({ ...p, education: p.education.map((ed, j) => j === i ? { ...ed, degree: e.target.value } : ed) }))} />
                </div>
                <div>
                  <label className="block text-warm-gray text-xs mb-1">Field of Study</label>
                  <input className="input-field" value={edu.field} placeholder="Computer Science"
                    onChange={(e) => setProfile((p) => ({ ...p, education: p.education.map((ed, j) => j === i ? { ...ed, field: e.target.value } : ed) }))} />
                </div>
                <div>
                  <label className="block text-warm-gray text-xs mb-1">GPA (optional)</label>
                  <input className="input-field" value={edu.gpa} placeholder="3.7"
                    onChange={(e) => setProfile((p) => ({ ...p, education: p.education.map((ed, j) => j === i ? { ...ed, gpa: e.target.value } : ed) }))} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="card mb-8">
        <h2 className="font-semibold text-ink mb-4">Links</h2>
        <div className="space-y-3">
          {[
            { key: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
            { key: 'portfolio', label: 'Portfolio', placeholder: 'https://yoursite.dev' },
            { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="text-warm-gray text-sm w-20 flex-shrink-0">{label}</label>
              <input className="input-field flex-1" placeholder={placeholder}
                value={(profile.links as any)[key]}
                onChange={(e) => setProfile((p) => ({ ...p, links: { ...p.links, [key]: e.target.value } }))} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mb-20">
        <button onClick={save} disabled={loading} className="btn-primary px-8">
          {loading ? 'Saving…' : 'Save all changes'}
        </button>
      </div>
    </div>
  );
}
