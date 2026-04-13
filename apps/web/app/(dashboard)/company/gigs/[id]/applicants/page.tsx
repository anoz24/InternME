'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-mint-text' : score >= 40 ? 'bg-gold' : 'bg-warm-gray';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-cream rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-ink w-10 text-right">{score}%</span>
    </div>
  );
}

export default function ApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [gig, setGig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    try {
      const [gigData, appData] = await Promise.all([
        api.get<any>(`/api/gigs/${id}`),
        api.get<any[]>(`/api/gigs/${id}/applicants`),
      ]);
      setGig(gigData);
      setApplicants(appData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function decide(studentId: string, status: 'ACCEPTED' | 'REJECTED') {
    try {
      await api.put(`/api/gigs/${id}/applicants/${studentId}`, { status });
      toast.success(status === 'ACCEPTED' ? 'Applicant accepted!' : 'Applicant rejected');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  }

  if (loading) return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="card h-20"/>)}</div>;

  const hasAccepted = applicants.some((a) => a.status === 'ACCEPTED');

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="page-title mb-1">Applicants</h1>
        {gig && (
          <p className="text-warm-gray text-sm">
            {gig.title} · {applicants.length} applicant{applicants.length !== 1 ? 's' : ''} · ranked by match score
          </p>
        )}
        {/* Bias notice */}
        <div className="mt-4 px-4 py-3 bg-mint-bg rounded-btn border border-mint-text/20 inline-block">
          <p className="text-mint-text text-xs font-medium">
            ✓ Bias-free view — no university name, no institution, no uni email. Pure skill.
          </p>
        </div>
      </div>

      {applicants.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-4xl mb-3">👥</div>
          <h2 className="font-semibold text-ink mb-1">No applicants yet</h2>
          <p className="text-warm-gray text-sm">Check back once your gig is live</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map((app, rank) => {
            const sp = app.student.studentProfile;
            const isOpen = expanded === app.applicationId;
            return (
              <div key={app.applicationId} className={`card transition-all ${app.status === 'ACCEPTED' ? 'border-mint-text/50 bg-mint-bg/30' : app.status === 'REJECTED' ? 'opacity-50' : 'hover:border-ink/30'}`}>
                {/* Row header */}
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : app.applicationId)}>
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rank === 0 ? 'bg-ink text-spark' : 'bg-cream text-warm-gray'}`}>
                    {rank + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold text-ink">{app.student.name}</span>
                      {app.status !== 'PENDING' && (
                        <span className={`text-xs px-2 py-0.5 rounded-pill font-medium ${app.status === 'ACCEPTED' ? 'text-mint-text bg-mint-bg' : 'text-error-text bg-error-bg'}`}>
                          {app.status}
                        </span>
                      )}
                    </div>
                    {sp?.headline && <p className="text-warm-gray text-xs">{sp.headline}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(sp?.skills || []).slice(0, 5).map((s: string) => (
                        <span key={s} className="tag-category text-xs">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="w-36 flex-shrink-0">
                    <ScoreBar score={app.score} />
                  </div>

                  <div className="text-warm-gray text-xs flex-shrink-0">{isOpen ? '▲' : '▼'}</div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="mt-6 pt-6 border-t border-cream">
                    {app.coverNote && (
                      <div className="mb-6">
                        <p className="section-label mb-2">Cover note</p>
                        <p className="text-warm-gray text-sm leading-relaxed">{app.coverNote}</p>
                      </div>
                    )}

                    {sp?.projects?.length > 0 && (
                      <div className="mb-6">
                        <p className="section-label mb-3">Projects</p>
                        <div className="space-y-3">
                          {(sp.projects as any[]).map((p: any, i: number) => (
                            <div key={i} className="border border-cream rounded-btn p-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-ink text-sm">{p.title}</span>
                                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-gold text-xs hover:text-spark">↗ View</a>}
                              </div>
                              <p className="text-warm-gray text-xs leading-relaxed">{p.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(p.tech || []).map((t: string) => <span key={t} className="tag-category text-xs">{t}</span>)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sp?.experience?.length > 0 && (
                      <div className="mb-6">
                        <p className="section-label mb-3">Experience</p>
                        {(sp.experience as any[]).map((e: any, i: number) => (
                          <div key={i} className="mb-3">
                            <div className="font-medium text-ink text-sm">{e.role}</div>
                            <div className="text-warm-gray text-xs">{e.dates}</div>
                            <ul className="mt-2 space-y-1">
                              {(e.bullets || []).map((b: string, bi: number) => (
                                <li key={bi} className="text-warm-gray text-xs flex gap-1.5">
                                  <span className="text-gold mt-0.5">•</span>{b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {app.status === 'PENDING' && !hasAccepted && (
                      <div className="flex gap-3">
                        <button className="btn-primary" onClick={() => decide(app.student.id, 'ACCEPTED')}>
                          ✓ Accept this applicant
                        </button>
                        <button className="btn-ghost" onClick={() => decide(app.student.id, 'REJECTED')}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
