import { useState } from "react";
import { useData } from "api/hooks";
import { ThemedText } from "components/base";
import { Card, InlineError, SectionTitle } from "components/molecules/common";
import { Field } from "components/molecules/form-field";
import { useEditorSave } from "components/organisms/editor-shared";
import { FormScreen, LoadingCards } from "components/organisms/screen";
import type { Inventory } from "types/domain";
import { dateLabel } from "utils/format";
import { numeric, validDay } from "utils/finance";
import { Palette } from "themes";
export function InventoryEditor({ date }: { date: string }) {
  const query = useData<Inventory>("/api/inventory?date=" + date);
  if (!query.data)
    return (
      <>
        <InlineError
          message={query.error?.message}
          onRetry={() => {
            void query.refetch();
          }}
        />
        {query.isLoading ? <LoadingCards /> : null}
      </>
    );
  return <InventoryForm data={query.data} />;
}
function InventoryForm({ data }: { data: Inventory }) {
  const [items, setItems] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      data.ingredientLines.map((item) => [
        item.itemKey,
        String(item.onHandQuantity),
      ]),
    ),
  );
  const [batches, setBatches] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      data.milkBatchLines.map((batch) => [
        batch.batchKey,
        String(batch.remainingLiters),
      ]),
    ),
  );
  const [note, setNote] = useState(data.note);
  const save = useEditorSave("/api/inventory");
  return (
    <FormScreen
      title={"Kiểm kho " + dateLabel(data.snapshotDate)}
      saving={save.saving}
      error={save.error}
      saveLabel={data.saved ? "Cập nhật số kiểm kho" : "Chốt số kiểm kho"}
      onSave={() =>
        save.save(() => ({
          snapshotDate: validDay(data.snapshotDate),
          items: data.ingredientLines.map((item) => ({
            itemKey: item.itemKey,
            onHandQuantity: numeric(items[item.itemKey], item.itemName),
          })),
          milkBatches: data.milkBatchLines.map((batch) => ({
            batchKey: batch.batchKey,
            remainingLiters: numeric(batches[batch.batchKey], batch.batchName),
          })),
          note,
        }))
      }
    >
      <ThemedText fontSize={12} lineHeight={19} color={Palette.textSecondary}>
        Nhập lượng còn thực tế theo đúng đơn vị. Giá trị và hao hụt sẽ được
        Snowmilk tính lại sau khi lưu.
      </ThemedText>
      <SectionTitle>Hàng hoá</SectionTitle>
      {data.ingredientLines.map((item) => (
        <Card key={item.itemKey}>
          <Field
            label={item.itemName + " (" + item.unit + ")"}
            numeric
            value={items[item.itemKey]}
            onChange={(value) =>
              setItems((current) => ({ ...current, [item.itemKey]: value }))
            }
          />
        </Card>
      ))}
      <SectionTitle>Nền sữa thành phẩm</SectionTitle>
      {data.milkBatchLines.map((batch) => (
        <Field
          key={batch.batchKey}
          label={batch.batchName + " (lít)"}
          numeric
          value={batches[batch.batchKey]}
          onChange={(value) =>
            setBatches((current) => ({ ...current, [batch.batchKey]: value }))
          }
        />
      ))}
      <Field label="Ghi chú kiểm kho" value={note} onChange={setNote} />
    </FormScreen>
  );
}
