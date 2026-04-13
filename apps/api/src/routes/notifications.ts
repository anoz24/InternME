import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/notifications
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
      take: 20,
    });
    const unreadCount = notifications.filter((n: any) => !n.read).length;
    return res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    if (notification.userId !== req.user!.id) return res.status(403).json({ error: 'Access denied' });

    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// PUT /api/notifications/read-all
router.put('/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
