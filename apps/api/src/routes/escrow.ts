import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// ── POST /api/escrow/create ────────────────────────────────
router.post('/create', requireAuth, requireRole('COMPANY'), async (req, res, next) => {
  try {
    const { gigId } = req.body;
    if (!gigId) return res.status(400).json({ error: 'gigId is required' });

    const gig = await prisma.gig.findUnique({ where: { id: gigId }, include: { escrow: true } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.companyId !== req.user!.id) return res.status(403).json({ error: 'Not your gig' });
    if (!['IN_PROGRESS', 'SUBMITTED'].includes(gig.status)) {
      return res.status(400).json({ error: 'Gig must be IN_PROGRESS or SUBMITTED to fund escrow' });
    }
    if (gig.escrow) return res.status(409).json({ error: 'Escrow already exists for this gig' });

    const totalCharged = Math.round(gig.budgetEGP * 1.15);
    const platformFeeB2B = Math.round(gig.budgetEGP * 0.15);
    const internPayout = Math.round(gig.budgetEGP * 0.9);
    const platformFeeB2C = Math.round(gig.budgetEGP * 0.1);

    const escrow = await prisma.escrow.create({
      data: {
        gigId: gig.id,
        totalCharged,
        platformFeeB2B,
        internPayout,
        platformFeeB2C,
        status: 'PENDING',
      },
    });

    // In production, this would redirect to Paymob.
    // For MVP demo, return the mock-pay endpoint.
    return res.status(201).json({
      escrowId: escrow.id,
      totalCharged,
      breakdown: {
        internBudget: gig.budgetEGP,
        platformFee: platformFeeB2B,
        totalCharged,
      },
      // Demo: use mock-pay endpoint
      mockPayUrl: `/api/escrow/mock-pay/${escrow.id}`,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/escrow/mock-pay/:escrowId ───────────────────
// Demo only — immediately holds funds without payment gateway
router.post('/mock-pay/:escrowId', requireAuth, async (req, res, next) => {
  try {
    const escrow = await prisma.escrow.findUnique({
      where: { id: req.params.escrowId },
      include: { gig: true },
    });
    if (!escrow) return res.status(404).json({ error: 'Escrow not found' });
    if (escrow.gig.companyId !== req.user!.id) return res.status(403).json({ error: 'Not your escrow' });
    if (escrow.status !== 'PENDING') {
      return res.status(400).json({ error: `Escrow is already ${escrow.status}` });
    }

    await prisma.escrow.update({
      where: { id: escrow.id },
      data: { status: 'HELD' },
    });

    return res.json({ success: true, message: 'Payment simulated — funds are now held in escrow.' });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/escrow/release/:gigId ───────────────────────
router.post('/release/:gigId', requireAuth, requireRole('COMPANY'), async (req, res, next) => {
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: req.params.gigId },
      include: { escrow: true },
    });

    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.companyId !== req.user!.id) return res.status(403).json({ error: 'Not your gig' });
    if (!['SUBMITTED', 'IN_PROGRESS'].includes(gig.status)) {
      return res.status(400).json({ error: 'Gig must be SUBMITTED or IN_PROGRESS to release payment' });
    }
    if (!gig.escrow) return res.status(400).json({ error: 'No escrow found for this gig' });
    if (gig.escrow.status !== 'HELD') {
      return res.status(400).json({ error: 'Escrow must be HELD before releasing' });
    }
    if (!gig.internId) return res.status(400).json({ error: 'No intern assigned to this gig' });

    await prisma.$transaction(async (tx: any) => {
      // Update escrow
      await tx.escrow.update({
        where: { id: gig.escrow!.id },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      // Update gig
      await tx.gig.update({
        where: { id: gig.id },
        data: { status: 'COMPLETED' },
      });

      // Create transactions
      await tx.transaction.createMany({
        data: [
          {
            escrowId: gig.escrow!.id,
            userId: gig.internId!,
            amountEGP: gig.escrow!.internPayout,
            type: 'INTERN_PAYOUT',
          },
          {
            escrowId: gig.escrow!.id,
            userId: gig.internId!,
            amountEGP: gig.escrow!.platformFeeB2C,
            type: 'PLATFORM_FEE_B2C',
          },
          {
            escrowId: gig.escrow!.id,
            userId: gig.companyId,
            amountEGP: gig.escrow!.platformFeeB2B,
            type: 'PLATFORM_FEE_B2B',
          },
        ],
      });

      // Notify intern
      await tx.notification.create({
        data: {
          userId: gig.internId!,
          type: 'PAYOUT',
          message: `Your payment of ${gig.escrow!.internPayout} EGP has been released for "${gig.title}"!`,
          link: '/student/earnings',
        },
      });
    });

    return res.json({ success: true, internPayout: gig.escrow.internPayout });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/escrow/dispute/:gigId ───────────────────────
router.post('/dispute/:gigId', requireAuth, async (req, res, next) => {
  try {
    const gig = await prisma.gig.findUnique({ where: { id: req.params.gigId } });
    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    const isParty = gig.companyId === req.user!.id || gig.internId === req.user!.id;
    if (!isParty && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not a party to this gig' });
    }

    if (!['IN_PROGRESS', 'SUBMITTED'].includes(gig.status)) {
      return res.status(400).json({ error: 'Disputes can only be opened on IN_PROGRESS or SUBMITTED gigs' });
    }

    await prisma.gig.update({ where: { id: gig.id }, data: { status: 'DISPUTED' } });

    // Notify admin
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    await prisma.notification.createMany({
      data: admins.map((admin: any) => ({
        userId: admin.id,
        type: 'DISPUTE',
        message: `Dispute opened on gig "${gig.title}"`,
        link: `/admin`,
      })),
    });

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/escrow/:gigId ─────────────────────────────────
router.get('/:gigId', requireAuth, async (req, res, next) => {
  try {
    const gig = await prisma.gig.findUnique({
      where: { id: req.params.gigId },
      include: { escrow: { include: { transactions: true } } },
    });

    if (!gig) return res.status(404).json({ error: 'Gig not found' });

    const isParty = gig.companyId === req.user!.id || gig.internId === req.user!.id;
    if (!isParty && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(gig.escrow || null);
  } catch (err) {
    next(err);
  }
});

export default router;
