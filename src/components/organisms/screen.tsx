import type { PropsWithChildren, ReactNode } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText, ThemedView } from "components/base";
import { AppButton } from "components/ui/button";
import { EmptyState } from "components/ui/empty-state";
import { InlineError } from "components/molecules/common";
import { FloatingTabContentInset, FontFamily, Palette } from "themes";

const spacing = {
  paddingHorizontal: 20,
  paddingTop: 8,
  paddingBottom: FloatingTabContentInset,
  gap: 18,
};
export function Screen({
  children,
  refresh,
  refreshing = false,
  backgroundColor,
  contentWidth,
}: PropsWithChildren<{
  refresh?: () => void;
  refreshing?: boolean;
  backgroundColor?: string;
  contentWidth?: number;
}>) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor }}
      contentContainerStyle={[
        spacing,
        contentWidth
          ? { width: "100%", maxWidth: contentWidth, alignSelf: "center" }
          : undefined,
      ]}
      refreshControl={
        refresh ? (
          <RefreshControl
            tintColor={Palette.accent}
            refreshing={refreshing}
            onRefresh={refresh}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}
export function ListScreen<T>({
  items,
  keyOf,
  renderItem,
  header,
  loading,
  error,
  refresh,
  refreshing,
  empty = "Chưa có dữ liệu",
  emptyMessage = "Dùng nút + để thêm mới hoặc đổi bộ lọc.",
}: {
  items: T[];
  keyOf: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  header: ReactNode;
  loading: boolean;
  error?: string;
  refresh: () => void;
  refreshing: boolean;
  empty?: string;
  emptyMessage?: string;
}) {
  return (
    <FlatList
      data={loading ? [] : items}
      keyExtractor={keyOf}
      renderItem={({ item }) => (
        <ThemedView marginBottom={12}>{renderItem(item)}</ThemedView>
      )}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: FloatingTabContentInset,
      }}
      ListHeaderComponent={
        <ThemedView gap={18} paddingBottom={18}>
          {header}
          <InlineError message={error} onRetry={refresh} />
        </ThemedView>
      }
      ListEmptyComponent={
        loading ? (
          <LoadingCards />
        ) : error && items.length === 0 ? null : (
          <EmptyState title={empty} message={emptyMessage} />
        )
      }
      refreshControl={
        <RefreshControl
          tintColor={Palette.accent}
          refreshing={!loading && refreshing}
          onRefresh={refresh}
        />
      }
    />
  );
}
export function LoadingCards() {
  return (
    <ThemedView gap={14}>
      {[1, 2, 3].map((key) => (
        <ThemedView key={key} loading height={130} radius={21} />
      ))}
    </ThemedView>
  );
}
export function CloseEditorButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  return (
    <AppButton
      label="Đóng"
      variant="ghost"
      disabled={disabled}
      onPress={() => {
        if (router.canGoBack()) router.back();
        else router.replace("/(tabs)/dashboard");
      }}
    />
  );
}
export function FormScreen({
  children,
  title,
  saving,
  error,
  onSave,
  saveLabel = "Lưu",
  footer,
  saveDisabled,
  loadingLabel,
}: PropsWithChildren<{
  title: string;
  saving: boolean;
  error?: string;
  onSave: () => void;
  saveLabel?: string;
  footer?: ReactNode;
  saveDisabled?: boolean;
  loadingLabel?: string;
}>) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <BottomSheetModalProvider>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Palette.surfaceBase }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ThemedView
          rowCenter
          gap={12}
          paddingHorizontal={20}
          paddingVertical={12}
        >
          <ThemedText
            flex={1}
            fontSize={21}
            lineHeight={29}
            fontFamily={FontFamily.semibold}
          >
            {title}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng màn nhập liệu"
            accessibilityState={{ disabled: saving }}
            disabled={saving}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/(tabs)/dashboard");
            }}
            style={({ pressed }) => ({
              opacity: saving ? 0.4 : pressed ? 0.6 : 1,
            })}
          >
            <ThemedView
              square={44}
              contentCenter
              backgroundColor={Palette.surfaceMuted}
              round={44}
            >
              <X size={20} strokeWidth={1.6} color={Palette.textPrimary} />
            </ThemedView>
          </Pressable>
        </ThemedView>
        <ScrollView
          accessibilityLabel={title}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 24,
            gap: 18,
          }}
        >
          <ThemedView gap={18} pointerEvents={saving ? "none" : "auto"}>
            {children}
          </ThemedView>
          <ThemedView pointerEvents={saving ? "none" : "auto"}>
            {footer}
          </ThemedView>
        </ScrollView>
        <ThemedView
          paddingHorizontal={20}
          paddingTop={12}
          paddingBottom={Math.max(insets.bottom, 16)}
          gap={10}
          backgroundColor={Palette.surfaceBase}
        >
          <InlineError message={error} />
          <AppButton label={saveLabel} loading={saving} disabled={saveDisabled}
            loadingLabel={loadingLabel ?? "Đang lưu…"} onPress={onSave} />
        </ThemedView>
      </KeyboardAvoidingView>
    </BottomSheetModalProvider>
  );
}
