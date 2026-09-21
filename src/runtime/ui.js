"use strict";

const React = require("react");
const { TONE_COLORS, canvasTypography, canvasRadius, hostTheme } = require("./tokens");

const TextNestContext = React.createContext(false);
const CardContext = React.createContext({ size: "base", open: true, variant: "default" });

function useHostTheme() {
  const kind = (typeof globalThis !== "undefined" && globalThis.__PAGES_TO_PDF_THEME) || "light";
  return hostTheme(kind);
}

function ThemeProvider({ children }) {
  return React.createElement(React.Fragment, null, children);
}

function mergeStyle(base, override) {
  return override ? { ...base, ...override } : { ...base };
}

function Stack({ children, gap = 8, style }) {
  return React.createElement(
    "div",
    {
      style: mergeStyle(
        { display: "flex", flexDirection: "column", gap, minWidth: 0 },
        style
      ),
    },
    children
  );
}

const ALIGN = { start: "flex-start", center: "center", end: "flex-end", stretch: "stretch" };
const JUSTIFY = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  "space-between": "space-between",
};

function Row({ children, gap = 8, align = "center", justify = "start", wrap = false, style }) {
  return React.createElement(
    "div",
    {
      style: mergeStyle(
        {
          display: "flex",
          flexDirection: "row",
          gap,
          alignItems: ALIGN[align] || align,
          justifyContent: JUSTIFY[justify] || justify,
          flexWrap: wrap ? "wrap" : "nowrap",
          minWidth: 0,
        },
        style
      ),
    },
    children
  );
}

function Grid({ children, columns, gap = 12, align = "stretch", style }) {
  const template =
    typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns;
  return React.createElement(
    "div",
    {
      style: mergeStyle(
        {
          display: "grid",
          gridTemplateColumns: template,
          gap,
          alignItems: ALIGN[align] || align,
        },
        style
      ),
    },
    children
  );
}

function Divider({ style }) {
  const t = useHostTheme();
  return React.createElement("hr", {
    style: mergeStyle(
      {
        border: "none",
        borderTop: `1px solid ${t.stroke.tertiary}`,
        margin: "8px 0",
        width: "100%",
      },
      style
    ),
  });
}

function Spacer() {
  return React.createElement("div", { style: { flex: 1, minWidth: 0 } });
}

function H1({ children, style }) {
  const t = useHostTheme();
  return React.createElement(
    "h1",
    {
      style: mergeStyle(
        { ...canvasTypography.h1, color: t.text.primary, margin: 0 },
        style
      ),
    },
    children
  );
}

function H2({ children, style }) {
  const t = useHostTheme();
  return React.createElement(
    "h2",
    {
      style: mergeStyle(
        {
          ...canvasTypography.h2,
          color: t.text.primary,
          margin: "4px 0 0",
          pageBreakAfter: "avoid",
        },
        style
      ),
    },
    children
  );
}

function H3({ children, style }) {
  const t = useHostTheme();
  return React.createElement(
    "h3",
    {
      style: mergeStyle(
        {
          ...canvasTypography.h3,
          color: t.text.primary,
          margin: "4px 0 0",
          pageBreakAfter: "avoid",
        },
        style
      ),
    },
    children
  );
}

const TEXT_TONE = {
  primary: (t) => t.text.primary,
  secondary: (t) => t.text.secondary,
  tertiary: (t) => t.text.tertiary,
  quaternary: (t) => t.text.quaternary,
};

const TEXT_WEIGHT = { normal: 400, medium: 500, semibold: 590, bold: 700 };

