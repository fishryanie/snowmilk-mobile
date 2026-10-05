import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  WifiOff,
} from "lucide-react-native";
import { ApiError } from "api/client";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import { Screen } from "components/organisms/screen";
import {
  Card,
  InlineError,
  MonthPicker,
  SectionTitle,
  Segments,
} from "components/molecules/common";
import {
  CountBadge,
  PageHeading,
  SummaryPill,
} from "components/molecules/page-heading";
import { DateField } from "components/molecules/form-field";
import { AppButton } from "components/ui/button";
import { FontFamily, NumericFontVariant, Palette } from "themes";
import type { Dashboard } from "types/domain";
import { dayKey, money, monthRange, number } from "utils/format";
import { compareCashFlow } from "utils/finance";
import { RevenueChart } from "./revenue-chart";

export default function DashboardScreen() {
  const [period, setPeriod] = useState(() => dayKey().slice(0, 7));
  const [mode, setMode] = useState<"month" | "custom">("month");
  const [custom, setCustom] = useState(() => monthRange(period));
  const range = mode === "month" ? monthRange(period) : custom;
  const to =
    mode === "month" && period === dayKey().slice(0, 7) ? dayKey() : range.to;
  const invalidRange = range.from > to;
  const query = useData<Dashboard>(
    "/api/reports/dashboard?from=" + range.from + "&to=" + to,
    !invalidRange,
  );
  const data = invalidRange ? undefined : query.data;
  const flow = data
    ? compareCashFlow(
        data.kpis.cashIn,
        data.kpis.cashOut,
        data.kpis.estimatedProfit,
      )
    : null;
  const daysInRange = invalidRange
    ? 0
    : Math.round(
        (Date.parse(to + "T00:00:00Z") -
          Date.parse(range.from + "T00:00:00Z")) /
          86400000,
      ) + 1;
  const totalFlow = flow ? flow.cashIn + flow.cashOut : 0;
  const cashOutPercent =
    flow && totalFlow > 0 ? (flow.cashOut / totalFlow) * 100 : 0;
  const cashInPercent = totalFlow > 0 ? 100 - cashOutPercent : 0;
  const percentage = (value: number) =>
    totalFlow > 0
      ? value.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + "%"
      : "—";
  const retry = () => {
    void query.refetch();
  };

  return (
    <Screen
      refresh={retry}
      refreshing={query.isFetching && !query.isLoading}
      backgroundColor={Palette.surfaceBase}
    >
      <PageHeading title="Tổng quan">
        <CountBadge
          icon={
            <CalendarDays
              size={15}
              strokeWidth={1.5}
              color={Palette.textSecondary}
            />
          }
        >
          {number(daysInRange)} ngày
        </CountBadge>
      </PageHeading>
      <ThemedView gap={8}>
        <Segments
          value={mode}
          onChange={setMode}
          options={[
            { value: "month", label: "Theo tháng" },
            { value: "custom", label: "Khoảng ngày" },
          ]}
        />
        {mode === "month" ? (
          <MonthPicker embedded value={period} onChange={setPeriod} />
        ) : (
          <ThemedView row gap={10} padding={4}>
            <ThemedView flex={1}>
              <DateField
                label="Từ ngày"
                value={custom.from}
                onChange={(from) =>
                  setCustom((current) => ({ ...current, from }))
                }
              />
            </ThemedView>
            <ThemedView flex={1}>
              <DateField
                label="Đến ngày"
                value={custom.to}
                onChange={(end) =>
                  setCustom((current) => ({ ...current, to: end }))
                }
              />
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>
      <InlineError
        message={
          invalidRange
            ? "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc."
            : data
              ? query.error?.message
              : undefined
        }
        onRetry={invalidRange ? undefined : retry}
        retrying={query.isFetching}
      />
      {!invalidRange &&
        (data && flow ? (
          <>
            <ThemedView row gap={10} wrap>
              <SummaryPill
                icon={
                  <ArrowDownLeft
                    color={Palette.cashIn}
                    size={16}
                    strokeWidth={1.5}
                  />
                }
              >
                <ThemedText
                  selectable
                  fontSize={13}
                  fontFamily={FontFamily.medium}
                  fontVariant={NumericFontVariant}
                >
                  Tiền vào {money(flow.cashIn)}
                </ThemedText>
              </SummaryPill>
              <SummaryPill
                icon={
                  <ArrowUpRight
                    color={Palette.cashOut}
                    size={16}
                    strokeWidth={1.5}
                  />
                }
              >
                <ThemedText
                  selectable
                  fontSize={12}
                  color={Palette.textSecondary}
                  fontVariant={NumericFontVariant}
                >
                  Tiền ra {money(flow.cashOut)}
                </ThemedText>
              </SummaryPill>
            </ThemedView>
            <Card>
              <ThemedView gap={7}>
                <ThemedView rowCenter justifyContent="space-between" gap={8}>
                  <ThemedText fontSize={12} color={Palette.textSecondary}>
                    Dòng tiền thuần
                  </ThemedText>
                  <ThemedView rowCenter gap={5}>
                    <ThemedView
                      square={5}
                      round={5}
                      backgroundColor={
                        flow.difference >= 0 ? Palette.cashIn : Palette.cashOut
                      }
                    />
                    <ThemedText fontSize={11} color={Palette.textSecondary}>
                      {flow.difference > 0
                        ? "Thu nhiều hơn chi"
                        : flow.difference < 0
                          ? "Chi nhiều hơn thu"
                          : "Thu chi cân bằng"}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
                <ThemedText
                  selectable
                  fontSize={24}
                  letterSpacing={-0.7}
                  fontFamily={FontFamily.semibold}
                  fontVariant={NumericFontVariant}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {(flow.difference > 0 ? "+" : "") + money(flow.difference)}
                </ThemedText>
              </ThemedView>
              <ThemedView height={1} backgroundColor={Palette.borderSubtle} />
              <ThemedView rowCenter justifyContent="space-between" gap={12}>
                <ThemedView rowCenter gap={7} flex={1}>
                  <CalendarDays size={15} color={Palette.textTertiary} />
                  <ThemedText
                    fontSize={11}
                    color={Palette.textSecondary}
                    flex={1}
                  >
                    Chi bình quân / ngày
                  </ThemedText>
                </ThemedView>
                <ThemedText
                  selectable
                  fontSize={14}
                  fontFamily={FontFamily.semibold}
                  fontVariant={NumericFontVariant}
                >
                  {money(flow.cashOut / Math.max(daysInRange, 1))}
                </ThemedText>
              </ThemedView>
            </Card>
            <Card>
              <ThemedView gap={4}>
                <SectionTitle>Doanh thu theo ngày</SectionTitle>
                <ThemedText fontSize={11} color={Palette.textSecondary}>
                  Số tiền đã chốt trong kỳ
                </ThemedText>
              </ThemedView>
              <RevenueChart daily={data.daily} />
            </Card>
            <Card>
              <SectionTitle>Cơ cấu dòng tiền</SectionTitle>
              <ThemedView
                row
                height={10}
                radius={5}
                overflow="hidden"
                backgroundColor={Palette.borderSubtle}
                accessible
                accessibilityLabel={
                  "Tiền vào " +
                  percentage(cashInPercent) +
                  ", tiền ra " +
                  percentage(cashOutPercent)
                }
              >
                {totalFlow > 0 ? (
                  <>
                    <ThemedView
                      flex={flow.cashIn}
                      backgroundColor={Palette.cashIn}
                    />
                    <ThemedView
                      flex={flow.cashOut}
                      backgroundColor={Palette.cashOut}
                    />
                  </>
                ) : null}
              </ThemedView>
              <ThemedView row gap={20}>
                <FlowShare
                  label="Tiền vào"
                  amount={money(flow.cashIn)}
                  percentage={percentage(cashInPercent)}
                  color={Palette.cashIn}
                />
                <FlowShare
                  label="Tiền ra"
                  amount={money(flow.cashOut)}
                  percentage={percentage(cashOutPercent)}
                  color={Palette.cashOut}
                />
              </ThemedView>
            </Card>
          </>
        ) : query.error || query.fetchStatus === "paused" ? (
          <DashboardUnavailable
            error={query.error}
            retry={retry}
            retrying={query.isFetching}
          />
        ) : (
          <DashboardLoading />
        ))}
    </Screen>
  );
}

function FlowShare({
  label,
  amount,
  percentage,
  color,
}: {
  label: string;
  amount: string;
  percentage: string;
  color: string;
}) {
  return (
    <ThemedView flex={1} minWidth={0} gap={6}>
      <ThemedView rowCenter gap={6}>
        <ThemedView square={6} round={6} backgroundColor={color} />
        <ThemedText fontSize={11} color={Palette.textSecondary}>
          {label}
        </ThemedText>
      </ThemedView>
      <ThemedText
        selectable
        fontSize={22}
        fontFamily={FontFamily.semibold}
        fontVariant={NumericFontVariant}
      >
        {percentage}
      </ThemedText>
      <ThemedText selectable fontSize={11} color={Palette.textSecondary}>
        {amount}
      </ThemedText>
    </ThemedView>
  );
}

function DashboardUnavailable({
  error,
  retry,
  retrying,
}: {
  error: Error | null;
  retry: () => void;
  retrying: boolean;
}) {
  const networkFailure =
    !error || (error instanceof ApiError && error.status === 0);
  return (
    <ThemedView
      paddingVertical={30}
      gap={12}
      alignItems="center"
      accessibilityLiveRegion="polite"
    >
      <WifiOff size={27} strokeWidth={1.2} color={Palette.textTertiary} />
      <ThemedView gap={8} alignItems="center">
        <ThemedText
          fontSize={18}
          fontFamily={FontFamily.bold}
          textAlign="center"
        >
          {networkFailure
            ? "Chưa kết nối được với tiệm"
            : "Chưa tải được báo cáo"}
        </ThemedText>
        <ThemedText
          selectable
          fontSize={12}
          lineHeight={20}
          color={Palette.textSecondary}
          textAlign="center"
        >
          {networkFailure
            ? "Kiểm tra Wi-Fi và máy chủ Snowmilk,\nrồi thử lại để xem số liệu của tiệm."
            : error?.message}
        </ThemedText>
      </ThemedView>
      <ThemedView gap={4}>
        <AppButton
          label="Thử lại"
          variant="ghost"
          loading={retrying}
          onPress={retry}
        />
      </ThemedView>
    </ThemedView>
  );
}

function DashboardLoading() {
  return (
    <ThemedView gap={10} accessibilityLabel="Đang tải báo cáo">
      <ThemedView row gap={12}>
        <ThemedView flex={1} loading height={38} radius={22} />
        <ThemedView flex={1} loading height={38} radius={22} />
      </ThemedView>
      <ThemedView loading height={112} radius={12} />
      <ThemedView loading height={220} radius={12} />
    </ThemedView>
  );
}
