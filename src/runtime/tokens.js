"use strict";

const chartPalette = {
  green: "#1F8A65E8",
  darkGreen: "#0D855AE0",
  lightGreen: "#52B896E0",
  mintGreen: "#7DCAB0E0",
  blue: "#2E79B5E0",
  lightBlue: "#70B0D8E0",
  indigo: "#5A6CC0F0",
  lightIndigo: "#9AAADCE0",
  purple: "#7B64B8F0",
  lightPurple: "#AA98D8E0",
  warmPink: "#C85898E0",
  lightPink: "#E8A0C4E0",
  brightOrange: "#F0A040E0",
  deepOrange: "#C06028E0",
  goldenYellow: "#E8C030E0",
  darkAmber: "#C04848E0",
  warmPeach: "#F0A088E0",
  vibrantTeal: "#2A9A8AE0",
  muted: "#8888A8E0",
  neutralLine: "#888899D0",
};

const chartColorSequence = [
  chartPalette.blue,
  chartPalette.green,
  chartPalette.purple,
  chartPalette.brightOrange,
  chartPalette.indigo,
  chartPalette.warmPink,
  chartPalette.vibrantTeal,
  chartPalette.goldenYellow,
  chartPalette.lightBlue,
  chartPalette.lightGreen,
  chartPalette.lightPurple,
  chartPalette.deepOrange,
];

const categoryPaletteLight = {
  gray: "#6B6B6B",
  purple: "#7C5CB8",
  green: "#1F8A65",
  yellow: "#C4A017",
  cyan: "#2A9A8A",
  pink: "#C85898",
  blue: "#2E79B5",
  orange: "#C06028",
  red: "#C04848",
};

const categoryPaletteDark = {
  gray: "#A0A0A0",
  purple: "#AA98D8",
  green: "#52B896",
  yellow: "#E8C030",
  cyan: "#7DCAB0",
  pink: "#E8A0C4",
  blue: "#70B0D8",
  orange: "#F0A040",
  red: "#F0A088",
};

const usageColorSequence = [
  "gray",
  "purple",
  "green",
  "yellow",
  "cyan",
  "pink",
  "blue",
  "orange",
];

const canvasPaletteLight = {
  foreground: "#141414",
  foregroundSecondary: "rgba(20, 20, 20, 0.74)",
  foregroundTertiary: "rgba(20, 20, 20, 0.60)",
  foregroundQuaternary: "rgba(20, 20, 20, 0.36)",
  editor: "#ffffff",
  chrome: "#f7f7f5",
  sidebar: "#f0f0ee",
  elevated: "#ffffff",
  fillPrimary: "rgba(20, 20, 20, 0.20)",
  fillSecondary: "rgba(20, 20, 20, 0.14)",
  fillTertiary: "rgba(20, 20, 20, 0.08)",
  fillQuaternary: "rgba(20, 20, 20, 0.06)",
  strokePrimary: "rgba(20, 20, 20, 0.20)",
  strokeSecondary: "rgba(20, 20, 20, 0.12)",
  strokeTertiary: "rgba(20, 20, 20, 0.08)",
  strokeFocused: "#3B82F6",
  accent: "#3B82F6",
  buttonBackground: "#3B82F6",
  buttonForeground: "#ffffff",
  buttonHoverBackground: "#2563EB",
  link: "#2563EB",
  diffInsertedLine: "#E6F4EA",
  diffRemovedLine: "#FCE8E6",
  diffStripAdded: "#1F8A65",
  diffStripRemoved: "#C04848",
};

const canvasPaletteDark = {
  foreground: "#F0F0F0",
  foregroundSecondary: "rgba(240, 240, 240, 0.74)",
  foregroundTertiary: "rgba(240, 240, 240, 0.60)",
  foregroundQuaternary: "rgba(240, 240, 240, 0.36)",
  editor: "#181818",
  chrome: "#141414",
  sidebar: "#1e1e1e",
  elevated: "#1e1e1e",
  fillPrimary: "rgba(240, 240, 240, 0.20)",
  fillSecondary: "rgba(240, 240, 240, 0.14)",
  fillTertiary: "rgba(240, 240, 240, 0.08)",
  fillQuaternary: "rgba(240, 240, 240, 0.06)",
  strokePrimary: "rgba(240, 240, 240, 0.20)",
  strokeSecondary: "rgba(240, 240, 240, 0.12)",
  strokeTertiary: "rgba(240, 240, 240, 0.08)",
  strokeFocused: "#5B9EFF",
  accent: "#5B9EFF",
  buttonBackground: "#3B82F6",
  buttonForeground: "#ffffff",
  buttonHoverBackground: "#60A5FA",
  link: "#7DB4FF",
  diffInsertedLine: "#1A3D2E",
  diffRemovedLine: "#3D1A1A",
  diffStripAdded: "#1F8A65",
  diffStripRemoved: "#C04848",
};

