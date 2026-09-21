"use strict";

const React = require("react");
const { chartColorSequence, TONE_COLORS, chartPalette } = require("./tokens");
const { useHostTheme, mergeStyle } = require("./ui");

function seriesColor(series, index) {
  if (series.tone && TONE_COLORS[series.tone]) return TONE_COLORS[series.tone];
  return chartColorSequence[index % chartColorSequence.length];
}

function formatVal(n, prefix = "", suffix = "") {
  if (!Number.isFinite(n)) return "";
  const rounded = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
  return `${prefix}${rounded}${suffix}`;
}

function niceMax(n) {
  if (n <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const m = n / exp;
  const nice = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return nice * exp;
}

function axisDomain(series, { beginAtZero = true, yMin, yMax, stacked, normalized, referenceLines }) {
  if (normalized) return { min: 0, max: 100 };
  const values = [];
  if (stacked) {
    const len = Math.max(0, ...series.map((s) => s.data.length));
    for (let i = 0; i < len; i++) {
      values.push(series.reduce((sum, s) => sum + (Number(s.data[i]) || 0), 0));
    }
  } else {
    for (const s of series) for (const v of s.data) values.push(Number(v) || 0);
  }
  if (referenceLines) {
    for (const line of referenceLines) values.push(Number(line.value) || 0);
  }
  let min = values.length ? Math.min(...values) : 0;
  let max = values.length ? Math.max(...values) : 1;
  if (beginAtZero && min > 0) min = 0;
  if (yMin != null) min = yMin;
  if (yMax != null) max = yMax;
  if (max === min) max = min + 1;
  if (yMax == null) max = niceMax(max);
  return { min, max };
}

function Legend({ series, t }) {
  if (!series || series.length < 2) return null;
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        justifyContent: "center",
        marginTop: 8,
        fontSize: 11,
        color: t.text.secondary,
      },
    },
    series.map((s, i) =>
      React.createElement(
        "span",
        { key: s.name || i, style: { display: "inline-flex", alignItems: "center", gap: 5 } },
        React.createElement("span", {
          style: {
            width: 8,
            height: 8,
            borderRadius: 2,
            background: seriesColor(s, i),
          },
        }),
        s.name
      )
    )
  );
}