const INLINE_MD = /(`[^`]+`)|(\[[^\]]+\]\([^)\s]+\))|(\*\*[^*]+\*\*)/g;

// Хост Cursor разбирает в Text инлайновый markdown: `код`, [текст](url), **жирный**.
function parseInlineMarkdown(node, keyPrefix = "md") {
  if (typeof node !== "string" || !node) return node;
  const parts = [];
  let last = 0;
  let match;
  let i = 0;
  INLINE_MD.lastIndex = 0;
  while ((match = INLINE_MD.exec(node)) !== null) {
    if (match.index > last) parts.push(node.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith("`")) {
      parts.push(React.createElement(Code, { key }, token.slice(1, -1)));
    } else if (token.startsWith("[")) {
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const href = token.slice(close + 2, -1);
      parts.push(React.createElement(Link, { key, href }, label));
    } else {
      parts.push(
        React.createElement("strong", { key, style: { fontWeight: 590 } }, token.slice(2, -2))
      );
    }
    last = match.index + token.length;
  }
  if (!parts.length) return node;
  if (last < node.length) parts.push(node.slice(last));
  return parts;
}

function renderInline(children) {
  if (typeof children === "string") return parseInlineMarkdown(children);
  if (Array.isArray(children)) {
    return children.map((child, i) =>
      typeof child === "string" ? parseInlineMarkdown(child, `md-${i}`) : child
    );
  }
  return children;
}

function Text({
  children,
  tone = "primary",
  size = "body",
  as,
  weight = "normal",
  italic = false,
  truncate,
  style,
}) {
  const t = useHostTheme();
  const nested = React.useContext(TextNestContext);
  const tag = as || (nested ? "span" : "p");
  const typo = size === "small" ? canvasTypography.small : canvasTypography.body;
  const truncateStyle =
    truncate === true || truncate === "end"
      ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
      : truncate === "start"
        ? {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            direction: "rtl",
          }
        : {};
  return React.createElement(
    TextNestContext.Provider,
    { value: true },
    React.createElement(
      tag,
      {
        style: mergeStyle(
          {
            ...typo,
            color: (TEXT_TONE[tone] || TEXT_TONE.primary)(t),
            fontWeight: TEXT_WEIGHT[weight] || 400,
            fontStyle: italic ? "italic" : "normal",
            margin: tag === "p" ? "0" : undefined,
            ...truncateStyle,
          },
          style
        ),
      },
      renderInline(children)
    )
  );
}

function Code({ children, style }) {
  const t = useHostTheme();
  return React.createElement(
    "code",
    {
      style: mergeStyle(
        {
          fontFamily: 'Consolas, "Cascadia Mono", "Courier New", monospace',
          fontSize: "0.92em",
          background: t.fill.tertiary,
          padding: "0.08em 0.32em",
          borderRadius: canvasRadius.sm,
        },
        style
      ),
    },
    children
  );
}

function Link({ children, href, style }) {
  const t = useHostTheme();
  return React.createElement(
    "a",
    {
      href,
      style: mergeStyle({ color: t.text.link, textDecoration: "none" }, style),
    },
    children
  );
}

function CanvasChevron({ expanded }) {
  const t = useHostTheme();
  return React.createElement(
    "svg",
    {
      width: 12,
      height: 12,
      viewBox: "0 0 12 12",
      style: {
        transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
        flexShrink: 0,
      },
    },
    React.createElement("path", {
      d: "M4 2l5 4-5 4",
      fill: "none",
      stroke: t.text.tertiary,
      strokeWidth: 1.4,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    })
  );
}

function Card({
  children,
  variant = "default",
  size = "base",
  stickyHeader = false,
  collapsible = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  style,
}) {
  const t = useHostTheme();
  const open = true;
  const ctx = { size, open, variant, stickyHeader, collapsible };
  const borderless = variant === "borderless";
  return React.createElement(
    CardContext.Provider,
    { value: ctx },
    React.createElement(
      "div",
      {
        className: "canvas-card",
        style: mergeStyle(
          {
            background: t.bg.elevated,
            border: borderless ? "none" : `1px solid ${t.stroke.tertiary}`,
            borderRadius: borderless ? 0 : canvasRadius.lg,
            overflow: "hidden",
            breakInside: "avoid",
          },
          style
        ),
      },
      children
    )
  );
}

