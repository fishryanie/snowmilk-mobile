import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Coins, Plus, UsersRound } from "lucide-react-native";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import {
  Card,
  DetailRow,
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
import { AppButton } from "components/ui/button";
import { PageActionBar } from "components/ui/page-action-bar";
import { StatusChip } from "components/ui/status-chip";
import { Screen, LoadingCards } from "components/organisms/screen";
import { FontFamily, NumericFontVariant, PageLayout, Palette } from "themes";
import type { Employee, PayrollPeriod, Withdrawal } from "types/domain";
import { dateLabel, dayKey, idOf, money, number } from "utils/format";

export default function PayrollScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState(() => dayKey().slice(0, 7));
  const [mode, setMode] = useState<"allocation" | "employees">("allocation");
  const periods = useData<PayrollPeriod[]>("/api/payroll/periods");
  const employees = useData<Employee[]>("/api/payroll/employees");
  const withdrawals = useData<Withdrawal[]>(
    "/api/payroll/withdrawals?period=" + period,
  );
  const current = periods.data?.find((item) => item.period === period);
  const loading =
    periods.isLoading || employees.isLoading || withdrawals.isLoading;
  const refresh = () => {
    void periods.refetch();
    void employees.refetch();
    void withdrawals.refetch();
  };
  const paidIds = new Set(withdrawals.data?.map((item) => item.employeeId));
  const activeShare = (employees.data ?? [])
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + item.sharePercent, 0);

  return (
    <Screen
      refresh={refresh}
      refreshing={
        !loading &&
        (periods.isFetching || employees.isFetching || withdrawals.isFetching)
      }
      actions={
        <PageActionBar
          actions={[
            {
              label: "Thêm nhân sự",
              Icon: Plus,
              onPress: () => router.push("/editor?kind=employee"),
            },
          ]}
        />
      }
    >
      <PageHeading title="Tính lương">
        <CountBadge
          icon={
            <UsersRound
              size={15}
              strokeWidth={1.5}
              color={Palette.textSecondary}
            />
          }
        >
          {employees.data ? number(employees.data.length) : "—"} người
        </CountBadge>
      </PageHeading>
      <MonthPicker value={period} onChange={setPeriod} />
      <Segments
        value={mode}
        onChange={setMode}
        options={[
          { value: "allocation", label: "Phân chia & chi lương" },
          { value: "employees", label: "Nhân sự" },
        ]}
      />
      <InlineError
        message={
          periods.error?.message ||
          employees.error?.message ||
          withdrawals.error?.message
        }
        onRetry={refresh}
      />
      {loading ? (
        <LoadingCards />
      ) : mode === "employees" ? (
        <>
          <ThemedView row gap={10} wrap>
            <SummaryPill
              icon={
                <UsersRound
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
                Tỷ lệ đang hoạt động{" "}
                {employees.data ? number(activeShare) + "%" : "—"}
              </ThemedText>
            </SummaryPill>
          </ThemedView>
          <SectionTitle>Danh sách nhân sự</SectionTitle>
          <ThemedView gap={PageLayout.rowGap}>
            {(employees.data ?? []).map((employee) => (
              <Pressable
                key={idOf(employee)}
                accessibilityRole="button"
                accessibilityLabel={"Sửa nhân sự " + employee.name}
                onPress={() =>
                  router.push({
                    pathname: "/editor",
                    params: { kind: "employee", id: idOf(employee) },
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
                      fontSize={14}
                      lineHeight={20}
                      fontFamily={FontFamily.semibold}
                    >
                      {employee.name}
                    </ThemedText>
                    <ThemedText
                      selectable
                      fontSize={13}
                      lineHeight={20}
                      fontFamily={FontFamily.semibold}
                      fontVariant={NumericFontVariant}
                    >
                      {number(employee.sharePercent)}%
                    </ThemedText>
                  </ThemedView>
                  <ThemedView row gap={8}>
                    <ThemedText
                      flex={1}
                      fontSize={11}
                      lineHeight={16}
                      color={Palette.textSecondary}
                    >
                      {employee.role}
                    </ThemedText>
                    <ThemedText
                      fontSize={11}
                      lineHeight={16}
                      color={Palette.textSecondary}
                    >
                      {employee.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </ThemedText>
                  </ThemedView>
                </ThemedView>
              </Pressable>
            ))}
          </ThemedView>
          {employees.data?.length === 0 ? (
            <AppButton
              label="Thêm nhân sự đầu tiên"
              variant="ghost"
              onPress={() => router.push("/editor?kind=employee")}
            />
          ) : null}
        </>
      ) : current ? (
        <>
          <ThemedView row gap={10} wrap>
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
                Quỹ chia {money(current.distributablePool)}
              </ThemedText>
            </SummaryPill>
            <StatusChip
              label={current.isClosed ? "Đã chốt" : "Tạm tính"}
              tone={current.isClosed ? "success" : "warning"}
            />
          </ThemedView>
          <Card>
            <DetailRow
              label="Doanh thu tháng"
              value={money(current.periodRevenue)}
            />
            <DetailRow
              label="Chi phí tháng"
              value={money(current.periodCostTotal)}
            />
            <DetailRow
              label="Quỹ dự phòng"
              value={money(current.reserveFundsTotal)}
            />
            <DetailRow
              label="Đã phân bổ cho nhân sự"
              value={money(current.allocatedTotal)}
            />
            <ThemedText
              fontSize={11}
              color={Palette.textSecondary}
              lineHeight={18}
            >
              {current.isClosed
                ? "Kỳ đã được Snowmilk chốt. Mỗi người lãnh đúng phần đã phân bổ, một phiếu trong một kỳ."
                : "Tháng đang diễn ra. Số tiền sẽ thay đổi theo thu–chi; chi lương khả dụng sau khi Snowmilk chốt kỳ."}
            </ThemedText>
          </Card>
          <SectionTitle>Phần của từng người</SectionTitle>
          <ThemedView gap={PageLayout.rowGap}>
            {current.allocations.map((allocation) => (
              <Card key={allocation.employeeId}>
                <ThemedView rowCenter gap={8}>
                  <ThemedText
                    flex={1}
                    fontSize={14}
                    lineHeight={20}
                    fontFamily={FontFamily.semibold}
                  >
                    {allocation.employeeName}
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
                    {money(allocation.amount)}
                  </ThemedText>
                </ThemedView>
                <ThemedView row gap={8}>
                  <ThemedText
                    flex={1}
                    fontSize={11}
                    lineHeight={16}
                    color={Palette.textSecondary}
                  >
                    {allocation.role} · {number(allocation.sharePercent)}%
                  </ThemedText>
                  <ThemedText
                    fontSize={11}
                    lineHeight={16}
                    color={Palette.textSecondary}
                  >
                    {paidIds.has(allocation.employeeId)
                      ? "Đã lãnh"
                      : current.isClosed
                        ? "Chưa lãnh"
                        : "Tạm tính"}
                  </ThemedText>
                </ThemedView>
                {current.isClosed &&
                allocation.amount >= 1 &&
                !paidIds.has(allocation.employeeId) ? (
                  <AppButton
                    label="Ghi nhận chi lương"
                    variant="ghost"
                    onPress={() =>
                      router.push({
                        pathname: "/editor",
                        params: {
                          kind: "withdrawal",
                          employeeId: allocation.employeeId,
                          period,
                        },
                      })
                    }
                  />
                ) : null}
              </Card>
            ))}
          </ThemedView>
          {current.allocations.length === 0 ? (
            <ThemedText color={Palette.textSecondary} fontSize={12}>
              Chưa có nhân sự được phân bổ trong kỳ này.
            </ThemedText>
          ) : null}
          <SectionTitle>Lịch sử đã chi</SectionTitle>
          {withdrawals.data?.length ? (
            <ThemedView gap={PageLayout.rowGap}>
              {withdrawals.data.map((item) => (
                <Card key={idOf(item)}>
                  <ThemedView rowCenter gap={8}>
                    <ThemedText
                      flex={1}
                      fontSize={14}
                      fontFamily={FontFamily.semibold}
                    >
                      {item.employeeName}
                    </ThemedText>
                    <ThemedText
                      selectable
                      fontSize={13}
                      fontFamily={FontFamily.semibold}
                      fontVariant={NumericFontVariant}
                    >
                      {money(item.amount)}
                    </ThemedText>
                  </ThemedView>
                  <ThemedText fontSize={11} color={Palette.textSecondary}>
                    {dateLabel(item.withdrawalDate)}
                    {item.note ? " · " + item.note : ""}
                  </ThemedText>
                </Card>
              ))}
            </ThemedView>
          ) : (
            <ThemedText fontSize={12} color={Palette.textSecondary}>
              Chưa có phiếu chi lương trong kỳ này.
            </ThemedText>
          )}
        </>
      ) : (
        <ThemedView paddingVertical={30} gap={8} alignItems="center">
          <UsersRound
            size={27}
            strokeWidth={1.2}
            color={Palette.textTertiary}
          />
          <ThemedText
            color={Palette.textSecondary}
            fontSize={12}
            lineHeight={20}
            textAlign="center"
          >
            Chưa có kỳ lương này trong Snowmilk. Chọn tháng đã có dữ liệu hoặc
            thêm nhân sự.
          </ThemedText>
        </ThemedView>
      )}
    </Screen>
  );
}
