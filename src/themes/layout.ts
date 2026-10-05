import { Platform } from "react-native";
import { mhs, vs } from "themes/scaling";

export const Spacing = {
  half: mhs(2),
  one: mhs(4),
  two: mhs(8),
  three: mhs(12),
  four: mhs(16),
  five: mhs(24),
  six: mhs(32),
  seven: mhs(40),
  eight: mhs(64),
} as const;

export const Radius = {
  small: mhs(12),
  medium: mhs(16),
  large: mhs(24),
  pill: 999,
} as const;

export const FormControl = {
  // Keep controls at 45 layout points; labels and helper text sit outside.
  height: 45,
  radius: 12,
  paddingHorizontal: 12,
  multilinePaddingVertical: 10,
  gap: 6,
  fontSize: 14,
  lineHeight: 20,
  labelFontSize: 12,
  labelLineHeight: 16,
  iconSize: 18,
} as const;

// Shared page rhythm, taken from the Nhập hàng screen.
export const PageLayout = {
  maxWidth: 600,
  paddingHorizontal: 20,
  paddingTop: 8,
  paddingBottom: 24,
  gap: 10,
  rowGap: 4,
  rowRadius: 12,
  rowPadding: 12,
  titleSize: 30,
  titleLineHeight: 39,
  titleLetterSpacing: -1.1,
  actionBottom: 20,
  actionContentInset: 100,
} as const;

export const BottomTabInset = vs(
  Platform.select({ ios: 50, android: 80 }) ?? 0,
);
