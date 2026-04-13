# InternMe — Claude Code Build Skill
> 3-day sprint. Node.js + Next.js. Read this entire file before writing a single line of code.

---

## 0. Project Overview

**InternMe** is Egypt's first micro-internship marketplace. Students get short paid gigs (5–20 hrs) and build portfolios. Companies post gigs, pay via escrow, and "try before they hire."

**Revenue model:**
- Company pays escrow upfront → InternMe takes **15%** on completion
- Intern receives payout minus InternMe's **10%** of their share
- Example: Company posts 1,000 EGP gig → 1,150 EGP charged (15% added) → on completion, intern gets 900 EGP (10% deducted from intern's 1,000 EGP), InternMe keeps 250 EGP total

---

## 1. Tech Stack (NON-NEGOTIABLE)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 14** (App Router) | React + routing + SSR in one |
| Styling | **Tailwind CSS** | Fast, utility-first, no time for custom CSS |
| Backend | **Node.js + Express** | One language everywhere |
| Database | **PostgreSQL** via **Prisma ORM** | Type-safe, migrations built-in |
| Auth | **JWT** (jsonwebtoken) + bcrypt | Simple, no OAuth complexity |
| CV generation | **LaTeX** (pdflatex on server) | Jake Resume template → PDF |
| File storage | **Cloudflare R2** (S3-compatible) | Free tier, fast |
| Email | **Resend** | Best DX, generous free tier |
| Payment | **Paymob** (Egypt, EGP) | Only real option for Egypt cards |
| Caching | **Redis** (via Upstash free tier) | Session store + match cache |
| Deployment | **Railway** (backend) + **Vercel** (frontend) | Free tier, instant deploys |

**Do NOT introduce Python, Django, Flask, or FastAPI.** The founder has zero Python experience. Node.js only.

---

## 2. Monorepo Structure

```
internme/
├── apps/
│   ├── web/              ← Next.js frontend (Vercel)
│   └── api/              ← Express backend (Railway)
├── packages/
│   └── shared/           ← Shared TypeScript types, Zod schemas
├── prisma/
│   └── schema.prisma     ← Single source of truth for DB
├── .env.example
├── package.json          ← Root workspace (npm workspaces)
└── SKILL.md              ← This file
```

---

## 3. Database Schema (Prisma)

Define ALL models before writing any routes. This is the contract.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  STUDENT
  COMPANY
  ADMIN
}

enum GigStatus {
  DRAFT
  OPEN
  IN_REVIEW    // company reviewing applicants
  IN_PROGRESS  // intern accepted, work started
  SUBMITTED    // intern submitted deliverable
  COMPLETED    // company approved, payout triggered
  DISPUTED
  CANCELLED
}

enum EscrowStatus {
  PENDING
  HELD
  RELEASED
  REFUNDED
}

model User {
  id            String   @id @default(uuid())
  createdAt     DateTime @default(now())
  role          UserRole

  // Identity fields (unique triplet — NO duplicates possible)
  ssnHash       String   @unique  // bcrypt hash of SSN — NEVER store raw
  personalEmail String   @unique  // MUST NOT contain .edu / .ac / university signals
  uniEmail      String   @unique  // for verification only — NOT shown publicly

  // Public profile (bias-free — no uni visible)
  displayEmail  String   // = personalEmail, shown on profile
  name          String
  passwordHash  String

  // Student-specific
  studentProfile StudentProfile?
  applications   Application[]
  gigsWon        Gig[]           @relation("InternGigs")
  earnings       Transaction[]   @relation("InternTransactions")

  // Company-specific
  companyProfile CompanyProfile?
  gigsPosted     Gig[]           @relation("CompanyGigs")

  // Shared
  ratingsGiven    Rating[]        @relation("RaterRatings")
  ratingsReceived Rating[]        @relation("RateeRatings")
  notifications   Notification[]
}

model StudentProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])

  // CV fields — filled by student, rendered to PDF
  headline    String?
  skills      String[] // e.g. ["React", "Node.js", "Figma"]
  projects    Json?    // [{title, description, url, tech[]}]
  experience  Json?    // [{company (REDACTED from PDF bias check), role, dates, bullets[]}]
  education   Json?    // [{degree, field, gpa?}] — NO institution name in blind match
  links       Json?    // {github, portfolio, linkedin}
  cvPdfUrl    String?  // Cloudflare R2 URL of compiled Jake PDF

  matchScore  Float?   // computed by blind match engine, cached
}

model CompanyProfile {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])

  companyName String
  industry    String
  size        String   // "1-10", "11-50", etc.
  website     String?
  verified    Boolean  @default(false)
}

model Gig {
  id           String    @id @default(uuid())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  companyId    String
  company      User      @relation("CompanyGigs", fields: [companyId], references: [id])

  internId     String?
  intern       User?     @relation("InternGigs", fields: [internId], references: [id])

  title        String
  description  String
  skills       String[]  // must match student skill tags
  hoursMin     Int       // 5–20 hours
  hoursMax     Int
  budgetEGP    Int       // amount company pays intern
  status       GigStatus @default(DRAFT)

  escrow       Escrow?
  applications Application[]
  ratings      Rating[]
  deliverable  String?   // URL or text submitted by intern
}

model Application {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  gigId     String
  gig       Gig      @relation(fields: [gigId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  score     Float    // blind match score at time of application
  coverNote String?
  status    String   @default("PENDING") // PENDING, ACCEPTED, REJECTED

  @@unique([gigId, userId])
}

model Escrow {
  id             String       @id @default(uuid())
  createdAt      DateTime     @default(now())
  gigId          String       @unique
  gig            Gig          @relation(fields: [gigId], references: [id])

  // What company deposits (internBudget + 15% platform fee)
  totalCharged   Int          // budgetEGP * 1.15
  platformFeeB2B Int          // budgetEGP * 0.15

  // What intern receives (budgetEGP - 10%)
  internPayout   Int          // budgetEGP * 0.90
  platformFeeB2C Int          // budgetEGP * 0.10

  status         EscrowStatus @default(PENDING)
  paymobOrderId  String?      // from Paymob
  releasedAt     DateTime?
  transactions   Transaction[]
}

model Transaction {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  escrowId  String
  escrow    Escrow   @relation(fields: [escrowId], references: [id])
  userId    String
  user      User     @relation("InternTransactions", fields: [userId], references: [id])
  amountEGP Int
  type      String   // "INTERN_PAYOUT" | "PLATFORM_FEE_B2B" | "PLATFORM_FEE_B2C"
}

model Rating {
  id        String   @id @default(uuid())
  gigId     String
  gig       Gig      @relation(fields: [gigId], references: [id])
  raterId   String
  rater     User     @relation("RaterRatings", fields: [raterId], references: [id])
  rateeId   String
  ratee     User     @relation("RateeRatings", fields: [rateeId], references: [id])
  score     Int      // 1–5
  comment   String?
}

model Notification {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // "GIG_MATCH" | "APPLICATION_UPDATE" | "PAYOUT" | "DISPUTE"
  message   String
  read      Boolean  @default(false)
  link      String?
}
```

---

## 4. Authentication — The Identity Lock

**The uniqueness triplet:** SSN + personal Gmail + uni email. All three stored separately:
- `ssnHash` → bcrypt hash of raw SSN (NEVER store raw)
- `personalEmail` → validated to NOT contain `.edu`, `.ac.`, `student.`, or Egyptian university domains
- `uniEmail` → stored for internal verification but **never shown publicly**

**Public profile shows ONLY `personalEmail`** — zero university signal visible to companies.

**Banned email domains for `personalEmail`** (enforce server-side):
```js
const BANNED_DOMAINS = [
  '.edu', '.ac.', 'student.', 'aast.', 'aastmt.', 'aucegypt.', 
  'guc.', 'bue.', 'msa.', 'futureuniversity.', 'aiu.', 
  'fayoum.edu', 'cairo.edu', 'alex.edu', 'mans.edu',
  // add more Egyptian university domains
];

function isPersonalEmail(email) {
  return !BANNED_DOMAINS.some(d => email.toLowerCase().includes(d));
}
```

**Auth flow:**
1. POST `/api/auth/register` — receives `{name, ssn, personalEmail, uniEmail, password, role}`
2. Server: hash SSN with bcrypt (cost 12), hash password with bcrypt (cost 10)
3. Check all three fields for uniqueness — if ANY exists, reject with clear error
4. Create user, return JWT (7 day expiry)
5. POST `/api/auth/login` — only needs `personalEmail` + `password`
6. JWT middleware: `Authorization: Bearer <token>` on all protected routes

---

## 5. Blind Match Algorithm

**Goal:** Rank students for a gig purely on skills, ignoring university.

**Implementation (TF-IDF cosine similarity):**

```js
// apps/api/src/services/matchEngine.js

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);
}

