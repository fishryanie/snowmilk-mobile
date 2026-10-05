import { useData } from "api/hooks";
import { Card, DetailRow, InlineError } from "components/molecules/common";
import { DateField } from "components/molecules/form-field";
import { useDraft, useEditorSave } from "components/organisms/editor-shared";
import { FormScreen, LoadingCards } from "components/organisms/screen";
import type { DailySales } from "types/domain";
import { buildDailySaleInput } from "utils/daily-sales";
import { dayKey, money } from "utils/format";

export function SaleEditor() {
  const query = useData<DailySales>("/api/sales");
  if (!query.data)
    return (
      <>
        <InlineError
          message={query.error?.message}
          onRetry={() => {
            void query.refetch();
          }}
        />
        {!query.error ? <LoadingCards /> : null}
      </>
    );
  return <SaleForm context={query.data} />;
}

function SaleForm({ context }: { context: DailySales }) {
  const { draft, set, field } = useDraft({
    date: dayKey(),
    cash: "",
    bank: "",
  });
  const save = useEditorSave("/api/sales");
  return (
    <FormScreen
      title="Tạo ngày chốt doanh thu"
      saveLabel="Chốt doanh thu"
      saving={save.saving}
      error={save.error}
      onSave={() =>
        save.save(() =>
          buildDailySaleInput(
            { date: draft.date, cash: draft.cash, bank: draft.bank },
            context,
          ),
        )
      }
    >
      <DateField
        label="Ngày chốt"
        value={draft.date}
        onChange={(value) => set("date", value)}
      />
      {field("cash", "Tiền mặt (đồng)", true)}
      {field("bank", "Chuyển khoản (đồng)", true)}
      <Card tinted>
        <DetailRow
          label="Tổng doanh thu"
          value={money((Number(draft.cash) || 0) + (Number(draft.bank) || 0))}
        />
      </Card>
    </FormScreen>
  );
}
