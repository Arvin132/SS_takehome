# Vibe, Tone & Content Structure

## Vibe in one line

Optimistic, credible, slightly scrappy **climate-tech startup** — not enterprise-industrial, not
consumer-flashy. Reads like a well-funded seed-stage hardware+software startup (which, per the
site's own "In the News" section, it is: pre-seed raise, Canadian, founded/associated with student
entrepreneurship competitions).

## What creates that feeling

- **Warm, not cold.** The orange accent + golden-hour dust-storm photography avoids the generic
  "blue = trustworthy enterprise SaaS" palette almost every B2B dashboard defaults to. Solar/dust
  imagery is used as texture and brand color source, not just illustration.
- **Light typographic weight.** Thin (200-weight) large headlines feel confident/airy rather than
  shouty — the site earns attention through scale and whitespace, not boldness or bright color
  everywhere. Bold is reserved for a few emphasized words per headline and for numbers.
- **Numbers do the persuading.** Nearly every section leads with a quantified claim before any
  qualitative copy: "15B liters wasted", "up to 30% efficiency loss", "10× ROI", "95%+ prediction
  accuracy", "30–50% cost savings". Copy is short; the stats carry the argument.
- **Problem → Solution rhythm.** Both product pages (`/hardware`, `/software`) follow the same
  narrative arc: name the industry problem with 2–3 concrete failure modes → quantify the cost of
  the status quo → introduce the product as the fix → list 3–4 core features each with its own
  micro-stat → show ROI/value numbers → show integration/ease-of-adoption → award/credibility
  proof → closing CTA. This structure is worth mirroring in any onboarding/empty-state copy for
  the app (state the cost of not cleaning, then the recommendation, then the payoff number).
- **Proof over hype.** Heavy use of awards, press mentions, and specific dollar/percentage figures
  instead of vague superlatives — copy avoids words like "revolutionary" in body text even though
  it appears once in the page `<title>`; the actual on-page copy is fairly matter-of-fact and
  numbers-first.
- **Human-scaled team, not faceless corp.** Footer contact is a named person's email
  (`miswar@swishsolar.com`) and a direct phone number, HQ listed as "Kitchener, Ontario, Canada" —
  reinforces the startup, not enterprise, register.

## Copy patterns worth reusing in-app

- **Micro-stat + label pairs** everywhere instead of paragraphs: a big bold number/phrase (`Up to
  10× ROI`, `Zero water usage`, `Real-time`) with a small gray caption underneath (`Optimized
  cleaning decisions`, `Revenue tracking`). Good shape for empty-state or summary cards in the
  fleet dashboard (e.g. `$4,280` / `Recoverable today`).
- **Plain-language translation of technical metrics into dollars** is the core value prop of
  SwishOS itself ("translating soiling losses into financial terms for utility-scale operators" —
  per the PV Magazine blurb quoted on the homepage). This directly validates this project's
  `recoverable_usd` formula as the right north-star metric to foreground in the UI, not raw
  soiling % alone.
- Section eyebrows are always **UPPERCASE, short (2–3 words), and orange** — a cheap, consistent
  way to add visual rhythm without new components.

## Caveats

- This is a **live marketing site for a real, funded company** — the palette/type/product
  screenshots are their actual brand, not a generic reference. Reusing the exact palette and
  layout ideas for this take-home's UI is reasonable ("mirrors the real brand this system is
  named after"), but if this is ever meant to look like an independent product, note that
  explicitly in `DECISIONS.md` rather than presenting it as original branding.
- Content above reflects the site as captured on 2026-09-17; marketing sites change often — treat
  specific numbers/awards/copy as a snapshot, not a stable source to link against later.
