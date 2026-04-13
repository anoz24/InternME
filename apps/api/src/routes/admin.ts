import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/admin/stats
router.get('/stats', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalCompanies,
      totalGigs,
      totalEscrows,
      totalRevenue,
      activeDisputes,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'COMPANY' } }),
      prisma.gig.count(),
      prisma.escrow.count(),
      prisma.transaction.aggregate({
        _sum: { amountEGP: true },
        where: { type: { in: ['PLATFORM_FEE_B2B', 'PLATFORM_FEE_B2C'] } },
      }),
      prisma.gig.count({ where: { status: 'DISPUTED' } }),
    ]);

    return res.json({
      totalUsers,
      totalStudents,
      totalCompanies,
      totalGigs,
      totalEscrows,
      totalRevenue: totalRevenue._sum.amountEGP || 0,
      activeDisputes,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/users
router.get('/users', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { role, page = '1', limit = '20', search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { personalEmail: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          personalEmail: true,
          role: true,
          createdAt: true,
          _count: { select: { gigsPosted: true, applications: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ data: users, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/escrows
router.get('/escrows', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status) where.status = status;

    const [escrows, total] = await Promise.all([
      prisma.escrow.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          gig: {
            include: {
              company: { select: { name: true, personalEmail: true } },
              intern: { select: { name: true, personalEmail: true } },
            },
          },
          transactions: true,
        },
      }),
      prisma.escrow.count({ where }),
    ]);

    return res.json({ data: escrows, pagination: { page: pageNum, limit: limitNum, total } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/disputes
router.get('/disputes', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const disputes = await prisma.gig.findMany({
      where: { status: 'DISPUTED' },
      include: {
        company: { select: { id: true, name: true, personalEmail: true } },
        intern: { select: { id: true, name: true, personalEmail: true } },
        escrow: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(disputes);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/disputes/:gigId/resolve
router.post('/disputes/:gigId/resolve', requireAuth, requireRole('ADMIN'), async (req, res, next) => {
  try {
    const { resolution, note } = req.body;
    if (!['RELEASE', 'REFUND'].includes(resolution)) {
      return res.status(400).json({ error: 'resolution must be RELEASE or REFUND' });
    }

    const gig = await prisma.gig.findUnique({
      where: { id: req.params.gigId },
      include: { escrow: true },
    });

    if (!gig) return res.status(404).json({ error: 'Gig not found' });
    if (gig.status !== 'DISPUTED') return res.status(400).json({ error: 'Gig is not disputed' });

    if (resolution === 'RELEASE') {
      await prisma.$transaction(async (tx: any) => {
        await tx.escrow.update({
          where: { id: gig.escrow!.id },
          data: { status: 'RELEASED', releasedAt: new Date() },
        });
        await tx.gig.update({ where: { id: gig.id }, data: { status: 'COMPLETED' } });
        await tx.transaction.createMany({
          data: [
            { escrowId: gig.escrow!.id, userId: gig.internId!, amountEGP: gig.escrow!.internPayout, type: 'INTERN_PAYOUT' },
            { escrowId: gig.escrow!.id, userId: gig.internId!, amountEGP: gig.escrow!.platformFeeB2C, type: 'PLATFORM_FEE_B2C' },
            { escrowId: gig.escrow!.id, userId: gig.companyId, amountEGP: gig.escrow!.platformFeeB2B, type: 'PLATFORM_FEE_B2B' },
          ],
        });
        if (gig.internId) {
          await tx.notification.create({
            data: { userId: gig.internId, type: 'PAYOUT', message: `Dispute resolved: payment of ${gig.escrow!.internPayout} EGP released. Note: ${note}`, link: '/student/earnings' },
          });
        }
      });
    } else {
      await prisma.$transaction(async (tx: typeof prisma) => {
        await tx.escrow.update({ where: { id: gig.escrow!.id }, data: { status: 'REFUNDED' } });
        await tx.gig.update({ where: { id: gig.id }, data: { status: 'CANCELLED' } });
        await tx.notification.createMany({
          data: [
            { userId: gig.companyId, type: 'DISPUTE', message: `Dispute resolved: escrow refunded. Note: ${note}`, link: '/company/gigs' },
            ...(gig.internId ? [{ userId: gig.internId, type: 'DISPUTE' as const, message: `Dispute resolved in company's favor. Note: ${note}`, link: '/gigs' }] : []),
          ],
        });
      });
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
