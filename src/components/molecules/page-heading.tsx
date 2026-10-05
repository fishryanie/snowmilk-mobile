import type { PropsWithChildren, ReactNode } from "react";
import { ThemedText, ThemedView } from "components/base";
import { FontFamily, PageLayout, Palette } from "themes";

export function PageHeading({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <ThemedView rowCenter gap={12}>
      <ThemedText
        accessibilityRole="header"
        flex={1}
        fontSize={PageLayout.titleSize}
        lineHeight={PageLayout.titleLineHeight}
        letterSpacing={PageLayout.titleLetterSpacing}
        fontFamily={FontFamily.bold}
      >
        {title}
      </ThemedText>
      {children}
    </ThemedView>
  );
}

export function CountBadge({
  icon,
  children,
}: PropsWithChildren<{ icon: ReactNode }>) {
  return (
    <ThemedView
      rowCenter
      gap={6}
      paddingHorizontal={12}
      paddingVertical={8}
      radius={20}
      backgroundColor={Palette.surfaceMuted}
    >
      {icon}
      <ThemedText fontSize={12} color={Palette.textSecondary}>
        {children}
      </ThemedText>
    </ThemedView>
  );
}

export function SummaryPill({
  icon,
  children,
}: PropsWithChildren<{ icon: ReactNode }>) {
  return (
    <ThemedView
      rowCenter
      gap={7}
      paddingHorizontal={13}
      paddingVertical={9}
      radius={22}
      backgroundColor={Palette.surfaceMuted}
    >
      {icon}
      {children}
    </ThemedView>
  );
}
