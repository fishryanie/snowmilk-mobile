import {
  useDraft,
  useEditorSave,
  required,
  FundingField,
  DeleteAction,
} from "components/organisms/editor-shared";
import { FormScreen } from "components/organisms/screen";
import { DateField, SelectField } from "components/molecules/form-field";
import { Card, DetailRow } from "components/molecules/common";
import { ThemedText } from "components/base";
import type { Expense } from "types/domain";
import { dayKey, idOf, money } from "utils/format";
import { isoDay, numeric } from "utils/finance";
export function ExpenseEditor({ record }: { record?: Expense }) {
  const {
    draft: d,
    set,
    field,
  } = useDraft({
    date: record ? dayKey(new Date(record.expenseDate)) : dayKey(),
    category: record?.category ?? "Điện",
    description: record?.description ?? "",
    amount: String(record?.amount ?? ""),
    status: record?.paymentStatus ?? (record ? "paid" : "unpaid"),
    funding:
      record?.fundingSource ?? (record ? "owner_capital" : "sales_revenue"),
    treatment: record?.accountingTreatment ?? "operating_expense",
    recurring: String(record?.isRecurring ?? false),
    liters: String(record?.milkLiters ?? ""),
    unitPrice: String(record?.milkUnitPrice ?? 5000),
    provider: record?.provider ?? "",
    note: record?.note ?? "",
  });
  const save = useEditorSave(
    "/api/expenses",
    record ? idOf(record) : undefined,
  );
  const milk = d.category === "Tiệt trùng sữa";
  const linked =
    record?.sourceType === "purchase_sterilization" &&
    Boolean(record.sourcePurchaseId);
  const categories = [
    ...new Set([
      "Điện",
      "Nước",
      "Mặt bằng",
      "Vận chuyển",
      "Marketing",
      "Sửa chữa",
      "Tiệt trùng sữa",
      "Khác",
      d.category,
    ]),
  ];
  return (
    <FormScreen
      title={record ? "Sửa khoản chi" : "Ghi khoản chi mới"}
      saving={save.saving}
      error={save.error}
      onSave={() =>
        save.save(() => ({
          expenseDate: isoDay(d.date),
          category: d.category,
          description: milk ? "" : required(d.description, "Nội dung"),
          amount: milk
            ? numeric(d.liters, "Số lít", { positive: true }) *
              numeric(d.unitPrice, "Đơn giá", { positive: true })
            : numeric(d.amount, "Số tiền", { integer: true }),
          ...(milk
            ? {
                milkLiters: numeric(d.liters, "Số lít", { positive: true }),
                milkUnitPrice: numeric(d.unitPrice, "Đơn giá", {
                  positive: true,
                }),
              }
            : {}),
          provider: d.provider,
          paymentStatus: d.status,
          fundingSource: d.funding,
          accountingTreatment: d.treatment,
          isRecurring: d.recurring === "true",
          note: d.note,
        }))
      }
      footer={
        record && !linked ? (
          <DeleteAction
            path={"/api/expenses/" + idOf(record)}
            label="khoản chi này"
          />
        ) : undefined
      }
    >
      <DateField
        label="Ngày ghi chi phí"
        value={d.date}
        onChange={(value) => set("date", value)}
      />
      {linked ? (
        <Card>
          <ThemedText fontSize={13} lineHeight={20}>
            Khoản tiệt trùng được tạo từ phiếu nhập sữa. Sửa số lít, đơn giá
            hoặc xóa khoản này tại Nhập hàng.
          </ThemedText>
          <DetailRow label="Nội dung" value={record.description} />
          <DetailRow label="Số tiền" value={money(record.amount)} />
        </Card>
      ) : (
        <>
          <SelectField
            label="Nhóm chi phí"
            value={d.category}
            onChange={(value) => set("category", value)}
            options={categories.map((value) => ({ value, label: value }))}
          />
          {milk ? (
            <>
              {field("liters", "Số lít sữa", true)}
              {field("unitPrice", "Đơn giá / lít (đồng)", true)}
              {field("provider", "Đơn vị tiệt trùng")}
              <Card>
                <DetailRow
                  label="Tổng phí tiệt trùng"
                  value={money(
                    (Number(d.liters.replace(",", ".")) || 0) *
                      (Number(d.unitPrice) || 0),
                  )}
                />
              </Card>
            </>
          ) : (
            <>
              {field("description", "Nội dung chi phí")}
              {field("amount", "Số tiền (đồng)", true)}
            </>
          )}
        </>
      )}
      <SelectField
        label="Thanh toán"
        value={d.status}
        onChange={(value) => set("status", value)}
        options={
          linked && record.paymentId
            ? [{ value: "paid", label: "Đã trả trong lần thanh toán" }]
            : [
                { value: "unpaid", label: "Chưa trả" },
                { value: "paid", label: "Đã trả" },
              ]
        }
      />
      <FundingField
        value={d.funding}
        onChange={(value) => set("funding", value)}
      />
      {!linked ? (
        <>
          <SelectField
            label="Cách hạch toán"
            value={d.treatment}
            onChange={(value) => set("treatment", value)}
            options={[
              { value: "operating_expense", label: "Chi phí vận hành" },
              { value: "inventory_cost", label: "Tính vào giá vốn kho" },
            ]}
          />
          <SelectField
            label="Khoản chi định kỳ"
            value={d.recurring}
            onChange={(value) => set("recurring", value)}
            options={[
              { value: "false", label: "Không" },
              { value: "true", label: "Có" },
            ]}
          />
        </>
      ) : null}
      {field("note", "Ghi chú")}
    </FormScreen>
  );
}
