import { useRouter } from "expo-router";
import { Banknote, CreditCard, Plus, ReceiptText } from "lucide-react-native";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import { SectionTitle } from "components/molecules/common";
import {
  CountBadge,
  PageHeading,
  SummaryPill,
} from "components/molecules/page-heading";
import { ListScreen } from "components/organisms/screen";
import { PageActionBar } from "components/ui/page-action-bar";
import { FontFamily, NumericFontVariant, PageLayout, Palette } from "themes";
import type { DailySales } from "types/domain";
import { dateLabel, money, number } from "utils/format";

export default function SalesScreen() {
  const router = useRouter();
  const query = useData<DailySales>("/api/sales");
  const pending = query.data === undefined;
  const items = [...(query.data?.history ?? [])].sort((a, b) =>
    b.saleDate.localeCompare(a.saleDate),
  );
  const cash = items.reduce((sum, item) => sum + item.cashReceived, 0);
  const transfers = items.reduce(
    (sum, item) => sum + item.bankTransferReceived,
    0,
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
      actions={
        <PageActionBar
          actions={[
            {
              label: "Tạo ngày mới",
              Icon: Plus,
              onPress: () => router.push("/editor?kind=sale"),
            },
          ]}
        />
      }
      empty="Chưa có ngày chốt doanh thu"
      emptyMessage="Bấm nút + để nhập tiền mặt và tiền chuyển khoản cho ngày mới."
      header={
        <>
          <PageHeading title="Doanh thu">
            <CountBadge
              icon={
                <ReceiptText
                  size={15}
                  strokeWidth={1.5}
                  color={Palette.textSecondary}
                />
              }
            >
              {pending ? "—" : number(items.length)} ngày
            </CountBadge>
          </PageHeading>
          <ThemedView
            row
            gap={10}
            wrap
            accessibilityLabel="Tổng doanh thu trong danh sách"
          >
            <SummaryPill
              icon={
                <Banknote
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
                Tiền mặt {pending ? "—" : money(cash)}
              </ThemedText>
            </SummaryPill>
            <SummaryPill
              icon={
                <CreditCard
                  size={16}
                  strokeWidth={1.5}
                  color={Palette.textSecondary}
                />
              }
            >
              <ThemedText
                selectable
                fontSize={12}
                color={Palette.textSecondary}
                fontVariant={NumericFontVariant}
              >
                Chuyển khoản {pending ? "—" : money(transfers)}
              </ThemedText>
            </SummaryPill>
          </ThemedView>
          <SectionTitle>Ngày đã chốt</SectionTitle>
          {items.length === 250 ? (
            <ThemedText fontSize={11} color={Palette.textSecondary}>
              Hiển thị 250 ngày chốt gần nhất. Tổng chỉ tính các ngày trong danh
              sách.
            </ThemedText>
          ) : null}
        </>
      }
      renderItem={(item) => (
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
              fontSize={14}
              lineHeight={20}
              fontFamily={FontFamily.semibold}
            >
              {dateLabel(item.saleDate)}
            </ThemedText>
            <ThemedText
              selectable
              maxWidth="45%"
              textAlign="right"
              fontSize={13}
              lineHeight={20}
              fontFamily={FontFamily.semibold}
              fontVariant={NumericFontVariant}
            >
              {money(item.cashReceived + item.bankTransferReceived)}
            </ThemedText>
          </ThemedView>
          <ThemedView row gap={8}>
            <ThemedText
              selectable
              flex={1}
              fontSize={11}
              lineHeight={16}
              color={Palette.textSecondary}
            >
              Tiền mặt {money(item.cashReceived)}
            </ThemedText>
            <ThemedText
              selectable
              flex={1}
              textAlign="right"
              fontSize={11}
              lineHeight={16}
              color={Palette.textSecondary}
            >
              Chuyển khoản {money(item.bankTransferReceived)}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      )}
    />
  );
}
