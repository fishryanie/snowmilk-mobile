import { useRef, useState } from "react";
import {
  Pressable,
  TextInput,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { Eye, EyeOff, CircleX } from "lucide-react-native";
import { ThemedText, ThemedView } from "components/base";
import { FontFamily, FormControl, Palette } from "themes";
import { fs, mhs, mvs, rmvs } from "themes/scaling";
import { FormControlLabel } from "./form-control-label";

type FloatingTextInputProps = Omit<TextInputProps, "style"> & {
  accentColor?: string;
  error?: string;
  isMoney?: boolean;
  isPassword?: boolean;
  label: string;
  labelBackgroundColor?: string;
  onClear?: () => void;
  style?: ViewStyle;
};

const moneyFormatter = new Intl.NumberFormat("en-US");

export default function FloatingTextInput({
  accentColor = Palette.accent,
  error,
  isMoney,
  isPassword,
  label,
  labelBackgroundColor = Palette.surfaceRaised,
  onBlur,
  onFocus,
  onClear,
  style,
  value,
  ...inputProps
}: FloatingTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const showAccessory = Boolean(value) && (isPassword || Boolean(onClear));

  return (
    <ThemedView gap={FormControl.gap} style={style}>
      <FormControlLabel>{label}</FormControlLabel>
      <ThemedView
        rowCenter
        height={rmvs(FormControl.height)}
        radius={FormControl.radius}
        borderCurve="continuous"
        backgroundColor={labelBackgroundColor}
        borderWidth={1}
        borderColor={
          error
            ? Palette.danger
            : isFocused
              ? Palette.accentBorder
              : "transparent"
        }
      >
        <TextInput
          {...inputProps}
          ref={inputRef}
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          keyboardType={isMoney ? "numeric" : inputProps.keyboardType}
          onChangeText={(text) => {
            if (isMoney) {
              const digits = text.replace(/[^0-9]/g, "");
              inputProps.onChangeText?.(
                digits ? moneyFormatter.format(Number(digits)) : "",
              );
            } else inputProps.onChangeText?.(text);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholder={
            inputProps.placeholder ?? `Nhập ${label.toLocaleLowerCase("vi")}…`
          }
          placeholderTextColor={Palette.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          selectionColor={accentColor}
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            color: Palette.textPrimary,
            fontFamily: FontFamily.regular,
            fontSize: fs(FormControl.fontSize),
            lineHeight: fs(FormControl.lineHeight),
            includeFontPadding: false,
            paddingHorizontal: mhs(FormControl.paddingHorizontal),
            paddingVertical: inputProps.multiline
              ? mvs(FormControl.multilinePaddingVertical)
              : 0,
            textAlignVertical: inputProps.multiline ? "top" : "center",
          }}
          value={value}
        />
        {showAccessory ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isPassword
                ? showPassword
                  ? "Ẩn mật khẩu"
                  : "Hiện mật khẩu"
                : `Xóa ${label.toLocaleLowerCase("vi")}`
            }
            onPress={() => {
              if (isPassword) setShowPassword((current) => !current);
              else onClear?.();
            }}
            style={({ pressed }) => ({
              alignItems: "center",
              justifyContent: "center",
              width: FormControl.height,
              height: "100%",
              opacity: pressed ? 0.55 : 1,
            })}
          >
            {isPassword ? (
              showPassword ? (
                <Eye color={Palette.textTertiary} size={FormControl.iconSize} />
              ) : (
                <EyeOff color={Palette.textTertiary} size={FormControl.iconSize} />
              )
            ) : (
              <CircleX color={Palette.textTertiary} size={FormControl.iconSize} />
            )}
          </Pressable>
        ) : null}
      </ThemedView>
      {error ? (
        <ThemedText
          selectable
          color={Palette.danger}
          fontSize={12}
          lineHeight={18}
          accessibilityLiveRegion="polite"
        >
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}
