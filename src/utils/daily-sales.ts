import type { DailySales } from "../types/domain";
import { numeric, validDay } from "./finance";
import { dayKey } from "./format";

export function buildDailySaleInput(
  draft: { date: string; cash: string; bank: string },
  context: DailySales,
  today = dayKey(),
) {
  const saleDate = validDay(draft.date);
  if (saleDate > today)
    throw new Error("Không chốt doanh thu ngày ở tương lai.");
  const previousSales = context.history
    .filter((sale) => dayKey(new Date(sale.saleDate)) <= saleDate)
    .sort((a, b) => b.saleDate.localeCompare(a.saleDate));
  if (
    previousSales.some((sale) => dayKey(new Date(sale.saleDate)) === saleDate)
  )
    throw new Error("Ngày này đã chốt doanh thu. Vui lòng chọn ngày khác.");
  const cashReceived = numeric(draft.cash || "0", "Tiền mặt", {
    integer: true,
  });
  const bankTransferReceived = numeric(draft.bank || "0", "Chuyển khoản", {
    integer: true,
  });
  const total = cashReceived + bankTransferReceived;
  if (total <= 0)
    throw new Error("Tổng tiền mặt và chuyển khoản phải lớn hơn 0.");
  if (!Number.isSafeInteger(total))
    throw new Error("Tổng tiền vượt giới hạn cho phép.");
  const eligibleBatches = context.batches.filter(
    (batch) =>
      batch.costPerMl > 0 &&
      (!batch.cookedAt || dayKey(new Date(batch.cookedAt)) <= saleDate),
  );
  const previousBatch = previousSales
    .map((sale) => eligibleBatches.find((batch) => batch.id === sale.batchId))
    .find((batch) => batch !== undefined);
  const batch = previousBatch ?? eligibleBatches[0];
  if (!batch)
    throw new Error(
      "Chưa có mẻ sữa hợp lệ để chốt doanh thu. Vui lòng cập nhật mẻ sữa trong Snowmilk.",
    );
  return {
    saleDate,
    cashReceived,
    bankTransferReceived,
    batchId: batch.id,
    freshMilkBottleCount: 0,
    productQuantities: [],
    overwrite: false,
  };
}
