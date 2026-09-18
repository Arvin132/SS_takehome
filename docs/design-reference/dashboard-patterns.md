# SwishOS Product Dashboard — UI Reference

`swishsolar.com/software` embeds several **mockup screenshots of the actual SwishOS product UI**
(labeled "Acme Inc" as the demo tenant). These are static marketing images, not a live app, but
they're clearly a real design-system export (pixel-precise UI, not an illustration) and are the
closest thing to an official visual spec for the app this take-home asks us to build — a fleet
soiling/cleaning dashboard. **This file is the most load-bearing one for the actual frontend
build.**

Important: this dashboard UI uses a **different (darker) theme than the marketing site**. Don't
reuse the light-everywhere marketing palette for the app shell — use this one.

## Overall shell

- **Persistent dark sidebar**, left-aligned, near-black navy (visually close to the marketing
  site's `#161c2c` footer color, not the `#33394a` slate). Contains, top to bottom:
  1. Logo mark + "SwishOS" wordmark + a collapse/expand icon button, top-right of the sidebar header.
  2. Primary nav group: `Dashboard`, `Plant Overview`, `Soiling`, `Settings` — each with a small
     line icon to the left of the label.
  3. A second, unlabeled nav group listing **individual plants by name** (`Sunfield Alpha`,
     `Cactus Bloom`, `Mountain Crest`, then a `More` overflow item) — i.e. the fleet list lives
     directly in the sidebar as quick-switch links, not only in a table.
  4. Account footer pinned to the bottom: avatar + org name ("Acme Inc") + user email, with a
     small chevron (account switcher).
- **Active nav item** styling: soft peach/cream background pill behind the item, a thin orange
  left-edge accent bar, and orange text/icon — the same accent-on-light-pill pattern used for
  eyebrow badges on the marketing site, just inverted onto a dark rail.
- **Main content area** is light (`--background`/`--card` family from `tokens.md`), giving a
  dark-sidebar / light-canvas split — this is the one clear "app chrome vs. marketing chrome"
  distinction worth carrying into the real build.
- Page header inside the content area: page title top-left (e.g. "Soiling Maintenance"), a
  **site/plant selector dropdown** top-right (e.g. "Sunfield Alpha - Arizona, USA ▾") — the
  dashboard is scoped to one plant at a time via this selector, with the sidebar plant list as an
  alternate way to switch.

## KPI strip

A row of small bordered boxes directly under the page header, each showing:
- a metric label (small, muted),
- the actual/expected value pair (e.g. "Expected 98% (−2.8%)"),
- a colored delta badge (green up-arrow / red down-arrow percentage) inline with the label.

Example row: `Expected 98% (-2.8%)` · `Expected 20000 MWh (-1.2%)` · `Expected 1.4M $USD (-1.2%)`
· `Latest updated: Oct 15, 2025` · `Sunfield Alpha — Last cleaned: Aug 10, 2025`. This maps almost
directly onto this project's domain: expected vs. actual energy, expected vs. actual revenue,
last-updated/last-cleaned timestamps — reuse this shape for a plant summary header.

## Tabs

Underline-style tabs directly below the KPI strip (`Performance` / `Energy Loss` seen on one
screen), active tab has an orange underline + orange text, inactive tabs are muted gray text, no
pill/box around tabs.

## Chart cards (the core repeating unit)

Every chart lives in its own white `rounded-xl` card with a consistent header row:
`[small icon] Chart Title ................. [ⓘ info icon] [period dropdown ▾]` — e.g.
"📈 Soiling Trend & Cleaning Schedule" with an "ⓘ" tooltip trigger and a "Monthly ▾" period
selector on the right.

Below the header, a **legend + big numbers row** sits above the chart itself: colored square
swatches paired with a label and a large bold value, e.g.:

```
■ Today's Soiling   ■ Selected Date
2.3% ↗              Nov 1, 2025

                              ■ Selected Date Cost   ■ Optimized Cleaning Cost
                              7904 $USD               5881 $USD
```

i.e. **the two numbers being compared (actual/selected vs. optimized/expected) are shown as large
figures right above the chart, not just in the chart itself** — good pattern to copy for
showing `recoverable_usd` vs. current-schedule cost on a plant detail view.

### Line/area chart styling

- X-axis: dates in `MM/DD` format, small muted gray tick labels.
- Y-axis: percentage or power units, gridlines are light dashed horizontal lines.
- Primary series (actual/historical) is drawn as a **solid orange line with a soft
  orange-gradient fill** beneath it down to the axis (area chart, not a bare line).
- Forecast/expected portion of the same series continues as a **dashed line, no fill**, in a
  muted slate-blue — a clean visual convention for "this part is predicted/optimized, not
  observed" that fits this project's forward-looking `days_until_next_reset` projections well.
- One or more **vertical reference lines** cross the chart marking key dates (e.g. "today",
  "10/21", "10/31 optimized cleaning date", "11/01 next reset") — thin solid vertical lines in
  blue/green with the date labeled directly on the axis in matching color/bold.
- A second chart pattern (multi-series "Performance Ratio Analysis") plots 2–3 series
  (actual/expected/secondary) as smooth lines in orange, gold, and slate — no fill, just lines
  with small circular data-point markers.

## Data tables

Below the chart, a "Cleaning Events" table:
- Header row: `Date of Event | Money Saved / Lost | Soiling on Date | Cleaning Effectiveness`,
  plus `+ Add` / `✎ Edit` actions top-right of the table's own mini-header.
- Money values are colored (green, prefixed with `+`) rather than using a separate icon.
- Percentages are right-aligned plain text, no progress bars or extra chrome — table stays dense
  and numeric, letting color do the only extra signaling.
- Row hover/zebra striping not clearly visible at this resolution — assume plain white rows with
  hairline `#e5e5e5` dividers, consistent with the token set.

## Integration/system diagram

The "Works With Your Existing Systems" section uses a simple **vertical flow diagram**: a bordered
box ("Your Existing Systems — SCADA • Inverters • Monitoring") connected by a thin vertical line
down to a highlighted peach-bordered box ("SwishOS Platform — AI-Powered Analytics Engine"),
continuing down to a third box. Good reusable pattern for an "how data flows into a
recommendation" explainer if the app needs one (e.g. for the LLM-justification requirement in the
brief).

## Direct recommendations for this project's frontend

1. **App shell:** dark navy sidebar (nav + fleet/plant list + account footer) + light content
   canvas, matching this screenshot set — not the all-light marketing theme.
2. **Plant selector:** put it top-right of the page header as a dropdown, mirroring
   "Sunfield Alpha - Arizona, USA ▾", and mirror it with a quick-switch plant list in the sidebar.
3. **Recommendation view:** lead with a KPI strip (expected vs. actual energy/revenue + last
   cleaned date), then a chart card showing the soiling/PR trend with a solid line for observed
   data and a dashed line for the projected/no-clean-vs-clean scenario, with vertical markers for
   "today" and the recommended cleaning date.
4. **Cleaning economics table:** reuse the `Date | Money Saved/Lost | Soiling on Date |
   Effectiveness`-style table shape for a plant's cleaning history, colorizing the
   `recoverable_usd` column green/red by sign instead of adding icons.
5. Keep the **orange accent reserved for the one primary metric/action per screen** (today's
   soiling, the recommended action, the primary series) — the mockups never use orange for more
   than one emphasis role at a time.
