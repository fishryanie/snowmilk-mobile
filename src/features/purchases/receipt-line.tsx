import { ThemedText, ThemedView } from "components/base";
import { Card, DetailRow } from "components/molecules/common";
import { Field, SelectField } from "components/molecules/form-field";
import { AppButton } from "components/ui/button";
import type { Ingredient } from "types/domain";
import type { ReceiptDraftLine } from "types/receipt";
import { FontFamily, Palette } from "themes";
import { idOf, number } from "utils/format";

export function ReceiptLineCard({ line, ingredients, onChange }: {
  line: ReceiptDraftLine;
  ingredients: Ingredient[];
  onChange: (change: Partial<ReceiptDraftLine>) => void;
}) {
  const selected = ingredients.find((item) => idOf(item) === line.ingredientId);
  return (
    <Card>
      <ThemedView rowCenter gap={8}>
        <ThemedText flex={1} fontFamily={FontFamily.semibold} fontSize={15}>{line.name}</ThemedText>
        <AppButton variant="ghost" label={line.included ? "Bỏ dòng" : "Thêm lại"}
          onPress={() => onChange({ included: !line.included })} />
      </ThemedView>
      {line.included ? <>
        <ThemedText fontSize={12} color={Palette.textSecondary}>Đơn vị đọc trên bill: {line.billUnit}</ThemedText>
        {line.warnings.map((warning) => <ThemedText key={warning} selectable fontSize={12} lineHeight={19} color={Palette.cashOut}>{warning}</ThemedText>)}
        <SelectField label="Đối chiếu hàng hoá" value={line.source === "new" ? "__new__" : line.ingredientId}
          options={[
            ...ingredients.filter((item) => item.isActive).map((item) => ({ value: idOf(item), label: item.name,
              description: `${number(item.packageQuantity)} ${item.costUnit} / ${item.purchaseUnit}` })),
            { value: "__new__", label: "Tạo hàng mới từ bill" },
          ]}
          onChange={(value) => onChange(value === "__new__"
            ? { source: "new", ingredientId: "" } : { source: "existing", ingredientId: value })} />
        {line.source === "new" ? <>
          <Field label="Tên hàng mới" value={line.name} onChange={(name) => onChange({ name })} />
          <SelectField label="Nhóm hàng" value={line.category} onChange={(category) => onChange({ category })}
            options={["Nguyên liệu", "Topping", "Bao bì", "Khác"].map((value) => ({ value, label: value }))} />
          <Field label="Đơn vị mua (gói, chai, thùng...)" value={line.purchaseUnit} onChange={(purchaseUnit) => onChange({ purchaseUnit })} />
          <Field label="Lượng quy đổi / đơn vị mua" numeric value={line.packageQuantity} onChange={(packageQuantity) => onChange({ packageQuantity })} />
          <Field label="Đơn vị quy đổi (g, ml, lít...)" value={line.costUnit} onChange={(costUnit) => onChange({ costUnit })} />
        </> : selected ? <ThemedText fontSize={12} lineHeight={19} color={Palette.textSecondary}>
          Danh mục: {number(selected.packageQuantity)} {selected.costUnit} / {selected.purchaseUnit}. Kiểm tra số lượng theo đơn vị này.
        </ThemedText> : null}
        <Field label={`Số đơn vị mua (${line.source === "new" ? line.purchaseUnit || "đơn vị" : selected?.purchaseUnit || "đơn vị"})`}
          numeric value={line.count} onChange={(count) => onChange({ count })} />
        <Field label="Thành tiền dòng hàng (đồng)" numeric value={line.amount} onChange={(amount) => onChange({ amount })} />
        <DetailRow label="Tổng lượng quy đổi" value={number((Number(line.count.replace(",", ".")) || 0)
          * (line.source === "new" ? Number(line.packageQuantity.replace(",", ".")) || 0 : selected?.packageQuantity ?? 0))
          + " " + (line.source === "new" ? line.costUnit : selected?.costUnit ?? "")} />
      </> : <ThemedText fontSize={12} color={Palette.textTertiary}>Dòng này sẽ không được nhập kho.</ThemedText>}
    </Card>
  );
}
