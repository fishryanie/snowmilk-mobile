import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { ChevronRight, UserRound, Plus } from "lucide-react-native";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import {
  Card,
  DetailRow,
  InlineError,
  AddRecordButton,
  MonthPicker,
  SectionTitle,
  Segments,
  Stat,
} from "components/molecules/common";
import { AppButton } from "components/ui/button";
import { StatusChip } from "components/ui/status-chip";
import { Screen, LoadingCards } from "components/organisms/screen";
import { FontFamily, Palette } from "themes";
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
  return (
    <Screen
      refresh={refresh}
      refreshing={
        !loading &&
        (periods.isFetching || employees.isFetching || withdrawals.isFetching)
      }
    >
      <ThemedView rowCenter gap={12}>
        <ThemedView flex={1}>
          <MonthPicker value={period} onChange={setPeriod} />
        </ThemedView>
        <AddRecordButton
          onPress={() => router.push("/editor?kind=employee")}
          label="Thêm nhân sự"
        />
      </ThemedView>
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
          <Card>
            <Stat
              label="Tổng tỷ lệ nhân sự đang hoạt động"
              value={
                number(
                  (employees.data ?? [])
                    .filter((item) => item.isActive)
                    .reduce((sum, item) => sum + item.sharePercent, 0),
                ) + "%"
              }
            />
          </Card>
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
            >
              <Card>
                <ThemedView rowCenter gap={12}>
                  <ThemedView
                    round={42}
                    contentCenter
                    backgroundColor={Palette.accentSoft}
                  >
                    <UserRound color={Palette.accent} size={21} />
                  </ThemedView>
                  <ThemedView flex={1} gap={4}>
                    <ThemedText fontSize={16} fontFamily={FontFamily.semibold}>
                      {employee.name}
                    </ThemedText>
                    <ThemedText fontSize={12} color={Palette.textSecondary}>
                      {employee.role}
                    </ThemedText>
                  </ThemedView>
                  <ChevronRight color={Palette.textTertiary} size={18} />
                </ThemedView>
                <DetailRow
                  label="Tỷ lệ phân chia"
                  value={number(employee.sharePercent) + "%"}
                />
                <StatusChip
                  label={
                    employee.isActive ? "Đang hoạt động" : "Ngừng hoạt động"
                  }
                  tone={employee.isActive ? "success" : "muted"}
                />
              </Card>
            </Pressable>
          ))}
          {employees.data?.length === 0 ? (
            <AppButton
              icon={<Plus size={18} color="white" />}
              label="Thêm nhân sự đầu tiên"
              onPress={() => router.push("/editor?kind=employee")}
            />
          ) : null}
        </>
      ) : current ? (
        <>
          <Card tinted>
            <SectionTitle
              right={
                <StatusChip
                  label={current.isClosed ? "Đã chốt" : "Tạm tính"}
                  tone={current.isClosed ? "success" : "warning"}
                />
              }
            >
              Quỹ phân chia
            </SectionTitle>
            <Stat
              label="Số tiền có thể phân chia"
              value={money(current.distributablePool)}
              color={Palette.accent}
            />
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
              fontSize={12}
              color={Palette.textSecondary}
              lineHeight={19}
            >
              {current.isClosed
                ? "Kỳ đã được Snowmilk chốt. Mỗi người lãnh đúng phần đã phân bổ, một phiếu trong một kỳ."
                : "Tháng đang diễn ra. Số tiền sẽ thay đổi theo thu–chi; chi lương khả dụng sau khi Snowmilk chốt kỳ."}
            </ThemedText>
          </Card>
          <SectionTitle>Phần của từng người</SectionTitle>
          {current.allocations.map((allocation) => (
            <Card key={allocation.employeeId}>
              <ThemedView rowCenter gap={12}>
                <ThemedView
                  round={40}
                  contentCenter
                  backgroundColor={Palette.surfaceMuted}
                >
                  <UserRound color={Palette.textSecondary} size={20} />
                </ThemedView>
                <ThemedView flex={1} gap={5}>
                  <ThemedText fontSize={15} fontFamily={FontFamily.semibold}>
                    {allocation.employeeName}
                  </ThemedText>
                  <ThemedText fontSize={12} color={Palette.textSecondary}>
                    {allocation.role} · {number(allocation.sharePercent)}%
                  </ThemedText>
                </ThemedView>
                <StatusChip
                  label={
                    paidIds.has(allocation.employeeId)
                      ? "Đã lãnh"
                      : current.isClosed
                        ? "Chưa lãnh"
                        : "Tạm tính"
                  }
                  tone={
                    paidIds.has(allocation.employeeId) ? "success" : "muted"
                  }
                />
              </ThemedView>
              <ThemedText
                selectable
                fontSize={24}
                fontFamily={FontFamily.bold}
                color={Palette.accent}
              >
                {money(allocation.amount)}
              </ThemedText>
              {current.isClosed &&
              allocation.amount >= 1 &&
              !paidIds.has(allocation.employeeId) ? (
                <AppButton
                  label="Ghi nhận chi lương"
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
          {current.allocations.length === 0 ? (
            <ThemedText color={Palette.textSecondary} fontSize={13}>
              Chưa có nhân sự được phân bổ trong kỳ này.
            </ThemedText>
          ) : null}
          <SectionTitle>Lịch sử đã chi</SectionTitle>
          {withdrawals.data?.length ? (
            withdrawals.data.map((item) => (
              <Card key={idOf(item)}>
                <DetailRow
                  label={item.employeeName}
                  value={money(item.amount)}
                />
                <ThemedText fontSize={12} color={Palette.textSecondary}>
                  {dateLabel(item.withdrawalDate)}
                  {item.note ? " · " + item.note : ""}
                </ThemedText>
              </Card>
            ))
          ) : (
            <ThemedText fontSize={13} color={Palette.textSecondary}>
              Chưa có phiếu chi lương trong kỳ này.
            </ThemedText>
          )}
        </>
      ) : (
        <Card>
          <ThemedText color={Palette.textSecondary} fontSize={14}>
            Chưa có kỳ lương này trong Snowmilk. Chọn tháng đã có dữ liệu hoặc
            thêm nhân sự.
          </ThemedText>
        </Card>
      )}
    </Screen>
  );
}
