import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import gigsRoutes from './routes/gigs';
import escrowRoutes from './routes/escrow';
import cvRoutes from './routes/cv';
import ratingsRoutes from './routes/ratings';
import notificationsRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security & Parsing ─────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/gigs', gigsRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// ── Error handler (must be last) ───────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 InternMe API running on port ${PORT}`);
});

export default app;
