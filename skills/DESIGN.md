# InternMe — Figma Pitch Deck Specs

This file contains the prompts and JSON structure for the InternMe Pitch Deck in Figma.

## Brand Setup Prompt
Use this to set up the brand styles and components first.

```
Set up an InternMe brand file in Figma with the following:

COLOR STYLES:
- Ink: #1A1A14
- Spark Yellow: #F5E642
- Gold: #C4A000
- Warm White: #FAFAF7
- Cream: #E8E0C8
- Warm Gray: #7A7A6A
- Mint Success: #0D9E75
- Alert: #C4A000

TEXT STYLES (Fallback: Inter):
- Hero: Fraunces 700, 56px, line-height 1.05, tracking -1.5px
- H1: Fraunces 700, 32px, line-height 1.15, tracking -0.5px
- H2: Plus Jakarta Sans 600, 20px, line-height 1.3
- Body: Plus Jakarta Sans 400, 15px, line-height 1.6
- Body Strong: Plus Jakarta Sans 600, 15px, line-height 1.6
- Label: Plus Jakarta Sans 500, 12px, line-height 1.4, tracking 0.2px

LOGO COMPONENT:
Create a component called "Logo/Icon". 
Frame: 44x44px, fill #1A1A14, corner radius 10px.
Text inside: "Me", Georgia Bold, 18px, fill #F5E642, centered.

Create a component called "Logo/Lockup".
Contains Logo/Icon + text "InternMe" to the right.
Text: Georgia Bold, 24px, tracking -1px.
"Intern" fill #1A1A14, "Me" fill #C4A000.
Vertical align: center. Gap between icon and text: 10px.

BUTTON COMPONENTS:
- Button/Primary: fill #1A1A14, text #F5E642, Plus Jakarta Sans 600, 13px, padding 10px 20px, radius 8px
- Button/Secondary: fill transparent, stroke 1.5px #1A1A14, text #1A1A14, same size
- Button/Ghost: fill #FAFAF7, stroke 0.5px #E8E0C8, text #7A7A6A
```

---

## Pitch Deck Slides Prompt
Create a new page called "Pitch Deck" and add 10 frames (1920x1080px) with the following content:

### SLIDE 1 — Title / Hook
Background: #1A1A14
Center of slide:
- Text: "600,000 graduates." — Fraunces Bold 72px, #F5F3EE
- Text below it: "40% unemployed." — Fraunces Bold 72px, #F5E642
- Text below it: "We fixed the broken middle." — Fraunces Bold 48px, #F5F3EE, opacity 80%
- Small text bottom center: "InternMe · Rally 2026" Inter 400 18px #7A7A6A
- Logo/Lockup component bottom-left, 48px from edges, reversed variant

### SLIDE 2 — Problem
Background: #1A1A14
Top-left: Section label "The problem" Inter 500 14px #7A7A6A, 64px from top/left
Large headline left-aligned: "Students can't get jobs." Fraunces Bold 56px #F5F3EE
Second line: "Companies won't hire them." Fraunces Bold 56px #F5E642
Body below: "Traditional internships require 3-month commitments. CVs get filtered by university name, not ability. SMEs screen 1,000+ applicants to hire one junior." Inter 400 18px #7A7A6A, max-width 700px
Right side: 3 stat cards stacked vertically, each 360x100px, #242418 bg, radius 12px:
  Card 1: "600,000+" #F5E642 Inter 700 36px, "graduates per year in Egypt" #7A7A6A Inter 400 15px
  Card 2: "40%+" #F5E642 Inter 700 36px, "youth unemployment rate" #7A7A6A Inter 400 15px
  Card 3: "1,000+ CVs" #F5E642 Inter 700 36px, "screened to hire one junior" #7A7A6A Inter 400 15px

