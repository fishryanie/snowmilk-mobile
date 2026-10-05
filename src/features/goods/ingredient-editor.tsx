import {
  useDraft,
  useEditorSave,
  required,
  ActiveField,
  DeleteAction,
} from "components/organisms/editor-shared";
import { FormScreen } from "components/organisms/screen";
import { SelectField } from "components/molecules/form-field";
import type { Ingredient } from "types/domain";
import { idOf } from "utils/format";
import { numeric } from "utils/finance";
export function IngredientEditor({ record }: { record?: Ingredient }) {
  const {
    draft: d,
    set,
    field,
  } = useDraft({
    code: record?.code ?? "",
    name: record?.name ?? "",
    category: record?.category ?? "Nguyên liệu",
    purchaseUnit: record?.purchaseUnit ?? "gói",
    quantity: String(record?.packageQuantity ?? 1),
    unit: record?.costUnit ?? "g",
    price: String(record?.referencePackagePrice ?? 0),
    active: String(record?.isActive ?? true),
    note: record?.note ?? "",
  });
  const save = useEditorSave(
    "/api/ingredients",
    record ? idOf(record) : undefined,
  );
  return (
    <FormScreen
      title={record ? "Sửa hàng hoá" : "Thêm hàng hoá"}
      saving={save.saving}
      error={save.error}
      onSave={() =>
        save.save(() => ({
          ...(d.code ? { code: d.code } : {}),
          name: required(d.name, "Tên hàng"),
          category: d.category,
          purchaseUnit: required(d.purchaseUnit, "Đơn vị mua"),
          packageQuantity: numeric(d.quantity, "Quy cách", { positive: true }),
          costUnit: required(d.unit, "Đơn vị quy đổi"),
          referencePackagePrice: numeric(d.price, "Giá tham chiếu", {
            integer: true,
          }),
          isActive: d.active === "true",
          note: d.note,
        }))
      }
      footer={
        record ? (
          <DeleteAction
            path={"/api/ingredients/" + idOf(record)}
            label="hàng hoá này"
          />
        ) : undefined
      }
    >
      {field("name", "Tên hàng")}
      {field("code", "Mã hàng (để trống để tự tạo)")}
      <SelectField
        label="Nhóm hàng"
        value={d.category}
        onChange={(value) => set("category", value)}
        options={["Nguyên liệu", "Topping", "Bao bì", "Khác"].map((value) => ({
          value,
          label: value,
        }))}
      />
      {field("purchaseUnit", "Đơn vị mua (gói, chai...)")}
      {field("quantity", "Lượng quy đổi / đơn vị mua", true)}
      {field("unit", "Đơn vị quy đổi (g, ml, lít...)")}
      {field("price", "Giá tham chiếu / đơn vị mua (đồng)", true)}
      <ActiveField
        value={d.active}
        onChange={(value) => set("active", value)}
      />
      {field("note", "Ghi chú")}
    </FormScreen>
  );
}