function CardHeader({ children, trailing, style }) {
  const t = useHostTheme();
  const card = React.useContext(CardContext);
  const height = card.size === "lg" ? 32 : 28;
  return React.createElement(
    "div",
    {
      style: mergeStyle(
        {
          display: "flex",
          alignItems: "center",
          gap: 8,
          minHeight: height,
          padding: "0 12px",
          borderBottom: `1px solid ${t.stroke.tertiary}`,
          fontSize: 12,
          fontWeight: 590,
          color: t.text.primary,
          background: t.bg.chrome,
        },
        style
      ),
    },
    card.collapsible ? React.createElement(CanvasChevron, { expanded: true }) : null,
    React.createElement("div", { style: { flex: 1, minWidth: 0 } }, children),
    trailing
      ? React.createElement("div", { style: { flexShrink: 0 } }, trailing)
      : null
  );
}

function CardBody({ children, style }) {
  return React.createElement(
    "div",
    { style: mergeStyle({ padding: 12 }, style) },
    children
  );
}

function Button({
  children,
  variant = "secondary",
  disabled,
  type = "button",
  style,
  onClick,
}) {
  const t = useHostTheme();
  const variants = {
    primary: {
      background: t.accent.control,
      color: t.text.onAccent,
      border: "none",
    },
    secondary: {
      background: t.fill.tertiary,
      color: t.text.primary,
      border: `1px solid ${t.stroke.secondary}`,
    },
    ghost: {
      background: "transparent",
      color: t.text.secondary,
      border: "none",
    },
  };
  return React.createElement(
    "button",
    {
      type,
      disabled,
      onClick,
      style: mergeStyle(
        {
          height: 24,
          padding: "0 10px",
          borderRadius: canvasRadius.sm,
          fontSize: 12,
          fontWeight: 590,
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.5 : 1,
          width: "auto",
          ...(variants[variant] || variants.secondary),
        },
        style
      ),
    },
    children
  );
}

function Pill({
  children,
  active = false,
  size = "md",
  leadingContent,
  keyboardHint,
  disabled,
  title,
  style,
  onClick,
}) {
  const t = useHostTheme();
  const sm = size === "sm";
  return React.createElement(
    "span",
    {
      title,
      onClick: disabled ? undefined : onClick,
      style: mergeStyle(
        {
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          height: sm ? 18 : 24,
          padding: sm ? "0 6px" : "0 10px",
          borderRadius: canvasRadius.full,
          fontSize: sm ? 11 : 12,
          border: sm ? "none" : `1px solid ${t.stroke.tertiary}`,
          background: active ? t.fill.primary : t.fill.quaternary,
          color: t.text.primary,
          opacity: disabled ? 0.5 : 1,
        },
        style
      ),
    },
    leadingContent,
    children,
    keyboardHint
      ? React.createElement(
          "span",
          { style: { color: t.text.tertiary, fontSize: 10 } },
          keyboardHint
        )
      : null
  );
}

function Stat({ value, label, tone, style }) {
  const t = useHostTheme();
  const color = tone && TONE_COLORS[tone] ? TONE_COLORS[tone] : t.text.primary;
  return React.createElement(
    "div",
    { style: mergeStyle({ display: "flex", flexDirection: "column", gap: 2 }, style) },
    React.createElement(
      "div",
      { style: { fontSize: 22, lineHeight: "28px", fontWeight: 590, color } },
      value
    ),
    React.createElement(
      "div",
      { style: { fontSize: 12, lineHeight: "16px", color: t.text.tertiary } },
      label
    )
  );
}

const CALLOUT_ICONS = {
  info: "i",
  success: "✓",
  warning: "!",
  danger: "!",
  neutral: "·",
};

