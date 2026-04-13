import { PrismaClient, UserRole, GigStatus, EscrowStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding InternMe database...');

  // ── Admin ────────────────────────────────────────────────
  const adminSsnHash = await bcrypt.hash('00000000000000', 12);
  const adminPwHash = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { personalEmail: 'admin@internme.co' },
    update: {},
    create: {
      role: UserRole.ADMIN,
      ssnHash: adminSsnHash,
      personalEmail: 'admin@internme.co',
      uniEmail: 'admin@admin.internme.co',
      displayEmail: 'admin@internme.co',
      name: 'Admin',
      passwordHash: adminPwHash,
    },
  });
  console.log('✅ Admin created:', admin.name);

  // ── Students ─────────────────────────────────────────────
  const studentData = [
    {
      ssn: '29901011234567',
      personalEmail: 'sara@gmail.com',
      uniEmail: 'sara@guc.edu.eg',
      name: 'Sara Khalil',
      headline: 'Frontend Developer & UI Designer',
      skills: ['React', 'TypeScript', 'Figma', 'Node.js', 'CSS'],
      projects: [
        {
          title: 'Portfolio Website',
          description: 'Personal portfolio built with Next.js and Framer Motion with smooth animations',
          url: 'https://sara.dev',
          tech: ['Next.js', 'Framer Motion', 'Tailwind'],
        },
        {
          title: 'E-commerce Dashboard',
          description: 'Analytics dashboard for a fashion brand with real-time charts',
          url: 'https://github.com/sara/dashboard',
          tech: ['React', 'Chart.js', 'REST API'],
        },
      ],
      experience: [
        {
          role: 'Frontend Intern',
          dates: 'Jun 2024 – Aug 2024',
          bullets: [
            'Built reusable component library used across 3 products',
            'Improved page load time by 40% through code splitting',
            'Collaborated with design team on Figma-to-code handoff',
          ],
        },
      ],
      education: [{ degree: 'BSc', field: 'Computer Science', gpa: '3.7' }],
      links: { github: 'https://github.com/sara', portfolio: 'https://sara.dev', linkedin: '' },
    },
    {
      ssn: '30003052345678',
      personalEmail: 'ahmed.dev@gmail.com',
      uniEmail: 'ahmed@aast.edu.eg',
      name: 'Ahmed Mostafa',
      headline: 'Backend Engineer | Node.js & PostgreSQL',
      skills: ['Node.js', 'PostgreSQL', 'Express', 'Python', 'Docker'],
      projects: [
        {
          title: 'Real-time Chat API',
          description: 'WebSocket-based chat service supporting 1000+ concurrent users',
          url: 'https://github.com/ahmed/chat',
          tech: ['Node.js', 'Socket.io', 'Redis'],
        },
      ],
      experience: [
        {
          role: 'Backend Developer',
          dates: 'Jan 2025 – Present',
          bullets: [
            'Designed RESTful APIs serving 50k+ daily requests',
            'Set up CI/CD pipelines with GitHub Actions',
            'Reduced database query time by 60% via indexing',
          ],
        },
      ],
      education: [{ degree: 'BSc', field: 'Software Engineering', gpa: '3.5' }],
      links: { github: 'https://github.com/ahmed', portfolio: '', linkedin: '' },
    },
    {
      ssn: '30105073456789',
      personalEmail: 'nour.design@gmail.com',
      uniEmail: 'nour@aucegypt.edu',
      name: 'Nour Hassan',
      headline: 'UI/UX Designer & Motion Graphics',
      skills: ['Figma', 'UI/UX', 'Motion Graphics', 'Video Editing', 'Copywriting'],
      projects: [
        {
          title: 'Fintech App Redesign',
          description: 'Complete UX overhaul for a mobile banking app improving task completion by 30%',
          url: 'https://behance.net/nour',
          tech: ['Figma', 'Principle', 'After Effects'],
        },
      ],
      experience: [
        {
          role: 'UX Designer',
          dates: 'Sep 2024 – Dec 2024',
          bullets: [
            'Conducted user research interviews with 20+ participants',
            'Created wireframes and prototypes for 4 core user flows',
            'Delivered design system with 80+ documented components',
          ],
        },
      ],
      education: [{ degree: 'BA', field: 'Graphic Design', gpa: '3.9' }],
      links: { github: '', portfolio: 'https://behance.net/nour', linkedin: '' },
    },
  ];

  const students: any[] = [];

  for (const s of studentData) {
    const ssnHash = await bcrypt.hash(s.ssn, 12);
    const pwHash = await bcrypt.hash('Test123!', 10);

    const user = await prisma.user.upsert({
      where: { personalEmail: s.personalEmail },
      update: {},
      create: {
        role: UserRole.STUDENT,
        ssnHash,
        personalEmail: s.personalEmail,
        uniEmail: s.uniEmail,
        displayEmail: s.personalEmail,
        name: s.name,
        passwordHash: pwHash,
        studentProfile: {
          create: {
            headline: s.headline,
            skills: s.skills,
            projects: s.projects as any,
            experience: s.experience as any,
            education: s.education as any,
            links: s.links as any,
          },
        },
      },
    });
    students.push(user);
    console.log('✅ Student created:', user.name);
  }

  // ── Companies ─────────────────────────────────────────────
  const companyData = [
    {
      ssn: '60001019876543',
      personalEmail: 'hiring@konnect.co',
      uniEmail: 'hr@konnect.corporate',
      name: 'Konnect Labs HR',
      companyName: 'Konnect Labs',
      industry: 'SaaS / Fintech',
      size: '11-50',
      website: 'https://konnect.co',
    },
    {
      ssn: '60002028765432',
      personalEmail: 'jobs@cairodigital.agency',
      uniEmail: 'ops@cairodigital.corporate',
      name: 'Cairo Digital Agency',
      companyName: 'Cairo Digital Agency',
      industry: 'Marketing & Creative',
      size: '51-200',
      website: 'https://cairodigital.agency',
    },
  ];

  const companies: any[] = [];

  for (const c of companyData) {
    const ssnHash = await bcrypt.hash(c.ssn, 12);
    const pwHash = await bcrypt.hash('Test123!', 10);

    const user = await prisma.user.upsert({
      where: { personalEmail: c.personalEmail },
      update: {},
      create: {
        role: UserRole.COMPANY,
        ssnHash,
        personalEmail: c.personalEmail,
        uniEmail: c.uniEmail,
        displayEmail: c.personalEmail,
        name: c.name,
        passwordHash: pwHash,
        companyProfile: {
          create: {
            companyName: c.companyName,
            industry: c.industry,
            size: c.size,
            website: c.website,
            verified: true,
          },
        },
      },
    });
    companies.push(user);
    console.log('✅ Company created:', c.companyName);
  }

  // ── Gigs ─────────────────────────────────────────────────
  const gig1 = await prisma.gig.create({
    data: {
      companyId: companies[0].id,
      title: 'React Frontend Developer for Dashboard MVP',
      description:
        'We need a skilled React developer to build the core UI for our analytics dashboard. You will work with our design team on Figma mockups and implement responsive components using React and TypeScript. This is a real project used by paying customers.',
      skills: ['React', 'TypeScript', 'Figma', 'CSS'],
      hoursMin: 10,
      hoursMax: 15,
      budgetEGP: 1200,
      status: GigStatus.OPEN,
    },
  });

  const gig2 = await prisma.gig.create({
    data: {
      companyId: companies[1].id,
      title: 'Motion Graphics for Product Launch Campaign',
      description:
        'Create 3 animated social media videos (15–30 seconds each) for our product launch. Videos should be in the brand style guide we provide. Deliverable: MP4 files exported at 1080p for Instagram, TikTok, and LinkedIn.',
      skills: ['Motion Graphics', 'Video Editing', 'Figma'],
      hoursMin: 8,
      hoursMax: 12,
      budgetEGP: 800,
      status: GigStatus.OPEN,
    },
  });

  const sara = students[0]; // React + Figma
  const gig3 = await prisma.gig.create({
    data: {
      companyId: companies[0].id,
      internId: sara.id,
      title: 'Node.js API Integration for CRM',
      description:
        'Integrate our existing Node.js API with a third-party CRM system. Tasks include: mapping data models, writing sync scripts, and testing with Postman. Documentation required.',
      skills: ['Node.js', 'PostgreSQL', 'Express'],
      hoursMin: 12,
      hoursMax: 18,
      budgetEGP: 1500,
      status: GigStatus.SUBMITTED,
    },
  });

  const gig4 = await prisma.gig.create({
    data: {
      companyId: companies[1].id,
      title: 'SEO Content Writing – 10 Blog Posts',
      description:
        'Write 10 SEO-optimized blog posts (800–1200 words each) on topics related to digital marketing, growth hacking, and social media strategy. Research, outline, write, and submit with target keywords.',
      skills: ['Copywriting', 'SEO', 'Marketing'],
      hoursMin: 15,
      hoursMax: 20,
      budgetEGP: 900,
      status: GigStatus.COMPLETED,
      deliverable: 'https://docs.google.com/document/d/example',
    },
  });

  const gig5 = await prisma.gig.create({
    data: {
      companyId: companies[0].id,
      title: 'UI Design for Mobile App (Draft)',
      description: 'Design screens for iOS app. Will define scope when ready.',
      skills: ['Figma', 'UI/UX'],
      hoursMin: 5,
      hoursMax: 10,
      budgetEGP: 600,
      status: GigStatus.DRAFT,
    },
  });

  console.log('✅ 5 gigs created');

  // ── Applications ──────────────────────────────────────────
  await prisma.application.createMany({
    data: [
      { gigId: gig1.id, userId: students[0].id, score: 0.87, coverNote: 'I have built 3 dashboards with React + TypeScript. Excited to contribute!' },
      { gigId: gig1.id, userId: students[1].id, score: 0.62, coverNote: 'Strong backend skills, comfortable with React for frontend work too.' },
      { gigId: gig2.id, userId: students[2].id, score: 0.91, coverNote: 'Motion graphics is my specialty. See my portfolio for samples.' },
      { gigId: gig3.id, userId: students[0].id, score: 0.75, status: 'ACCEPTED' },
    ],
  });
  console.log('✅ Applications created');

  // ── Escrow for completed gig ───────────────────────────────
  const escrow = await prisma.escrow.create({
    data: {
      gigId: gig4.id,
      totalCharged: Math.round(900 * 1.15),
      platformFeeB2B: Math.round(900 * 0.15),
      internPayout: Math.round(900 * 0.9),
      platformFeeB2C: Math.round(900 * 0.1),
      status: EscrowStatus.RELEASED,
      releasedAt: new Date(),
    },
  });

  const nour = students[2]; // nour did the SEO gig
  await prisma.transaction.createMany({
    data: [
      { escrowId: escrow.id, userId: nour.id, amountEGP: Math.round(900 * 0.9), type: 'INTERN_PAYOUT' },
      { escrowId: escrow.id, userId: nour.id, amountEGP: Math.round(900 * 0.1), type: 'PLATFORM_FEE_B2C' },
      { escrowId: escrow.id, userId: companies[1].id, amountEGP: Math.round(900 * 0.15), type: 'PLATFORM_FEE_B2B' },
    ],
  });

  // ── Escrow for IN_PROGRESS gig (held) ────────────────────
  const escrow2 = await prisma.escrow.create({
    data: {
      gigId: gig3.id,
      totalCharged: Math.round(1500 * 1.15),
      platformFeeB2B: Math.round(1500 * 0.15),
      internPayout: Math.round(1500 * 0.9),
      platformFeeB2C: Math.round(1500 * 0.1),
      status: EscrowStatus.HELD,
    },
  });

  console.log('✅ Escrows created');

  // ── Rating on completed gig ───────────────────────────────
  await prisma.rating.create({
    data: {
      gigId: gig4.id,
      raterId: companies[1].id,
      rateeId: nour.id,
      score: 5,
      comment: 'Excellent work! Delivered on time and exceeded expectations.',
    },
  });
  console.log('✅ Rating created');

  // ── Notifications ─────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: companies[0].id,
        type: 'APPLICATION_UPDATE',
        message: 'New applicant for "React Frontend Developer for Dashboard MVP"',
        link: `/company/gigs/${gig1.id}/applicants`,
      },
      {
        userId: students[0].id,
        type: 'APPLICATION_UPDATE',
        message: 'Your application for "Node.js API Integration" was accepted!',
        link: `/gigs/${gig3.id}`,
      },
      {
        userId: nour.id,
        type: 'PAYOUT',
        message: 'Your payment of 810 EGP has been released!',
        link: `/student/earnings`,
      },
    ],
  });
  console.log('✅ Notifications created');

  console.log('\n🎉 Seed complete! Demo accounts:');
  console.log('  Student:  sara@gmail.com        / Test123!');
  console.log('  Company:  hiring@konnect.co     / Test123!');
  console.log('  Admin:    admin@internme.co     / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
