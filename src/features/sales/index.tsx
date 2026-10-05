import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import { Card, DetailRow } from "components/molecules/common";
import { ListScreen } from "components/organisms/screen";
import { AppButton } from "components/ui/button";
import { FontFamily, Palette } from "themes";
import type { DailySales } from "types/domain";
import { dateLabel, money } from "utils/format";

export default function SalesScreen() {
  const router = useRouter();
  const query = useData<DailySales>("/api/sales");
  const items = [...(query.data?.history ?? [])].sort((a, b) =>
    b.saleDate.localeCompare(a.saleDate),
  );
  return (
    <ListScreen
      items={items}
      keyOf={(item) => item.saleDate}
      loading={!query.data && !query.error}
      error={query.error?.message}
      refreshing={query.isFetching}
      refresh={() => {
        void query.refetch();
      }}
      empty="Chưa có ngày chốt doanh thu"
      emptyMessage="Bấm Tạo ngày mới để nhập tiền mặt và tiền chuyển khoản."
      header={
        <>
          <AppButton
            label="Tạo ngày mới"
            icon={<Plus size={20} color="white" />}
            onPress={() => router.push("/editor?kind=sale")}
          />
          {items.length === 250 ? (
            <ThemedText fontSize={12} color={Palette.textSecondary}>
              Hiển thị 250 ngày chốt gần nhất.
            </ThemedText>
          ) : null}
        </>
      }
      renderItem={(item) => (
        <Card>
          <ThemedView row justifyContent="space-between" gap={12} wrap>
            <ThemedText fontSize={16} fontFamily={FontFamily.semibold}>
              {dateLabel(item.saleDate)}
            </ThemedText>
            <ThemedText
              selectable
              fontSize={17}
              fontFamily={FontFamily.bold}
              color={Palette.accent}
            >
              {money(item.cashReceived + item.bankTransferReceived)}
            </ThemedText>
          </ThemedView>
          <DetailRow label="Tiền mặt" value={money(item.cashReceived)} />
          <DetailRow
            label="Chuyển khoản"
            value={money(item.bankTransferReceived)}
          />
        </Card>
      )}
    />
  );
}
