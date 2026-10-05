const moneyFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});
const numberFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 2,
});
const dayFormatter = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
export const money = (value: number) =>
  moneyFormatter.format(value || 0) + " ₫";
export const number = (value: number) => numberFormatter.format(value || 0);
export function dayKey(date = new Date()) {
  return dayFormatter.format(date);
}
export const dateLabel = (value: string) =>
  value
    ? dateFormatter.format(
        new Date(value.length === 10 ? value + "T12:00:00+07:00" : value),
      )
    : "—";
export const monthLabel = (period: string) =>
  "Tháng " + Number(period.slice(5)) + "/" + period.slice(0, 4);
export function monthRange(period: string) {
  const [year, month] = period.split("-").map(Number);
  return {
    from: period + "-01",
    to: period + "-" + new Date(Date.UTC(year, month, 0)).getUTCDate(),
  };
}
export function shiftMonth(period: string, amount: number) {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + amount, 1))
    .toISOString()
    .slice(0, 7);
}
export const idOf = (entity: { id?: string; _id?: string }) =>
  entity.id ?? entity._id ?? "";
export const matches = (search: string, ...values: unknown[]) =>
  values.some((value) =>
    String(value ?? "")
      .toLocaleLowerCase("vi")
      .includes(search.trim().toLocaleLowerCase("vi")),
  );
export const fundingLabels = {
  sales_revenue: "Tiền bán hàng",
  owner_capital: "Tiền cá nhân",
  loan: "Tiền vay",
  other: "Nguồn khác",
};
