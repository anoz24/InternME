# InternMe — Brand Identity Spec
> Version 1.0 · Direction: Warm Ink · Last updated: April 2026
> 
> This file is the single source of truth for all design work on InternMe.
> Always read this file before creating any UI, slide, component, or asset.

---

## Identity in one sentence
InternMe is Egypt's first micro-internship marketplace — career infrastructure for Gen Z, not a gig app. The brand feels editorial, serious about talent, and warm enough to trust with your first paycheck.

---

## Logo

### Construction
- **Icon mark**: 44×44px rounded rectangle, radius 10px, fill `#1A1A14` (Ink)
- **Mark text**: "Me" in Georgia Bold, 18px, color `#F5E642` (Spark Yellow), letter-spacing -1px
- **Wordmark**: "Intern" + "Me" in Fraunces Bold (fallback: Georgia Bold), 24px, letter-spacing -1px
  - "Intern" color: `#1A1A14`
  - "Me" color: `#C4A000` (Gold) on light backgrounds
  - "Me" color: `#F5E642` (Spark Yellow) on dark backgrounds

### Lockup rules
- Always use icon + wordmark together at sizes ≥ 24px height
- Icon-only mark: use for favicon, app icon, social avatar
- Minimum clear space: equal to the height of the "M" in the wordmark on all sides
- Never stretch, skew, outline, or add effects to the logo
- Never recolor — only the two approved variants (light bg / dark bg) exist

### Approved variants
| Variant | Background | Icon fill | Icon text | Wordmark |
|---|---|---|---|---|
| Primary | `#FAFAF7` Warm White | `#1A1A14` | `#F5E642` | `#1A1A14` / `#C4A000` |
| Reversed | `#1A1A14` Ink | `#F5E642` | `#1A1A14` | `#F5F3EE` / `#F5E642` |

---

## Color Palette

### Core colors
| Token name | Hex | Usage |
|---|---|---|
| Ink | `#1A1A14` | Primary text, backgrounds, logo mark fill, dark CTAs |
| Spark Yellow | `#F5E642` | Logo mark text, hero accents on dark backgrounds ONLY |
| Gold | `#C4A000` | Wordmark "Me", CTAs on light bg, links, highlights |
| Warm White | `#FAFAF7` | Page background, card surfaces — NEVER use pure #FFFFFF |
| Cream | `#E8E0C8` | Card borders, dividers, subtle container fills |
| Warm Gray | `#7A7A6A` | Secondary text, captions, placeholder text |

### Semantic / state colors
| Token name | Hex | Usage |
|---|---|---|
| Mint Success bg | `#E8F5F0` | Payment confirmed, gig completed — background |
| Mint Success text | `#0D9E75` | Payment confirmed, gig completed — text/icon |
| Alert bg | `#FFF8DC` | Pending, in-review states — background |
| Alert text | `#8A6A00` | Pending, in-review states — text/icon |
| Error bg | `#FEF0F0` | Failed payment, rejected — background |
| Error text | `#B33A3A` | Failed payment, rejected — text/icon |

### Color rules (hard)
- NEVER use any shade of blue — it reads LinkedIn
- NEVER use Spark Yellow `#F5E642` as text on white/light backgrounds — contrast ratio fails WCAG AA
- NEVER use pure white `#FFFFFF` — always Warm White `#FAFAF7`
- Gold `#C4A000` = light background accent; Spark Yellow `#F5E642` = dark background accent only
- Maximum 3 colors visible in any single component or screen

---

## Typography

### Typefaces
| Role | Typeface | Fallback | Weight | Usage |
|---|---|---|---|---|
| Display / Brand | Fraunces | Georgia, serif | 700 | Hero headlines, section titles, wordmark |
| UI / Body | Plus Jakarta Sans | Inter, system-ui, sans-serif | 400 / 500 / 600 | All UI, body copy, buttons, labels, captions |

### Type scale
| Name | Typeface | Size | Weight | Line height | Tracking |
|---|---|---|---|---|---|
| Hero | Fraunces | 56–64px | 700 | 1.05 | -1.5px |
| H1 | Fraunces | 32px | 700 | 1.15 | -0.5px |
| H2 | Plus Jakarta Sans | 20px | 600 | 1.3 | 0 |
| H3 | Plus Jakarta Sans | 16px | 600 | 1.4 | 0 |
| Body | Plus Jakarta Sans | 15–16px | 400 | 1.6 | 0 |
| Body strong | Plus Jakarta Sans | 15px | 600 | 1.6 | 0 |
| Label / UI | Plus Jakarta Sans | 12–13px | 500 | 1.4 | 0.2px |
| Caption | Plus Jakarta Sans | 11px | 400 | 1.5 | 0.3px |

