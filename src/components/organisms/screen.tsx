import type { PropsWithChildren, ReactNode, Ref } from "react";
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
import { FontFamily, PageLayout, Palette } from "themes";

const spacing = {
  width: "100%" as const,
  maxWidth: PageLayout.maxWidth,
  alignSelf: "center" as const,
  paddingHorizontal: PageLayout.paddingHorizontal,
  paddingTop: PageLayout.paddingTop,
  paddingBottom: PageLayout.paddingBottom,
  gap: PageLayout.gap,
};
export function Screen({
  children,
  refresh,
  refreshing = false,
  backgroundColor = Palette.surfaceBase,
  contentWidth = PageLayout.maxWidth,
  actions,
}: PropsWithChildren<{
  refresh?: () => void;
  refreshing?: boolean;
  backgroundColor?: string;
  contentWidth?: number;
  actions?: ReactNode;
}>) {
  return (
    <ThemedView flex={1} backgroundColor={backgroundColor}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={[
          spacing,
          { maxWidth: contentWidth },
          actions
            ? { paddingBottom: PageLayout.actionContentInset }
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
      {actions}
    </ThemedView>
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
  actions,
  listRef,
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
  actions?: ReactNode;
  listRef?: Ref<FlatList<T>>;
}) {
  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <FlatList
        ref={listRef}
        data={loading ? [] : items}
        keyExtractor={keyOf}
        renderItem={({ item }) => (
          <ThemedView marginBottom={PageLayout.rowGap}>
            {renderItem(item)}
          </ThemedView>
        )}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: Palette.surfaceBase }}
        contentContainerStyle={{
          ...spacing,
          gap: 0,
          paddingBottom: actions
            ? PageLayout.actionContentInset
            : PageLayout.paddingBottom,
        }}
        ListHeaderComponent={
          <ThemedView gap={PageLayout.gap} paddingBottom={8}>
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
      {actions}
    </ThemedView>
  );
}
export function LoadingCards() {
  return (
    <ThemedView gap={PageLayout.rowGap}>
      {[1, 2, 3].map((key) => (
        <ThemedView
          key={key}
          loading
          height={64}
          radius={PageLayout.rowRadius}
        />
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
          width="100%"
          maxWidth={PageLayout.maxWidth}
          alignSelf="center"
          rowCenter
          gap={12}
          paddingHorizontal={20}
          paddingVertical={12}
        >
          <ThemedText
            flex={1}
            fontSize={PageLayout.titleSize}
            lineHeight={PageLayout.titleLineHeight}
            letterSpacing={PageLayout.titleLetterSpacing}
            fontFamily={FontFamily.bold}
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
          contentContainerStyle={spacing}
        >
          <ThemedView
            gap={PageLayout.gap}
            pointerEvents={saving ? "none" : "auto"}
          >
            {children}
          </ThemedView>
          <ThemedView pointerEvents={saving ? "none" : "auto"}>
            {footer}
          </ThemedView>
        </ScrollView>
        <ThemedView
          width="100%"
          maxWidth={PageLayout.maxWidth}
          alignSelf="center"
          paddingHorizontal={20}
          paddingTop={12}
          paddingBottom={Math.max(insets.bottom, 16)}
          gap={10}
          backgroundColor={Palette.surfaceBase}
        >
          <InlineError message={error} />
          <AppButton
            label={saveLabel}
            loading={saving}
            disabled={saveDisabled}
            loadingLabel={loadingLabel ?? "Đang lưu…"}
            onPress={onSave}
          />
        </ThemedView>
      </KeyboardAvoidingView>
    </BottomSheetModalProvider>
  );
}
