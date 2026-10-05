import { ThemedText } from "components/base";
import { FontFamily, FormControl, Palette } from "themes";

export function FormControlLabel({ children }: { children: string }) {
  return (
    <ThemedText
      color={Palette.textSecondary}
      fontFamily={FontFamily.medium}
      fontSize={FormControl.labelFontSize}
      lineHeight={FormControl.labelLineHeight}
    >
      {children}
    </ThemedText>
  );
}
