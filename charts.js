/*! Demandflow Charts v1.0.0 — animates and adds tooltips to chart embeds.
 * The chart HTML is complete without this script (data + table are static).
 * Each chart initialises once, and a failure in one chart never stops the others.
 */
(() => {
  'use strict';

  const VERSION = '1.0.0';
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const DURATION = 900;
  const STAGGER = 70;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- data from the table (the source of truth for tooltips) ----------
  const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const readTable = (chart) => {
    const table = chart.querySelector('.chart_table');
    if (!table) return null;
    return {
      head: [...table.querySelectorAll('thead th')].map((th) => escapeHtml(th.textContent.trim())),
      rows: [...table.querySelectorAll('tbody tr')].map((tr) => ({
        label: escapeHtml(tr.querySelector('th')?.textContent.trim() ?? ''),
        values: [...tr.querySelectorAll('td')].map((td) => escapeHtml(td.textContent.trim())),
      })),
    };
  };

  // ---------- count-up: "4,700%" → animates the number, restores the exact text at the end ----------
  const countUp = (el, delay) => {
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    const m = final.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
    if (!m) return;
    const target = parseFloat(m[2].replace(/,/g, ''));
    const decimals = (m[2].split('.')[1] || '').length;
    const start = performance.now() + delay;
    const tick = (now) => {
      const t = Math.min(1, Math.max(0, (now - start) / DURATION));
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = t >= 1 ? final
        : m[1] + (target * eased).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + m[3];
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const grow = (els, keyframes, step = STAGGER) => els.forEach((el, i) =>
    el.animate(keyframes, { duration: DURATION, delay: i * step, easing: EASE, fill: 'backwards' }));

  const fadeValues = (chart, step = STAGGER) => chart.querySelectorAll('.chart_value').forEach((el, i) => {
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: i * step + 200, fill: 'backwards' });
    countUp(el, i * step);
  });

  // ---------- entrance animation per chart type ----------
  const ANIMATE = {
    bar(chart) {
      grow([...chart.querySelectorAll('.chart_fill')], [{ transform: 'scaleX(0)' }, { transform: 'none' }]);
      fadeValues(chart);
    },
    column(chart) {
      grow([...chart.querySelectorAll('.chart_colfill')], [{ transform: 'scaleY(0)' }, { transform: 'none' }]);
      fadeValues(chart);
    },
    grouped(chart) {
      grow([...chart.querySelectorAll('.chart_gfill')], [{ transform: 'scaleX(0)' }, { transform: 'none' }], 40);
      fadeValues(chart, 40);
    },
    stacked(chart) {
      grow([...chart.querySelectorAll('.chart_strack')], [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }]);
      chart.querySelectorAll('.chart_value').forEach((el, i) =>
        el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 500 + i * 30, fill: 'backwards' }));
    },
    line(chart) {
      const svg = chart.querySelector('.chart_line .chart_svg');
      svg.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
        { duration: 1200, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'backwards' });
      chart.querySelectorAll('.chart_pt').forEach((pt) => {
        const x = parseFloat(pt.style.getPropertyValue('--x')) || 0;
        pt.animate([{ opacity: 0, scale: 0 }, { opacity: 1, scale: 1 }], { duration: 300, delay: x * 1100, easing: EASE, fill: 'backwards' });
      });
    },
    donut(chart) {
      let delay = 0;
      chart.querySelectorAll('.chart_arc').forEach((arc) => {
        const [len] = (arc.getAttribute('stroke-dasharray') || '0 100').split(/\s+/).map(Number);
        const duration = Math.max(250, len * 12);
        arc.animate([{ strokeDasharray: '0 100' }, { strokeDasharray: `${len} ${100 - len}` }],
          { duration, delay, easing: 'linear', fill: 'backwards' });
        delay += duration;
      });
      chart.querySelectorAll('.chart_key').forEach((k, i) =>
        k.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 150 + i * STAGGER, fill: 'backwards' }));
    },
  };

  // ---------- tooltip: one per chart, slides between marks, follows the pointer horizontally ----------
  const createTooltip = (chart) => {
    const tip = document.createElement('div');
    tip.className = 'chart_tip';
    tip.setAttribute('aria-hidden', 'true');
    chart.appendChild(tip);
    let key = null;
    return {
      show(html, contentKey, clientX, topY) {
        if (contentKey !== key) { tip.innerHTML = html; key = contentKey; }
        const c = chart.getBoundingClientRect();
        const w = tip.offsetWidth;
        const h = tip.offsetHeight;
        const left = Math.min(Math.max(clientX - c.left - w / 2, 8), c.width - w - 8);
        const top = topY - c.top - h - 10;
        const wasHidden = !tip.classList.contains('is-on');
        tip.classList.toggle('is-jump', wasHidden);
        tip.style.translate = `${left}px ${top}px`;
        if (wasHidden) { void tip.offsetWidth; tip.classList.remove('is-jump'); }
        tip.classList.add('is-on');
      },
      hide() { tip.classList.remove('is-on'); key = null; },
    };
  };

  const setActive = (chart, selector) => {
    chart.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'));
    if (!selector) { chart.classList.remove('has-active'); return; }
    chart.querySelectorAll(selector).forEach((el) => el.classList.add('is-active'));
    chart.classList.add('has-active');
  };

  const swatch = (s) => `<span class="chart_swatch is-s${s + 1}"></span>`;

  // ---------- hover per chart type ----------
  const bindHover = (chart, type, data) => {
    const tip = createTooltip(chart);
    const plot = chart.querySelector('.chart_plot');
    if (!plot || !data) return;
    const series = data.head.slice(1);
    const leave = () => { tip.hide(); setActive(chart, null); };

    if (type === 'line') {
      const area = plot.querySelector('.chart_lineplot');
      const n = data.rows.length;
      area.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = area.getBoundingClientRect();
        const i = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (n - 1));
        const pts = [...area.querySelectorAll(`.chart_pt[data-r="${i}"]`)];
        const row = data.rows[i];
        const top = pts.length ? Math.min(...pts.map((p) => p.getBoundingClientRect().top)) : r.top;
        area.style.setProperty('--cx', n > 1 ? i / (n - 1) : 0);
        setActive(chart, `.chart_pt[data-r="${i}"]`);
        const lines = row.values.map((v, s) => `<span class="chart_tip-row">${swatch(s)}${series[s] ?? ''}<b>${v}</b></span>`).join('');
        tip.show(`<strong>${row.label}</strong>${lines}`, `r${i}`, r.left + (n > 1 ? i / (n - 1) : 0) * r.width, top);
      });
      area.addEventListener('pointerleave', leave);
      return;
    }

    const targetSel = { bar: '.chart_bar', column: '.chart_col', grouped: '.chart_gbar', stacked: '.chart_seg', donut: '.chart_arc' }[type];
    plot.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.target.closest(targetSel);
      if (!el) return;
      const r = Number(el.dataset.r);
      const s = el.dataset.s !== undefined ? Number(el.dataset.s) : null;
      const row = data.rows[r];
      if (!row) return;
      let html;
      let top;
      if (s === null) {
        html = `<strong>${row.values[0]}</strong>${row.label}`;
        setActive(chart, `[data-r="${r}"]`);
      } else {
        html = `<strong>${row.values[s]}</strong><span class="chart_tip-row">${swatch(s)}${series[s] ?? ''}</span>${row.label}`;
        setActive(chart, `[data-r="${r}"][data-s="${s}"]`);
      }
      if (type === 'bar') top = el.querySelector('.chart_track').getBoundingClientRect().top;
      else if (type === 'column') {
        const fill = el.querySelector('.chart_colfill');
        top = el.getBoundingClientRect().bottom - fill.offsetHeight - 28;
      } else if (type === 'donut') top = e.clientY - 6;
      else top = el.getBoundingClientRect().top;
      tip.show(html, `${r}-${s}`, e.clientX, top);
    });
    plot.addEventListener('pointerleave', leave);
  };

  // ---------- init ----------
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      play(entry.target);
    });
  }, { threshold: 0.35 }) : null;

  function play(chart) {
    chart.classList.remove('is-waiting');
    try { ANIMATE[chart.dataset.chart]?.(chart); } catch (err) { console.warn('[charts] animation failed', chart.dataset.chartId, err); }
  }

  // ---------- checks ----------
  // Debug mode (error banner + outlines): Webflow staging, localhost, or ?chart-debug=1. ?chart-debug=0 forces production mode.
  const debugMode = () => {
    const flag = new URLSearchParams(location.search).get('chart-debug');
    if (flag !== null) return flag !== '0';
    return /\.webflow\.io$/.test(location.hostname) || ['localhost', '127.0.0.1'].includes(location.hostname);
  };
  const problems = [];
  const report = (chart, message) => {
    const id = chart ? chart.dataset.chartId || '(no id)' : 'page';
    problems.push({ id, message, chart });
    console.warn(`[charts] ${id}: ${message}`);
  };

  const isNum = (v) => v !== '' && v !== null && Number.isFinite(Number(v));
  const cssVar = (el, name) => el.style.getPropertyValue(name).trim();

  // Table: the SEO / screen-reader copy and the production fallback
  const checkTable = (chart) => {
    const table = chart.querySelector('.chart_table');
    if (!table) return ['data table is missing'];
    const errors = [];
    const cols = table.querySelectorAll('thead th').length;
    const rows = [...table.querySelectorAll('tbody tr')];
    if (cols < 2) errors.push('data table header is incomplete');
    if (!rows.length) errors.push('data table has no rows');
    rows.forEach((tr, i) => {
      const th = tr.querySelector('th');
      const tds = tr.querySelectorAll('td');
      if (!th || !th.textContent.trim()) errors.push(`data table row ${i + 1} has no label`);
      if (cols >= 2 && tds.length !== cols - 1) errors.push(`data table row ${i + 1} has ${tds.length} value(s), expected ${cols - 1}`);
    });
    return errors;
  };

  // Plot: marks exist, match the table, and carry valid numbers
  const MARKS = {
    bar: { sel: '.chart_bar', perSeries: false, num: (el) => [cssVar(el, '--v')] },
    column: { sel: '.chart_col', perSeries: false, num: (el) => [cssVar(el, '--v')] },
    donut: { sel: '.chart_arc', perSeries: false, num: (el) => (el.getAttribute('stroke-dasharray') || '').split(/\s+/) },
    stacked: { sel: '.chart_seg', perSeries: true, num: (el) => [cssVar(el, '--v')] },
    grouped: { sel: '.chart_gbar', perSeries: true, num: (el) => [cssVar(el.querySelector('.chart_gfill') || el, '--v')] },
    line: { sel: '.chart_xtick', perSeries: false, num: (el) => [cssVar(el, '--x')] },
  };
  const checkPlot = (chart, type, table) => {
    const spec = MARKS[type];
    if (!spec) return [`unknown chart type “${type}”`];
    const plot = chart.querySelector('.chart_plot');
    if (!plot) return ['chart plot is missing'];
    const errors = [];
    const marks = [...plot.querySelectorAll(spec.sel)];
    if (!marks.length) errors.push('chart has no bars/points');
    if (table) {
      const series = Math.max(table.head.length - 1, 1);
      const expected = table.rows.length * (spec.perSeries ? series : 1);
      if (marks.length && marks.length !== expected) errors.push(`chart has ${marks.length} mark(s) but the table has data for ${expected}`);
      if (type === 'line' && plot.querySelectorAll('.chart_path').length !== series) errors.push('line chart is missing a series line');
    }
    const bad = marks.filter((el) => spec.num(el).some((v) => !isNum(v)));
    if (type === 'line') bad.push(...[...plot.querySelectorAll('.chart_pt')].filter((pt) => !isNum(cssVar(pt, '--x')) || !isNum(cssVar(pt, '--y'))));
    if (bad.length) errors.push(`${bad.length} mark(s) have a missing or invalid value`);
    return errors;
  };

  // Production: show the table instead of a broken chart; hide the chart if the table is broken too
  const degrade = (chart, tableOk, debug) => {
    chart.classList.remove('is-waiting');
    if (debug) chart.classList.add('has-problem');
    if (tableOk) chart.classList.add('is-fallback');
    else if (!debug) chart.classList.add('is-hidden');
  };

  const initChart = (chart, debug) => {
    if (chart.dataset.jsInit) return;
    chart.dataset.jsInit = 'true';
    const type = chart.dataset.chart;
    if (!chart.dataset.chartId) report(chart, 'chart has no data-chart-id');
    const tableErrors = checkTable(chart);
    const table = tableErrors.length ? null : readTable(chart);
    const plotErrors = checkPlot(chart, type, table);
    tableErrors.forEach((m) => report(chart, m));
    plotErrors.forEach((m) => report(chart, m));
    if (plotErrors.length) { degrade(chart, !tableErrors.length, debug); return; }
    if (tableErrors.length && debug) chart.classList.add('has-problem');
    if (table) bindHover(chart, type, table);
    if (reducedMotion() || !io || !chart.animate) return;
    chart.classList.add('is-waiting');
    io.observe(chart);
  };

  // Page-level checks: duplicate IDs and the brand variables from the site's Head code
  const BRAND_VARS = ['--chart-color-1', '--chart-accent', '--chart-ink', '--chart-font-heading'];
  const checkPage = (charts, debug) => {
    const seen = {};
    charts.forEach((c) => { const id = c.dataset.chartId; if (id) (seen[id] = seen[id] || []).push(c); });
    Object.entries(seen).forEach(([id, list]) => {
      if (list.length < 2) return;
      report(list[1], `chart ID “${id}” is used ${list.length} times on this page`);
      if (debug) list.forEach((c) => c.classList.add('has-problem'));
    });
    const root = getComputedStyle(document.documentElement);
    const missing = BRAND_VARS.filter((v) => !root.getPropertyValue(v).trim());
    if (missing.length) report(null, `brand variables missing (${missing.join(', ')}); charts use neutral colours. Add the brand block to Site settings → Custom code → Head.`);
  };

  // Staging banner: lists every problem, click to jump to the chart
  const showBanner = () => {
    if (!problems.length || document.querySelector('.chart-alert')) return;
    const box = document.createElement('div');
    box.className = 'chart-alert';
    box.setAttribute('role', 'status');
    const items = problems.map((p, i) => `<li><button type="button" class="chart-alert_id" data-i="${i}">${escapeHtml(p.id)}</button> ${escapeHtml(p.message)}</li>`).join('');
    box.innerHTML = `<div class="chart-alert_head"><strong>Charts: ${problems.length} problem${problems.length > 1 ? 's' : ''} on this page</strong>`
      + '<button type="button" class="chart-alert_close" aria-label="Hide">×</button></div>'
      + `<ul class="chart-alert_list">${items}</ul><p class="chart-alert_foot">Shown on staging only. Visitors on the live site see the data table or nothing instead of a broken chart.</p>`;
    box.addEventListener('click', (e) => {
      if (e.target.closest('.chart-alert_close')) { box.remove(); return; }
      const btn = e.target.closest('.chart-alert_id');
      const chart = btn && problems[Number(btn.dataset.i)].chart;
      if (chart) chart.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.body.appendChild(box);
  };

  const init = () => {
    const debug = debugMode();
    const charts = [...document.querySelectorAll('.chart[data-chart]')];
    charts.forEach((chart) => {
      try { initChart(chart, debug); } catch (err) {
        report(chart, `failed to initialise (${err.message})`);
        degrade(chart, !checkTable(chart).length, debug);
      }
    });
    if (charts.length) checkPage(charts, debug);
    if (debug) showBanner();
  };

  window.DemandflowCharts = { version: VERSION, init, problems };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
