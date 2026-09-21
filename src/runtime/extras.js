"use strict";

const React = require("react");
const { usageColorSequence, canvasRadius, TONE_COLORS } = require("./tokens");
const { useHostTheme, mergeStyle, CanvasChevron, Row, Stack, Text } = require("./ui");

function useCanvasState(key, defaultValue) {
  return React.useState(defaultValue);
}

function useCanvasAction() {
  return function dispatch() {};
}

function TextInput({ value = "", placeholder, disabled, type = "text", style }) {
  const t = useHostTheme();
  return React.createElement("input", {
    type,
    value,
    placeholder,
    disabled: true,
    readOnly: true,
    style: mergeStyle(
      {
        height: 28,
        padding: "0 8px",
        border: `1px solid ${t.stroke.secondary}`,
        borderRadius: canvasRadius.sm,
        background: t.bg.editor,
        color: t.text.primary,
        fontSize: 13,
        width: "100%",
      },
      style
    ),
  });
}

function TextArea({ value = "", placeholder, rows = 3, style }) {
  const t = useHostTheme();
  return React.createElement("textarea", {
    value,
    placeholder,
    rows,
    disabled: true,
    readOnly: true,
    style: mergeStyle(
      {
        padding: 8,
        border: `1px solid ${t.stroke.secondary}`,
        borderRadius: canvasRadius.sm,
        background: t.bg.editor,
        color: t.text.primary,
        fontSize: 13,
        width: "100%",
        resize: "none",
        fontFamily: "inherit",
      },
      style
    ),
  });
}

function Checkbox({ checked = false, disabled, label, style }) {
  const t = useHostTheme();
  return React.createElement(
    "label",
    {
      style: mergeStyle(
        { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: t.text.primary },
        style
      ),
    },
    React.createElement("span", {
      style: {
        width: 14,
        height: 14,
        borderRadius: 3,
        border: `1.5px solid ${checked ? t.accent.primary : t.stroke.primary}`,
        background: checked ? t.accent.primary : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: t.text.onAccent,
        fontSize: 10,
        opacity: disabled ? 0.5 : 1,
      },
    }, checked ? "✓" : null),
    label
  );
}

function Toggle({ checked = false, disabled, size = "sm", style }) {
  const t = useHostTheme();
  const w = size === "md" ? 32 : 26;
  const h = size === "md" ? 20 : 16;
  const knob = h - 4;
  return React.createElement(
    "span",
    {
      style: mergeStyle(
        {
          width: w,
          height: h,
          borderRadius: h,
          background: checked ? t.accent.control : t.fill.primary,
          display: "inline-flex",
          alignItems: "center",
          padding: 2,
          opacity: disabled ? 0.5 : 1,
        },
        style
      ),
    },
    React.createElement("span", {
      style: {
        width: knob,
        height: knob,
        borderRadius: knob,
        background: "#fff",
        marginLeft: checked ? w - knob - 4 : 0,
      },
    })
  );
}

function Select({ value, options = [], placeholder, disabled, style }) {
  const t = useHostTheme();
  const selected = options.find((o) => o.value === value);
  return React.createElement(
    "span",
    {
      style: mergeStyle(
        {
          display: "inline-flex",
          alignItems: "center",
          height: 28,
          padding: "0 8px",
          border: `1px solid ${t.stroke.secondary}`,
          borderRadius: canvasRadius.sm,
          background: t.bg.editor,
          color: t.text.primary,
          fontSize: 13,
          minWidth: 120,
          opacity: disabled ? 0.5 : 1,
        },
        style
      ),
    },
    selected ? selected.label : placeholder || ""
  );
}

function IconButton({ children, disabled, title, variant = "default", size = "md", style }) {
  const t = useHostTheme();
  const px = size === "sm" ? 16 : 20;
  return React.createElement(
    "span",
    {
      title,
      style: mergeStyle(
        {
          width: px,
          height: px,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: variant === "circle" ? px : canvasRadius.sm,
          background: variant === "circle" ? t.fill.tertiary : "transparent",
          color: t.text.secondary,
          opacity: disabled ? 0.5 : 1,
          fontSize: 12,
        },
        style
      ),
    },
    children
  );
}

