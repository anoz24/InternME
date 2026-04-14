import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { generatePdf } from '../services/cvGenerator';
import { uploadBuffer, getSignedDownloadUrl, deleteFile } from '../lib/supabase';

const router = Router();

// POST /api/cv/generate
router.post('/generate', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { studentProfile: true },
    });

    if (!user || !user.studentProfile) {
      return res.status(400).json({ error: 'Complete your profile before generating a CV' });
    }

    const profile = {
      ...user.studentProfile,
      user: { name: user.name },
      displayEmail: user.displayEmail,
    };

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generatePdf(profile);
    } catch (latexErr: any) {
      console.error('[CV] LaTeX error:', latexErr.message);
      return res.status(500).json({
        error: 'CV generation failed. Make sure pdflatex (LaTeX) is installed on the server.',
        details: latexErr.message,
      });
    }

    // Delete existing PDF if it exists
    if (user.studentProfile.cvPdfUrl && !user.studentProfile.cvPdfUrl.startsWith('http')) {
      await deleteFile(user.studentProfile.cvPdfUrl);
    }

    const key = `cv-${user.id}-${Date.now()}.pdf`;
    let cvUrl: string;

    try {
      cvUrl = await uploadBuffer(key, pdfBuffer, 'application/pdf');
    } catch (storageErr) {
      // If Supabase is not configured, serve the PDF directly as base64 for demo
      console.warn('[CV] Supabase not configured — returning base64');
      const base64 = pdfBuffer.toString('base64');
      return res.json({
        url: null,
        base64: `data:application/pdf;base64,${base64}`,
        message: 'Supabase not configured. CV generated successfully but not stored remotely.',
      });
    }

    // Save URL to profile
    await prisma.studentProfile.update({
      where: { userId: user.id },
      data: { cvPdfUrl: cvUrl },
    });

    return res.json({ url: cvUrl });
  } catch (err) {
    next(err);
  }
});

// GET /api/cv/download
router.get('/download', requireAuth, requireRole('STUDENT'), async (req, res, next) => {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: req.user!.id },
    });

    if (!profile?.cvPdfUrl) {
      return res.status(404).json({ error: 'No CV generated yet' });
    }

    // If it's already a public URL, redirect directly
    if (profile.cvPdfUrl.startsWith('http')) {
      return res.redirect(profile.cvPdfUrl);
    }

    // Otherwise generate a signed URL from Supabase
    try {
      const url = await getSignedDownloadUrl(profile.cvPdfUrl);
      return res.redirect(url);
    } catch {
      return res.redirect(profile.cvPdfUrl);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
