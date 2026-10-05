import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import { Coins, Plus, Search, Wallet } from "lucide-react-native";
import { FlatList, Pressable } from "react-native";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import {
  MonthPicker,
  SectionTitle,
  Segments,
} from "components/molecules/common";
import { Field } from "components/molecules/form-field";
import {
  CountBadge,
  PageHeading,
  SummaryPill,
} from "components/molecules/page-heading";
import { ListScreen } from "components/organisms/screen";
import { AppButton } from "components/ui/button";
import { PageActionBar } from "components/ui/page-action-bar";
import { FontFamily, NumericFontVariant, PageLayout, Palette } from "themes";
import type { Expense } from "types/domain";
import {
  dateLabel,
  dayKey,
  fundingLabels,
  idOf,
  matches,
  money,
  number,
} from "utils/format";

export default function ExpensesScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList<Expense>>(null);
  const query = useData<Expense[]>("/api/expenses?limit=500");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState(() => dayKey().slice(0, 7));
  const [status, setStatus] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtered = Boolean(search.trim()) || status !== "all";
  const pending = query.data === undefined;
  const items = (query.data ?? [])
    .filter(
      (item) =>
        dayKey(new Date(item.expenseDate)).startsWith(period) &&
        (status === "all" || (item.paymentStatus ?? "paid") === status) &&
        matches(search, item.category, item.description, item.provider),
    )
    .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate));
  const paid = items
    .filter((item) => item.paymentStatus !== "unpaid")
    .reduce((sum, item) => sum + item.amount, 0);
  const unpaid = items
    .filter((item) => item.paymentStatus === "unpaid")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <ListScreen
      listRef={listRef}
      items={items}
      keyOf={idOf}
      loading={query.isLoading}
      error={query.error?.message}
      refreshing={query.isFetching}
      refresh={() => {
        void query.refetch();
      }}
      actions={
        <PageActionBar
          actions={[
            {
              label: "Tìm và lọc chi phí",
              Icon: Search,
              active: filtersOpen || filtered,
              expanded: filtersOpen,
              indicator: filtered,
              onPress: () => {
                setFiltersOpen((open) => !open);
                listRef.current?.scrollToOffset({ offset: 0, animated: true });
              },
            },
            {
              label: "Thêm chi phí",
              Icon: Plus,
              onPress: () => router.push("/editor?kind=expense"),
            },
          ]}
        />
      }
      header={
        <>
          <PageHeading title="Chi phí">
            <CountBadge
              icon={
                <Wallet
                  size={15}
                  strokeWidth={1.5}
                  color={Palette.textSecondary}
                />
              }
            >
              {pending ? "—" : number(items.length)} khoản
            </CountBadge>
          </PageHeading>
          <MonthPicker value={period} onChange={setPeriod} />
          <ThemedView
            row
            gap={10}
            wrap
            accessibilityLabel="Tổng chi phí trong danh sách"
          >
            <SummaryPill
              icon={
                <Coins
                  size={16}
                  strokeWidth={1.5}
                  color={Palette.textSecondary}
                />
              }
            >
              <ThemedText
                selectable
                fontSize={13}
                fontFamily={FontFamily.medium}
                fontVariant={NumericFontVariant}
              >
                Đã trả {pending ? "—" : money(paid)}
              </ThemedText>
            </SummaryPill>
            <SummaryPill
              icon={
                <Wallet size={16} strokeWidth={1.5} color={Palette.cashOut} />
              }
            >
              <ThemedText
                selectable
                fontSize={12}
                color={Palette.cashOut}
                fontVariant={NumericFontVariant}
              >
                Chưa trả {pending ? "—" : money(unpaid)}
              </ThemedText>
            </SummaryPill>
          </ThemedView>
          <SectionTitle>Khoản chi đã ghi</SectionTitle>
          {filtersOpen ? (
            <ThemedView
              gap={12}
              padding={16}
              radius={22}
              backgroundColor={Palette.surfaceMuted}
            >
              <Field
                label="Tìm nội dung, nhóm chi phí"
                value={search}
                onChange={setSearch}
              />
              <Segments
                value={status}
                onChange={setStatus}
                options={[
                  { value: "all", label: "Tất cả" },
                  { value: "paid", label: "Đã trả" },
                  { value: "unpaid", label: "Chưa trả" },
                ]}
              />
            </ThemedView>
          ) : null}
          {filtered ? (
            <AppButton
              label="Xóa bộ lọc"
              variant="ghost"
              onPress={() => {
                setSearch("");
                setStatus("all");
              }}
            />
          ) : null}
          {query.data?.length === 500 ? (
            <ThemedText fontSize={11} color={Palette.textSecondary}>
              Danh sách giới hạn 500 khoản chi theo API Snowmilk.
            </ThemedText>
          ) : null}
        </>
      }
      empty="Không có khoản chi phù hợp"
      renderItem={(item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"Chi phí " + item.description}
          onPress={() =>
            router.push({
              pathname: "/editor",
              params: { kind: "expense", id: idOf(item) },
            })
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
        >
          <ThemedView
            padding={PageLayout.rowPadding}
            radius={PageLayout.rowRadius}
            borderCurve="continuous"
            backgroundColor={Palette.surfaceMuted}
            gap={4}
          >
            <ThemedView rowCenter gap={8}>
              <ThemedText
                flex={1}
                minWidth={0}
                fontSize={14}
                lineHeight={20}
                fontFamily={FontFamily.semibold}
              >
                {item.description || item.category}
              </ThemedText>
              <ThemedText
                selectable
                maxWidth="45%"
                fontSize={13}
                lineHeight={20}
                textAlign="right"
                fontFamily={FontFamily.semibold}
                fontVariant={NumericFontVariant}
              >
                {money(item.amount)}
              </ThemedText>
            </ThemedView>
            <ThemedView row gap={8}>
              <ThemedText
                flex={1}
                fontSize={11}
                lineHeight={16}
                color={Palette.textSecondary}
              >
                {dateLabel(item.expenseDate)} · {item.category}
              </ThemedText>
              <ThemedText
                maxWidth="45%"
                fontSize={11}
                lineHeight={16}
                textAlign="right"
                color={
                  item.paymentStatus === "unpaid"
                    ? Palette.cashOut
                    : Palette.textSecondary
                }
              >
                {item.paymentStatus === "unpaid" ? "Chưa trả" : "Đã trả"}
              </ThemedText>
            </ThemedView>
            <ThemedText
              fontSize={11}
              lineHeight={16}
              color={Palette.textSecondary}
            >
              {item.accountingTreatment === "inventory_cost"
                ? "Giá vốn kho"
                : "Chi phí vận hành"}
              {" · "}
              {item.fundingSource
                ? fundingLabels[item.fundingSource]
                : "Chưa ghi nguồn tiền"}
              {item.isRecurring ? " · Định kỳ" : ""}
            </ThemedText>
          </ThemedView>
        </Pressable>
      )}
    />
  );
}
