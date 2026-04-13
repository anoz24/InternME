# InternMe — 3-Day Execution Plan
> Rally 2026 · Omar Emad El-Habashy
> Stack: Next.js 14 + Node.js/Express + PostgreSQL/Prisma + Tailwind
> Read SKILL.md before touching code. This file is the clock.

---

## Before You Start — One-Time Setup (30 min)

Do this before Day 1 begins. Don't skip.

- [ ] Create accounts: [Railway](https://railway.app), [Vercel](https://vercel.com), [Cloudflare](https://dash.cloudflare.com) (R2), [Upstash](https://upstash.com) (Redis), [Resend](https://resend.com)
- [ ] Register at [Paymob](https://accept.paymob.com) — get API key, create integration, note iframe ID
- [ ] Install globally: `npm i -g pnpm` and verify `node -v` is 18+
- [ ] Install [LaTeX](https://www.tug.org/texlive/) locally for CV dev: `sudo apt install texlive-latex-extra` (Linux) or MiKTeX (Windows)
- [ ] Create GitHub repo: `internme` — private
- [ ] Clone repo, open in VS Code, open Claude Code in terminal

**First Claude Code prompt:**
```
Read SKILL.md. Initialize the monorepo exactly as described:
- Root package.json with npm workspaces for apps/web and apps/api
- apps/api: Express + TypeScript skeleton with nodemon
- apps/web: Next.js 14 with App Router and Tailwind CSS
- packages/shared: shared TypeScript types
- prisma/schema.prisma: full schema from SKILL.md section 3
- .env.example with all variables from SKILL.md section 10
- .gitignore that excludes .env, node_modules, .next, dist
Run npm install and verify both apps start without errors.
```

---

## DAY 1 — Foundation
### Goal by end of day: A user can register, log in, and see their dashboard shell.

---

### Block 1 · 9:00–11:00 · Monorepo + Database (2 hrs)

**What you're building:** The skeleton everything else plugs into.

- [ ] Confirm monorepo initialized from setup prompt above
- [ ] Paste full Prisma schema from SKILL.md into `prisma/schema.prisma`
- [ ] Set `DATABASE_URL` in `apps/api/.env` — use Railway PostgreSQL (provision now, copy URL)
- [ ] Run: `npx prisma migrate dev --name init`
- [ ] Run: `npx prisma generate`
- [ ] Verify: `npx prisma studio` opens and shows all empty tables

**Claude Code prompt:**
```
In apps/api, create the full Express server structure:
- src/index.ts — app entry, listens on PORT env (default 4000)
- src/middleware/auth.ts — JWT verification middleware, attaches req.user
- src/middleware/errorHandler.ts — catches all errors, returns {error: message}
- src/middleware/validate.ts — Zod schema validation wrapper
- src/lib/prisma.ts — singleton Prisma client
- src/lib/redis.ts — Upstash Redis client using REDIS_URL env
Install: express, jsonwebtoken, bcryptjs, zod, @prisma/client, ioredis, cors, helmet, express-rate-limit
Install dev: typescript, ts-node, nodemon, @types/*
Add npm script: "dev": "nodemon src/index.ts"
```

**Verify:** `npm run dev --workspace=apps/api` starts with "Server running on port 4000"

---

### Block 2 · 11:00–13:00 · Auth API (2 hrs)

**What you're building:** Register, login, JWT — the identity triplet lock.

- [ ] Create `src/routes/auth.ts`
- [ ] Implement `POST /api/auth/register` with full validation
- [ ] Implement `POST /api/auth/login`
- [ ] Implement `GET /api/auth/me` (protected)

**Claude Code prompt:**
```
In apps/api/src/routes/auth.ts, implement all three auth routes exactly as specified in SKILL.md section 4:

POST /api/auth/register:
- Zod schema: {name, ssn, personalEmail, uniEmail, password, role: "STUDENT"|"COMPANY"}
- Validate personalEmail does NOT contain any of these strings (case-insensitive):
  .edu, .ac., student., aast., aastmt., aucegypt., guc., bue., msa., futureuniversity.
  If it does, return 400: "Personal email must not be a university email"
- Hash SSN with bcrypt cost 12 (store as ssnHash, NEVER return it)
- Hash password with bcrypt cost 10
- Check uniqueness of personalEmail, uniEmail, ssnHash — if any exist return 409 with specific field
- Create User with role, then create empty StudentProfile or CompanyProfile
- Return JWT (7d expiry) + safe user object (no ssnHash, no passwordHash)

POST /api/auth/login:
- Only needs personalEmail + password
- Return JWT + safe user object

GET /api/auth/me:
- Requires auth middleware
- Return safe user object with their profile (student or company)

Apply rate limiting: 10 req/min per IP on register and login routes.
```

**Test with curl or Postman:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahmed","ssn":"12345678901234","personalEmail":"ahmed@gmail.com","uniEmail":"ahmed@aast.edu","password":"Test123!","role":"STUDENT"}'
```
Expected: `{ token: "...", user: { id, name, email, role } }`

---

### Block 3 · 14:00–16:00 · Next.js Shell + Auth Pages (2 hrs)

**What you're building:** The visual container — every page lives inside it.

- [ ] Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `apps/web/.env.local`
- [ ] Create auth context + API client
- [ ] Register page (3-step form)
- [ ] Login page
- [ ] Dashboard shell with sidebar

**Claude Code prompt:**
```
In apps/web, build the auth system and dashboard shell using Next.js 14 App Router + Tailwind:

1. src/lib/api.ts — typed fetch wrapper:
   - All requests go to NEXT_PUBLIC_API_URL
   - Attaches Authorization: Bearer <token> from localStorage
   - Throws on non-2xx with error message from response

2. src/context/AuthContext.tsx — React context:
   - Stores: user, token, isLoading
   - Methods: login(email, password), register(data), logout()
   - On mount, calls GET /api/auth/me to restore session
   - Wraps app in _app or layout

3. app/auth/register/page.tsx — 3-step form:
   Step 1: Two cards — "I'm a Student" / "I'm a Company" (role selection)
   Step 2: Identity fields: name, personalEmail, uniEmail, SSN (masked input), password
            Show inline error if personalEmail looks like university email
   Step 3: Students fill headline + skills tags. Companies fill companyName + industry + size.
   Use InternMe brand colors: background #1A1A14, accent #F5E642

4. app/auth/login/page.tsx — simple email + password, link to register

5. app/(dashboard)/layout.tsx — protected layout:
   - Redirects to /auth/login if no user
   - Sidebar with: logo, nav links (role-based), notification bell, user avatar + logout
   - Student links: Dashboard, Browse Gigs, My Profile, My CV, Earnings
   - Company links: Dashboard, Post a Gig, My Gigs, Applicants
   - Admin links: Users, Escrows, Disputes

6. app/(dashboard)/page.tsx — role-based home:
   - Student: welcome message + "Complete your profile" prompt if profile empty
   - Company: welcome message + "Post your first gig" CTA
```

**Verify:** Register a student, get redirected to dashboard, see sidebar with student links.

---

### Block 4 · 16:00–18:00 · Student Profile API + Form (2 hrs)

**What you're building:** The structured profile that feeds the CV and the match algorithm.

**Claude Code prompt:**
```
Build the student profile system:

API (apps/api/src/routes/profile.ts):
- PUT /api/profile/student — update own StudentProfile
  Body: { headline, skills: string[], projects: [{title, description, url, tech[]}],
          experience: [{role, dates, bullets[]}], education: [{degree, field, gpa}],
          links: {github, portfolio, linkedin} }
  IMPORTANT: experience objects must NOT store company/institution names
- GET /api/profile/student/:id — public profile, returns safe fields only
  NEVER return: ssnHash, passwordHash, uniEmail, education institution names

Frontend (apps/web/app/(dashboard)/profile/page.tsx):
- Four collapsible sections: Skills, Projects, Experience, Education
- Skills: tag input component — type skill name + Enter to add, click × to remove
  Autocomplete suggestions from this list: React, Node.js, TypeScript, Python, Figma, 
  UI/UX, PostgreSQL, MongoDB, Express, Next.js, Flutter, Java, C++, Marketing, 
  SEO, Copywriting, Video Editing, Motion Graphics, Data Analysis
- Projects: repeatable form rows (Add Project button), fields: title, tech tags, description, URL
- Experience: repeatable rows, fields: role title, date range, 3 bullet points
  Label says "Role / Job Title" — no field for company name
- Education: repeatable rows, fields: degree, field of study, GPA (optional)
  Label says "Field of Study" — no field for institution name
- Save button → PUT /api/profile/student → show success toast
- Profile completion percentage shown as progress bar at top
```

**End of Day 1 checkpoint:**
- [ ] Can register as student AND as company
- [ ] Login redirects to correct dashboard by role
- [ ] Student can fill and save their profile
- [ ] No university info leaks in API responses

---

## DAY 2 — Core Product
### Goal by end of day: Students browse gigs, apply, companies see ranked blind applicants.

---

### Block 5 · 9:00–11:00 · CV Generator (2 hrs)

**What you're building:** The Jake Resume PDF — the crown jewel feature for students.

- [ ] Verify `pdflatex` is installed on your machine: `pdflatex --version`
- [ ] Install LaTeX on Railway later (add to Dockerfile or railway.toml nixpacks)

**Claude Code prompt:**
```
Build the CV generation system as described in SKILL.md section 6:

API (apps/api/src/services/cvGenerator.ts):
- Implement buildLatex(profile) using the Jake Resume template from SKILL.md
- Implement generatePdf(profile) that:
  1. Creates a temp dir /tmp/cv-{uuid}
  2. Writes the .tex file
  3. Runs pdflatex via child_process.exec
  4. Reads the output PDF
  5. Cleans up temp dir
  6. Returns the PDF buffer
- Add escTex(str) helper to escape LaTeX special chars: & % $ # _ { } ~ ^ \
- CRITICAL: experience entries render role title only — company name is replaced with [Company]
  This is intentional bias prevention — document this in a code comment

API route POST /api/cv/generate:
- Requires auth (student only)
- Fetches student's full profile from DB
- Calls generatePdf()
- Uploads PDF buffer to Cloudflare R2 as cv-{userId}-{timestamp}.pdf
- Updates studentProfile.cvPdfUrl in DB
- Returns { url: "R2 signed URL" }

API route GET /api/cv/download:
- Requires auth
- Returns redirect to R2 signed URL (1hr expiry) for own CV

Cloudflare R2 client (apps/api/src/lib/r2.ts):
- Use @aws-sdk/client-s3 (R2 is S3-compatible)
- Endpoint: https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com
- Implement: uploadBuffer(key, buffer, contentType), getSignedUrl(key)

Frontend button in profile page:
- "Generate My CV" button at top of profile page
- Shows spinner while generating
- On success: "Download PDF" link appears
- Also shows "Last generated: [date]" if cvPdfUrl exists
```

**Test:** Fill a student profile, click "Generate My CV", download the PDF, verify it looks like Jake Resume.

---

### Block 6 · 11:00–13:00 · Gig System API (2 hrs)

**What you're building:** The full gig CRUD + the blind match scoring on every GET.

**Claude Code prompt:**
```
Build the complete gig system in apps/api/src/routes/gigs.ts:

POST /api/gigs — company only
  Body: { title, description, skills: string[], hoursMin, hoursMax, budgetEGP }
  Validate: hoursMin 5–20, hoursMax <= 20, budgetEGP > 0
  Creates gig with status DRAFT
  Returns created gig

PUT /api/gigs/:id/publish — company only, changes DRAFT → OPEN
  Validates gig belongs to requesting company

GET /api/gigs — public, lists all OPEN gigs
  Query params: skills (comma-separated filter), minBudget, maxBudget, page (default 1), limit (default 20)
  If request has valid JWT and user is STUDENT:
    For each gig, compute blind match score using scoreStudentForGig() from SKILL.md section 5
    Sort by match score descending
    Add matchScore field to each gig in response
  If no auth or company/admin role: return gigs sorted by createdAt desc
  NEVER return companyId or any company user details that could identify the company to students

GET /api/gigs/:id — public
  Returns full gig detail
  If student auth: include matchScore

PUT /api/gigs/:id — company only (own gig)
  Can update: title, description, skills, hoursMin, hoursMax, budgetEGP (only when DRAFT)
  Can update status machine transitions:
    OPEN → IN_REVIEW (when company starts reviewing)
    IN_REVIEW → IN_PROGRESS (when company accepts an applicant)
    IN_PROGRESS → COMPLETED (after deliverable approved — triggers escrow release)
    Any → DISPUTED

DELETE /api/gigs/:id — company only, DRAFT status only

POST /api/gigs/:id/apply — student only
  Body: { coverNote?: string }
  Checks: student profile has at least 1 skill, gig is OPEN, student hasn't applied before
  Computes match score at application time, stores in Application.score
  Creates Application record
  Sends notification to company: "New applicant for [gig title]"

GET /api/gigs/:id/applicants — company only (own gig)
  Returns applications sorted by score DESC
  Each applicant includes: name, personalEmail, skills, projects, matchScore, coverNote
  NEVER includes: uniEmail, ssnHash, education institution names, graduation year

PUT /api/gigs/:id/applicants/:userId — company only
  Body: { status: "ACCEPTED" | "REJECTED" }
  If ACCEPTED: sets gig internId = userId, changes all other applications to REJECTED
                changes gig status to IN_PROGRESS
                sends notification to accepted student + rejection to others

POST /api/gigs/:id/submit — intern only (assigned intern)
  Body: { deliverable: string } — URL or description of completed work
  Changes gig status to SUBMITTED
  Notifies company

Implement scoreStudentForGig() exactly as specified in SKILL.md section 5.
Export it from apps/api/src/services/matchEngine.ts
```

---

### Block 7 · 14:00–16:00 · Gig Marketplace Frontend (2 hrs)

**What you're building:** The main student-facing discovery experience.

**Claude Code prompt:**
```
Build the gig marketplace in apps/web using Next.js App Router + Tailwind:

app/(dashboard)/gigs/page.tsx — Browse Gigs:
- Filter bar at top: skill tags (multi-select from common list), budget range slider, hours range
- Grid of GigCard components (3 cols desktop, 2 tablet, 1 mobile)
- GigCard shows: title, skill tags (colored pills), budget in EGP, hours range, 
  match score badge (if student — green gradient pill showing "87% match")
- "Load more" pagination
- Empty state: "No gigs match your filters"
- Skeleton loading state while fetching

app/(dashboard)/gigs/[id]/page.tsx — Gig Detail:
- Left column: title, full description, skill tags, budget, hours, posted date
- Right column (sticky): 
  - Match score circle (large, color-coded: green >70%, amber 40-70%, gray <40%)
  - "Apply Now" button → opens modal
  - Application modal: optional cover note textarea (max 500 chars), confirm button
- After applying: button changes to "Applied ✓" disabled state

app/(dashboard)/company/post-gig/page.tsx — Post a Gig:
- Single page form (not multi-step):
  Title (text), Description (textarea, min 100 chars)
  Skills needed (tag input, same autocomplete as profile)
  Hours min + max (two number inputs, both 5–20)
  Budget in EGP (number input, min 500)
  Preview card (live preview of how the gig card will look)
  "Save as Draft" + "Publish Now" buttons

app/(dashboard)/company/gigs/page.tsx — My Gigs list:
  Table: title, status badge, applicant count, budget, actions
  Status badges: DRAFT (gray), OPEN (green), IN_REVIEW (amber), IN_PROGRESS (blue), COMPLETED (purple)
  Actions: View Applicants, Fund Escrow (if IN_PROGRESS + no escrow), Edit (if DRAFT)

app/(dashboard)/company/gigs/[id]/applicants/page.tsx — Blind Applicant List:
- Header shows gig title + status
- Ranked table: rank number, name, match score bar, skill tags, 3 project names
- Click row → expand to show full projects + experience bullets
- Accept / Reject buttons (only one accept allowed)
- NEVER show university, uni email, graduation year anywhere on this page
```

---

### Block 8 · 16:00–18:00 · Ratings + Notifications (2 hrs)

**What you're building:** Post-completion trust system + in-app notification bell.

**Claude Code prompt:**
```
Build ratings and notifications:

Ratings API (apps/api/src/routes/ratings.ts):
POST /api/ratings/:gigId
  Requires auth. Gig must be COMPLETED.
  Body: { score: 1-5, comment?: string }
  Rater = requesting user, ratee = the other party (if company rates, ratee is intern and vice versa)
  One rating per user per gig — reject duplicates
  Both ratings stored. Compute average for each user from all their ratingsReceived.

Notifications API (apps/api/src/routes/notifications.ts):
GET /api/notifications
  Returns 20 most recent for current user, unread first
PUT /api/notifications/:id/read
  Marks single notification read
PUT /api/notifications/read-all
  Marks all read

Notification bell (apps/web/src/components/NotificationBell.tsx):
- Icon in sidebar header with unread count badge (red dot, number)
- Click opens dropdown panel (max 5 items, "View all" link)
- Each item: icon by type, message text, time ago, unread highlight
- Polling: fetch /api/notifications every 30 seconds (simple polling, no websockets)
- Types and icons:
  GIG_MATCH: spark icon (yellow)
  APPLICATION_UPDATE: checkmark (green) or X (red)
  PAYOUT: money bag (green)
  DISPUTE: warning (amber)

Rating modal (apps/web/src/components/RatingModal.tsx):
- Shown automatically when a gig moves to COMPLETED for both parties
- 5-star selector + optional comment textarea
- "Submit Rating" button
- Can be dismissed (rating becomes optional after 48hrs)
```

**End of Day 2 checkpoint:**
- [ ] Student can browse gigs and see match scores
- [ ] Student can apply to a gig
- [ ] Company can see ranked blind applicant list
- [ ] Company can accept an applicant
- [ ] Notifications appear in the bell
- [ ] CV PDF downloads correctly

---

## DAY 3 — Escrow + Polish + Deploy
### Goal by end of day: Working demo with funded escrow, payout logic, and live URL.

---

### Block 9 · 9:00–11:00 · Escrow + Paymob (2 hrs)

**What you're building:** The money engine. Critical for the demo.

> **Note for demo day:** If Paymob test approval takes time, build a "Mock Pay" button that skips Paymob and directly sets escrow to HELD. The logic remains real — only the payment capture is mocked. Tell judges this at demo time.

**Claude Code prompt:**
```
Build the full escrow system as described in SKILL.md sections 7:

apps/api/src/services/paymob.ts:
- Implement createPaymentOrder() exactly from SKILL.md
- Use env vars: PAYMOB_API_KEY, PAYMOB_INTEGRATION_ID, PAYMOB_IFRAME_ID

apps/api/src/routes/escrow.ts:

POST /api/escrow/create
  Requires company auth. Body: { gigId }
  Validates: gig belongs to company, gig is IN_PROGRESS, no escrow exists yet
  Computes:
    totalCharged   = budgetEGP * 1.15  (rounded to nearest integer)
    platformFeeB2B = budgetEGP * 0.15
    internPayout   = budgetEGP * 0.90
    platformFeeB2C = budgetEGP * 0.10
  Creates Escrow record with status PENDING
  Calls Paymob createPaymentOrder(totalCharged, escrow.id, companyBillingData)
  Returns { paymentUrl, escrowId }

POST /api/escrow/paymob-webhook  (public — no auth)
  Verify Paymob HMAC signature:
    Concatenate specific fields in Paymob's documented order
    HMAC-SHA512 with PAYMOB_HMAC_SECRET
    Compare to hmac in request — reject if mismatch
  If success = true: update Escrow status PENDING → HELD
  If success = false: leave PENDING, log failure
  Return 200 always (Paymob retries on non-200)

POST /api/escrow/release/:gigId
  Requires company auth. Gig must be SUBMITTED.
  Validates escrow exists and is HELD
  In a DB transaction:
    Update Escrow status → RELEASED, set releasedAt
    Update Gig status → COMPLETED
    Create Transaction: type INTERN_PAYOUT, amount internPayout, userId = intern
    Create Transaction: type PLATFORM_FEE_B2C, amount platformFeeB2C, userId = intern
    Create Transaction: type PLATFORM_FEE_B2B, amount platformFeeB2B, userId = company
  Send notification to intern: "Your payment of {internPayout} EGP has been released!"
  (Actual Paymob disbursement is manual in MVP — flag for post-Rally)

POST /api/escrow/dispute/:gigId
  Either party can open. Gig must be IN_PROGRESS or SUBMITTED.
  Updates Gig status → DISPUTED
  Creates notification for admin
  Returns 200

GET /api/escrow/:gigId
  Returns escrow with all transactions (both parties can view own gig's escrow)

Also add mock endpoint for demo:
POST /api/escrow/mock-pay/:escrowId  (only works if NODE_ENV !== "production")
  Sets escrow PENDING → HELD immediately without Paymob
  Returns { success: true }
```

---

### Block 10 · 11:00–13:00 · Escrow Frontend + Earnings (1.5 hrs)

**Claude Code prompt:**
```
Build the escrow and earnings UI:

app/(dashboard)/company/gigs/[id]/escrow/page.tsx:
- Shows gig title, intern name, budget breakdown:
    Intern budget:    1,000 EGP
    Platform fee:     +  150 EGP (15%)
    ─────────────────────────────
    Total to pay:     1,150 EGP
- "Fund Escrow" button → POST /api/escrow/create → redirect to Paymob paymentUrl
- After payment: status badge "Funds Held ✓" in green
- "Approve & Release Payment" button (visible when gig is SUBMITTED):
    Shows breakdown of where money goes
    Confirm modal before releasing
    POST /api/escrow/release/:gigId
- "Open Dispute" link (small, below main actions)
- For demo: "Mock Payment (Demo)" button that calls /api/escrow/mock-pay/:escrowId

app/(dashboard)/student/earnings/page.tsx:
- Summary cards at top:
    Total earned (all RELEASED), Pending (HELD escrows), In Progress
- Transaction history table:
    Date | Gig title | Gross | Platform fee (10%) | Net payout | Status
- Empty state: "Complete your first gig to start earning"
```

---

### Block 11 · 13:00–15:00 · Admin Panel + Seed Data (2 hrs)

**Claude Code prompt:**
```
Build the admin panel:

API (apps/api/src/routes/admin.ts):
All routes require auth + role === "ADMIN" checked server-side

GET /api/admin/stats
  Returns: { totalUsers, totalStudents, totalCompanies, totalGigs, totalEscrows,
             totalRevenue (sum of all platform fees), activeDisputes }

GET /api/admin/users?role=&page=
  Paginated user list: id, name, email, role, createdAt, gigCount

GET /api/admin/escrows?status=&page=
  Paginated escrow list with gig title, company name, intern name, amounts, status

GET /api/admin/disputes
  Open disputes with gig details, both parties, timeline

POST /api/admin/disputes/:gigId/resolve
  Body: { resolution: "RELEASE" | "REFUND", note: string }
  If RELEASE: triggers escrow release to intern
  If REFUND: sets escrow REFUNDED, notifies both parties
  Updates gig status to CANCELLED

app/(dashboard)/admin/page.tsx:
- Stats cards row (totalUsers, revenue, active gigs, open disputes)
- Three tabs: Users | Escrows | Disputes
- Users tab: searchable table with role filter
- Escrows tab: filterable by status, shows amounts
- Disputes tab: each dispute shows both sides, resolve buttons

Create prisma/seed.ts:
- Admin user: name "Admin", personalEmail "admin@internme.co", uniEmail "admin@admin.internme.co", 
  ssn "00000000000000", password "Admin123!", role ADMIN
- 3 students with realistic Egyptian names, skills (mix of tech + design + marketing)
- 2 companies: one startup "Konnect Labs", one SME "Cairo Digital Agency"
- 5 gigs across statuses: 2 OPEN, 1 IN_PROGRESS (with held escrow), 1 SUBMITTED, 1 COMPLETED
- Applications for the open gigs from 2–3 students each
- 1 rating on the completed gig

Add to package.json: "prisma": { "seed": "ts-node prisma/seed.ts" }
Run: npx prisma db seed
```

---

### Block 12 · 15:00–17:00 · Deploy + Final Polish (2 hrs)

**Deploy checklist — do in this order:**

**Backend on Railway:**
- [ ] Connect GitHub repo to Railway, select `apps/api` as root
- [ ] Add all env vars from `.env.example` in Railway dashboard
- [ ] Add `nixpacks.toml` for LaTeX install (see below)
- [ ] Deploy — get the Railway URL (e.g. `https://internme-api.up.railway.app`)

**`nixpacks.toml` for LaTeX on Railway:**
```toml
[phases.setup]
nixPkgs = ["texlive", "texlive.combined.scheme-basic", "texlive-latex-extra"]
```

**Frontend on Vercel:**
- [ ] Connect GitHub repo to Vercel, set root to `apps/web`
- [ ] Set env var: `NEXT_PUBLIC_API_URL=https://internme-api.up.railway.app`
- [ ] Deploy — get Vercel URL

**Final polish Claude Code prompt:**
```
Do a final pass on the entire app:

1. Loading states — every page that fetches data must show a skeleton loader, not a blank screen
2. Error boundaries — wrap each dashboard section, show "Something went wrong. Try again." with retry button
3. Mobile responsiveness — sidebar collapses to bottom nav on mobile (4 icons: Home, Gigs, Profile, Notifications)
4. Empty states — every list page needs a helpful empty state with a CTA button
5. Toast notifications — use react-hot-toast for all success/error feedback
6. Form validation — all forms show inline errors before submit
7. 404 page — custom page with "Go Home" button
8. Meta tags — add title and description to layout.tsx

Install: react-hot-toast
```

---

### Block 13 · 17:00–18:00 · Demo Prep (1 hr)

Prepare the demo flow — this is what Rally judges will see.

**Demo script (practice this 3 times):**

1. Open homepage → show the problem statement (you can embed the pitch deck as a splash)
2. Register as a student (use a real-seeming name, not "test user")
3. Fill in the student profile — add 4–5 skills, 2 projects
4. Click "Generate My CV" → download the PDF — **this moment always impresses**
5. Browse gigs → show match scores appearing on cards
6. Apply to a gig with a cover note
7. Log out → Log in as the company (use seeded company)
8. Go to My Gigs → click "View Applicants" on the gig
9. Show the ranked list — point out: **"No university names. Pure skill."**
10. Accept the student
11. Click "Fund Escrow" → show the payment breakdown (use Mock Pay for demo)
12. Log back in as student → submit deliverable
13. Log in as company → click "Approve & Release Payment"
14. Go to student Earnings page → show 900 EGP received
15. Show admin panel → show InternMe's 250 EGP revenue

**Demo accounts (after seeding):**
```
Student:  sara@gmail.com      / Test123!
Company:  hiring@konnect.co   / Test123!
Admin:    admin@internme.co   / Admin123!
```

---

## Contingency — If You Fall Behind

**Drop in this order (least impact on demo):**

| If behind by | Drop this |
|---|---|
| 1 block | Ratings system (nice-to-have) |
| 2 blocks | Admin panel detail (keep stats only) |
| 3 blocks | Real Paymob (keep mock pay) |
| 4 blocks | Notifications (manual refresh) |
| Half a day | Earnings page (show escrow status only) |

**Never drop:**
- Auth (SSN triplet)
- Blind match score display
- CV PDF generation
- Gig post + apply flow
- Escrow fund + release (even if mocked)

---

## Key Numbers to Know Cold

Memorize these for the pitch:

| Metric | Value |
|---|---|
| Gig value example | 1,000 EGP |
| Company pays total | 1,150 EGP (+15%) |
| Intern receives | 900 EGP (−10%) |
| InternMe revenue per gig | 250 EGP |
| Year 1 target | 100 gigs = 37,500 EGP |
| Students in pilot | 500+ (AASTMT CS) |
| Egypt youth unemployment | 40%+ |
| Annual graduates trapped | 600,000+ |

---

*End of PLAN.md — you have 3 days and every hour is accounted for. Ship it.*