function Swatch({ color, style }) {
  const t = useHostTheme();
  const fill = (t.category && t.category[color]) || t.fill.primary;
  return React.createElement("span", {
    style: mergeStyle(
      {
        width: 24,
        height: 24,
        borderRadius: 6,
        background: fill,
        display: "inline-block",
        flexShrink: 0,
      },
      style
    ),
  });
}

function UsageBar({ segments = [], total, topLeftLabel, topRightLabel, style }) {
  const t = useHostTheme();
  const sum = segments.reduce((s, seg) => s + Math.max(0, Number(seg.value) || 0), 0);
  const cap = total || sum || 1;
  const remainder = Math.max(0, cap - sum);
  return React.createElement(
    "div",
    { style: mergeStyle({ display: "flex", flexDirection: "column", gap: 4 }, style) },
    topLeftLabel || topRightLabel
      ? React.createElement(
          Row,
          { justify: "space-between" },
          React.createElement(Text, { size: "small", tone: "secondary" }, topLeftLabel),
          React.createElement(Text, { size: "small", tone: "tertiary" }, topRightLabel)
        )
      : null,
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          height: 8,
          borderRadius: 8,
          overflow: "hidden",
          background: t.fill.quaternary,
          gap: 1,
        },
      },
      segments.map((seg, i) => {
        const v = Math.max(0, Number(seg.value) || 0);
        if (v <= 0) return null;
        const colorName = seg.color || usageColorSequence[i % usageColorSequence.length];
        const bg = (t.category && t.category[colorName]) || colorName;
        return React.createElement("div", {
          key: seg.id || i,
          style: { width: `${(v / cap) * 100}%`, background: bg },
        });
      }),
      remainder > 0
        ? React.createElement("div", {
            style: { width: `${(remainder / cap) * 100}%`, background: t.fill.tertiary },
          })
        : null
    )
  );
}

function CollapsibleSection({ title, leading, count, trailing, children, style }) {
  const t = useHostTheme();
  return React.createElement(
    "div",
    { style: mergeStyle({ display: "flex", flexDirection: "column", gap: 6 }, style) },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: 28,
        },
      },
      React.createElement(CanvasChevron, { expanded: true }),
      leading,
      React.createElement("span", { style: { fontSize: 13, fontWeight: 590, color: t.text.primary } }, title),
      count != null
        ? React.createElement("span", { style: { fontSize: 12, color: t.text.tertiary } }, count)
        : null,
      React.createElement("span", { style: { flex: 1 } }),
      trailing
        ? React.createElement("span", { style: { color: t.text.tertiary } }, trailing)
        : null
    ),
    React.createElement("div", { style: { paddingLeft: 20 } }, children)
  );
}

const TODO_MARK = {
  pending: "○",
  in_progress: "◐",
  completed: "●",
  cancelled: "✕",
};

function TodoList({ todos = [], dimmedTodoIds, style }) {
  const t = useHostTheme();
  if (!todos.length) return null;
  const dimmed = dimmedTodoIds instanceof Set ? dimmedTodoIds : new Set(dimmedTodoIds || []);
  return React.createElement(
    "div",
    { style: mergeStyle({ display: "flex", flexDirection: "column", gap: 4 }, style) },
    todos.map((todo) =>
      React.createElement(
        "div",
        {
          key: todo.id,
          style: {
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontSize: 13,
            color: t.text.primary,
            opacity: dimmed.has(todo.id) || todo.status === "cancelled" ? 0.5 : 1,
            textDecoration: todo.status === "cancelled" ? "line-through" : "none",
          },
        },
        React.createElement(
          "span",
          { style: { color: todo.status === "completed" ? TONE_COLORS.success : t.text.tertiary } },
          TODO_MARK[todo.status] || "○"
        ),
        todo.content
      )
    )
  );
}

