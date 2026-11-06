# Changelog

## 1.2.1 — 2026-11-06

- Tooltip value was invisible on sites that colour `strong` inside rich text with `!important`: the tooltip now uses its own spans (`.chart_tip-value`, `.chart_tip-num`).
- Donut: moving the pointer from an arc into the hole now hides the tooltip and the highlight.

## 1.2.0 — 2026-11-06

Webflow strips `<svg>` from rich text embeds when they are saved (found on the first CMS write), so donut and line charts arrived without their rings and lines.

- Donut arcs and line paths now ship as empty `<span>`s with their geometry in data attributes (`.chart_arcdata`, `.chart_pathdata`); the script draws the SVG (and the line grid) on load. Embeds that already contain an SVG still work.
- Without JS, a donut shows the same ring as a CSS conic-gradient (`--ring` on `.chart_ring`); a line chart shows its points.
- The hidden data table sits in a 1px clipping box (`.chart_data`), so a long table can no longer widen the card. Embeds without the wrapper keep the old rule.

## 1.1.0 — 2026-11-06

- Colours 7–12 (`--chart-color-7` … `--chart-color-12`, `--chart-on-color-7` … `12`) for charts with up to 12 parts. Optional: without them they are derived from colours 1–6.
- Stacked bars: segments shrink to fit the 2px gaps (the last segment no longer overflows with many parts); on mobile, values on segments under 14% are hidden (still in the tooltip).

## 1.0.0 — 2026-11-06

First release.

- Chart types: bar, column, stacked, grouped, line, donut.
- Entrance animations on scroll, count-up values, tooltip that follows the pointer and slides between marks.
- Respects reduced motion.
- Checks every chart; on the live site a broken chart falls back to its data table (or is hidden), on staging a banner lists the problems.
- Brand colours and fonts from CSS variables, neutral greys when they are missing.
