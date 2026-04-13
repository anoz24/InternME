import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Safe fields — never return ssnHash, passwordHash, uniEmail, or education institutions
function safeStudentProfile(user: any) {
  const profile = user.studentProfile;
  return {
    id: user.id,
    name: user.name,
    displayEmail: user.displayEmail,
    role: user.role,
    createdAt: user.createdAt,
    studentProfile: profile
      ? {
          headline: profile.headline,
          skills: profile.skills,
          projects: profile.projects,
          // experience: omit company name in public view
          experience: Array.isArray(profile.experience)
            ? profile.experience.map((e: any) => ({
                role: e.role,
                dates: e.dates,
                bullets: e.bullets,
              }))
            : profile.experience,
          education: Array.isArray(profile.education)
            ? profile.education.map((e: any) => ({
                degree: e.degree,
                field: e.field,
                gpa: e.gpa,
              }))
            : profile.education,
          links: profile.links,
          cvPdfUrl: profile.cvPdfUrl,
        }
      : null,
  };
}

// ── PUT /api/profile/student ───────────────────────────────
const studentProfileSchema = z.object({
  headline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  projects: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        url: z.string().optional(),
        tech: z.array(z.string()).optional(),
      })
    )
    .optional(),
  experience: z
    .array(
      z.object({
        role: z.string(),
        dates: z.string().optional(),
        bullets: z.array(z.string()).optional(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        degree: z.string(),
        field: z.string(),
        gpa: z.string().optional(),
      })
    )
    .optional(),
  links: z
    .object({
      github: z.string().optional(),
      portfolio: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
});

router.put('/student', requireAuth, requireRole('STUDENT'), validate(studentProfileSchema), async (req, res, next) => {
  try {
    const { headline, skills, projects, experience, education, links } = req.body;

    const profile = await prisma.studentProfile.update({
      where: { userId: req.user!.id },
      data: {
        ...(headline !== undefined && { headline }),
        ...(skills !== undefined && { skills }),
        ...(projects !== undefined && { projects }),
        ...(experience !== undefined && { experience }),
        ...(education !== undefined && { education }),
        ...(links !== undefined && { links }),
      },
    });

    return res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/profile/student (self) ─────────────────────────
router.get('/student', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { studentProfile: true },
    });
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json(safeStudentProfile(user));
  } catch (err) {
    next(err);
  }
});

// ── GET /api/profile/student/earnings ─────────────────────
router.get('/student/earnings', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user!.id, type: 'INTERN_PAYOUT' },
      orderBy: { createdAt: 'desc' },
    });
    const totalEarned = transactions.reduce((sum: number, tx: any) => sum + tx.amountEGP, 0);

    const activeGigs = await prisma.gig.count({
      where: { internId: req.user!.id, status: 'IN_PROGRESS' },
    });

    return res.json({
      totalEarned,
      gigCount: transactions.length,
      pending: 0, // placeholder — would query escrows with HELD status
      activeGigs,
      transactions,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/profile/student/:id ──────────────────────────
router.get('/student/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id, role: 'STUDENT' },
      include: { studentProfile: true },
    });

    if (!user) return res.status(404).json({ error: 'Student not found' });
    return res.json(safeStudentProfile(user));
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/profile/company ───────────────────────────────
const companyProfileSchema = z.object({
  companyName: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

router.put('/company', requireAuth, requireRole('COMPANY'), validate(companyProfileSchema), async (req, res, next) => {
  try {
    const { companyName, industry, size, website } = req.body;

    const profile = await prisma.companyProfile.update({
      where: { userId: req.user!.id },
      data: {
        ...(companyName && { companyName }),
        ...(industry && { industry }),
        ...(size && { size }),
        ...(website !== undefined && { website }),
      },
    });

    return res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
});

export default router;
