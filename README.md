# Webflow Charts

Animated, SEO-friendly charts for Webflow rich text, by [Demandflow](https://demandflow.co).

The chart HTML (data, labels and a data table) lives in a rich text embed on the page. These two files only style it, animate it and add tooltips, so search engines and screen readers always get the data.

Chart types: horizontal bars, columns, stacked bars, grouped bars, line, donut.

## Install on a Webflow site

**Site settings → Custom code → Head:**

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/DemandFlow-Studio/webflow-charts@1.2.2/charts.min.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/DemandFlow-Studio/webflow-charts@1.2.2/charts.min.css"></noscript>
<style>
  /* brand variables, see below */
</style>
```

The stylesheet loads without blocking the page; the script is deferred. If the CDN is down, charts show their data table (no CSS) or stay static (no JS); the rest of the page is unaffected.

**Site settings → Custom code → Footer (before `</body>`):**

```html
<script src="https://cdn.jsdelivr.net/gh/DemandFlow-Studio/webflow-charts@1.2.2/charts.min.js" defer></script>
```

Always load an exact version (`@1.2.2`). jsDelivr serves exact versions as immutable, so the CSS and JS on a page always match. A range like `@1` is cached by browsers for up to 7 days, so after a release a visitor can get new JS with old CSS. To update a site, change the version in both links.

## Brand variables

Set these on `:root` in the Head code, ideally pointing at the site's Webflow variables with a hex fallback (`var(--_swatch---purple--500, #7b13ff)`). Anything missing falls back to neutral greys, and staging shows a warning.

| Variable | Used for |
|---|---|
| `--chart-color-1` … `--chart-color-6` | Series colours, in this order |
| `--chart-color-7` … `--chart-color-12` | Optional second row for charts with 7–12 parts: lighter/darker shades of colours 1–6, ordered so neighbours never share a hue. Derived from 1–6 when not set |
| `--chart-on-color-1` … `--chart-on-color-12` | Text on top of each series colour |
| `--chart-accent`, `--chart-on-accent` | Highlighted bar and its text |
| `--chart-ink`, `--chart-muted` | Main and secondary text |
| `--chart-border`, `--chart-grid`, `--chart-track`, `--chart-surface` | Card border, grid lines, empty track, card background |
| `--chart-tooltip-bg`, `--chart-tooltip-ink` | Tooltip |
| `--chart-link-hover` | Optional: hover colour of links in the chart note (default: main text colour) |
| `--chart-font-heading`, `--chart-font-body` | Fonts |
| `--chart-radius` | Card corner radius |

Required for the staging check: `--chart-color-1`, `--chart-accent`, `--chart-ink`, `--chart-font-heading`.

## When something is wrong

Every chart is checked before it animates (data table, marks, numbers, chart type, duplicate IDs, brand variables).

- **Staging (`*.webflow.io`) and localhost:** a banner lists every problem and broken charts get a red outline. Force it with `?chart-debug=1`, turn it off with `?chart-debug=0`.
- **Live site:** a broken chart is replaced by its data table; if the table is broken too, the chart is hidden. Problems are logged to the console and exposed as `window.DemandflowCharts.problems`.

## Releases

Released versions are git tags (`v1.0.0`). A released tag is never changed or deleted, so no site can break by surprise. Fixes ship as a new patch or minor tag; anything that needs new chart HTML ships as a new major version.

## Handing a site over

When a client leaves, copy the version their site uses (`charts.css` and `charts.js` at that tag) into their Webflow project (Head `<style>` and Footer `<script>`), and remove the jsDelivr links. From then on the site no longer depends on this repository.
