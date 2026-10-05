import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Camera,
  Check,
  Plus,
  Search,
  X,
  ReceiptText,
} from "lucide-react-native";
import {
  FlatList,
  Pressable,
  RefreshControl,
  type ListRenderItemInfo,
} from "react-native";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import { InlineError, Segments } from "components/molecules/common";
import { Field } from "components/molecules/form-field";
import { AppButton } from "components/ui/button";
import { CountBadge, PageHeading } from "components/molecules/page-heading";
import { PageActionBar, type PageAction } from "components/ui/page-action-bar";
import { FontFamily, NumericFontVariant, PageLayout, Palette } from "themes";
import type { Purchase } from "types/domain";
import {
  dateLabel,
  dayKey,
  fundingLabels,
  idOf,
  money,
  number,
} from "utils/format";
import {
  purchaseListPath,
  purchasesForDay,
  purchaseTotals,
} from "utils/purchases";
import { DaySelector } from "./day-selector";
import { PurchaseSummary } from "./purchase-summary";

const CATEGORIES = ["all", "Nguyên liệu", "Topping", "Bao bì", "Khác"].map(
  (value) => ({
    value,
    label: value === "all" ? "Tất cả" : value,
  }),
);

function PurchaseCheckbox({
  item,
  checked,
  onToggle,
}: {
  item: Purchase;
  checked: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`Chọn phiếu nhập ${item.itemName}`}
      accessibilityState={{ checked }}
      onPress={() => onToggle(idOf(item))}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <ThemedView square={44} contentCenter>
        <ThemedView
          square={20}
          radius={6}
          contentCenter
          borderWidth={1.5}
          borderColor={checked ? Palette.accent : Palette.textTertiary}
          backgroundColor={checked ? Palette.accent : Palette.surfaceRaised}
        >
          {checked ? (
            <Check size={14} strokeWidth={2.4} color={Palette.onAccent} />
          ) : null}
        </ThemedView>
      </ThemedView>
    </Pressable>
  );
}

