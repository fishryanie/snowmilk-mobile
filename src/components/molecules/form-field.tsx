import { useCallback, useRef, useState } from "react";
import { Keyboard, Pressable } from "react-native";
import { CalendarDays, ChevronDown } from "lucide-react-native";
import { ThemedText, ThemedView } from "components/base";
import { DatePicker, type DatePickerMethods } from "components/base/DatePicker";
import FloatingTextInput from "components/ui/FloatingTextInput";
import { FormControlLabel } from "components/ui/form-control-label";
import { FontFamily, FormControl, Palette } from "themes";
import { rmvs } from "themes/scaling";
import { dateLabel, dayKey } from "utils/format";
import { SelectSheet, type SelectOption } from "./select-sheet";

export function Field({
  label,
  value,
  onChange,
  numeric = false,
  password = false,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
  password?: boolean;
  multiline?: boolean;
}) {
  return (
    <FloatingTextInput
      accessibilityLabel={label}
      autoCapitalize={password ? "none" : "sentences"}
      isPassword={password}
      keyboardType={numeric ? "decimal-pad" : "default"}
      label={label}
      value={value}
      onChangeText={onChange}
      multiline={multiline}
    />
  );
}
export function DateField({
  label,
  value,
  onChange,
  maxDate,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxDate?: string;
}) {
  const ref = useRef<DatePickerMethods>(null);
  return (
    <ThemedView gap={FormControl.gap}>
      <FormControlLabel>{label}</FormControlLabel>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${dateLabel(value)}`}
        onPress={() => ref.current?.open()}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <ThemedView
          rowCenter
          justifyContent="space-between"
          height={rmvs(FormControl.height)}
          radius={FormControl.radius}
          borderCurve="continuous"
          backgroundColor={Palette.surfaceRaised}
          paddingHorizontal={FormControl.paddingHorizontal}
          gap={12}
        >
          <ThemedText
            flex={1}
            minWidth={0}
            numberOfLines={1}
            fontFamily={FontFamily.regular}
            fontSize={FormControl.fontSize}
            lineHeight={FormControl.lineHeight}
          >
            {dateLabel(value)}
          </ThemedText>
          <CalendarDays color={Palette.accent} size={FormControl.iconSize} />
        </ThemedView>
      </Pressable>
      <DatePicker
        ref={ref}
        value={value}
        maxDate={maxDate}
        onChange={(seconds) => onChange(dayKey(new Date(seconds * 1000)))}
      />
    </ThemedView>
  );
}
export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const close = useCallback(() => setOpen(false), []);
  return (
    <ThemedView gap={FormControl.gap}>
      <FormControlLabel>{label}</FormControlLabel>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selected?.label ?? "chưa chọn"}`}
        accessibilityState={{ expanded: open }}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        <ThemedView
          height={rmvs(FormControl.height)}
          radius={FormControl.radius}
          borderCurve="continuous"
          paddingHorizontal={FormControl.paddingHorizontal}
          backgroundColor={Palette.surfaceRaised}
          rowCenter
          gap={12}
        >
          <ThemedText
            flex={1}
            minWidth={0}
            numberOfLines={1}
            fontFamily={FontFamily.regular}
            fontSize={FormControl.fontSize}
            lineHeight={FormControl.lineHeight}
            color={selected ? Palette.textPrimary : Palette.textTertiary}
          >
            {selected?.label ?? "Chọn " + label.toLocaleLowerCase("vi")}
          </ThemedText>
          <ChevronDown
            color={Palette.textSecondary}
            size={FormControl.iconSize}
            strokeWidth={1.6}
          />
        </ThemedView>
      </Pressable>
      {selected?.description ? (
        <ThemedText
          fontFamily={FontFamily.regular}
          fontSize={FormControl.labelFontSize}
          lineHeight={FormControl.labelLineHeight}
          color={Palette.textSecondary}
        >
          {selected.description}
        </ThemedText>
      ) : null}
      <SelectSheet
        label={label}
        value={value}
        options={options}
        visible={open}
        onChange={onChange}
        onClose={close}
      />
    </ThemedView>
  );
}
