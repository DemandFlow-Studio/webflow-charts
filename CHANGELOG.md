# Changelog

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
