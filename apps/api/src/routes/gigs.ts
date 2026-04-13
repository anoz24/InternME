import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { scoreStudentForGig } from '../services/matchEngine';

const router = Router();

// ── POST /api/gigs ─────────────────────────────────────────
const createGigSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(50),
  skills: z.array(z.string()).min(1),
  hoursMin: z.number().int().min(5).max(20),
  hoursMax: z.number().int().min(5).max(20),
  budgetEGP: z.number().int().min(1),
});

router.post('/', requireAuth, requireRole('COMPANY'), validate(createGigSchema), async (req, res, next) => {
  try {
    const { title, description, skills, hoursMin, hoursMax, budgetEGP } = req.body;
    if (hoursMin > hoursMax) return res.status(400).json({ error: 'hoursMin must be <= hoursMax' });

    const gig = await prisma.gig.create({
      data: {
        companyId: req.user!.id,
        title,
        description,
        skills,
        hoursMin,
        hoursMax,
        budgetEGP,
        status: 'DRAFT',
      },
    });
    return res.status(201).json(gig);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/gigs/:id/publish ──────────────────────────────
router.put('/:id/publish', requireAuth, requireRole('COMPANY'), async (req, res, next) => {
  try {
    const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.companyId !== req.user!.id) return res.status(403).json({ error: 'Not your gig' });
    if (gig.status !== 'DRAFT') return res.status(400).json({ error: 'Only DRAFT gigs can be published' });

    const updated = await prisma.gig.update({
      where: { id: gig.id },
      data: { status: 'OPEN' },
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/gigs ──────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { skills, minBudget, maxBudget, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = { status: 'OPEN' };

    if (skills) {
      const skillList = (skills as string).split(',').map((s) => s.trim());
      where.skills = { hasSome: skillList };
    }
    if (minBudget) where.budgetEGP = { ...where.budgetEGP, gte: parseInt(minBudget as string) };
    if (maxBudget) where.budgetEGP = { ...where.budgetEGP, lte: parseInt(maxBudget as string) };

    const [gigs, total] = await Promise.all([
      prisma.gig.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { applications: true } } },
      }),
      prisma.gig.count({ where }),
    ]);

    // If authenticated student, compute match scores
    let gigsWithScores = gigs as any[];
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const payload = jwt.default.verify(
          authHeader.slice(7),
          process.env.JWT_SECRET || 'dev-secret'
        ) as any;

        if (payload.role === 'STUDENT') {
          const profile = await prisma.studentProfile.findUnique({
            where: { userId: payload.id },
          });

          if (profile) {
            gigsWithScores = gigs.map((gig: any) => ({
              ...gig,
              matchScore: Math.round(scoreStudentForGig(profile, gig) * 100),
            }));
            // Sort by match score descending
            gigsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
          }
        }
      } catch {
        // Invalid token — just return without scores
      }
    }

    return res.json({
      data: gigsWithScores,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/gigs/mine (company: own gigs) ─────────────────
router.get('/mine', requireAuth, requireRole('COMPANY'), async (req, res, next) => {
  try {
    const gigs = await prisma.gig.findMany({
      where: { companyId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
    return res.json({ data: gigs, pagination: { total: gigs.length } });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/gigs/:id ──────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { applications: true } } },
    });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    let result: any = { ...gig };

    // Compute match score if student
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const payload = jwt.default.verify(
          authHeader.slice(7),
          process.env.JWT_SECRET || 'dev-secret'
        ) as any;

        if (payload.role === 'STUDENT') {
          const profile = await prisma.studentProfile.findUnique({ where: { userId: payload.id } });
          if (profile) {
            result.matchScore = Math.round(scoreStudentForGig(profile, gig) * 100);
          }
        }
      } catch { /* ignore */ }
    }

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/gigs/:id ──────────────────────────────────────
const updateGigSchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(50).optional(),
  skills: z.array(z.string()).optional(),
  hoursMin: z.number().int().min(5).max(20).optional(),
  hoursMax: z.number().int().min(5).max(20).optional(),
  budgetEGP: z.number().int().min(1).optional(),
  status: z.enum(['OPEN', 'IN_REVIEW', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED']).optional(),
});

router.put('/:id', requireAuth, requireRole('COMPANY'), validate(updateGigSchema), async (req, res, next) => {
  try {
    const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.companyId !== req.user!.id) return res.status(403).json({ error: 'Not your gig' });

    const data: any = { ...req.body };

    // Budget/content edits only allowed on DRAFT
    const contentFields = ['title', 'description', 'skills', 'hoursMin', 'hoursMax', 'budgetEGP'];
    const tryingContentEdit = contentFields.some((f) => f in data);
    if (tryingContentEdit && gig.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Content can only be edited on DRAFT gigs' });
    }

    const updated = await prisma.gig.update({ where: { id: gig.id }, data });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/gigs/:id ───────────────────────────────────
router.delete('/:id', requireAuth, requireRole('COMPANY'), async (req, res, next) => {
  try {
    const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.companyId !== req.user!.id) return res.status(403).json({ error: 'Not your gig' });
    if (gig.status !== 'DRAFT') return res.status(400).json({ error: 'Only DRAFT gigs can be deleted' });

    await prisma.gig.delete({ where: { id: gig.id } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/gigs/:id/apply ───────────────────────────────
router.post('/:id/apply', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const { coverNote } = req.body;
    const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.status !== 'OPEN') return res.status(400).json({ error: 'Gig is not open for applications' });

    // Check not already applied
    const existing = await prisma.application.findUnique({
      where: { gigId_userId: { gigId: gig.id, userId: req.user!.id } },
    });
    if (existing) return res.status(409).json({ error: 'Already applied to this gig' });

    // Check student has at least 1 skill
    const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user!.id } });
    if (!profile || !profile.skills?.length) {
      return res.status(400).json({ error: 'Complete your profile with at least 1 skill before applying' });
    }

    const score = scoreStudentForGig(profile, gig);

    const application = await prisma.application.create({
      data: {
        gigId: gig.id,
        userId: req.user!.id,
        score,
        coverNote: coverNote || null,
      },
    });

    // Notify company
    await prisma.notification.create({
      data: {
        userId: gig.companyId,
        type: 'APPLICATION_UPDATE',
        message: `New applicant for "${gig.title}"`,
        link: `/company/gigs/${gig.id}/applicants`,
      },
    });

    return res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/gigs/:id/applicants ───────────────────────────
router.get('/:id/applicants', requireAuth, requireRole('COMPANY'), async (req, res, next) => {
  try {
    const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.companyId !== req.user!.id) return res.status(403).json({ error: 'Not your gig' });

    const applications = await prisma.application.findMany({
      where: { gigId: gig.id },
      orderBy: { score: 'desc' },
      include: {
        user: {
          include: { studentProfile: true },
        },
      },
    });

    // Blind view — never return uniEmail, ssnHash, institution names, graduation year
    const blind = applications.map((app: any) => ({
      applicationId: app.id,
      status: app.status,
      score: Math.round(app.score * 100),
      coverNote: app.coverNote,
      appliedAt: app.createdAt,
      student: {
        id: app.user.id,
        name: app.user.name,
        displayEmail: app.user.displayEmail,
        studentProfile: app.user.studentProfile
          ? {
              headline: app.user.studentProfile.headline,
              skills: app.user.studentProfile.skills,
              projects: app.user.studentProfile.projects,
              experience: Array.isArray(app.user.studentProfile.experience)
                ? (app.user.studentProfile.experience as any[]).map((e: any) => ({
                    role: e.role,
                    dates: e.dates,
                    bullets: e.bullets,
                    // company name intentionally omitted for bias prevention
                  }))
                : [],
              links: app.user.studentProfile.links,
            }
          : null,
      },
    }));

    return res.json(blind);
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/gigs/:id/applicants/:userId ───────────────────
router.put('/:id/applicants/:userId', requireAuth, requireRole('COMPANY'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'status must be ACCEPTED or REJECTED' });
    }

    const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.companyId !== req.user!.id) return res.status(403).json({ error: 'Not your gig' });

    if (status === 'ACCEPTED') {
      await prisma.$transaction(async (tx: any) => {
        // Accept this applicant
        await tx.application.update({
          where: { gigId_userId: { gigId: gig.id, userId: req.params.userId } },
          data: { status: 'ACCEPTED' },
        });

        // Reject all others
        await tx.application.updateMany({
          where: { gigId: gig.id, userId: { not: req.params.userId } },
          data: { status: 'REJECTED' },
        });

        // Set intern on gig + change to IN_PROGRESS
        await tx.gig.update({
          where: { id: gig.id },
          data: { internId: req.params.userId, status: 'IN_PROGRESS' },
        });

        // Notify accepted student
        await tx.notification.create({
          data: {
            userId: req.params.userId,
            type: 'APPLICATION_UPDATE',
            message: `Congratulations! Your application for "${gig.title}" was accepted.`,
            link: `/gigs/${gig.id}`,
          },
        });
      });
    } else {
      await prisma.application.update({
        where: { gigId_userId: { gigId: gig.id, userId: req.params.userId } },
        data: { status: 'REJECTED' },
      });

      await prisma.notification.create({
        data: {
          userId: req.params.userId,
          type: 'APPLICATION_UPDATE',
          message: `Your application for "${gig.title}" was not selected.`,
          link: `/gigs/${gig.id}`,
        },
      });
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/gigs/:id/submit ──────────────────────────────
router.post('/:id/submit', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const { deliverable } = req.body;
    if (!deliverable) return res.status(400).json({ error: 'deliverable is required' });

    const gig = await prisma.gig.findUnique({ where: { id: req.params.id } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.internId !== req.user!.id) return res.status(403).json({ error: 'You are not the assigned intern' });
    if (gig.status !== 'IN_PROGRESS') return res.status(400).json({ error: 'Gig is not in progress' });

    const updated = await prisma.gig.update({
      where: { id: gig.id },
      data: { status: 'SUBMITTED', deliverable },
    });

    // Notify company
    await prisma.notification.create({
      data: {
        userId: gig.companyId,
        type: 'APPLICATION_UPDATE',
        message: `The intern submitted their deliverable for "${gig.title}". Review and release payment.`,
        link: `/company/gigs/${gig.id}/escrow`,
      },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
