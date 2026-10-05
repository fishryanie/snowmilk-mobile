import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { Search, X } from "lucide-react-native";
import { useCallback, useEffect, memo, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  TextInput,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText, ThemedView } from "components/base";
import { FontFamily, FormControl, Palette } from "themes";
import { fs, mhs, mvs, rmvs } from "themes/scaling";

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
};

const snapPoints = ["50%", "100%"];
// RN Web lacks the native focus API used by Gorhom's keyboard integration.
const SheetSearchInput =
  Platform.OS === "web" ? TextInput : BottomSheetTextInput;
const normalizeSearch = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

export function SelectSheet({
  label,
  value,
  options,
  visible,
  onChange,
  onClose,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  visible: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<BottomSheetModal>(null);
  const isPresentedRef = useRef(false);
  const [search, setSearch] = useState("");
  const insets = useSafeAreaInsets();
  const filtered = useMemo(() => {
    const query = normalizeSearch(search);
    return options.filter((option) =>
      normalizeSearch(`${option.label} ${option.description ?? ""}`).includes(
        query,
      ),
    );
  }, [options, search]);

  // CMS lifecycle: present after mounting, finalize visibility only onDismiss.
  useEffect(() => {
    if (visible) {
      const frame = requestAnimationFrame(() => {
        isPresentedRef.current = true;
        ref.current?.present();
      });
      return () => cancelAnimationFrame(frame);
    }
    if (isPresentedRef.current) ref.current?.dismiss();
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        ref.current?.dismiss();
        return true;
      },
    );
    return () => subscription.remove();
  }, [visible]);

  const handleDismiss = useCallback(() => {
    if (!isPresentedRef.current) return;
    isPresentedRef.current = false;
    setSearch("");
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    [],
  );

  const selectOption = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
      ref.current?.dismiss();
    },
    [onChange],
  );
  const renderOption = useCallback(
    ({ item }: ListRenderItemInfo<SelectOption>) => (
      <SelectOptionRow
        item={item}
        selected={item.value === value}
        onSelect={selectOption}
      />
    ),
    [value, selectOption],
  );

  return (
    <BottomSheetModal
      ref={ref}
      accessible={false}
      accessibilityRole="none"
      index={0}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      // FormScreen's local portal already sits below the status-bar safe area.
      topInset={0}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      enableBlurKeyboardOnGesture
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundStyle={{
        backgroundColor: Palette.surfaceSheet,
        borderRadius: mhs(28),
      }}
      handleIndicatorStyle={{ backgroundColor: Palette.border, width: mhs(36) }}
      onDismiss={handleDismiss}
    >
      <ThemedView
        paddingHorizontal={20}
        paddingTop={4}
        paddingBottom={12}
        gap={14}
      >
        <ThemedView rowCenter gap={12}>
          <ThemedText
            flex={1}
            fontSize={19}
            lineHeight={26}
            fontFamily={FontFamily.semibold}
          >
            Chọn {label.toLocaleLowerCase("vi")}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng danh sách"
            onPress={() => ref.current?.dismiss()}
            style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
          >
            <ThemedView square={44} contentCenter>
              <ThemedView
                square={28}
                round={28}
                backgroundColor={Palette.accentSoft}
                contentCenter
              >
                <X size={16} color={Palette.textSecondary} />
              </ThemedView>
            </ThemedView>
          </Pressable>
        </ThemedView>
        <ThemedView
          rowCenter
          gap={10}
          height={rmvs(FormControl.height)}
          paddingHorizontal={FormControl.paddingHorizontal}
          radius={FormControl.radius}
          borderCurve="continuous"
          backgroundColor={Palette.surfaceRaised}
        >
          <Search
            size={FormControl.iconSize}
            color={Palette.textTertiary}
            strokeWidth={1.6}
          />
          <SheetSearchInput
            accessibilityLabel={`Tìm ${label.toLocaleLowerCase("vi")}`}
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm trong danh sách…"
            placeholderTextColor={Palette.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={Palette.accent}
            style={{
              flex: 1,
              minWidth: 0,
              height: "100%",
              color: Palette.textPrimary,
              fontFamily: FontFamily.regular,
              fontSize: fs(FormControl.fontSize),
              lineHeight: fs(FormControl.lineHeight),
              includeFontPadding: false,
              paddingHorizontal: 0,
              paddingVertical: 0,
              textAlignVertical: "center",
            }}
          />
        </ThemedView>
      </ThemedView>
      <BottomSheetFlatList<SelectOption>
        data={filtered}
        extraData={value}
        keyExtractor={(option) => option.value}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: mhs(20),
          paddingBottom: insets.bottom + mvs(24),
        }}
        renderItem={renderOption}
        ListEmptyComponent={
          <ThemedView
            paddingVertical={32}
            alignItems="center"
            gap={8}
            accessibilityLiveRegion="polite"
          >
            <ThemedText fontSize={15} fontFamily={FontFamily.medium}>
              {search.trim() ? "Không tìm thấy lựa chọn" : "Chưa có lựa chọn"}
            </ThemedText>
            <ThemedText
              fontSize={13}
              color={Palette.textSecondary}
              textAlign="center"
            >
              {search.trim()
                ? "Thử từ khóa khác để tìm trong danh sách."
                : "Danh sách hiện chưa có dữ liệu."}
            </ThemedText>
          </ThemedView>
        }
      />
    </BottomSheetModal>
  );
}

const SelectOptionRow = memo(function SelectOptionRow({
  item,
  selected,
  onSelect,
}: {
  item: SelectOption;
  selected: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={[item.label, item.description]
        .filter(Boolean)
        .join(", ")}
      onPress={() => onSelect(item.value)}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <ThemedView
        rowCenter
        gap={12}
        paddingVertical={14}
        minHeight={68}
        borderBottomWidth={0.5}
        borderColor={Palette.borderSubtle}
      >
        <ThemedView
          square={40}
          round={40}
          backgroundColor={Palette.accentSoft}
          contentCenter
        >
          <ThemedText
            fontSize={12}
            fontFamily={FontFamily.medium}
            color={Palette.textSecondary}
          >
            {item.label
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((word) => word[0])
              .join("")
              .toLocaleUpperCase("vi")}
          </ThemedText>
        </ThemedView>
        <ThemedView flex={1} minWidth={0} gap={4}>
          <ThemedText
            fontSize={15}
            lineHeight={22}
            fontFamily={FontFamily.medium}
          >
            {item.label}
          </ThemedText>
          {item.description ? (
            <ThemedText
              fontSize={12}
              lineHeight={18}
              color={Palette.textSecondary}
            >
              {item.description}
            </ThemedText>
          ) : null}
        </ThemedView>
        <ThemedView
          square={22}
          round={22}
          contentCenter
          borderWidth={selected ? 1.5 : 1}
          borderColor={selected ? Palette.accent : Palette.border}
        >
          {selected ? (
            <ThemedView
              square={14}
              round={14}
              backgroundColor={Palette.accent}
            />
          ) : null}
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
});