function buildTfIdf(documents) {
  // documents: array of token arrays
  const N = documents.length;
  const idf = {};
  documents.forEach(doc => {
    const seen = new Set(doc);
    seen.forEach(term => { idf[term] = (idf[term] || 0) + 1; });
  });
  Object.keys(idf).forEach(term => {
    idf[term] = Math.log(N / idf[term]);
  });
  return idf;
}

function vectorize(tokens, idf) {
  const tf = {};
  tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
  const vec = {};
  tokens.forEach(t => { vec[t] = (tf[t] / tokens.length) * (idf[t] || 0); });
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  keys.forEach(k => {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// Main scoring function
function scoreStudentForGig(studentProfile, gig) {
  // Build student document from skills + project descriptions ONLY
  // DO NOT include university name or any educational institution
  const studentText = [
    ...(studentProfile.skills || []),
    ...(studentProfile.projects || []).map(p => `${p.title} ${p.description} ${(p.tech||[]).join(' ')}`),
    ...(studentProfile.experience || []).map(e => `${e.role} ${(e.bullets||[]).join(' ')}`),
  ].join(' ');

  const gigText = [
    gig.title,
    gig.description,
    ...(gig.skills || []),
  ].join(' ');

  const studentTokens = tokenize(studentText);
  const gigTokens = tokenize(gigText);

  const idf = buildTfIdf([studentTokens, gigTokens]);
  const studentVec = vectorize(studentTokens, idf);
  const gigVec = vectorize(gigTokens, idf);

  const similarity = cosineSimilarity(studentVec, gigVec);

  // Boost: exact skill tag matches (binary, weighted heavily)
  const gigSkills = new Set((gig.skills || []).map(s => s.toLowerCase()));
  const studentSkills = new Set((studentProfile.skills || []).map(s => s.toLowerCase()));
  const matchedSkills = [...gigSkills].filter(s => studentSkills.has(s));
  const skillBoost = matchedSkills.length / Math.max(gigSkills.size, 1);

  // Final score: 60% TF-IDF similarity + 40% skill tag overlap
  return (similarity * 0.6) + (skillBoost * 0.4);
}

module.exports = { scoreStudentForGig };
```

**What is NEVER passed to the algorithm:**
- University name
- Graduation year (too correlated with prestige)
- GPA
- `uniEmail`
- Any institution signal

---

## 6. CV Generation — Jake Resume → PDF

**How it works:**
1. Student fills a form in the dashboard (structured fields — NO free-text resume upload)
2. Backend compiles their data into Jake Resume LaTeX template
3. `pdflatex` runs server-side → PDF stored in Cloudflare R2
4. Student can download their own PDF
5. Companies NEVER receive a PDF — they only see the structured profile fields (blind to uni)

**Install on Railway server:**
```bash
apt-get install -y texlive-latex-base texlive-fonts-recommended texlive-latex-extra
```

**Jake Resume template integration:**
```js
// apps/api/src/services/cvGenerator.js
const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuid } = require('uuid');

function buildLatex(profile) {
  // Jake Resume .tex template with profile data injected
  // Full template: https://github.com/jakegut/resume
  return `
%-------------------------
% Jake's Resume Template
%-------------------------
\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\begin{document}

\\begin{center}
  {\\Huge \\scshape ${escTex(profile.user.name)}} \\\\ \\vspace{1pt}
  \\small ${escTex(profile.displayEmail)} $|$
  \\href{${escTex(profile.links?.github || '')}}{GitHub} $|$
  \\href{${escTex(profile.links?.portfolio || '')}}{Portfolio}
\\end{center}

%-----------SKILLS-----------
\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
  \\small{\\item{ ${escTex(profile.skills?.join(', ') || '')} }}
\\end{itemize}

%-----------PROJECTS-----------
\\section{Projects}
  \\resumeSubHeadingListStart
${(profile.projects || []).map(p => `
    \\resumeProjectHeading
      {\\textbf{${escTex(p.title)}} $|$ \\emph{${escTex((p.tech||[]).join(', '))}}}{}
    \\resumeItemListStart
      \\resumeItem{${escTex(p.description)}}
    \\resumeItemListEnd
`).join('')}
  \\resumeSubHeadingListEnd

%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
${(profile.experience || []).map(e => `
    \\resumeSubheading
      {${escTex(e.role)}}{${escTex(e.dates || '')}}
      {[Company]}{} 
    \\resumeItemListStart
${(e.bullets || []).map(b => `      \\resumeItem{${escTex(b)}}`).join('\n')}
    \\resumeItemListEnd
`).join('')}
  \\resumeSubHeadingListEnd

\\end{document}
`;
}

function escTex(str) {
  if (!str) return '';
  return str.replace(/[&%$#_{}~^\\]/g, m => '\\' + m);
}

async function generatePdf(profile) {
  const id = uuid();
  const dir = `/tmp/cv-${id}`;
  await fs.mkdir(dir, { recursive: true });

  const texPath = path.join(dir, 'resume.tex');
  await fs.writeFile(texPath, buildLatex(profile), 'utf8');

  await new Promise((resolve, reject) => {
    exec(
      `pdflatex -interaction=nonstopmode -output-directory=${dir} ${texPath}`,
      (err, stdout, stderr) => {
        if (err) reject(new Error(stderr || stdout));
        else resolve();
      }
    );
  });

  const pdfPath = path.join(dir, 'resume.pdf');
  const pdfBuffer = await fs.readFile(pdfPath);

  // Clean up temp files
  await fs.rm(dir, { recursive: true, force: true });

  return pdfBuffer;
}

module.exports = { generatePdf };
```

---

## 7. Escrow Service

**This is the most critical service. Get it right.**

**Money flow:**
```
Company posts gig: budgetEGP = 1000
↓
Company pays Paymob: totalCharged = 1000 * 1.15 = 1150 EGP
↓ (held in escrow)
Intern completes work → Company approves
↓
internPayout = 1000 * 0.90 = 900 EGP  → sent to intern (Paymob disbursement)
platformFee  = 1000 * 0.10 = 100 EGP (B2C) + 150 EGP (B2B) = 250 EGP → InternMe
```

**Escrow state machine:**
```
PENDING → HELD (payment confirmed) → RELEASED (work approved) → done
                                   → REFUNDED (dispute resolved for company)
```

**API routes:**
```
POST /api/escrow/create          → create escrow, get Paymob payment URL
POST /api/escrow/paymob-webhook  → Paymob confirms payment → set HELD
POST /api/escrow/release/:gigId  → company approves → set RELEASED, trigger payout
POST /api/escrow/dispute/:gigId  → opens dispute → admin reviews
```

**Paymob integration (MVP — use Paymob Accept):**
```js
// apps/api/src/services/paymob.js
const axios = require('axios');

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID;

async function createPaymentOrder(amountEGP, orderId, customerData) {
  // Step 1: Auth
  const { data: authData } = await axios.post(
    'https://accept.paymob.com/api/auth/tokens',
    { api_key: PAYMOB_API_KEY }
  );
  const token = authData.token;

  // Step 2: Order registration
  const { data: orderData } = await axios.post(
    'https://accept.paymob.com/api/ecommerce/orders',
    {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountEGP * 100,
      currency: 'EGP',
      merchant_order_id: orderId,
    }
  );

  // Step 3: Payment key
  const { data: keyData } = await axios.post(
    'https://accept.paymob.com/api/acceptance/payment_keys',
    {
      auth_token: token,
      amount_cents: amountEGP * 100,
      expiration: 3600,
      order_id: orderData.id,
      billing_data: customerData,
      currency: 'EGP',
      integration_id: INTEGRATION_ID,
    }
  );

  return {
    paymobOrderId: String(orderData.id),
    paymentUrl: `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${keyData.token}`,
  };
}

module.exports = { createPaymentOrder };
```

---

## 8. Frontend Panels to Build

Build in this exact priority order (Day 1 → Day 3):

### DAY 1 — Auth + Core Shell
1. **`/auth/register`** — 3-step form:
   - Step 1: Role selection (Student / Company)
   - Step 2: Identity (SSN, personalEmail validation, uniEmail, name, password)
   - Step 3: Profile basics
2. **`/auth/login`** — email + password only
3. **Dashboard shell** — sidebar nav, role-based routing

### DAY 2 — Core Product
4. **`/dashboard/student/profile`** — structured fields:
   - Skills (tag input, autocomplete from common list)
   - Projects (title, tech, description, URL)
   - Experience (role, dates, 3 bullet points) — no company name visible to algorithm
   - Links (GitHub, portfolio)
   - "Generate CV PDF" button → calls `/api/cv/generate` → download link
5. **`/gigs`** — marketplace browse page (cards with title, skills needed, budget, hours range)
6. **`/gigs/[id]`** — gig detail + apply button (shows match score to student)
7. **`/dashboard/company/post-gig`** — form: title, description, skills (tag input), budget, hours min/max
8. **`/dashboard/company/gigs/[id]/applicants`** — ranked list of applicants (blind — no uni, no photo, just name, skills, score, projects)

### DAY 3 — Escrow + Polish
9. **`/dashboard/company/gigs/[id]/escrow`** — fund gig button → Paymob redirect
10. **`/dashboard/student/earnings`** — pending + released payouts
11. **`/dashboard/admin`** — user list, active escrows, disputes
12. **Notification bell** — in-app only (email as fallback)

---

## 9. API Route Map

```
# Auth
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

# Users / Profiles
GET    /api/profile/student/:id    (public, bias-free view)
PUT    /api/profile/student        (own profile update)
PUT    /api/profile/company        (own profile update)

# CV
POST   /api/cv/generate            → returns PDF as buffer, stored to R2
GET    /api/cv/download            → redirect to R2 signed URL

# Gigs
GET    /api/gigs                   → list open gigs (with match score if student)
POST   /api/gigs                   → create gig (company only)
GET    /api/gigs/:id
PUT    /api/gigs/:id               → update status
DELETE /api/gigs/:id               → only if DRAFT

# Applications
POST   /api/gigs/:id/apply
GET    /api/gigs/:id/applicants    → company sees ranked list (blind)
PUT    /api/gigs/:id/applicants/:userId  → accept/reject

# Escrow
POST   /api/escrow/create          → body: { gigId }
POST   /api/escrow/paymob-webhook  → Paymob HMAC-verified callback
POST   /api/escrow/release/:gigId  → company triggers on approval
POST   /api/escrow/dispute/:gigId

# Ratings
POST   /api/ratings/:gigId         → both parties rate after completion

# Notifications
GET    /api/notifications
PUT    /api/notifications/:id/read

# Admin
GET    /api/admin/users
GET    /api/admin/escrows
POST   /api/admin/disputes/:id/resolve
```

---

## 10. Environment Variables

```env
# apps/api/.env
DATABASE_URL=postgresql://user:pass@host/internme
REDIS_URL=redis://...
JWT_SECRET=your-secret-here

# Paymob
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_IFRAME_ID=
PAYMOB_HMAC_SECRET=    # for webhook verification

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=internme-cvs
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Email
RESEND_API_KEY=

# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 11. Security Rules (ENFORCE ALWAYS)

1. **Never log or return `ssnHash`** — not in API responses, not in logs
2. **Verify Paymob webhooks** with HMAC-SHA512 before processing any escrow state change
3. **Blind match** — the applicant list returned to companies must NEVER include `uniEmail`, institution names from experience/education, or graduation year
4. **Admin routes** must check `role === 'ADMIN'` server-side — not just on frontend
5. **Rate limit** auth routes: 10 requests/minute per IP (use `express-rate-limit`)
6. **Input validation** — use **Zod** for all request bodies. Reject unknown fields.
7. **SQL injection** — Prisma ORM prevents this; never use raw queries with user input
8. **File uploads** — if accepting anything, validate MIME type server-side; CVs are generated server-side so no upload needed

---

## 12. Day-by-Day Build Plan

### Day 1 (Foundation)
- [ ] Init monorepo: `npm init -w apps/web -w apps/api`
- [ ] Set up Prisma schema + run first migration
- [ ] Auth service: register, login, JWT middleware
- [ ] Express app skeleton with error handler
- [ ] Next.js with Tailwind, auth pages (`/register`, `/login`)
- [ ] Dashboard shell with sidebar

### Day 2 (Product Core)
- [ ] Student profile CRUD + CV form
- [ ] Jake Resume LaTeX compilation + R2 upload
- [ ] Gig CRUD routes
- [ ] Blind match engine scoring
- [ ] Gig marketplace page + gig detail page
- [ ] Apply to gig flow
- [ ] Company applicant list (blind)

### Day 3 (Escrow + Demo Polish)
- [ ] Paymob integration (test mode)
- [ ] Escrow create → webhook → release flow
- [ ] Payout calculation logic
- [ ] Notifications (in-app)
- [ ] Admin panel (basic)
- [ ] Ratings system
- [ ] Seed script with demo data
- [ ] Deploy: Railway (API) + Vercel (web)

---

## 13. Demo Seed Data

Create `prisma/seed.js` with:
- 1 admin user
- 3 student accounts (different skill sets)
- 2 company accounts (1 startup, 1 SME)
- 5 gigs in various statuses (OPEN, IN_PROGRESS, COMPLETED)
- 2 escrows (1 HELD, 1 RELEASED with payout)

Run: `npx prisma db seed`

---

## 14. Commands Reference

```bash
# Setup
npm install                          # install all workspaces
npx prisma generate                  # generate Prisma client
npx prisma migrate dev --name init   # run migration

# Development
npm run dev --workspace=apps/api     # backend on :4000
npm run dev --workspace=apps/web     # frontend on :3000

# Database
npx prisma studio                    # visual DB explorer
npx prisma db seed                   # seed demo data

# Deploy
railway up                           # deploy API
vercel --prod                        # deploy web
```

---

## 15. What NOT to Build in 3 Days

Skip these entirely for the demo. They are nice-to-have post-Rally:
- ❌ Mobile app (React Native)
- ❌ Real Paymob disbursement (use mock release in demo)
- ❌ Video interviews
- ❌ Skill assessments / tests
- ❌ Email verification flow (just allow registration)
- ❌ Stripe / other payment gateways
- ❌ Two-factor authentication
- ❌ Chat / messaging between student and company

---

*This file is the single source of truth for Claude Code. Do not deviate from the stack, schema, or auth model without updating this file first.*
