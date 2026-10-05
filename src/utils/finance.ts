export function compareCashFlow(
  cashIn: number,
  cashOut: number,
  estimatedProfit: number,
) {
  const difference = cashIn - cashOut;
  return {
    cashIn,
    cashOut,
    difference,
    cashFlowMargin: cashIn > 0 ? (difference / cashIn) * 100 : null,
    profitMargin: cashIn > 0 ? (estimatedProfit / cashIn) * 100 : null,
  };
}
/** Inputs use an unformatted decimal value, including Vietnamese decimal comma. */
export function numeric(
  value: string,
  label: string,
  options: { positive?: boolean; integer?: boolean } = {},
) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized))
    throw new Error(
      "Nhập số hợp lệ cho " + label.toLocaleLowerCase("vi") + ".",
    );
  const amount = Number(normalized);
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    (options.positive && amount === 0) ||
    (options.integer && !Number.isSafeInteger(amount))
  )
    throw new Error(label + " không hợp lệ.");
  return amount;
}
export function validDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("Ngày phải có dạng YYYY-MM-DD.");
  const date = new Date(value + "T12:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new Error("Ngày không tồn tại.");
  return value;
}
export const isoDay = (value: string) => validDay(value) + "T12:00:00+07:00";
