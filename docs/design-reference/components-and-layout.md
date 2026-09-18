# Components & Layout Patterns (Marketing Site)

Observed by walking the home page (`/`), `/hardware` (SwishScreen), and `/software` (SwishOS) at
1440×900 and mobile widths.

## Navigation

- Desktop nav is a **floating glass pill** (see `tokens.md` for the blur/shadow values) anchored
  near the top of the viewport, not a full-width bar — it has visible page background/photography
  around it on all sides.
- Left: logo mark (a slanted parallelogram/panel icon in an orange→navy diagonal gradient) +
  "Swish Solar" wordmark.
- Center: flat text links — `Hardware · SwishOS · Partners · News · Blog · Careers · Team`.
- Right: **two CTAs, always paired** — a dark/secondary-filled "Request Demo" button next to a
  primary-orange-filled "Get Quote" (or page-specific equivalents like "Book a Demo" /
  "Request Pilot Deployment"). The pairing of a neutral-dark secondary action + a loud primary
  action is consistent across every page.
- Mobile (< ~768px): collapses to logo + a single hamburger icon in a dark rounded-square button.
- Nav is sticky and stays glassy/legible over both light sections and dark photography as you
  scroll.

## Hero sections

Every top-of-page hero follows the same recipe:

1. Full-bleed photographic background (desert solar farms, dust in motion, golden-hour lighting —
   the photography itself supplies most of the "orange" brand feeling, not just flat color).
2. A **glassmorphic card** overlaid on the image containing: small uppercase orange eyebrow label
   → large light-weight (200 weight) headline, with select words bolded for emphasis (e.g.
   "Building the Ecosystem for **Efficient & Sustainable Solar**") → 1–2 sentence descriptive
   paragraph → a primary orange button with a trailing arrow icon (`→`).
3. Small trust/credibility chips below the CTA (e.g. "🔒 Patented Technology · 🌐 Global
   Deployment") — icon + label pairs, low visual weight, sit at the bottom edge of the hero card.

## Section pattern ("problem" and "feature" sections)

Repeated structure down the page:

- Centered **eyebrow + H2** pair introduces each section ("THE CHALLENGE" → "Solar Maintenance is
  at a Breaking Point").
- Content below alternates **image-left/text-right ↔ text-left/image-right** as you scroll
  (classic marketing zig-zag layout), each block pairs a photo with an icon-badged headline, body
  copy, and a nested light-gray callout box highlighting one "real impact" stat or quote.
- **Stat rows**: a horizontal grid of big numbers (`15B`, `$2.5B`, `30%`, `85%`) each with a small
  caption underneath, often gradient-filled text (see `tokens.md`). Used to make a problem feel
  quantified before presenting the solution.
- **Feature cards**: 3-column grid of icon (peach tile) + bold micro-stat (e.g. "Up to 10× ROI") +
  short label — used for the SwishScreen/SwishOS feature highlight rows.

## Badges & pills

- Numbered step badges: small rounded-square peach tile with a bold orange numeral (`1`, `2`) —
  used to sequence a "why current solutions fail" narrative.
- Category/label pills: rounded-full peach background, orange text, e.g. "Core Feature",
  "Seamless Integration" — always paired with a matching icon.
- Year pills on the awards/timeline section: tiny rounded-full peach chip showing just a year
  ("2024", "2023") above each award name.

## Cards

- White (`--card`) surface, `rounded-xl`, `shadow-xl`, sitting on the pale `--background` — this
  contrast (`#fff` card vs `#f9fbfd` page) is subtle but consistently used to separate content
  from page chrome without hard borders.
- Stat cards (used in the "Industry Statistics" grid) combine a `rounded-xl` card shell with an
  inner `grid-cols-2` layout of gradient-text numbers + captions.

## Footer

- **Switches to dark theme** entirely (`#161c2c` background, white text) — the only large
  dark-background section on the marketing site (`tokens.md` notes the 404 page is also
  full-dark, so a dark theme variant clearly exists in the design system even though the rest of
  the site is light).
- 4-column layout: brand blurb + social icon → "Solutions" link list → "Company" link list →
  "Get in Touch" contact block (email/phone/address, each with an orange icon).
- Bottom bar: legal links (Privacy Policy, Terms & Conditions, Cookie Settings) left, copyright +
  "Designed by Maximoff Studio" credit right.

## Motion/interaction notes

- Buttons and cards use soft shadows and subtle gradient fills rather than hard borders —
  nothing skeuomorphic or heavy; borders are hairline (`#e5e5e5`) when present at all.
- No sharp corners anywhere — smallest radius observed is the 8px button radius.