function BarChart({
  categories = [],
  series = [],
  height = 220,
  stacked = false,
  horizontal = false,
  normalized = false,
  valueSuffix = "",
  valuePrefix = "",
  showValues,
  beginAtZero = true,
  yMin,
  yMax,
  referenceLines = [],
  style,
}) {
  const t = useHostTheme();
  const isStacked = stacked || normalized;
  const autoLabels = showValues == null ? series.length === 1 && categories.length <= 8 && !isStacked : showValues;
  const domain = axisDomain(series, { beginAtZero, yMin, yMax, stacked: isStacked, normalized, referenceLines });
  const pad = { top: 12, right: 16, bottom: horizontal ? 24 : 36, left: horizontal ? 72 : 40 };
  const width = 640;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const nCat = Math.max(categories.length, 1);
  const nSer = Math.max(series.length, 1);
  const groupW = innerW / nCat;
  const barGap = 2;

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => domain.min + ((domain.max - domain.min) * i) / ticks);

  const scale = (v) => {
    const p = (v - domain.min) / (domain.max - domain.min || 1);
    return horizontal ? p * innerW : innerH * (1 - p);
  };

  const bars = [];
  categories.forEach((cat, ci) => {
    if (isStacked) {
      let acc = 0;
      const raw = series.map((s) => Number(s.data[ci]) || 0);
      const sum = raw.reduce((a, b) => a + b, 0) || 1;
      series.forEach((s, si) => {
        const v = normalized ? (raw[si] / sum) * 100 : raw[si];
        const start = acc;
        acc += v;
        if (horizontal) {
          bars.push(
            React.createElement("rect", {
              key: `${ci}-${si}`,
              x: pad.left + scale(start),
              y: pad.top + ci * (innerH / nCat) + 4,
              width: Math.max(0, scale(start + v) - scale(start)),
              height: Math.max(4, innerH / nCat - 8),
              fill: seriesColor(s, si),
            })
          );
        } else {
          const y1 = pad.top + scale(start + v);
          const y0 = pad.top + scale(start);
          bars.push(
            React.createElement("rect", {
              key: `${ci}-${si}`,
              x: pad.left + ci * groupW + 6,
              y: y1,
              width: Math.max(2, groupW - 12),
              height: Math.max(0, y0 - y1),
              fill: seriesColor(s, si),
            })
          );
        }
      });
    } else {
      const slot = groupW / nSer;
      series.forEach((s, si) => {
        const v = Number(s.data[ci]) || 0;
        const color = series.length === 1 ? chartColorSequence[ci % chartColorSequence.length] : seriesColor(s, si);
        if (horizontal) {
          const h = Math.max(4, innerH / nCat / nSer - 4);
          bars.push(
            React.createElement(
              "g",
              { key: `${ci}-${si}` },
              React.createElement("rect", {
                x: pad.left,
                y: pad.top + ci * (innerH / nCat) + si * (innerH / nCat / nSer) + 2,
                width: Math.max(0, scale(v)),
                height: h,
                fill: color,
              }),
              autoLabels
                ? React.createElement(
                    "text",
                    {
                      x: pad.left + scale(v) + 4,
                      y: pad.top + ci * (innerH / nCat) + si * (innerH / nCat / nSer) + h / 2 + 3,
                      fontSize: 10,
                      fill: t.text.secondary,
                    },
                    formatVal(v, valuePrefix, valueSuffix)
                  )
                : null
            )
          );
        } else {
          const barW = Math.max(2, slot - barGap - 4);
          const x = pad.left + ci * groupW + si * slot + 4;
          const y = pad.top + scale(v);
          bars.push(
            React.createElement(
              "g",
              { key: `${ci}-${si}` },
              React.createElement("rect", {
                x,
                y,
                width: barW,
                height: Math.max(0, pad.top + innerH - y),
                fill: color,
              }),
              autoLabels
                ? React.createElement(
                    "text",
                    {
                      x: x + barW / 2,
                      y: y - 3,
                      textAnchor: "middle",
                      fontSize: 10,
                      fill: t.text.secondary,
                    },
                    formatVal(v, valuePrefix, valueSuffix)
                  )
                : null
            )
          );
        }
      });
    }
  });

  const axis = [];
  if (horizontal) {
    tickVals.forEach((v, i) => {
      const x = pad.left + scale(v);
      axis.push(
        React.createElement("line", {
          key: `tx-${i}`,
          x1: x,
          x2: x,
          y1: pad.top,
          y2: pad.top + innerH,
          stroke: t.stroke.tertiary,
          strokeWidth: 1,
        })
      );
      axis.push(
        React.createElement(
          "text",
          { key: `tl-${i}`, x, y: height - 6, textAnchor: "middle", fontSize: 10, fill: t.text.tertiary },
          formatVal(v, valuePrefix, normalized ? "%" : valueSuffix)
        )
      );
    });
    categories.forEach((cat, i) => {
      axis.push(
        React.createElement(
          "text",
          {
            key: `c-${i}`,
            x: pad.left - 6,
            y: pad.top + (i + 0.5) * (innerH / nCat) + 3,
            textAnchor: "end",
            fontSize: 10,
            fill: t.text.secondary,
          },
          cat
        )
      );
    });
  } else {
    tickVals.forEach((v, i) => {
      const y = pad.top + scale(v);
      axis.push(
        React.createElement("line", {
          key: `ty-${i}`,
          x1: pad.left,
          x2: pad.left + innerW,
          y1: y,
          y2: y,
          stroke: t.stroke.tertiary,
          strokeWidth: 1,
        })
      );
      axis.push(
        React.createElement(
          "text",
          { key: `tl-${i}`, x: pad.left - 6, y: y + 3, textAnchor: "end", fontSize: 10, fill: t.text.tertiary },
          formatVal(v, "", normalized ? "%" : "")
        )
      );
    });
    categories.forEach((cat, i) => {
      axis.push(
        React.createElement(
          "text",
          {
            key: `c-${i}`,
            x: pad.left + (i + 0.5) * groupW,
            y: height - 8,
            textAnchor: "middle",
            fontSize: 10,
            fill: t.text.secondary,
          },
          cat
        )
      );
    });
  }

  const refs = (referenceLines || []).map((line, i) => {
    const color = line.tone && TONE_COLORS[line.tone] ? TONE_COLORS[line.tone] : chartPalette.neutralLine;
    if (horizontal) {
      const x = pad.left + scale(line.value);
      return React.createElement(
        "g",
        { key: `ref-${i}` },
        React.createElement("line", {
          x1: x,
          x2: x,
          y1: pad.top,
          y2: pad.top + innerH,
          stroke: color,
          strokeDasharray: "4 3",
        }),
        line.label
          ? React.createElement(
              "text",
              { x: x + 4, y: pad.top + 10, fontSize: 10, fill: color },
              line.label
            )
          : null
      );
    }
    const y = pad.top + scale(line.value);
    return React.createElement(
      "g",
      { key: `ref-${i}` },
      React.createElement("line", {
        x1: pad.left,
        x2: pad.left + innerW,
        y1: y,
        y2: y,
        stroke: color,
        strokeDasharray: "4 3",
      }),
      line.label
        ? React.createElement(
            "text",
            { x: pad.left + innerW - 4, y: y - 4, textAnchor: "end", fontSize: 10, fill: color },
            line.label
          )
        : null
    );
  });

  return React.createElement(
    "div",
    { style: mergeStyle({ width: "100%" }, style) },
    React.createElement(
      "svg",
      { viewBox: `0 0 ${width} ${height}`, width: "100%", height, role: "img" },
      axis,
      refs,
      bars
    ),
    React.createElement(Legend, { series, t })
  );
}