function tokensFromPalette(palette, category) {
  return {
    bg: {
      editor: palette.editor,
      chrome: palette.chrome,
      elevated: palette.elevated,
    },
    text: {
      primary: palette.foreground,
      secondary: palette.foregroundSecondary,
      tertiary: palette.foregroundTertiary,
      quaternary: palette.foregroundQuaternary,
      link: palette.link,
      onAccent: palette.buttonForeground,
    },
    stroke: {
      primary: palette.strokePrimary,
      secondary: palette.strokeSecondary,
      tertiary: palette.strokeTertiary,
      focused: palette.strokeFocused,
    },
    fill: {
      primary: palette.fillPrimary,
      secondary: palette.fillSecondary,
      tertiary: palette.fillTertiary,
      quaternary: palette.fillQuaternary,
    },
    accent: {
      primary: palette.accent,
      control: palette.buttonBackground,
      controlHover: palette.buttonHoverBackground,
    },
    diff: {
      insertedLine: palette.diffInsertedLine,
      removedLine: palette.diffRemovedLine,
      stripAdded: palette.diffStripAdded,
      stripRemoved: palette.diffStripRemoved,
    },
    category,
  };
}

const canvasTokensLight = tokensFromPalette(canvasPaletteLight, categoryPaletteLight);
const canvasTokens = tokensFromPalette(canvasPaletteDark, categoryPaletteDark);
const colorPalette = categoryPaletteLight;

const TONE_COLORS = {
  success: "#1F8A65",
  danger: "#C04848",
  warning: "#C06028",
  info: "#2E79B5",
  neutral: "#6B6B6B",
};

const canvasTypography = {
  h1: { fontSize: "24px", lineHeight: "30px", fontWeight: 590 },
  h2: { fontSize: "18px", lineHeight: "24px", fontWeight: 590 },
  h3: { fontSize: "16px", lineHeight: "22px", fontWeight: 590 },
  body: { fontSize: "14px", lineHeight: "20px", fontWeight: 400 },
  small: { fontSize: "12px", lineHeight: "16px", fontWeight: 400 },
};

const canvasSpacing = {
  "0.5": 2,
  "1": 4,
  "1.5": 6,
  "2": 8,
  "2.5": 10,
  "3": 12,
  "3.5": 14,
  "4": 16,
  "4.5": 18,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
};

const canvasRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  full: 9999,
};

function applyPrimaryColor(palette, primary) {
  if (!primary || typeof primary !== "string") return palette;
  return {
    ...palette,
    accent: primary,
    buttonBackground: primary,
    strokeFocused: primary,
    link: primary,
  };
}

function applyWorkbenchSurfaces(palette, surfaces = {}) {
  return {
    ...palette,
    editor: surfaces.editorBackground || palette.editor,
    foreground: surfaces.editorForeground || palette.foreground,
    elevated: surfaces.editorBackground || palette.elevated,
  };
}

function buildHostTokens(kind, overrides = {}) {
  const light = kind === "light" || kind === "hc-light";
  let palette = light ? { ...canvasPaletteLight } : { ...canvasPaletteDark };
  const category = light ? categoryPaletteLight : categoryPaletteDark;
  palette = applyWorkbenchSurfaces(palette, overrides);
  if (overrides.primary) palette = applyPrimaryColor(palette, overrides.primary);
  return { tokens: tokensFromPalette(palette, category), palette };
}

function hostTheme(kind = "light") {
  const { tokens, palette } = buildHostTokens(kind);
  return {
    kind,
    tokens,
    palette,
    ...tokens,
  };
}

module.exports = {
  chartPalette,
  chartColorSequence,
  categoryPaletteLight,
  categoryPaletteDark,
  usageColorSequence,
  canvasPaletteLight,
  canvasPaletteDark,
  canvasTokensLight,
  canvasTokens,
  colorPalette,
  TONE_COLORS,
  canvasTypography,
  canvasSpacing,
  canvasRadius,
  applyPrimaryColor,
  applyWorkbenchSurfaces,
  buildHostTokens,
  tokensFromPalette,
  hostTheme,
};
