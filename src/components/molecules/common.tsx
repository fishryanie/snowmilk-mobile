import type { PropsWithChildren, ReactNode } from "react";
import { Pressable } from "react-native";
import {
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCw,
} from "lucide-react-native";
import { ThemedText, ThemedView } from "components/base";
import { FontFamily, Palette } from "themes";
import { dayKey, monthLabel, shiftMonth } from "utils/format";

export function Card({
  children,
  tinted = false,
}: PropsWithChildren<{ tinted?: boolean }>) {
  return (
    <ThemedView
      backgroundColor={tinted ? Palette.accentSoft : Palette.surfaceMuted}
      radius={24}
      borderCurve="continuous"
      padding={18}
      gap={14}
    >
      {children}
    </ThemedView>
  );
}
export function SectionTitle({
  children,
  right,
}: PropsWithChildren<{ right?: ReactNode }>) {
  return (
    <ThemedView rowCenter justifyContent="space-between" gap={10}>
      <ThemedText flex={1} fontSize={16} fontFamily={FontFamily.semibold}>
        {children}
      </ThemedText>
      {right}
    </ThemedView>
  );
}
export function AddRecordButton({
  onPress,
  label = "Thêm",
}: {
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      <ThemedView round={46} contentCenter backgroundColor={Palette.accent}>
        <Plus color="white" size={24} />
      </ThemedView>
    </Pressable>
  );
}
export function MonthPicker({
  value,
  onChange,
  embedded = false,
}: {
  value: string;
  onChange: (value: string) => void;
  embedded?: boolean;
}) {
  const future = value >= dayKey().slice(0, 7);
  return (
    <ThemedView
      rowCenter
      justifyContent="space-between"
      radius={16}
      backgroundColor={embedded ? "transparent" : Palette.surfaceBase}
      borderWidth={embedded ? 0 : 1}
      borderColor={Palette.borderSubtle}
      padding={embedded ? 0 : 4}
    >
      <Pressable
        accessibilityLabel="Tháng trước"
        accessibilityRole="button"
        onPress={() => onChange(shiftMonth(value, -1))}
      >
        <ThemedView contentCenter square={44}>
          <ChevronLeft size={18} color={Palette.textPrimary} />
        </ThemedView>
      </Pressable>
      <ThemedText fontFamily={FontFamily.semibold} fontSize={14}>
        {monthLabel(value)}
      </ThemedText>
      <Pressable
        accessibilityLabel="Tháng sau"
        accessibilityRole="button"
        disabled={future}
        onPress={() => onChange(shiftMonth(value, 1))}
      >
        <ThemedView contentCenter square={44}>
          <ChevronRight
            size={18}
            color={future ? Palette.border : Palette.textPrimary}
          />
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
}
export function Segments<T extends string>({
  value,
  options,
  onChange,
  fullWidth = false,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  fullWidth?: boolean;
}) {
  return (
    <ThemedView
      row
      gap={fullWidth ? 4 : 6}
      wrap={!fullWidth}
      padding={fullWidth ? 4 : 0}
      radius={24}
      backgroundColor={fullWidth ? Palette.surfaceMuted : "transparent"}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="button"
          accessibilityState={{ selected: option.value === value }}
          onPress={() => onChange(option.value)}
          style={({ pressed }) => ({
            flex: fullWidth ? 1 : undefined,
            opacity: pressed ? 0.65 : 1,
          })}
        >
          <ThemedView
            radius={22}
            minHeight={44}
            contentCenter
            paddingHorizontal={14}
            paddingVertical={10}
            backgroundColor={
              fullWidth
                ? value === option.value
                  ? Palette.surfaceRaised
                  : "transparent"
                : value === option.value
                  ? Palette.accentSoft
                  : "transparent"
            }
          >
            <ThemedText
              color={
                value === option.value
                  ? Palette.accentPressed
                  : Palette.textSecondary
              }
              fontSize={12}
              fontFamily={FontFamily.medium}
            >
              {option.label}
            </ThemedText>
          </ThemedView>
        </Pressable>
      ))}
    </ThemedView>
  );
}
export function Stat({
  label,
  value,
  color = Palette.textPrimary,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <ThemedView flex={1} minWidth={100} gap={7}>
      <ThemedText fontSize={12} color={Palette.textSecondary}>
        {label}
      </ThemedText>
      <ThemedText
        selectable
        fontSize={20}
        fontFamily={FontFamily.bold}
        color={color}
        fontVariant={["tabular-nums"]}
      >
        {value}
      </ThemedText>
    </ThemedView>
  );
}
export function DetailRow({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <ThemedView row gap={12} justifyContent="space-between">
      <ThemedText flex={1} fontSize={13} color={Palette.textSecondary}>
        {label}
      </ThemedText>
      <ThemedText
        selectable
        flexShrink={1}
        textAlign="right"
        fontSize={13}
        fontFamily={FontFamily.semibold}
        color={color}
      >
        {value}
      </ThemedText>
    </ThemedView>
  );
}
export function InlineError({
  message,
  onRetry,
  retrying = false,
}: {
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  if (!message) return null;
  return (
    <ThemedView
      backgroundColor={Palette.surfaceRaised}
      radius={8}
      row
      alignItems="flex-start"
      gap={10}
      padding={12}
      borderLeftWidth={2}
      borderColor={Palette.danger}
      accessibilityLiveRegion="polite"
    >
      <ThemedView
        square={28}
        radius={9}
        contentCenter
        backgroundColor={Palette.dangerSurface}
      >
        <CircleAlert color={Palette.danger} size={16} />
      </ThemedView>
      <ThemedView flex={1} minWidth={0} gap={8}>
        <ThemedText
          selectable
          fontSize={12}
          fontFamily={FontFamily.regular}
          lineHeight={20}
          color={Palette.textSecondary}
        >
          {message}
        </ThemedText>
        {onRetry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử lại"
            accessibilityState={{ disabled: retrying, busy: retrying }}
            disabled={retrying}
            onPress={onRetry}
            style={{ alignSelf: "flex-start" }}
          >
            <ThemedView
              rowCenter
              gap={6}
              minHeight={36}
              opacity={retrying ? 0.5 : 1}
            >
              <RotateCw color={Palette.accent} size={14} />
              <ThemedText
                color={Palette.accent}
                fontSize={12}
                fontFamily={FontFamily.medium}
              >
                {retrying ? "Đang thử lại…" : "Thử lại"}
              </ThemedText>
            </ThemedView>
          </Pressable>
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}
