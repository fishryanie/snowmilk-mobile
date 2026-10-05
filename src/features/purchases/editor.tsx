import { useState } from "react";
import { useData } from "api/hooks";
import {
  CloseEditorButton,
  FormScreen,
  LoadingCards,
  Screen,
} from "components/organisms/screen";
import {
  useDraft,
  useEditorSave,
  required,
  FundingField,
  DeleteAction,
} from "components/organisms/editor-shared";
import { ThemedText, ThemedView } from "components/base";
import {
  Card,
  DetailRow,
  InlineError,
  Segments,
} from "components/molecules/common";
import { DateField, SelectField } from "components/molecules/form-field";
import type { Ingredient, Purchase } from "types/domain";
import { dayKey, idOf, money, number } from "utils/format";
import { isoDay, numeric } from "utils/finance";
import {
  isFreshMilkIngredient,
  resolveOutsourcedSterilizationLiters,
  type SterilizationChoice,
} from "utils/milk-sterilization";
import { FontFamily, Palette } from "themes";
export function PurchaseEditor({
  record,
  date,
}: {
  record?: Purchase;
  date?: string;
}) {
  const ingredients = useData<Ingredient[]>("/api/ingredients?limit=500");
  if (!ingredients.data)
    return (
      <Screen>
        <InlineError
          message={ingredients.error?.message}
          onRetry={() => {
            void ingredients.refetch();
          }}
        />
        {ingredients.isLoading ? <LoadingCards /> : null}
        <CloseEditorButton />
      </Screen>
    );
  return (
    <PurchaseForm record={record} date={date} ingredients={ingredients.data} />
  );
}
function PurchaseForm({
  record,
  date,
  ingredients,
}: {
  record?: Purchase;
  date?: string;
  ingredients: Ingredient[];
}) {
  const existing = ingredients.find(
    (item) =>
      idOf(item) === record?.ingredientId || item.code === record?.itemCode,
  );
  const form = useDraft({
    date: record ? dayKey(new Date(record.purchaseDate)) : (date ?? dayKey()),
    source: record && !existing ? "new" : "existing",
    ingredientId: existing ? idOf(existing) : "",
    name: record?.itemName ?? "",
    category: record?.category ?? "Nguyên liệu",
    purchaseUnit: record?.purchaseUnit ?? "gói",
    packageQuantity: String(record?.packageQuantity ?? 1),
    costUnit: record?.costUnit ?? "g",
    count: String(record?.packageCount ?? 1),
    amount: record ? String(record.totalAmount) : "",
    funding:
      record?.fundingSource ?? (record ? "owner_capital" : "sales_revenue"),
    supplier: record?.supplier ?? "",
    note: record?.note ?? "",
    liters: String(record?.sterilizationOutsourcedLiters ?? 0),
    unitPrice: String(record?.sterilizationUnitPrice ?? 5000),
    provider: record?.sterilizationProvider ?? "",
    saveCatalog: record ? "false" : "true",
  });
  const { draft: d, set, field } = form;
  const [sterilization, setSterilization] = useState<SterilizationChoice>(
    (record?.sterilizationOutsourcedLiters ?? 0) <= 0
      ? "self"
      : (record?.sterilizationOutsourcedLiters ?? 0) >=
          (record?.convertedQuantity ?? 0)
        ? "full"
        : "partial",
  );
  const selected = ingredients.find((item) => idOf(item) === d.ingredientId);
  const item =
    d.source === "existing"
      ? selected
      : {
          name: d.name,
          costUnit: d.costUnit,
          packageQuantity: Number(d.packageQuantity.replace(",", ".")),
        };
  const fresh = item ? isFreshMilkIngredient(item) : false;
  const quantity =
    (Number(d.count.replace(",", ".")) || 0) * (item?.packageQuantity ?? 0);
  const outsourced = fresh
    ? sterilization === "full"
      ? quantity
      : sterilization === "partial"
        ? Number(d.liters.replace(",", ".")) || 0
        : 0
    : 0;
  const save = useEditorSave(
    "/api/purchases",
    record ? idOf(record) : undefined,
  );
  return (
    <FormScreen
      title={record ? "Sửa lần nhập hàng" : "Nhập hàng mới"}
      saveLabel={record ? "Lưu thay đổi" : "Lưu phiếu nhập"}
      saving={save.saving}
      error={save.error}
      onSave={() =>
        save.save(() => {
          const purchaseDate = isoDay(d.date);
          if (d.date > dayKey())
            throw new Error("Ngày nhập hàng không được sau hôm nay.");
          const totalAmount = numeric(d.amount, "Tổng tiền", { integer: true });
          const packageCount = numeric(d.count, "Số gói", { positive: true });
          const packageQuantity =
            d.source === "existing"
              ? (selected?.packageQuantity ?? 0)
              : numeric(d.packageQuantity, "Quy cách", { positive: true });
          if (d.source === "existing" && !selected)
            throw new Error("Hãy chọn hàng hoá trong danh mục.");
          const common = {
            purchaseDate,
            packageCount,
            totalAmount,
            fundingSource: d.funding,
            supplier: d.supplier,
            note: d.note,
            sterilizationOutsourcedLiters: fresh
              ? resolveOutsourcedSterilizationLiters(
                  sterilization,
                  packageCount * packageQuantity,
                  numeric(d.liters || "0", "Số lít thuê"),
                )
              : 0,
            sterilizationUnitPrice: numeric(d.unitPrice, "Giá tiệt trùng"),
            sterilizationProvider: d.provider,
          };
          return d.source === "existing"
            ? { ...common, source: "existing", ingredientId: d.ingredientId }
            : {
                ...common,
                source: "new",
                itemName: required(d.name, "Tên hàng"),
                category: d.category,
                purchaseUnit: required(d.purchaseUnit, "Đơn vị mua"),
                packageQuantity,
                costUnit: required(d.costUnit, "Đơn vị quy đổi"),
                saveToCatalog: d.saveCatalog === "true",
              };
        })
      }
      footer={
        record ? (
          <DeleteAction
            path={"/api/purchases/" + idOf(record)}
            label="lần nhập hàng này"
          />
        ) : undefined
      }
    >
      <Card>
        <ThemedText
          fontSize={13}
          fontFamily={FontFamily.medium}
          color={Palette.textSecondary}
        >
          Thông tin hàng nhập
        </ThemedText>
        <DateField
          label="Ngày nhập"
          value={d.date}
          maxDate={dayKey()}
          onChange={(value) => set("date", value)}
        />
        <Segments
          fullWidth
          value={d.source}
          onChange={(value) => set("source", value)}
          options={[
            { value: "existing", label: "Hàng có sẵn" },
            { value: "new", label: "Hàng mới" },
          ]}
        />
        {d.source === "existing" ? (
          <SelectField
            label="Hàng hoá"
            value={d.ingredientId}
            onChange={(value) => set("ingredientId", value)}
            options={ingredients
              .filter((item) => item.isActive || idOf(item) === d.ingredientId)
              .map((item) => ({
                value: idOf(item),
                label: item.name,
                description: [
                  item.code,
                  item.category,
                  `${number(item.packageQuantity)} ${item.costUnit} / ${item.purchaseUnit}`,
                ]
                  .filter(Boolean)
                  .join(" · "),
              }))}
          />
        ) : (
          <>
            {field("name", "Tên hàng")}
            <SelectField
              label="Nhóm hàng"
              value={d.category}
              onChange={(value) => set("category", value)}
              options={["Nguyên liệu", "Topping", "Bao bì", "Khác"].map(
                (value) => ({ value, label: value }),
              )}
            />
            {field("purchaseUnit", "Đơn vị mua (gói, chai, thùng...)")}
            {field("packageQuantity", "Lượng quy đổi / đơn vị mua", true)}
            {field("costUnit", "Đơn vị quy đổi (g, ml, lít...)")}
            <SelectField
              label="Lưu hàng vào danh mục"
              value={d.saveCatalog}
              onChange={(value) => set("saveCatalog", value)}
              options={[
                { value: "true", label: "Có" },
                { value: "false", label: "Chỉ ghi lần nhập" },
              ]}
            />
          </>
        )}
      </Card>
      <Card>
        <ThemedText
          fontSize={13}
          fontFamily={FontFamily.medium}
          color={Palette.textSecondary}
        >
          Số lượng & chi phí
        </ThemedText>
        {field("count", "Số đơn vị mua", true)}
        {field("amount", "Tổng tiền mua hàng (đồng)", true)}
        <ThemedView gap={12} paddingTop={6}>
          <DetailRow
            label="Tổng lượng quy đổi"
            value={number(quantity) + " " + (item?.costUnit ?? "")}
          />
          <DetailRow
            label="Giá / đơn vị mua"
            value={money((Number(d.amount) || 0) / (Number(d.count) || 1))}
          />
        </ThemedView>
      </Card>
      {fresh ? (
        <Card>
          <ThemedText
            fontSize={13}
            fontFamily={FontFamily.medium}
            color={Palette.textSecondary}
          >
            Tiệt trùng sữa
          </ThemedText>
          <Segments
            value={sterilization}
            onChange={setSterilization}
            options={[
              { value: "self", label: "Tự làm" },
              { value: "full", label: "Thuê toàn bộ" },
              { value: "partial", label: "Thuê một phần" },
            ]}
          />
          {sterilization === "partial"
            ? field("liters", "Số lít thuê tiệt trùng", true)
            : null}
          {sterilization !== "self" ? (
            <>
              {field("unitPrice", "Đơn giá tiệt trùng / lít", true)}
              {field("provider", "Đơn vị tiệt trùng")}
              <Card>
                <DetailRow
                  label="Phí tiệt trùng phát sinh"
                  value={money(outsourced * (Number(d.unitPrice) || 0))}
                />
                <ThemedText color={Palette.textSecondary} fontSize={12}>
                  Snowmilk tự tạo khoản tiệt trùng chưa trả và tính vào giá vốn
                  kho.
                </ThemedText>
              </Card>
            </>
          ) : null}
        </Card>
      ) : null}
      <Card>
        <ThemedText
          fontSize={13}
          fontFamily={FontFamily.medium}
          color={Palette.textSecondary}
        >
          Thanh toán & ghi chú
        </ThemedText>
        <FundingField
          value={d.funding}
          onChange={(value) => set("funding", value)}
        />
        {field("supplier", "Nhà cung cấp")}
        {field("note", "Ghi chú")}
      </Card>
    </FormScreen>
  );
}