function TodoListCard({ todos = [], dimmedTodoIds, style }) {
  const t = useHostTheme();
  const done = todos.filter((x) => x.status === "completed").length;
  return React.createElement(
    "div",
    {
      className: "canvas-card",
      style: mergeStyle(
        {
          border: `1px solid ${t.stroke.tertiary}`,
          borderRadius: canvasRadius.lg,
          overflow: "hidden",
        },
        style
      ),
    },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
          background: t.bg.chrome,
          fontSize: 12,
          fontWeight: 590,
        },
      },
      React.createElement(CanvasChevron, { expanded: true }),
      `${done} of ${todos.length} Done`
    ),
    React.createElement("div", { style: { padding: 12 } }, React.createElement(TodoList, { todos, dimmedTodoIds }))
  );
}

function DiffStats({ additions = 0, deletions = 0, style }) {
  if (!additions && !deletions) return null;
  return React.createElement(
    "span",
    {
      style: mergeStyle(
        { display: "inline-flex", gap: 8, fontVariantNumeric: "tabular-nums", fontSize: 12, fontWeight: 590 },
        style
      ),
    },
    additions
      ? React.createElement("span", { style: { color: TONE_COLORS.success } }, `+${additions}`)
      : null,
    deletions
      ? React.createElement("span", { style: { color: TONE_COLORS.danger } }, `-${deletions}`)
      : null
  );
}

function DiffView({
  lines = [],
  showLineNumbers = true,
  coloredLineNumbers = true,
  showAccentStrip = true,
  style,
}) {
  const t = useHostTheme();
  return React.createElement(
    "pre",
    {
      style: mergeStyle(
        {
          margin: 0,
          fontFamily: 'Consolas, "Cascadia Mono", "Courier New", monospace',
          fontSize: 11,
          lineHeight: 1.45,
          overflow: "auto",
        },
        style
      ),
    },
    lines.map((line, i) => {
      const bg =
        line.type === "added"
          ? t.diff.insertedLine
          : line.type === "removed"
            ? t.diff.removedLine
            : "transparent";
      const strip =
        line.type === "added" ? t.diff.stripAdded : line.type === "removed" ? t.diff.stripRemoved : "transparent";
      const numColor =
        coloredLineNumbers && line.type === "added"
          ? TONE_COLORS.success
          : coloredLineNumbers && line.type === "removed"
            ? TONE_COLORS.danger
            : t.text.quaternary;
      return React.createElement(
        "div",
        {
          key: i,
          style: {
            display: "flex",
            background: bg,
            borderLeft: showAccentStrip ? `3px solid ${strip}` : undefined,
          },
        },
        showLineNumbers
          ? React.createElement(
              "span",
              {
                style: {
                  width: 36,
                  textAlign: "right",
                  padding: "0 8px",
                  color: numColor,
                  userSelect: "none",
                },
              },
              line.lineNumber != null ? line.lineNumber : i + 1
            )
          : null,
        React.createElement(
          "span",
          { style: { padding: "0 8px", whiteSpace: "pre-wrap", color: t.text.primary } },
          (line.type === "added" ? "+" : line.type === "removed" ? "-" : " ") + (line.content || "")
        )
      );
    })
  );
}

