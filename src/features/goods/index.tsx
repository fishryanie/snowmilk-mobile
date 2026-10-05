import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { Boxes, ChevronRight, IceCreamBowl, Plus } from "lucide-react-native";
import { useData } from "api/hooks";
import { ThemedText, ThemedView } from "components/base";
import {
  Card,
  DetailRow,
  SectionTitle,
  Segments,
  Stat,
} from "components/molecules/common";
import { Field, DateField } from "components/molecules/form-field";
import { CountBadge, PageHeading } from "components/molecules/page-heading";
import { PageActionBar } from "components/ui/page-action-bar";
import { ListScreen } from "components/organisms/screen";
import { AppButton } from "components/ui/button";
import { StatusChip } from "components/ui/status-chip";
import { FontFamily, Palette } from "themes";
import type { Ingredient, Inventory, Product } from "types/domain";
import { dayKey, idOf, matches, money, number } from "utils/format";
export default function GoodsScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"ingredients" | "products" | "inventory">(
    "ingredients",
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [date, setDate] = useState(() => dayKey());
  const ingredients = useData<Ingredient[]>("/api/ingredients?limit=500");
  const products = useData<Product[]>(
    "/api/products?limit=500",
    mode === "products",
  );
  const inventory = useData<Inventory>(
    "/api/inventory?date=" + date,
    mode === "inventory",
  );
  const actions =
    mode !== "inventory" ? (
      <PageActionBar
        actions={[
          {
            label: mode === "products" ? "Thêm sản phẩm" : "Thêm hàng hoá",
            Icon: Plus,
            onPress: () =>
              router.push({
                pathname: "/editor",
                params: {
                  kind: mode === "products" ? "product" : "ingredient",
                },
              }),
          },
        ]}
      />
    ) : undefined;
  const header = (
    <>
      <PageHeading title="Hàng hoá">
        <CountBadge
          icon={
            <Boxes size={15} strokeWidth={1.5} color={Palette.textSecondary} />
          }
        >
          {mode === "products"
            ? products.data
              ? number(products.data.length)
              : "—"
            : mode === "inventory"
              ? inventory.data
                ? number(inventory.data.ingredientLines.length)
                : "—"
              : ingredients.data
                ? number(ingredients.data.length)
                : "—"}{" "}
          món
        </CountBadge>
      </PageHeading>
      <Segments
        value={mode}
        onChange={setMode}
        options={[
          { value: "ingredients", label: "Hàng hoá" },
          { value: "products", label: "Sản phẩm bán" },
          { value: "inventory", label: "Kiểm kho" },
        ]}
      />
      {mode === "inventory" ? (
        <>
          <DateField label="Ngày kiểm kho" value={date} onChange={setDate} />
          {inventory.data ? (
            <Card tinted>
              <Stat
                label="Giá trị tồn kho"
                value={money(inventory.data.totalInventoryValue)}
                color={Palette.accent}
              />
              <StatusChip
                label={
                  inventory.data.saved
                    ? "Đã kiểm kho ngày này"
                    : "Chưa kiểm · số liệu suy tính"
                }
                tone={inventory.data.saved ? "success" : "warning"}
              />
              <AppButton
                label="Nhập số kiểm thực tế"
                onPress={() =>
                  router.push({
                    pathname: "/editor",
                    params: { kind: "inventory", date },
                  })
                }
              />
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <Field
            label="Tìm tên hàng hoặc mã"
            value={search}
            onChange={setSearch}
          />
          {mode === "ingredients" ? (
            <Segments
              value={category}
              onChange={setCategory}
              options={["all", "Nguyên liệu", "Topping", "Bao bì", "Khác"].map(
                (value) => ({
                  value,
                  label: value === "all" ? "Tất cả" : value,
                }),
              )}
            />
          ) : null}
        </>
      )}
    </>
  );
  if (mode === "products") {
    const items = (products.data ?? []).filter((item) =>
      matches(search, item.name, item.code, item.groupName),
    );
    return (
      <ListScreen
        items={items}
        keyOf={idOf}
        header={header}
        actions={actions}
        loading={products.isLoading}
        error={products.error?.message}
        refresh={() => {
          void products.refetch();
        }}
        refreshing={products.isFetching}
        renderItem={(item) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={"Sản phẩm " + item.name}
            onPress={() =>
              router.push({
                pathname: "/editor",
                params: { kind: "product", id: idOf(item) },
              })
            }
          >
            <Card>
              <ThemedView rowCenter gap={12}>
                <ThemedView
                  square={32}
                  radius={10}
                  contentCenter
                  backgroundColor={Palette.accentSoft}
                >
                  <IceCreamBowl color={Palette.accent} size={22} />
                </ThemedView>
                <ThemedView flex={1} gap={4}>
                  <ThemedText fontSize={14} fontFamily={FontFamily.semibold}>
                    {item.name}
                  </ThemedText>
                  <ThemedText color={Palette.textTertiary} fontSize={11}>
                    {item.code} · {item.groupName}
                  </ThemedText>
                </ThemedView>
                <ChevronRight size={18} color={Palette.textTertiary} />
              </ThemedView>
              <DetailRow
                label="Giá bán"
                value={money(item.sellingPrice)}
                color={Palette.accent}
              />
              <DetailRow label="Giá vốn đầy đủ" value={money(item.fullCost)} />
              <DetailRow
                label="Lãi ước tính / sản phẩm"
                value={money(item.sellingPrice - item.fullCost)}
              />
              <ThemedView row gap={6}>
                <StatusChip
                  label={item.isActive ? "Đang bán" : "Ngừng bán"}
                  tone={item.isActive ? "success" : "muted"}
                />
                {item.hasCostWarning ? (
                  <StatusChip label="Cần đối soát giá vốn" tone="warning" />
                ) : null}
              </ThemedView>
            </Card>
          </Pressable>
        )}
      />
    );
  }
  if (mode === "inventory")
    return (
      <ListScreen
        items={inventory.data?.ingredientLines ?? []}
        keyOf={(item) => item.itemKey}
        loading={inventory.isLoading}
        error={inventory.error?.message}
        refreshing={inventory.isFetching}
        refresh={() => {
          void inventory.refetch();
        }}
        header={
          <>
            {header}
            {inventory.data?.milkBatchLines.length ? (
              <Card>
                <SectionTitle>Nền sữa thành phẩm</SectionTitle>
                {inventory.data.milkBatchLines.map((batch) => (
                  <DetailRow
                    key={batch.batchKey}
                    label={batch.batchName}
                    value={number(batch.remainingLiters) + " lít"}
                  />
                ))}
              </Card>
            ) : null}
          </>
        }
        renderItem={(item) => (
          <Card>
            <ThemedText fontSize={14} fontFamily={FontFamily.semibold}>
              {item.itemName}
            </ThemedText>
            <DetailRow
              label={item.itemCode + " · " + item.category}
              value={number(item.onHandQuantity) + " " + item.unit}
            />
            <DetailRow label="Giá trị tồn" value={money(item.inventoryValue)} />
          </Card>
        )}
      />
    );
  const items = (ingredients.data ?? []).filter(
    (item) =>
      (category === "all" || item.category === category) &&
      matches(search, item.name, item.code),
  );
  return (
    <ListScreen
      items={items}
      keyOf={idOf}
      loading={ingredients.isLoading}
      error={ingredients.error?.message}
      refreshing={ingredients.isFetching}
      refresh={() => {
        void ingredients.refetch();
      }}
      header={header}
      actions={actions}
      empty="Không tìm thấy hàng phù hợp"
      renderItem={(item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={"Sửa hàng hoá " + item.name}
          onPress={() =>
            router.push({
              pathname: "/editor",
              params: { kind: "ingredient", id: idOf(item) },
            })
          }
        >
          <Card>
            <ThemedView rowCenter gap={12}>
              <ThemedView
                square={32}
                radius={10}
                contentCenter
                backgroundColor={Palette.surfaceMuted}
              >
                <Boxes color={Palette.textSecondary} size={21} />
              </ThemedView>
              <ThemedView flex={1} gap={4}>
                <ThemedText fontSize={14} fontFamily={FontFamily.semibold}>
                  {item.name}
                </ThemedText>
                <ThemedText fontSize={11} color={Palette.textTertiary}>
                  {item.code} · {item.category}
                </ThemedText>
              </ThemedView>
              <ChevronRight size={18} color={Palette.textTertiary} />
            </ThemedView>
            <DetailRow
              label="Quy cách"
              value={
                "1 " +
                item.purchaseUnit +
                " = " +
                number(item.packageQuantity) +
                " " +
                item.costUnit
              }
            />
            <DetailRow
              label="Giá vốn bình quân"
              value={money(item.averageUnitCost) + " / " + item.costUnit}
            />
            <StatusChip
              label={item.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}
              tone={item.isActive ? "success" : "muted"}
            />
          </Card>
        </Pressable>
      )}
    />
  );
}
