'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const SKILLS = ['React', 'Node.js', 'TypeScript', 'Python', 'Figma', 'UI/UX', 'PostgreSQL', 'MongoDB', 'Express', 'Next.js', 'Flutter', 'Java', 'C++', 'Marketing', 'SEO', 'Copywriting', 'Video Editing', 'Motion Graphics', 'Data Analysis'];

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const sug = SKILLS.filter((s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s));
  function add(s: string) { if (s.trim() && !tags.includes(s.trim())) onChange([...tags, s.trim()]); setInput(''); }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((t) => <span key={t} className="tag-skill gap-1">{t}<button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="ml-1 text-spark/60 hover:text-spark">×</button></span>)}
      </div>
      <div className="relative">
        <input className="input-field" placeholder="Type skill and press Enter…" value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }} />
        {input && sug.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 bg-warm-white border border-cream rounded-btn mt-1 max-h-40 overflow-y-auto">
            {sug.map((s) => <button key={s} type="button" className="block w-full text-left px-4 py-2 text-sm hover:bg-cream/50" onClick={() => add(s)}>{s}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostGigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', skills: [] as string[],
    hoursMin: 5, hoursMax: 10, budgetEGP: 1000,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(publish: boolean) {
    if (!form.title) { toast.error('Title is required'); return; }
    if (form.description.length < 50) { toast.error('Description must be at least 50 characters'); return; }
    if (!form.skills.length) { toast.error('Add at least one skill'); return; }

    setLoading(true);
    try {
      const gig: any = await api.post('/api/gigs', form);
      if (publish) {
        await api.put(`/api/gigs/${gig.id}/publish`);
        toast.success('Gig published!');
      } else {
        toast.success('Gig saved as draft');
      }
      router.push('/company/gigs');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create gig');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="page-title mb-2">Post a Gig</h1>
      <p className="text-warm-gray text-sm mb-8">Describe what you need. Our algorithm does the matching.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div className="card">
            <label className="block text-warm-gray text-xs font-medium mb-2">Gig title</label>
            <input className="input-field" placeholder="React Frontend Developer for Dashboard MVP"
              value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          {/* Description */}
          <div className="card">
            <label className="block text-warm-gray text-xs font-medium mb-2">
              Description <span className="text-warm-gray/60">(min 50 chars)</span>
            </label>
            <textarea className="input-field h-40 resize-none pt-3"
              placeholder="Describe what you need done, what deliverables you expect, and any relevant context…"
              value={form.description} onChange={(e) => set('description', e.target.value)} />
            <div className="text-right text-warm-gray text-xs mt-1">{form.description.length} chars</div>
          </div>

          {/* Skills */}
          <div className="card">
            <label className="block text-warm-gray text-xs font-medium mb-2">Skills needed</label>
            <TagInput tags={form.skills} onChange={(skills) => set('skills', skills)} />
          </div>

          {/* Hours + Budget */}
          <div className="card">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-warm-gray text-xs font-medium mb-2">Min hours</label>
                <input type="number" className="input-field" min={5} max={20} value={form.hoursMin}
                  onChange={(e) => set('hoursMin', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="block text-warm-gray text-xs font-medium mb-2">Max hours</label>
                <input type="number" className="input-field" min={5} max={20} value={form.hoursMax}
                  onChange={(e) => set('hoursMax', parseInt(e.target.value))} />
              </div>
              <div>
                <label className="block text-warm-gray text-xs font-medium mb-2">Budget (EGP)</label>
                <input type="number" className="input-field" min={500} step={100} value={form.budgetEGP}
                  onChange={(e) => set('budgetEGP', parseInt(e.target.value))} />
              </div>
            </div>
            <p className="text-warm-gray text-xs mt-3">
              You'll pay {Math.round(form.budgetEGP * 1.15).toLocaleString()} EGP total including the 15% InternMe fee.
            </p>
          </div>

          <div className="flex gap-3 mt-2 pb-20">
            <button className="btn-ghost flex-1" disabled={loading} onClick={() => submit(false)}>
              Save as draft
            </button>
            <button className="btn-primary flex-1 justify-center" disabled={loading} onClick={() => submit(true)}>
              {loading ? 'Publishing…' : 'Publish now'}
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="h-fit">
          <p className="section-label mb-3">Live preview</p>
          <div className="card border-2 border-dashed border-cream">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {form.skills.length > 0
                ? form.skills.map((s) => <span key={s} className="tag-category text-xs">{s}</span>)
                : <span className="text-warm-gray text-xs">Skills appear here</span>}
            </div>
            <h3 className="font-semibold text-ink text-sm leading-tight mb-2">
              {form.title || 'Your gig title…'}
            </h3>
            <p className="text-warm-gray text-xs line-clamp-3 mb-3">
              {form.description || 'Your description…'}
            </p>
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-ink">{form.budgetEGP.toLocaleString()} EGP</span>
              <span className="text-warm-gray">{form.hoursMin}–{form.hoursMax} hrs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