function computeDAGLayout(options = {}) {
  const {
    nodes = [],
    edges = [],
    direction = "vertical",
    nodeWidth = 160,
    nodeHeight = 40,
    rankGap = 64,
    nodeGap = 48,
    padding = 24,
  } = options;

  const ids = nodes.map((n) => n.id);
  const idSet = new Set(ids);
  const outgoing = new Map(ids.map((id) => [id, []]));
  const edgeList = [];
  for (const e of edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    outgoing.get(e.from).push(e.to);
    edgeList.push(e);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map(ids.map((id) => [id, WHITE]));
  const backEdges = new Set();
  function dfs(u) {
    color.set(u, GRAY);
    for (const v of outgoing.get(u) || []) {
      const c = color.get(v);
      if (c === GRAY) backEdges.add(`${u}->${v}`);
      else if (c === WHITE) dfs(v);
    }
    color.set(u, BLACK);
  }
  for (const id of ids) if (color.get(id) === WHITE) dfs(id);

  const fwd = new Map(
    ids.map((id) => [id, (outgoing.get(id) || []).filter((v) => !backEdges.has(`${id}->${v}`))])
  );
  const indeg = new Map(ids.map((id) => [id, 0]));
  for (const vs of fwd.values()) for (const v of vs) indeg.set(v, indeg.get(v) + 1);
  const rank = new Map(ids.map((id) => [id, 0]));
  const q = ids.filter((id) => indeg.get(id) === 0);
  const seen = new Set();
  while (q.length) {
    const u = q.shift();
    seen.add(u);
    for (const v of fwd.get(u) || []) {
      rank.set(v, Math.max(rank.get(v), rank.get(u) + 1));
      indeg.set(v, indeg.get(v) - 1);
      if (indeg.get(v) === 0) q.push(v);
    }
  }

  const byRank = new Map();
  for (const id of ids) {
    const r = rank.get(id) || 0;
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r).push(id);
  }
  const ranks = [...byRank.keys()].sort((a, b) => a - b);
  const positioned = [];
  const pos = new Map();
  for (const r of ranks) {
    const group = byRank.get(r);
    group.forEach((id, i) => {
      const node =
        direction === "horizontal"
          ? {
              id,
              x: padding + r * (nodeWidth + rankGap),
              y: padding + i * (nodeHeight + nodeGap),
              rank: r,
              order: i,
            }
          : {
              id,
              x: padding + i * (nodeWidth + nodeGap),
              y: padding + r * (nodeHeight + rankGap),
              rank: r,
              order: i,
            };
      positioned.push(node);
      pos.set(id, node);
    });
  }

  let maxX = 0;
  let maxY = 0;
  for (const n of positioned) {
    maxX = Math.max(maxX, n.x + nodeWidth);
    maxY = Math.max(maxY, n.y + nodeHeight);
  }

  const layoutEdges = edgeList
    .map((e) => {
      const a = pos.get(e.from);
      const b = pos.get(e.to);
      if (!a || !b) return null;
      const isBackEdge = backEdges.has(`${e.from}->${e.to}`);
      if (direction === "horizontal") {
        return {
          from: e.from,
          to: e.to,
          sourceX: a.x + nodeWidth,
          sourceY: a.y + nodeHeight / 2,
          targetX: b.x,
          targetY: b.y + nodeHeight / 2,
          isBackEdge,
        };
      }
      return {
        from: e.from,
        to: e.to,
        sourceX: a.x + nodeWidth / 2,
        sourceY: a.y + nodeHeight,
        targetX: b.x + nodeWidth / 2,
        targetY: b.y,
        isBackEdge,
      };
    })
    .filter(Boolean);

  const rankBoxes = ranks.map((r) => {
    const ns = byRank.get(r).map((id) => pos.get(id));
    const x = Math.min(...ns.map((n) => n.x));
    const y = Math.min(...ns.map((n) => n.y));
    return {
      rank: r,
      x,
      y,
      width: Math.max(...ns.map((n) => n.x + nodeWidth)) - x,
      height: Math.max(...ns.map((n) => n.y + nodeHeight)) - y,
      nodeIds: byRank.get(r),
    };
  });

  return {
    nodes: positioned,
    edges: layoutEdges,
    ranks: rankBoxes,
    direction,
    width: maxX + padding,
    height: maxY + padding,
  };
}

module.exports = {
  useCanvasState,
  useCanvasAction,
  TextInput,
  TextArea,
  Checkbox,
  Toggle,
  Select,
  IconButton,
  Swatch,
  UsageBar,
  CollapsibleSection,
  TodoList,
  TodoListCard,
  DiffStats,
  DiffView,
  computeDAGLayout,
};