function LineChart({
  categories = [],
  series = [],
  height = 220,
  fill = false,
  valueSuffix = "",
  valuePrefix = "",
  showValues = false,
  beginAtZero = true,
  yMin,
  yMax,
  referenceLines = [],
  style,
}) {
  const t = useHostTheme();
  const domain = axisDomain(series, { beginAtZero, yMin, yMax, referenceLines });
  const pad = { top: 16, right: 16, bottom: 36, left: 40 };
  const width = 640;
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const nCat = Math.max(categories.length, 1);
  const xAt = (i) => pad.left + (nCat === 1 ? innerW / 2 : (i * innerW) / (nCat - 1));
  const yAt = (v) => pad.top + innerH * (1 - (v - domain.min) / (domain.max - domain.min || 1));

  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => domain.min + ((domain.max - domain.min) * i) / ticks);
  const grid = tickVals.map((v, i) =>
    React.createElement(
      "g",
      { key: `g-${i}` },
      React.createElement("line", {
        x1: pad.left,
        x2: pad.left + innerW,
        y1: yAt(v),
        y2: yAt(v),
        stroke: t.stroke.tertiary,
      }),
      React.createElement(
        "text",
        { x: pad.left - 6, y: yAt(v) + 3, textAnchor: "end", fontSize: 10, fill: t.text.tertiary },
        formatVal(v)
      )
    )
  );
  const cats = categories.map((cat, i) =>
    React.createElement(
      "text",
      { key: `c-${i}`, x: xAt(i), y: height - 8, textAnchor: "middle", fontSize: 10, fill: t.text.secondary },
      cat
    )
  );

  const paths = series.map((s, si) => {
    const color = seriesColor(s, si);
    const pts = s.data.map((v, i) => `${xAt(i)},${yAt(Number(v) || 0)}`);
    const line = pts.join(" ");
    const area = fill
      ? `M ${xAt(0)} ${pad.top + innerH} L ${pts.join(" L ")} L ${xAt(s.data.length - 1)} ${pad.top + innerH} Z`
      : null;
    const dots = s.data.map((v, i) =>
      React.createElement("circle", {
        key: i,
        cx: xAt(i),
        cy: yAt(Number(v) || 0),
        r: 3,
        fill: color,
      })
    );
    const labels = showValues && categories.length <= 20
      ? s.data.map((v, i) =>
          React.createElement(
            "text",
            {
              key: `v-${i}`,
              x: xAt(i),
              y: yAt(Number(v) || 0) - 8,
              textAnchor: "middle",
              fontSize: 10,
              fill: t.text.secondary,
            },
            formatVal(Number(v) || 0, valuePrefix, valueSuffix)
          )
        )
      : null;
    return React.createElement(
      "g",
      { key: si },
      area
        ? React.createElement("path", { d: area, fill: color, opacity: 0.15 })
        : null,
      React.createElement("polyline", {
        points: line,
        fill: "none",
        stroke: color,
        strokeWidth: 2,
      }),
      dots,
      labels
    );
  });

  const refs = (referenceLines || []).map((line, i) => {
    const color = line.tone && TONE_COLORS[line.tone] ? TONE_COLORS[line.tone] : chartPalette.neutralLine;
    const y = yAt(line.value);
    return React.createElement(
      "g",
      { key: `r-${i}` },
      React.createElement("line", {
        x1: pad.left,
        x2: pad.left + innerW,
        y1: y,
        y2: y,
        stroke: color,
        strokeDasharray: "4 3",
      }),
      line.label
        ? React.createElement(
            "text",
            { x: pad.left + innerW - 4, y: y - 4, textAnchor: "end", fontSize: 10, fill: color },
            line.label
          )
        : null
    );
  });

  return React.createElement(
    "div",
    { style: mergeStyle({ width: "100%" }, style) },
    React.createElement(
      "svg",
      { viewBox: `0 0 ${width} ${height}`, width: "100%", height, role: "img" },
      grid,
      refs,
      paths,
      cats
    ),
    React.createElement(Legend, { series, t })
  );
}

