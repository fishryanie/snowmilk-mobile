import { useLocalSearchParams } from "expo-router";
import { useData } from "api/hooks";
import { Card, InlineError } from "components/molecules/common";
import { ThemedText, ThemedView } from "components/base";
import { CloseEditorButton, LoadingCards } from "components/organisms/screen";
import { PurchaseEditor } from "features/purchases/editor";
import { ReceiptEditor } from "features/purchases/receipt-editor";
import { ExpenseEditor } from "features/expenses/editor";
import { IngredientEditor } from "features/goods/ingredient-editor";
import { ProductEditor } from "features/goods/product-editor";
import { InventoryEditor } from "features/goods/inventory-editor";
import { EmployeeEditor, WithdrawalEditor } from "features/payroll/editor";
import { SaleEditor } from "features/sales/editor";
import type {
  Employee,
  Expense,
  Ingredient,
  Product,
  Purchase,
} from "types/domain";
import { dayKey, idOf } from "utils/format";
import { purchaseListPath } from "utils/purchases";
type RecordType = Employee | Expense | Ingredient | Product | Purchase;
const resources: Record<string, string> = {
  purchase: "purchases",
  expense: "expenses",
  ingredient: "ingredients",
  product: "products",
  employee: "payroll/employees",
};
export default function EditorScreen() {
  const params = useLocalSearchParams<{
    kind: string;
    id?: string;
    date?: string;
    period?: string;
    employeeId?: string;
  }>();
  const kind = params.kind;
  const query = useData<RecordType[]>(
    kind === "purchase" && params.date
      ? purchaseListPath(params.date)
      : "/api/" +
          (resources[kind] ?? "ingredients") +
          (kind === "employee" ? "" : "?limit=500"),
    Boolean(params.id),
  );
  if (params.id && !query.data)
    return (
      <ThemedView padding={20} gap={16}>
        <InlineError
          message={query.error?.message}
          onRetry={() => {
            void query.refetch();
          }}
        />
        {query.isLoading ? <LoadingCards /> : null}
        <CloseEditorButton />
      </ThemedView>
    );
  const record = query.data?.find((item) => idOf(item) === params.id);
  if (params.id && !record)
    return (
      <ThemedView padding={20} gap={16}>
        <Card>
          <ThemedText>
            Không tìm thấy bản ghi trong dữ liệu Snowmilk. Hãy quay lại và tải
            mới danh sách.
          </ThemedText>
        </Card>
        <CloseEditorButton />
      </ThemedView>
    );
  if (kind === "receipt") return <ReceiptEditor />;
  if (kind === "purchase")
    return (
      <PurchaseEditor
        key={params.id ?? "new"}
        record={record as Purchase | undefined}
        date={params.date}
      />
    );
  if (kind === "expense")
    return (
      <ExpenseEditor
        key={params.id ?? "new"}
        record={record as Expense | undefined}
      />
    );
  if (kind === "ingredient")
    return (
      <IngredientEditor
        key={params.id ?? "new"}
        record={record as Ingredient | undefined}
      />
    );
  if (kind === "product")
    return (
      <ProductEditor
        key={params.id ?? "new"}
        record={record as Product | undefined}
      />
    );
  if (kind === "employee")
    return (
      <EmployeeEditor
        key={params.id ?? "new"}
        record={record as Employee | undefined}
      />
    );
  if (kind === "inventory")
    return <InventoryEditor date={params.date ?? dayKey()} />;
  if (kind === "withdrawal" && params.period && params.employeeId)
    return (
      <WithdrawalEditor period={params.period} employeeId={params.employeeId} />
    );
  if (kind === "sale") return <SaleEditor />;
  return (
    <ThemedView padding={20} gap={16}>
      <Card>
        <ThemedText>Màn hình không hợp lệ.</ThemedText>
      </Card>
      <CloseEditorButton />
    </ThemedView>
  );
}
