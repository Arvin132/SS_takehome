# Design Tokens

Extracted by reading computed styles / CSS custom properties directly from the live site
(`getComputedStyle(document.documentElement)` on `swishsolar.com`). The site defines its palette
as `oklch()` values on a shadcn/ui-style `:root`; hex equivalents below were computed via a canvas
`fillStyle` round-trip so they're exact, not eyeballed.

## Color tokens (shadcn/ui theme shape)

| Token | Hex | Used for |
|---|---|---|
| `--background` | `#f9fbfd` | Page background — very pale blue-white, not pure white |
| `--foreground` | `#33394a` | Default body/heading text — dark slate-navy, not black |
| `--primary` | `#df5b12` | Burnt-orange brand accent — CTAs, active nav state, links, chart lines, stat numbers |
| `--primary-foreground` | `#fafafa` | Text/icon color on top of `--primary` |
| `--secondary` | `#33394a` | Same slate-navy, used as a fill (e.g. the "Request Demo" dark button) |
| `--secondary-foreground` | `#ffffff` | Text on `--secondary` |
| `--muted` | `#f5f5f5` | Subtle section backgrounds, disabled states |
| `--muted-foreground` | `#737373` | Secondary/caption text |
| `--accent` | `#edede7` | Soft warm-gray accent surface |
| `--accent-foreground` | `#33394a` | Text on `--accent` |
| `--destructive` | `#e7000b` | Errors/negative deltas |
| `--destructive-foreground` | `#ffffff` | Text on destructive |
| `--card` | `#ffffff` | Card surfaces (pure white, sits on the `#f9fbfd` page bg for a subtle lift) |
| `--card-foreground` | `#33394a` | Card text |
| `--popover` | `#ffffff` | Dropdown/menu surfaces |
| `--popover-foreground` | `#0a0a0a` | Popover text (near-black, darker than body text) |
| `--border` | `#e5e5e5` | Hairline borders |
| `--input` | `#e5e5e5` | Form input borders |
| `--ring` | `#a1a1a1` | Focus ring |
| `--radius` | `0.625rem` (10px) | Base corner radius (see Radius section — actual components often use larger) |

### Chart palette (`--chart-1` … `--chart-5`)

| Token | Hex | Note |
|---|---|---|
| `--chart-1` | `#ef7c53` | Lighter orange (secondary series) |
| `--chart-2` | `#6684ce` | Muted blue (contrast series) |
| `--chart-3` | `#e2b46b` | Gold/tan |
| `--chart-4` | `#cf844c` | Warm brown-orange |
| `--chart-5` | `#51586a` | Slate (matches foreground family) |

In practice, the actual dashboard mockups mostly use **primary orange for the main series** and
**slate-navy/blue for a secondary or "expected" series**, with green/red used ad hoc for
positive/negative deltas (not tokenized — plain `text-green-600` / `text-red-600`-style utility
colors). See `dashboard-patterns.md`.

### Colors not in the semantic token set (but used on the live pages)

| Color | Hex (approx) | Used for |
|---|---|---|
| Footer background | `#161c2c` | Site footer — near-black navy, distinct from `--foreground` |
| Positive/green (money saved, cleaning effectiveness) | `#16a34a`-ish (Tailwind `green-600`) | Table cell values |
| Eyebrow badge background | soft peach, ~`#fde8d7` | Pill badges ("THE CHALLENGE", "Core Feature", numbered step badges) |
| Hero overlay | warm amber/orange photo grading (not a CSS token — literal photography of dust storms at golden hour) | Full-bleed hero backgrounds |

## Typography

- **Body font:** system stack — `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", …`
  (Tailwind's default sans stack; no custom body webfont is loaded). Base size `16px` / line
  height `24px`.
- **Heading font:** **`"Readex Pro"`** (Google Font, loaded via `next/font`), used for `h1`/`h2`
  and most large display numbers. Notably rendered at **light weight (200–300)**, not bold —
  e.g. the H1 is `font-weight: 200` at `36px+`. This thin-weight display type over a heavier body
  is a deliberate part of the "light, airy" feel — don't default headings to bold.
- **Numeric/stat emphasis:** large stat numbers (e.g. "15B", "$2.5B", "30%") use `font-bold`
  (700) at `text-4xl`/`text-5xl`, often with a `bg-gradient-to-br from-primary to-primary/70
  bg-clip-text text-transparent` treatment (gradient-filled text, not flat color) — a nice detail
  worth reusing for hero KPI numbers.
- **Eyebrow labels** (e.g. "THE CHALLENGE", "INTELLIGENT SOFTWARE", "ADVANCED NANOTECHNOLOGY"):
  small, uppercase, letter-spaced, bold, colored `--primary` orange, always sits above an H2.

## Shape & elevation

- **Buttons:** `border-radius: 8px`, padding `0 16px` at `14px` font / `500` weight.
- **Cards:** noticeably larger radius than buttons — `rounded-xl` (~12px), often with
  `shadow-xl` and a subtle inset gradient (`bg-gradient-to-br from-transparent to-black/[0.03]`)
  rather than a flat fill — cards feel like soft embossed panels, not flat boxes.
- **Nav bar:** floating glassmorphic pill — `background: rgba(255,255,255,0.04)`,
  `backdrop-filter: blur(12px)`, `border-radius: 16px`, combined with subtle inset shadows
  (`inset 2px 2px 4px rgba(0,0,0,.08)`, `inset -2px -2px 4px rgba(255,255,255,.1)`) for a
  frosted-glass look when it sits over hero photography.
- **Icon badges** (feature icons, step numbers): square-ish rounded tile (`rounded-xl`/`rounded-2xl`,
  ~48–56px), filled with a soft peach/orange-tinted background, orange icon/number inside —
  reused everywhere (feature lists, "why it fails" cards, integration diagrams).

## Practical takeaway for this project's Tailwind config

If matching this brand for the take-home frontend, define a Tailwind v4 `@theme`/CSS-variable
block using the hex values above (`--primary: #df5b12`, `--secondary: #33394a`,
`--background: #f9fbfd`, etc.), load **Readex Pro** for headings only, keep body text on the
system sans stack, and default headings to weight 200–300 rather than bold.
