import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const ratingSchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

router.post('/:gigId', requireAuth, validate(ratingSchema), async (req, res, next) => {
  try {
    const { score, comment } = req.body;
    const gig = await prisma.gig.findUnique({ where: { id: req.params.gigId } });

    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.status !== 'COMPLETED') return res.status(400).json({ error: 'Can only rate completed gigs' });

    const isCompany = gig.companyId === req.user!.id;
    const isIntern = gig.internId === req.user!.id;

    if (!isCompany && !isIntern) {
      return res.status(403).json({ error: 'You are not a party to this gig' });
    }

    // Check for duplicate rating
    const existing = await prisma.rating.findUnique({
      where: { gigId_raterId: { gigId: gig.id, raterId: req.user!.id } },
    });
    if (existing) return res.status(409).json({ error: 'You already rated this gig' });

    // Rater rates the other party
    const rateeId = isCompany ? gig.internId! : gig.companyId;

    const rating = await prisma.rating.create({
      data: {
        gigId: gig.id,
        raterId: req.user!.id,
        rateeId,
        score,
        comment: comment || null,
      },
    });

    return res.status(201).json(rating);
  } catch (err) {
    next(err);
  }
});

export default router;
