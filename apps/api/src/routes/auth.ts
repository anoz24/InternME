import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Rate limit: 10 requests/min per IP on auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait a minute.' },
});

// ── Helpers ────────────────────────────────────────────────
const BANNED_DOMAINS = [
  '.edu', '.ac.', 'student.', 'aast.', 'aastmt.', 'aucegypt.',
  'guc.', 'bue.', 'msa.', 'futureuniversity.', 'aiu.',
  'fayoum.edu', 'cairo.edu', 'alex.edu', 'mans.edu',
];

function isPersonalEmail(email: string): boolean {
  return !BANNED_DOMAINS.some((d) => email.toLowerCase().includes(d));
}

function signToken(payload: { id: string; role: string; email: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: '7d',
  });
}

function safeUser(user: any) {
  const { ssnHash, passwordHash, uniEmail, ...safe } = user;
  return safe;
}

// ── Schemas ────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2),
  ssn: z.string().length(14, 'SSN must be 14 digits'),
  personalEmail: z.string().email(),
  uniEmail: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['STUDENT', 'COMPANY']),
  // Optional profile basics
  headline: z.string().optional(),
  skills: z.array(z.string()).optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
});

const loginSchema = z.object({
  personalEmail: z.string().email(),
  password: z.string().min(1),
});

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, ssn, personalEmail, uniEmail, password, role, headline, skills, companyName, industry, size } = req.body;

    // Validate personal email is not a university email
    if (!isPersonalEmail(personalEmail)) {
      return res.status(400).json({
        error: 'Personal email must not be a university email. Use Gmail, Outlook, or similar.',
      });
    }

    // Hash SSN (cost 12) and password (cost 10)
    const ssnHash = await bcrypt.hash(ssn, 12);
    const passwordHash = await bcrypt.hash(password, 10);

    // Check uniqueness
    const [emailConflict, uniEmailConflict] = await Promise.all([
      prisma.user.findUnique({ where: { personalEmail } }),
      prisma.user.findUnique({ where: { uniEmail } }),
    ]);

    if (emailConflict) return res.status(409).json({ error: 'Personal email already registered', field: 'personalEmail' });
    if (uniEmailConflict) return res.status(409).json({ error: 'University email already registered', field: 'uniEmail' });

    // Check SSN hash uniqueness
    const allUsers = await prisma.user.findMany({ select: { ssnHash: true } });
    for (const u of allUsers) {
      if (await bcrypt.compare(ssn, u.ssnHash)) {
        return res.status(409).json({ error: 'SSN already registered', field: 'ssn' });
      }
    }

    // Create user + profile
    const user = await prisma.user.create({
      data: {
        role,
        ssnHash,
        personalEmail,
        uniEmail,
        displayEmail: personalEmail,
        name,
        passwordHash,
        ...(role === 'STUDENT'
          ? {
              studentProfile: {
                create: {
                  headline: headline || null,
                  skills: skills || [],
                },
              },
            }
          : {
              companyProfile: {
                create: {
                  companyName: companyName || name,
                  industry: industry || 'Other',
                  size: size || '1-10',
                },
              },
            }),
      },
      include: {
        studentProfile: true,
        companyProfile: true,
      },
    });

    const token = signToken({ id: user.id, role: user.role, email: user.personalEmail });
    return res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { personalEmail, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { personalEmail },
      include: { studentProfile: true, companyProfile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({ id: user.id, role: user.role, email: user.personalEmail });
    return res.json({ token, user: safeUser(user) });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me ───────────────────────────────────────
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { studentProfile: true, companyProfile: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(safeUser(user));
  } catch (err) {
    next(err);
  }
});

export default router;
