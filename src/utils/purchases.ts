import type { Purchase } from "../types/domain";
import { dayKey, matches } from "./format";

export function purchaseListPath(date: string) {
  return `/api/purchases?limit=500&from=${date}&to=${date}`;
}

export function purchasesForDay(
  purchases: Purchase[],
  date: string,
  search = "",
  category = "all",
) {
  return purchases
    .filter(
      (item) =>
        dayKey(new Date(item.purchaseDate)) === date &&
        (category === "all" || item.category === category) &&
        matches(search, item.itemName, item.itemCode, item.supplier),
    )
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate));
}

export function purchaseTotals(purchases: Purchase[]) {
  return purchases.reduce(
    (total, item) => ({
      quantity: total.quantity + item.packageCount,
      amount: total.amount + item.totalAmount,
    }),
    { quantity: 0, amount: 0 },
  );
}
