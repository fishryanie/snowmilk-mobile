export const Palette = {
  accent: "#232321",
  accentPressed: "#111110",
  accentSoft: "#EAE7E4",
  accentBorder: "#D9D5D1",
  accentGradient: ["#232321", "#232321"] as const,
  cashIn: "#3D7255",
  cashInSurface: "#EDF0EC",
  cashOut: "#A45E44",
  cashOutSurface: "#F3ECE7",
  border: "#DCD8D4",
  borderSubtle: "#E9E5E1",
  danger: "#AF4439",
  dangerSurface: "#F8E8E1",
  surfaceBase: "#FAF8F6",
  surfaceMuted: "#F1EEEB",
  surfaceRaised: "#FFFFFF",
  surfaceSheet: "#F5F3F1",
  antiFlashWhite: "#F1EEEB",
  textPrimary: "#232321",
  textSecondary: "#77736F",
  textTertiary: "#96918D",
  onAccent: "#FFFFFF",
  navigation: "#1E1E1C",
  navigationSelected: "#383835",
  navigationInactive: "#BCB9B5",
} as const;

export const Colors = {
  light: {
    text: Palette.textPrimary,
    background: Palette.surfaceBase,
    backgroundElement: Palette.surfaceMuted,
    backgroundSelected: Palette.accentSoft,
    textSecondary: Palette.textSecondary,
  },
  dark: {
    text: "#ffffff",
    background: "#000000",
    backgroundElement: "#212225",
    backgroundSelected: "#2E3135",
    textSecondary: "#B0B4BA",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