### Typography rules
- NEVER use all-caps — reads corporate, not human
- NEVER use Fraunces for UI elements (buttons, inputs, labels) — display headings only
- NEVER mix two serif typefaces in the same layout
- Headline color: `#1A1A14` (Ink) on light; `#F5F3EE` on dark
- Body color: `#1A1A14` primary; `#7A7A6A` secondary
- Gold `#C4A000` for links and text-level emphasis

---

## Spacing & Layout

### Base unit
- Grid: 8px base unit. All spacing is multiples of 8 (8, 16, 24, 32, 48, 64, 96)

### Corner radius
| Element | Radius |
|---|---|
| Logo mark / app icon | 10px |
| Cards | 16px |
| Buttons | 8px |
| Tags / badges / pills | 20px (full pill) |
| Input fields | 8px |
| Modals / sheets | 20px |

### Elevation (no drop shadows — use borders instead)
- Default card: `0.5px solid #E8E0C8` on `#FAFAF7`
- Focused / active card: `1.5px solid #1A1A14`
- Dark card: `#1A1A14` bg, `0.5px solid rgba(255,255,255,0.1)` border

---

## Components

### Primary button
- Background: `#1A1A14`
- Text: `#F5E642`, Plus Jakarta Sans 600, 13px
- Padding: 10px 20px
- Radius: 8px
- Hover: background `#2E2E20`

### Secondary button (outline)
- Background: transparent
- Border: `1.5px solid #1A1A14`
- Text: `#1A1A14`, Plus Jakarta Sans 600, 13px
- Padding: 9px 20px
- Radius: 8px

### Ghost button
- Background: `#FAFAF7`
- Border: `0.5px solid #E8E0C8`
- Text: `#7A7A6A`, Plus Jakarta Sans 400, 13px

### Tags / badges
| Type | Background | Text color |
|---|---|---|
| Verified skill | `#1A1A14` | `#F5E642` |
| Category (Design, Dev…) | `#E8E0C8` | `#3A3A2A` |
| Paid / success | `#E8F5F0` | `#0D6E50` |
| Remote | `#FAFAF7` + `#E8E0C8` border | `#7A7A6A` |
| Duration (5–10 hrs) | `#FFF8DC` | `#8A6A00` |

### Input fields
- Background: `#FAFAF7`
- Border: `0.5px solid #E8E0C8`
- Border (focus): `1.5px solid #1A1A14`
- Text: `#1A1A14`, Plus Jakarta Sans 400, 15px
- Placeholder: `#7A7A6A`
- Radius: 8px, Height: 44px

---

## Voice & Tone

### Personality
- Direct, not corporate
- Warm, not casual
- Confident, not arrogant
- Egyptian-market aware, globally credible

### Tagline options (use one consistently)
- "Skills speak. Prestige stays quiet."
- "Your first real job starts here."
- "Earn while you learn. For real this time."

### Copy rules
- Lead with the student or company's outcome, not the feature
- Never say "gig economy" — say "project-based" or "micro-internship"
- Never say "AI-powered" as a headline — show it, don't announce it
- Sentence case always, never Title Case or ALL CAPS
- Numbers are always specific: "5–20 hours", "15% fee", not "short" or "small"

---

## Do / Don't

| Do | Don't |
|---|---|
| Use Warm White `#FAFAF7` as the base surface | Use pure white `#FFFFFF` anywhere |
| Use Gold `#C4A000` for CTAs on light backgrounds | Use Spark Yellow on light backgrounds |
| Use Fraunces for emotional/hero moments | Use Fraunces for buttons or UI labels |
| Use the full logo lockup (icon + wordmark) | Use the wordmark without the icon at large sizes |
| Use thin 0.5px borders in `#E8E0C8` for card separation | Use drop shadows or blur effects |
| Keep illustrations minimal and flat | Add gradients, mesh backgrounds, or glow effects |
| Refer to users as "students" and "companies" | Say "talents", "clients", or "employers" |

---

## Figma Setup Prompt
Paste this into Gemini CLI with Figma MCP active:

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

TEXT STYLES (use Inter as fallback):
- Hero: Inter 700, 56px, line-height 1.05, tracking -1.5px
- H1: Inter 700, 32px, line-height 1.15, tracking -0.5px
- H2: Inter 600, 20px, line-height 1.3
- Body: Inter 400, 15px, line-height 1.6
- Body Strong: Inter 600, 15px, line-height 1.6
- Label: Inter 500, 12px, line-height 1.4, tracking 0.2px

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
- Button/Primary: fill #1A1A14, text #F5E642, Inter 600 13px, padding 10px 20px, radius 8px
- Button/Secondary: fill transparent, stroke 1.5px #1A1A14, text #1A1A14, same size
- Button/Ghost: fill #FAFAF7, stroke 0.5px #E8E0C8, text #7A7A6A
```