function polar(cx, cy, r, angle) {
  const a = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arcPath(cx, cy, r, start, end) {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

function donutPath(cx, cy, r, r0, start, end) {
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const [x3, y3] = polar(cx, cy, r0, end);
  const [x4, y4] = polar(cx, cy, r0, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${r0} ${r0} 0 ${large} 0 ${x4} ${y4} Z`;
}

function PieChart({ data = [], size = 200, donut = false, style }) {
  const t = useHostTheme();
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const r0 = donut ? r * 0.58 : 0;
  let angle = 0;
  const slices = data.map((d, i) => {
    const v = Number(d.value) || 0;
    const sweep = (v / total) * 360;
    const start = angle;
    const end = angle + sweep;
    angle = end;
    const color = d.tone && TONE_COLORS[d.tone] ? TONE_COLORS[d.tone] : chartColorSequence[i % chartColorSequence.length];
    const dPath = donut ? donutPath(cx, cy, r, r0, start, end) : arcPath(cx, cy, r, start, end);
    return React.createElement("path", { key: d.label || i, d: dPath, fill: color });
  });

  return React.createElement(
    "div",
    {
      style: mergeStyle(
        { display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" },
        style
      ),
    },
    React.createElement(
      "svg",
      { width: size, height: size, viewBox: `0 0 ${size} ${size}` },
      slices,
      donut
        ? React.createElement(
            "text",
            {
              x: cx,
              y: cy + 4,
              textAnchor: "middle",
              fontSize: 14,
              fontWeight: 590,
              fill: t.text.primary,
            },
            Math.round(total)
          )
        : null
    ),
    React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: t.text.secondary } },
      data.map((d, i) =>
        React.createElement(
          "div",
          { key: d.label || i, style: { display: "flex", alignItems: "center", gap: 6 } },
          React.createElement("span", {
            style: {
              width: 8,
              height: 8,
              borderRadius: 2,
              background: d.tone && TONE_COLORS[d.tone] ? TONE_COLORS[d.tone] : chartColorSequence[i % chartColorSequence.length],
            },
          }),
          `${d.label} · ${formatVal(Number(d.value) || 0)} (${Math.round(((Number(d.value) || 0) / total) * 100)}%)`
        )
      )
    )
  );
}

module.exports = { BarChart, LineChart, PieChart };
