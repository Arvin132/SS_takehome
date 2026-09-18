# Swish Solar — Frontend Design Reference

Notes captured by browsing `swishsolar.com` (marketing site, live as of 2026-09-17) to reuse its
visual language for this take-home's frontend. This is the **real company's actual brand**, not
an invented style guide — treat it as ground truth for colors/type/components, but note this is a
marketing site, not the real SwishOS app (that product's dashboard doesn't exist yet; the images
on `/software` are illustrative mockups, not a live app).

Site is built with **Next.js + Tailwind CSS v4 + shadcn/ui** (confirmed via `__variable_*` body
classes from `next/font`, shadcn's `text-card-foreground` / `bg-gradient-to-br from-primary`
utility patterns, and a full shadcn CSS-variable theme in `:root` using `oklch()` color values).
That means the palette below is a **shadcn theme** — dropping the token list in
[`tokens.md`](./tokens.md) into a Tailwind v4 `@theme`/`:root` block will reproduce it almost
exactly.

## Files in this folder

- [`tokens.md`](./tokens.md) — color tokens (hex, converted from the site's `oklch()` values),
  typography, radius/shadow tokens.
- [`components-and-layout.md`](./components-and-layout.md) — nav, hero, buttons, badges, cards,
  footer: how the marketing site assembles pages.
- [`dashboard-patterns.md`](./dashboard-patterns.md) — **the most directly useful file for this
  project.** The `/software` (SwishOS) page embeds mockup screenshots of an actual analytics
  dashboard UI (sidebar + charts + tables) that is a near-exact match for what this take-home
  asks us to build (fleet list, soiling trend chart, cleaning recommendation). Use it as the
  layout/visual reference for the React frontend.
- [`vibe-and-messaging.md`](./vibe-and-messaging.md) — tone, copy patterns, and the
  problem/solution narrative structure, useful for empty states, copy, and dashboard framing.

## Quick summary

- **Vibe:** clean, optimistic climate-tech / B2B SaaS. Light, airy, off-white pages for
  content; a single warm burnt-orange accent color carries all emphasis (CTAs, active states,
  stat highlights, chart lines). Headings use a soft geometric display font (Readex Pro) at thin
  weights against a dark slate-navy body text color — reads modern and light-touch, not corporate
  navy/gray SaaS.
- **Photography:** full-bleed desert/solar-farm photography (dust storms, golden-hour panels) is
  used behind glassmorphic (frosted-glass) hero cards — this is where the "orange" identity
  partly comes from (dust-storm color grading), not just the brand swatch.
- **Dashboard identity is different from the marketing site:** the embedded product screenshots
  use a **dark navy sidebar** (not the light marketing theme) with the same orange accent for
  active nav items, chart lines, and positive metrics — see `dashboard-patterns.md`. If building
  a real app UI, follow the dashboard screenshots' theme (dark sidebar + light content canvas),
  not the marketing page's all-light theme.
