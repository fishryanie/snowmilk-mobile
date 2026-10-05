import { ThemedText, ThemedView } from "components/base";
import { FontFamily, Palette } from "themes";
const tones = {
  muted: [Palette.surfaceMuted, Palette.textSecondary],
  success: ["#E8F4EF", "#027A48"],
  warning: ["#FFF3DF", "#B54708"],
  danger: ["#FFF1F0", Palette.danger],
};
export function StatusChip({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: keyof typeof tones;
}) {
  const [backgroundColor, color] = tones[tone];
  return (
    <ThemedView
      alignSelf="flex-start"
      radius="pill"
      paddingHorizontal={10}
      paddingVertical={5}
      backgroundColor={backgroundColor}
    >
      <ThemedText fontFamily={FontFamily.semibold} fontSize={11} color={color}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}