const PurchaseRow = memo(function PurchaseRow({
  item,
  checked,
  onToggle,
  onOpen,
}: {
  item: Purchase;
  checked: boolean;
  onToggle: (id: string) => void;
  onOpen: (item: Purchase) => void;
}) {
  const outsourced = (item.sterilizationOutsourcedLiters ?? 0) > 0;
  const funding = item.fundingSource
    ? fundingLabels[item.fundingSource]
    : "Chưa ghi nguồn tiền";
  const sterilization = outsourced
    ? `Tiệt trùng ${number(item.sterilizationOutsourcedLiters ?? 0)} lít · ${item.sterilizationPaymentStatus === "paid" ? "Đã trả" : "Chưa trả"}`
    : "";
  return (
    <ThemedView
      paddingHorizontal={PageLayout.rowPadding}
      paddingVertical={6}
      row
      alignItems="center"
      gap={4}
      minHeight={56}
      radius={PageLayout.rowRadius}
      borderCurve="continuous"
      backgroundColor={Palette.surfaceMuted}
    >
      <PurchaseCheckbox item={item} checked={checked} onToggle={onToggle} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sửa lần nhập ${item.itemName}, ${number(item.packageCount)} ${item.purchaseUnit || "gói"}, quy đổi ${number(item.convertedQuantity)} ${item.costUnit}, ${money(item.totalAmount)}, ${item.category}, ${funding}${sterilization ? `, ${sterilization}` : ""}`}
        onPress={() => onOpen(item)}
        style={({ pressed }) => ({
          flex: 1,
          alignSelf: "stretch",
          justifyContent: "center",
          opacity: pressed ? 0.55 : 1,
        })}
      >
        <ThemedView minWidth={0} gap={2}>
          <ThemedView rowCenter gap={8}>
            <ThemedText
              flex={1}
              minWidth={0}
              numberOfLines={1}
              fontFamily={FontFamily.semibold}
              fontSize={14}
              lineHeight={20}
            >
              {item.itemName}
            </ThemedText>
            <ThemedText
              selectable
              maxWidth="45%"
              flexShrink={0}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              fontFamily={FontFamily.semibold}
              fontSize={13}
              lineHeight={20}
              fontVariant={NumericFontVariant}
              textAlign="right"
            >
              {money(item.totalAmount)}
            </ThemedText>
          </ThemedView>
          <ThemedView rowCenter gap={8}>
            <ThemedText
              selectable
              flex={1}
              minWidth={0}
              numberOfLines={1}
              fontFamily={FontFamily.regular}
              fontSize={11}
              lineHeight={16}
              fontVariant={NumericFontVariant}
              color={Palette.textSecondary}
            >
              {number(item.packageCount)} {item.purchaseUnit || "gói"} ·{" "}
              {number(item.convertedQuantity)} {item.costUnit}
            </ThemedText>
            <ThemedText
              maxWidth="45%"
              numberOfLines={1}
              fontFamily={FontFamily.regular}
              fontSize={11}
              lineHeight={16}
              textAlign="right"
              color={
                item.fundingSource ? Palette.textSecondary : Palette.cashOut
              }
            >
              {funding}
            </ThemedText>
          </ThemedView>
          {outsourced ? (
            <ThemedText
              fontSize={11}
              lineHeight={16}
              color={
                item.sterilizationPaymentStatus === "paid"
                  ? Palette.textSecondary
                  : Palette.cashOut
              }
            >
              {sterilization}
            </ThemedText>
          ) : null}
        </ThemedView>
      </Pressable>
    </ThemedView>
  );
});

function PurchaseSeparator() {
  return <ThemedView height={PageLayout.rowGap} />;
}

function PurchaseActionBar({
  filtersOpen,
  filtered,
  onSearch,
  onCamera,
  onAdd,
}: {
  filtersOpen: boolean;
  filtered: boolean;
  onSearch: () => void;
  onCamera: () => void;
  onAdd: () => void;
}) {
  const actions: PageAction[] = [
    {
      label: "Tìm và lọc hàng đã nhập",
      Icon: Search,
      onPress: onSearch,
      active: filtersOpen || filtered,
      expanded: filtersOpen,
      indicator: filtered,
    },
    { label: "Chụp bill để nhập hàng", Icon: Camera, onPress: onCamera },
    { label: "Thêm lần nhập hàng", Icon: Plus, onPress: onAdd },
  ];

  return <PageActionBar actions={actions} />;
}

function PurchaseEmpty({
  pending,
  failed,
  offline,
  filtered,
  date,
  onAdd,
  onClear,
}: {
  pending: boolean;
  failed: boolean;
  offline: boolean;
  filtered: boolean;
  date: string;
  onAdd: () => void;
  onClear: () => void;
}) {
  if (pending && failed) return null;
  if (pending && offline)
    return (
      <ThemedView paddingVertical={32} gap={8}>
        <ThemedText fontFamily={FontFamily.semibold} fontSize={15}>
          Đang chờ kết nối mạng
        </ThemedText>
        <ThemedText
          fontFamily={FontFamily.regular}
          fontSize={12}
          lineHeight={20}
          color={Palette.textSecondary}
        >
          Có mạng trở lại, danh sách nhập hàng sẽ tự tải.
        </ThemedText>
      </ThemedView>
    );
  if (pending)
    return (
      <ThemedView gap={20} paddingTop={20}>
        {[1, 2, 3].map((key) => (
          <ThemedView key={key} gap={9}>
            <ThemedView rowCenter justifyContent="space-between" gap={24}>
              <ThemedView loading height={18} width="48%" radius={4} />
              <ThemedView loading height={18} width="27%" radius={4} />
            </ThemedView>
            <ThemedView loading height={12} width="40%" radius={3} />
            <ThemedView
              borderTopWidth={1}
              borderColor={Palette.borderSubtle}
              marginTop={14}
            />
          </ThemedView>
        ))}
      </ThemedView>
    );
  return (
    <ThemedView gap={12} paddingVertical={30} alignItems="center">
      <ReceiptText color={Palette.textTertiary} size={27} strokeWidth={1.2} />
      <ThemedText
        fontFamily={FontFamily.display}
        fontSize={25}
        textAlign="center"
      >
        {filtered ? "Không có món phù hợp" : "Sổ ngày này còn trống"}
      </ThemedText>
      <ThemedText
        fontFamily={FontFamily.regular}
        color={Palette.textSecondary}
        fontSize={12}
        lineHeight={20}
        textAlign="center"
        maxWidth={270}
      >
        {filtered
          ? "Thử tìm từ khác hoặc xóa bộ lọc để xem các món đã nhập."
          : `Chưa có phiếu nhập ngày ${dateLabel(date)}. Chọn ngày khác hoặc ghi lần nhập đầu tiên.`}
      </ThemedText>
      <AppButton
        label={filtered ? "Xóa bộ lọc" : "Thêm lần nhập hàng"}
        variant="ghost"
        onPress={filtered ? onClear : onAdd}
      />
    </ThemedView>
  );
}

export default function PurchasesScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Purchase>>(null);
  const params = useLocalSearchParams<{ date?: string; receiptId?: string }>();
  const [selection, setSelection] = useState(() => ({
    date: dayKey(),
    receiptId: "",
  }));
  if (
    params.receiptId &&
    params.receiptId !== selection.receiptId &&
    params.date &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.date)
  ) {
    setSelection({ date: params.date, receiptId: params.receiptId });
  }
  const date = selection.date;
  const setDate = (value: string) =>
    setSelection((current) => ({ ...current, date: value }));
  const query = useData<Purchase[]>(purchaseListPath(date));
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState(() => new Set<string>());
  const togglePurchase = useCallback((id: string) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const filtered = Boolean(search.trim()) || category !== "all";
  const items = useMemo(
    () => purchasesForDay(query.data ?? [], date, search, category),
    [query.data, date, search, category],
  );
  const totals = useMemo(() => purchaseTotals(items), [items]);
  const refresh = () => {
    void query.refetch();
  };
  const add = () =>
    router.push({ pathname: "/editor", params: { kind: "purchase", date } });
  const toggleFilters = () => {
    setFiltersOpen((open) => !open);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };
  const clearFilters = () => {
    setSearch("");
    setCategory("all");
  };
  const pending = query.data === undefined;
  const openPurchase = useCallback(
    (item: Purchase) => {
      router.push({
        pathname: "/editor",
        params: { kind: "purchase", id: idOf(item), date },
      });
    },
    [router, date],
  );
  const renderPurchase = useCallback(
    ({ item }: ListRenderItemInfo<Purchase>) => (
      <PurchaseRow
        item={item}
        checked={checkedIds.has(idOf(item))}
        onToggle={togglePurchase}
        onOpen={openPurchase}
      />
    ),
    [checkedIds, togglePurchase, openPurchase],
  );

  return (
    <ThemedView flex={1} backgroundColor={Palette.surfaceBase}>
      <FlatList
        ref={listRef}
        data={pending ? [] : items}
        extraData={checkedIds}
        keyExtractor={idOf}
        renderItem={renderPurchase}
        ItemSeparatorComponent={PurchaseSeparator}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: Palette.surfaceBase }}
        contentContainerStyle={{
          width: "100%",
          maxWidth: PageLayout.maxWidth,
          alignSelf: "center",
          paddingHorizontal: PageLayout.paddingHorizontal,
          paddingTop: PageLayout.paddingTop,
          paddingBottom: PageLayout.actionContentInset,
        }}
        refreshControl={
          <RefreshControl
            tintColor={Palette.accent}
            refreshing={!query.isLoading && query.isFetching}
            onRefresh={refresh}
          />
        }
        ListHeaderComponent={
          <ThemedView gap={10} paddingBottom={8}>
            <PageHeading title="Nhập hàng">
              <CountBadge
                icon={
                  <ReceiptText
                    size={15}
                    strokeWidth={1.5}
                    color={Palette.textSecondary}
                  />
                }
              >
                {pending ? "—" : number(items.length)} phiếu
              </CountBadge>
            </PageHeading>
            <DaySelector value={date} onChange={setDate} />
            <PurchaseSummary
              amount={totals.amount}
              quantity={totals.quantity}
              count={items.length}
              pending={pending}
              filtered={filtered}
            />
            <InlineError
              message={query.error?.message}
              onRetry={refresh}
              retrying={query.isFetching}
            />
            <ThemedText
              fontSize={12}
              fontFamily={FontFamily.medium}
              color={Palette.textSecondary}
            >
              Hàng đã nhập
            </ThemedText>
            {filtersOpen ? (
              <ThemedView
                gap={12}
                padding={16}
                radius={22}
                backgroundColor={Palette.surfaceMuted}
              >
                <Field
                  label="Tìm hàng, mã hoặc nhà cung cấp"
                  value={search}
                  onChange={setSearch}
                />
                <Segments
                  value={category}
                  onChange={setCategory}
                  options={CATEGORIES}
                />
              </ThemedView>
            ) : null}
            {filtered ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xóa bộ lọc"
                onPress={clearFilters}
              >
                <ThemedView rowCenter gap={6} paddingBottom={8} minHeight={36}>
                  <X size={14} color={Palette.accent} />
                  <ThemedText fontSize={12} color={Palette.accent}>
                    {category === "all" ? "Tất cả nhóm" : category}
                    {search.trim() ? ` · “${search.trim()}”` : ""} · Xóa lọc
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ) : null}
            {query.data?.length === 500 ? (
              <ThemedText
                fontSize={11}
                color={Palette.cashOut}
                paddingBottom={8}
              >
                Ngày này đạt giới hạn 500 phiếu; danh sách và tổng chỉ tính các
                phiếu đã tải.
              </ThemedText>
            ) : null}
          </ThemedView>
        }
        ListEmptyComponent={
          <PurchaseEmpty
            pending={pending}
            failed={Boolean(query.error)}
            offline={query.fetchStatus === "paused"}
            filtered={filtered}
            date={date}
            onAdd={add}
            onClear={clearFilters}
          />
        }
        ListFooterComponent={
          !pending && items.length > 0 ? (
            <ThemedView rowCenter gap={12} paddingTop={24}>
              <ThemedView
                flex={1}
                height={1}
                backgroundColor={Palette.borderSubtle}
              />
              <ThemedText
                fontFamily={FontFamily.regular}
                fontSize={10}
                color={Palette.textTertiary}
              >
                Đã xem hết {number(items.length)} phiếu
              </ThemedText>
              <ThemedView
                flex={1}
                height={1}
                backgroundColor={Palette.borderSubtle}
              />
            </ThemedView>
          ) : null
        }
      />
      <PurchaseActionBar
        filtersOpen={filtersOpen}
        filtered={filtered}
        onSearch={toggleFilters}
        onCamera={() =>
          router.push({ pathname: "/editor", params: { kind: "receipt" } })
        }
        onAdd={add}
      />
    </ThemedView>
  );
}
