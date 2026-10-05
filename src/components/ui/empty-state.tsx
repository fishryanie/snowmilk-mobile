import { ThemedText, ThemedView } from "components/base";
import { Inbox } from "lucide-react-native";

import { FontFamily, Palette } from "themes";

export function EmptyState({
  message,
  title,
}: {
  message?: string;
  title: string;
}) {
  return (
    <ThemedView alignItems="center" gap={12} paddingVertical={30}>
      <Inbox size={27} strokeWidth={1.2} color={Palette.textTertiary} />
      <ThemedText
        color={Palette.textPrimary}
        fontFamily={FontFamily.display}
        fontSize={25}
        textAlign="center"
      >
        {title}
      </ThemedText>
      {message ? (
        <ThemedText
          color={Palette.textSecondary}
          fontFamily={FontFamily.regular}
          fontSize={12}
          lineHeight={20}
          textAlign="center"
          maxWidth={270}
        >
          {message}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}