### SLIDE 3 — Solution
Background: #FAFAF7
Top-left: Section label "The solution" Inter 500 14px #7A7A6A
Headline: "Micro-internships." Fraunces Bold 64px #1A1A14
Subhead: "5–20 hour paid gigs. Skills only. No prestige filter." Inter 400 20px #7A7A6A
3 columns below, each ~500px wide, with icon placeholder (40x40 #E8E0C8 rounded rect), title Inter 600 18px #1A1A14, body Inter 400 15px #7A7A6A:
  Col 1: "Project-based" / "Real deliverables — not coffee runs. Students build a portfolio across 10+ companies."
  Col 2: "Blind Match AI" / "Our algorithm ranks on verified skills. University name is hidden from companies."
  Col 3: "Try before you hire" / "Companies test potential full-time hires through actual work. Zero long-term risk."

### SLIDE 4 — Product
Background: #1A1A14
Left half: headline "How it works" Fraunces Bold 48px #F5F3EE, then 3 numbered steps stacked:
  "01  Student creates skill-verified profile" Inter 400 18px #7A7A6A
  "02  AI blind-matches to open gigs" Inter 400 18px #7A7A6A  
  "03  Company pays on completion via escrow" Inter 400 18px #F5E642
Right half: placeholder frame 500x700px, #242418 bg, radius 20px, centered text "App screens" Inter 400 14px #444441 (replace with mobile screen exports later)

### SLIDE 5 — Business Model
Background: #FAFAF7
Headline: "We only make money when placements succeed." Fraunces Bold 48px #1A1A14, max-width 900px
Two large cards side by side, each 760x300px, radius 16px:
  Card 1: #1A1A14 bg — "Companies" Inter 600 16px #7A7A6A top, "15%" Fraunces Bold 96px #F5E642, "per completed internship" Inter 400 18px #F5F3EE, small text "Cheaper than agencies. Faster than LinkedIn." Inter 400 14px #7A7A6A
  Card 2: #FAFAF7 bg, 1.5px #1A1A14 border — "Students" Inter 600 16px #7A7A6A top, "10%" Fraunces Bold 96px #1A1A14, "of every gig earned" Inter 400 18px #1A1A14, small text "Free to join. Pay only when you earn." Inter 400 14px #7A7A6A

### SLIDE 6 — Traction
Background: #1A1A14
Section label: "Why we're not starting from zero" Inter 500 14px #7A7A6A
Headline: "Distribution is already open." Fraunces Bold 56px #F5F3EE
4 traction cards in a row, each 380x160px, #242418 bg, radius 12px:
  "500+ CS students" #F5E642 Inter 700 28px / "AASTMT pilot access" #7A7A6A Inter 400 14px
  "Rally network" #F5E642 Inter 700 28px / "Direct startup pipeline" #7A7A6A Inter 400 14px
  "Paymob escrow" #F5E642 Inter 700 28px / "Student payments secured" #7A7A6A Inter 400 14px
  "37,500 EGP" #F5E642 Inter 700 28px / "Year 1 projected revenue" #7A7A6A Inter 400 14px

### SLIDE 7 — Market
Background: #FAFAF7
Headline: "The market is massive and untouched." Fraunces Bold 48px #1A1A14
3 concentric-style stat blocks left to right:
  "6M+" Inter 700 48px #C4A000 / "university students in Egypt" Inter 400 15px #7A7A6A
  "50,000+" Inter 700 48px #C4A000 / "active SMEs and startups" Inter 400 15px #7A7A6A
  "$0" Inter 700 48px #C4A000 / "dedicated micro-internship platforms" Inter 400 15px #7A7A6A
Bottom note: "First-mover advantage in a market with no direct competitor." Inter 400 16px #7A7A6A italic

### SLIDE 8 — Team
Background: #1A1A14
Headline: "Built by someone who lived the problem." Fraunces Bold 48px #F5F3EE
One founder card centered, 600x200px, #242418 bg, radius 16px:
  Avatar placeholder 72x72 circle #F5E642 bg, initials "OE" #1A1A14 Inter 700 24px
  Name: "Omar Emad El-Habashy" Inter 600 20px #F5F3EE
  Title: "Founder · Computer Science, AASTMT" Inter 400 15px #7A7A6A
Bottom: "We are 3 people with the right distribution, the right market, and zero competition." Inter 400 18px #7A7A6A, centered, max-width 700px

### SLIDE 9 — The Ask
Background: #FAFAF7
Headline: "What we need from Rally." Fraunces Bold 56px #1A1A14
Two columns:
  Left — "We're asking for:" Inter 600 18px #1A1A14, then 2 items:
    "Incubation & mentorship" Inter 400 16px #7A7A6A
    "Technical resources for MVP" Inter 400 16px #7A7A6A
  Right — "In return, Rally gets:" Inter 600 18px #1A1A14, then 2 items:
    "First access to Egypt's top student talent pool" Inter 400 16px #7A7A6A
    "A pipeline of vetted junior hires for portfolio companies" Inter 400 16px #7A7A6A
Bottom center: Large primary button shape 400x60px #1A1A14 bg radius 8px, text "internme.co · omar@internme.co" Inter 500 16px #F5E642

### SLIDE 10 — Vision / Close
Background: #1A1A14
Single centered statement:
  "Every Egyptian student deserves" Fraunces Bold 56px #F5F3EE
  "a fair shot." Fraunces Bold 56px #F5E642
  Gap, then: "InternMe." Fraunces Bold 36px #F5F3EE opacity 60%
Logo/Lockup reversed variant, bottom center, 48px from bottom
