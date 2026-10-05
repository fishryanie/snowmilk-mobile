import { useState } from "react";
import * as Linking from "expo-linking";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import {
  Card,
  DetailRow,
  InlineError,
  SectionTitle,
} from "components/molecules/common";
import { Field, SelectField } from "components/molecules/form-field";
import {
  ActiveField,
  DeleteAction,
  required,
  useDraft,
  useEditorSave,
} from "components/organisms/editor-shared";
import { CloseEditorButton, FormScreen, LoadingCards, Screen } from "components/organisms/screen";
import { AppButton } from "components/ui/button";
import { Palette } from "themes";
import type { Entity, Ingredient, Product } from "types/domain";
import { idOf, money } from "utils/format";
import { numeric } from "utils/finance";
import { useApi } from "api/provider";
type Batch = Entity & { name: string; batchType?: string; outputUnit?: string };
type Size = Entity & { name: string; sellingPrice: number };
type IngredientRow = {
  source: "batch" | "ingredient";
  selectedId: string;
  quantity: string;
  unit: string;
  key: number;
};
type PackagingRow = { selectedId: string; quantity: string; key: number };
export function ProductEditor({ record }: { record?: Product }) {
  const ingredients = useData<Ingredient[]>("/api/ingredients?limit=500");
  const batches = useData<Batch[]>("/api/batches?limit=500");
  const sizes = useData<Size[]>(
    "/api/sizes?limit=500",
    Boolean(record && (!record.productMode || record.productMode === "legacy")),
  );
  const { serverUrl } = useApi();
  if (record?.productMode === "recipe")
    return (
      <Screen>
        <Card>
          <SectionTitle>{record.name}</SectionTitle>
          <DetailRow label="Giá bán" value={money(record.sellingPrice)} />
          <DetailRow label="Giá vốn" value={money(record.fullCost)} />
          <ThemedText fontSize={13} color={Palette.textSecondary}>
            Sản phẩm này dùng công thức phiên bản của Snowmilk. Mở trang sản
            phẩm để chỉnh công thức và giữ nguyên liên kết.
          </ThemedText>
          <AppButton
            label="Mở sản phẩm trên Snowmilk web"
            onPress={() => {
              void Linking.openURL(serverUrl + "/products");
            }}
          />
        </Card>
        <CloseEditorButton />
      </Screen>
    );
  if (
    !ingredients.data ||
    !batches.data ||
    (record &&
      (!record.productMode || record.productMode === "legacy") &&
      !sizes.data)
  )
    return (
      <Screen>
        <InlineError
          message={
            ingredients.error?.message ||
            batches.error?.message ||
            sizes.error?.message
          }
          onRetry={() => {
            void ingredients.refetch();
            void batches.refetch();
            void sizes.refetch();
          }}
        />
        <LoadingCards />
        <CloseEditorButton />
      </Screen>
    );
  if (record && (!record.productMode || record.productMode === "legacy"))
    return (
      <LegacyForm
        record={record}
        ingredients={ingredients.data}
        sizes={sizes.data ?? []}
      />
    );
  return (
    <ProductForm
      record={record}
      ingredients={ingredients.data}
      batches={batches.data}
    />
  );
}
function ProductForm({
  record,
  ingredients,
  batches,
}: {
  record?: Product;
  ingredients: Ingredient[];
  batches: Batch[];
}) {
  const {
    draft: d,
    set,
    field,
  } = useDraft({
    name: record?.name ?? "",
    group: record?.groupName ?? "Sữa Tuyết",
    price: String(record?.sellingPrice ?? ""),
    active: String(record?.isActive ?? true),
    note: record?.note ?? "",
  });
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>(() =>
    productIngredients(record).length
      ? productIngredients(record).map((item, key) => ({
          source: item.source,
          selectedId:
            item.source === "batch"
              ? (item.batchId ?? "")
              : (item.ingredientId ?? ""),
          quantity: String(item.quantity),
          unit: item.unit,
          key,
        }))
      : [
          {
            source: "ingredient",
            selectedId: "",
            quantity: "",
            unit: "g",
            key: 0,
          },
        ],
  );
  const [packagingRows, setPackagingRows] = useState<PackagingRow[]>(() =>
    record?.packagingItems?.length
      ? record.packagingItems.map((item, key) => ({
          selectedId: item.ingredientId,
          quantity: String(item.quantity),
          key,
        }))
      : [{ selectedId: "", quantity: "1", key: 0 }],
  );
  const save = useEditorSave(
    "/api/product-onboarding",
    record ? idOf(record) : undefined,
  );
  const updateIngredient = (key: number, values: Partial<IngredientRow>) =>
    setIngredientRows((current) =>
      current.map((item) => (item.key === key ? { ...item, ...values } : item)),
    );
  const updatePackaging = (key: number, values: Partial<PackagingRow>) =>
    setPackagingRows((current) =>
      current.map((item) => (item.key === key ? { ...item, ...values } : item)),
    );
  return (
    <FormScreen
      title={record ? "Sửa sản phẩm & giá vốn" : "Thêm sản phẩm bán"}
      saving={save.saving}
      error={save.error}
      onSave={() =>
        save.save(() => ({
          name: required(d.name, "Tên sản phẩm"),
          groupName: required(d.group, "Nhóm sản phẩm"),
          sellingPrice: numeric(d.price, "Giá bán", { integer: true }),
          ingredientItems: ingredientRows.map((item) => ({
            source: item.source,
            ...(item.source === "batch"
              ? { batchId: required(item.selectedId, "Mẻ thành phẩm") }
              : { ingredientId: required(item.selectedId, "Nguyên liệu") }),
            quantity: numeric(item.quantity, "Định lượng", { positive: true }),
            unit: required(item.unit, "Đơn vị"),
          })),
          packagingItems: packagingRows.map((item) => ({
            source: "existing",
            ingredientId: required(item.selectedId, "Bao bì"),
            quantity: numeric(item.quantity, "Số lượng bao bì", {
              positive: true,
            }),
          })),
          isActive: d.active === "true",
          note: d.note,
        }))
      }
      footer={
        record ? (
          <DeleteAction
            path={"/api/products/" + idOf(record)}
            label="sản phẩm này"
          />
        ) : undefined
      }
    >
      {field("name", "Tên sản phẩm")}
      {field("group", "Nhóm sản phẩm")}
      {field("price", "Giá bán (đồng)", true)}
      <SectionTitle>Nguyên liệu / thành phẩm</SectionTitle>
      {ingredientRows.map((item, index) => (
        <Card key={item.key}>
          <ThemedText fontSize={13}>Thành phần {index + 1}</ThemedText>
          <SelectField
            label="Nguồn thành phần"
            value={item.source}
            onChange={(source) =>
              updateIngredient(item.key, {
                source: source as IngredientRow["source"],
                selectedId: "",
              })
            }
            options={[
              { value: "ingredient", label: "Hàng hoá trong danh mục" },
              { value: "batch", label: "Mẻ thành phẩm đã nấu" },
            ]}
          />
          <SelectField
            label="Thành phần"
            value={item.selectedId}
            onChange={(selectedId) => {
              const unit =
                item.source === "ingredient"
                  ? ingredients.find(
                      (ingredient) => idOf(ingredient) === selectedId,
                    )?.costUnit
                  : (batches.find((batch) => idOf(batch) === selectedId)
                      ?.outputUnit ?? "ml");
              updateIngredient(item.key, { selectedId, unit: unit || "g" });
            }}
            options={(item.source === "ingredient" ? ingredients : batches).map(
              (source) => ({ value: idOf(source), label: source.name }),
            )}
          />
          <ThemedView row gap={10}>
            <ThemedView flex={1}>
              <Field
                label="Định lượng"
                numeric
                value={item.quantity}
                onChange={(quantity) =>
                  updateIngredient(item.key, { quantity })
                }
              />
            </ThemedView>
            <ThemedView flex={1}>
              <Field
                label="Đơn vị"
                value={item.unit}
                onChange={(unit) => updateIngredient(item.key, { unit })}
              />
            </ThemedView>
          </ThemedView>
          {ingredientRows.length > 1 ? (
            <AppButton
              variant="ghost"
              textColor={Palette.danger}
              label="Bỏ thành phần"
              onPress={() =>
                setIngredientRows((current) =>
                  current.filter((row) => row.key !== item.key),
                )
              }
            />
          ) : null}
        </Card>
      ))}
      <AppButton
        variant="ghost"
        label="+ Thêm thành phần"
        onPress={() =>
          setIngredientRows((current) => [
            ...current,
            {
              source: "ingredient",
              selectedId: "",
              quantity: "",
              unit: "g",
              key: Math.max(...current.map((row) => row.key)) + 1,
            },
          ])
        }
      />
      <SectionTitle>Bao bì</SectionTitle>
      {packagingRows.map((item) => (
        <Card key={item.key}>
          <SelectField
            label="Bao bì"
            value={item.selectedId}
            onChange={(selectedId) => updatePackaging(item.key, { selectedId })}
            options={ingredients
              .filter(
                (ingredient) =>
                  ingredient.category === "Bao bì" ||
                  idOf(ingredient) === item.selectedId,
              )
              .map((ingredient) => ({
                value: idOf(ingredient),
                label: ingredient.name,
              }))}
          />
          <Field
            label="Số lượng / sản phẩm"
            numeric
            value={item.quantity}
            onChange={(quantity) => updatePackaging(item.key, { quantity })}
          />
          {packagingRows.length > 1 ? (
            <AppButton
              variant="ghost"
              textColor={Palette.danger}
              label="Bỏ bao bì"
              onPress={() =>
                setPackagingRows((current) =>
                  current.filter((row) => row.key !== item.key),
                )
              }
            />
          ) : null}
        </Card>
      ))}
      <AppButton
        variant="ghost"
        label="+ Thêm bao bì"
        onPress={() =>
          setPackagingRows((current) => [
            ...current,
            {
              selectedId: "",
              quantity: "1",
              key: Math.max(...current.map((row) => row.key)) + 1,
            },
          ])
        }
      />
      <ActiveField
        value={d.active}
        onChange={(value) => set("active", value)}
      />
      {field("note", "Ghi chú")}
      <ThemedText fontSize={12} color={Palette.textSecondary}>
        Giá vốn nguyên liệu, bao bì và chi phí được tính lại bởi Snowmilk. Thêm
        bao bì vào danh mục hàng hoá trước khi chọn.
      </ThemedText>
    </FormScreen>
  );
}
function productIngredients(
  record?: Product,
): NonNullable<Product["ingredientItems"]> {
  if (record?.ingredientItems?.length) return record.ingredientItems;
  return [
    ...(record?.milkBatchId
      ? [
          {
            source: "batch" as const,
            batchId: record.milkBatchId,
            quantity: record.milkMl ?? 0,
            unit: "ml",
          },
        ]
      : []),
    ...(record?.toppingItems ?? [])
      .filter((item) => item.ingredientId || item.batchId)
      .map((item) => ({
        ...item,
        source: item.source || "batch",
        unit: item.unit || "g",
      })),
  ];
}
function LegacyForm({
  record,
  ingredients,
  sizes,
}: {
  record: Product;
  ingredients: Ingredient[];
  sizes: Size[];
}) {
  const {
    draft: d,
    set,
    field,
  } = useDraft({
    topping: record.toppingIngredientId ?? "",
    size: record.sizeId ?? "",
    grams: String(record.toppingGrams ?? 0),
    active: String(record.isActive),
  });
  const save = useEditorSave("/api/products", idOf(record));
  return (
    <FormScreen
      title={record.name}
      saving={save.saving}
      error={save.error}
      onSave={() =>
        save.save(() => ({
          toppingIngredientId: required(d.topping, "Topping"),
          sizeId: required(d.size, "Size"),
          toppingGrams: numeric(d.grams, "Định lượng topping"),
          isActive: d.active === "true",
        }))
      }
      footer={
        <DeleteAction
          path={"/api/products/" + idOf(record)}
          label="sản phẩm này"
        />
      }
    >
      <Card>
        <DetailRow
          label="Giá bán theo size"
          value={money(record.sellingPrice)}
        />
        <DetailRow label="Giá vốn hiện tại" value={money(record.fullCost)} />
      </Card>
      <SelectField
        label="Topping"
        value={d.topping}
        onChange={(value) => set("topping", value)}
        options={ingredients
          .filter(
            (item) => item.category === "Topping" || idOf(item) === d.topping,
          )
          .map((item) => ({ value: idOf(item), label: item.name }))}
      />
      <SelectField
        label="Size"
        value={d.size}
        onChange={(value) => set("size", value)}
        options={sizes.map((item) => ({
          value: idOf(item),
          label: item.name + " · " + money(item.sellingPrice),
        }))}
      />
      {field("grams", "Định lượng topping (g)", true)}
      <ActiveField
        value={d.active}
        onChange={(value) => set("active", value)}
      />
    </FormScreen>
  );
}
