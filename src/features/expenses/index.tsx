import { useState } from "react";
import { useRouter } from "expo-router";
import { Receipt, ChevronRight } from "lucide-react-native";
import { Pressable } from "react-native";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import {
  Card,
  DetailRow,
  AddRecordButton,
  MonthPicker,
  Segments,
  Stat,
} from "components/molecules/common";
import { Field } from "components/molecules/form-field";
import { ListScreen } from "components/organisms/screen";
import { StatusChip } from "components/ui/status-chip";
import { FontFamily, Palette } from "themes";
import type { Expense } from "types/domain";
import {
  dateLabel,
  dayKey,
  fundingLabels,
  idOf,
  matches,
  money,
} from "utils/format";
export default function ExpensesScreen() {
  const router = useRouter();
  const query = useData<Expense[]>("/api/expenses?limit=500");
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState(() => dayKey().slice(0, 7));
  const [status, setStatus] = useState("all");
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
      items={items}
      keyOf={idOf}
      loading={query.isLoading}
      error={query.error?.message}
      refreshing={query.isFetching}
      refresh={() => {
        void query.refetch();
      }}
      header={
        <>
          <ThemedView rowCenter gap={12}>
            <ThemedView flex={1}>
              <MonthPicker value={period} onChange={setPeriod} />
            </ThemedView>
            <AddRecordButton
              onPress={() => router.push("/editor?kind=expense")}
              label="Thêm chi phí"
            />
          </ThemedView>
          <Card>
            <ThemedView row gap={16}>
              <Stat
                label="Đã trả trong danh sách"
                value={money(paid)}
                color={Palette.accent}
              />
              <Stat label="Chưa trả" value={money(unpaid)} color="#B54708" />
            </ThemedView>
          </Card>
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
        >
          <Card>
            <ThemedView rowCenter gap={12}>
              <ThemedView
                square={42}
                radius={14}
                contentCenter
                backgroundColor="#FFF3DF"
              >
                <Receipt color="#D48A40" size={21} />
              </ThemedView>
              <ThemedView flex={1} gap={4}>
                <ThemedText fontSize={15} fontFamily={FontFamily.semibold}>
                  {item.description || item.category}
                </ThemedText>
                <ThemedText fontSize={11} color={Palette.textTertiary}>
                  {dateLabel(item.expenseDate)} · {item.category}
                </ThemedText>
              </ThemedView>
              <ChevronRight size={18} color={Palette.textTertiary} />
            </ThemedView>
            <DetailRow
              label={
                item.accountingTreatment === "inventory_cost"
                  ? "Tính vào giá vốn kho"
                  : "Chi phí vận hành"
              }
              value={money(item.amount)}
            />
            <ThemedView row gap={6} wrap>
              <StatusChip
                label={item.paymentStatus === "unpaid" ? "Chưa trả" : "Đã trả"}
                tone={item.paymentStatus === "unpaid" ? "warning" : "success"}
              />
              <StatusChip
                label={
                  item.fundingSource
                    ? fundingLabels[item.fundingSource]
                    : "Chưa ghi nguồn tiền"
                }
                tone={item.fundingSource ? "muted" : "warning"}
              />
              {item.isRecurring ? <StatusChip label="Định kỳ" /> : null}
            </ThemedView>
          </Card>
        </Pressable>
      )}
    />
  );
}