function Callout({ children, tone = "neutral", title, icon, style }) {
  const t = useHostTheme();
  const accent = TONE_COLORS[tone] || t.stroke.secondary;
  return React.createElement(
    "div",
    {
      className: "canvas-card",
      style: mergeStyle(
        {
          display: "flex",
          gap: 10,
          padding: "10px 12px",
          border: `1px solid ${t.stroke.tertiary}`,
          borderLeft: `3px solid ${accent}`,
          borderRadius: canvasRadius.md,
          background: t.fill.quaternary,
          breakInside: "avoid",
        },
        style
      ),
    },
    React.createElement(
      "div",
      {
        style: {
          width: 18,
          height: 18,
          borderRadius: 9,
          background: accent,
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        },
      },
      icon || CALLOUT_ICONS[tone] || "·"
    ),
    React.createElement(
      "div",
      { style: { minWidth: 0, flex: 1 } },
      title
        ? React.createElement(
            "div",
            { style: { fontWeight: 590, fontSize: 13, marginBottom: 4, color: t.text.primary } },
            title
          )
        : null,
      React.createElement(
        "div",
        { style: { fontSize: 13, color: t.text.secondary } },
        renderInline(children)
      )
    )
  );
}

function Table({
  headers = [],
  rows = [],
  columnAlign,
  rowTone,
  framed = true,
  striped = false,
  stickyHeader = false,
  style,
  emptyMessage,
}) {
  const t = useHostTheme();
  const align = (i) => (columnAlign && columnAlign[i]) || "left";
  const body =
    rows.length === 0
      ? React.createElement(
          "tr",
          null,
          React.createElement(
            "td",
            {
              colSpan: Math.max(headers.length, 1),
              style: { padding: 10, color: t.text.tertiary },
            },
            emptyMessage || ""
          )
        )
      : rows.map((row, ri) => {
          const cells = headers.map((_, ci) => row[ci] ?? "");
          const tone = rowTone && rowTone[ri];
          const dot = tone
            ? React.createElement("span", {
                style: {
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: 7,
                  background: TONE_COLORS[tone] || t.text.tertiary,
                  marginRight: 8,
                  verticalAlign: "middle",
                },
              })
            : null;
          return React.createElement(
            "tr",
            {
              key: ri,
              style: {
                background: striped && ri % 2 === 1 ? t.fill.quaternary : "transparent",
                breakInside: "avoid",
              },
            },
            cells.map((cell, ci) =>
              React.createElement(
                "td",
                {
                  key: ci,
                  style: {
                    padding: "6px 8px",
                    borderBottom: `1px solid ${t.stroke.tertiary}`,
                    textAlign: align(ci),
                    verticalAlign: "top",
                    fontSize: 12,
                    color: t.text.primary,
                  },
                },
                ci === 0 ? dot : null,
                cell
              )
            )
          );
        });

  const table = React.createElement(
    "table",
    {
      style: {
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 12,
      },
    },
    React.createElement(
      "thead",
      null,
      React.createElement(
        "tr",
        null,
        headers.map((h, i) =>
          React.createElement(
            "th",
            {
              key: i,
              style: {
                textAlign: align(i),
                padding: "6px 8px",
                borderBottom: `1px solid ${t.stroke.secondary}`,
                fontWeight: 590,
                fontSize: 12,
                color: t.text.secondary,
                background: t.bg.chrome,
                position: stickyHeader ? "sticky" : undefined,
                top: stickyHeader ? 0 : undefined,
              },
            },
            h
          )
        )
      )
    ),
    React.createElement("tbody", null, body)
  );

  if (!framed) return React.createElement("div", { style }, table);
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
    table
  );
}

module.exports = {
  ThemeProvider,
  useHostTheme,
  mergeStyle,
  Stack,
  Row,
  Grid,
  Divider,
  Spacer,
  H1,
  H2,
  H3,
  Text,
  Code,
  Link,
  CanvasChevron,
  Card,
  CardHeader,
  CardBody,
  Button,
  Pill,
  Stat,
  Callout,
  Table,
};
