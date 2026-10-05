import { useData } from "api/hooks";
import { ThemedText } from "components/base";
import { Card, DetailRow, InlineError } from "components/molecules/common";
import { DateField } from "components/molecules/form-field";
import {
  ActiveField,
  required,
  useDraft,
  useEditorSave,
} from "components/organisms/editor-shared";
import { FormScreen, LoadingCards } from "components/organisms/screen";
import { Palette } from "themes";
import type { Employee, PayrollPeriod, Withdrawal } from "types/domain";
import { dayKey, idOf, money, monthLabel, number } from "utils/format";
import { isoDay, numeric } from "utils/finance";
export function EmployeeEditor({ record }: { record?: Employee }) {
  const {
    draft: d,
    set,
    field,
  } = useDraft({
    name: record?.name ?? "",
    role: record?.role ?? "",
    phone: record?.phone ?? "",
    email: record?.email ?? "",
    share: String(record?.sharePercent ?? ""),
    joined: record ? dayKey(new Date(record.joinedAt)) : dayKey(),
    active: String(record?.isActive ?? true),
  });
  const save = useEditorSave(
    "/api/payroll/employees",
    record ? idOf(record) : undefined,
  );
  return (
    <FormScreen
      title={record ? "Sửa nhân sự" : "Thêm nhân sự"}
      saving={save.saving}
      error={save.error}
      onSave={() =>
        save.save(() => ({
          name: required(d.name, "Tên nhân sự"),
          role: required(d.role, "Vai trò"),
          phone: d.phone,
          email: d.email.trim(),
          sharePercent: numeric(d.share, "Tỷ lệ phân chia", { positive: true }),
          joinedAt: isoDay(d.joined),
          isActive: d.active === "true",
        }))
      }
    >
      {field("name", "Tên nhân sự")}
      {field("role", "Vai trò")}
      {field("share", "Tỷ lệ phân chia (%)", true)}
      {field("phone", "Số điện thoại")}
      {field("email", "Email")}
      <DateField
        label="Ngày tham gia"
        value={d.joined}
        onChange={(value) => set("joined", value)}
      />
      <ActiveField
        value={d.active}
        onChange={(value) => set("active", value)}
      />
      <ThemedText fontSize={12} lineHeight={19} color={Palette.textSecondary}>
        Tổng tỷ lệ nhân sự đang hoạt động không vượt quá 100%. Kỳ đã chốt giữ
        nguyên phân bổ lịch sử.
      </ThemedText>
    </FormScreen>
  );
}
export function WithdrawalEditor({
  period,
  employeeId,
}: {
  period: string;
  employeeId: string;
}) {
  const query = useData<PayrollPeriod[]>("/api/payroll/periods");
  const paid = useData<Withdrawal[]>(
    "/api/payroll/withdrawals?period=" + period,
  );
  const current = query.data?.find((item) => item.period === period);
  const allocation = current?.allocations.find(
    (item) => item.employeeId === employeeId,
  );
  if (!query.data || !paid.data)
    return (
      <>
        <InlineError
          message={query.error?.message || paid.error?.message}
          onRetry={() => {
            void query.refetch();
            void paid.refetch();
          }}
        />
        {query.isLoading || paid.isLoading ? <LoadingCards /> : null}
      </>
    );
  if (
    !current?.isClosed ||
    !allocation ||
    allocation.amount < 1 ||
    paid.data.some((item) => item.employeeId === employeeId)
  )
    return (
      <Card>
        <ThemedText>
          Kỳ chưa chốt, không có khoản được lãnh hoặc đã có phiếu chi. Hãy quay
          lại và tải mới.
        </ThemedText>
      </Card>
    );
  return <WithdrawalForm period={period} allocation={allocation} />;
}
function WithdrawalForm({
  period,
  allocation,
}: {
  period: string;
  allocation: PayrollPeriod["allocations"][number];
}) {
  const { draft: d, set, field } = useDraft({ date: dayKey(), note: "" });
  const save = useEditorSave("/api/payroll/withdrawals");
  return (
    <FormScreen
      title="Ghi nhận chi lương"
      saving={save.saving}
      error={save.error}
      saveLabel="Xác nhận đã chi lương"
      onSave={() =>
        save.save(() => {
          if (d.date.slice(0, 7) <= period || d.date > dayKey())
            throw new Error("Ngày chi phải sau kỳ lương và không ở tương lai.");
          const amount = Math.round(allocation.amount);
          return {
            employeeId: allocation.employeeId,
            period,
            withdrawalDate: isoDay(d.date),
            amount,
            entitlementSnapshot: amount,
            note: d.note,
          };
        })
      }
    >
      <Card tinted>
        <DetailRow label="Nhân sự" value={allocation.employeeName} />
        <DetailRow label="Kỳ lương" value={monthLabel(period)} />
        <DetailRow
          label="Tỷ lệ đã chốt"
          value={number(allocation.sharePercent) + "%"}
        />
        <DetailRow
          label="Số tiền chi"
          value={money(Math.round(allocation.amount))}
        />
      </Card>
      <DateField
        label="Ngày chi lương"
        value={d.date}
        onChange={(value) => set("date", value)}
      />
      {field("note", "Ghi chú")}
      <ThemedText fontSize={12} color={Palette.textSecondary}>
        Xác nhận khi bạn đã thanh toán cho nhân sự. Snowmilk tạo một phiếu lương
        cho khoản đã chốt này.
      </ThemedText>
    </FormScreen>
  );
}
