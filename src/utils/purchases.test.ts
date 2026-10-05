import { describe, expect, it } from "bun:test";
import type { Purchase } from "../types/domain";
import { purchaseListPath, purchasesForDay, purchaseTotals } from "./purchases";
import { fullDayLabel, shiftDay, weekdayLabel } from "./calendar";

const purchase = (overrides: Partial<Purchase>): Purchase => ({
  id: "test-receipt",
  purchaseDate: "2026-10-04T05:00:00Z",
  itemCode: "TEST",
  itemName: "Hàng kiểm tra",
  category: "Nguyên liệu",
  purchaseUnit: "gói",
  packageCount: 2,
  packageQuantity: 1000,
  costUnit: "g",
  convertedQuantity: 2000,
  totalAmount: 120000,
  ...overrides,
});

describe("daily purchase list", () => {
  it("uses Vietnamese day boundaries and keeps the source list unchanged", () => {
    const source = [
      purchase({ id: "before", purchaseDate: "2026-10-03T16:59:59.999Z" }),
      purchase({ id: "start", purchaseDate: "2026-10-03T17:00:00.000Z" }),
      purchase({ id: "end", purchaseDate: "2026-10-04T16:59:59.999Z" }),
      purchase({ id: "after", purchaseDate: "2026-10-04T17:00:00.000Z" }),
    ];
    expect(
      purchasesForDay(source, "2026-10-04").map((item) => item.id),
    ).toEqual(["end", "start"]);
    expect(source.map((item) => item.id)).toEqual([
      "before",
      "start",
      "end",
      "after",
    ]);
    expect(purchaseListPath("2026-10-04")).toBe(
      "/api/purchases?limit=500&from=2026-10-04&to=2026-10-04",
    );
  });

  it("totals purchase units rather than adding incompatible converted units", () => {
    const source = [
      purchase({
        packageCount: 2,
        convertedQuantity: 2000,
        costUnit: "g",
        totalAmount: 120000,
      }),
      purchase({
        category: "Topping",
        supplier: "Nhà cung cấp",
        packageCount: 3.5,
        convertedQuantity: 3500,
        costUnit: "ml",
        totalAmount: 80000,
      }),
    ];
    expect(purchaseTotals(purchasesForDay(source, "2026-10-04"))).toEqual({
      quantity: 5.5,
      amount: 200000,
    });
    expect(
      purchaseTotals(purchasesForDay(source, "2026-10-04", " NHÀ ", "Topping")),
    ).toEqual({ quantity: 3.5, amount: 80000 });
    expect(
      purchaseTotals(purchasesForDay(source, "2026-10-04", "không có")),
    ).toEqual({ quantity: 0, amount: 0 });
  });
});

describe("continuous calendar days", () => {
  it("crosses month, year and leap-day boundaries in both directions", () => {
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDay("2027-01-01", -1)).toBe("2026-12-31");
    expect(shiftDay("2028-03-01", -1)).toBe("2028-02-29");
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDay(shiftDay("2026-10-04", 5000), -5000)).toBe("2026-10-04");
    expect(weekdayLabel("2026-10-04")).toBe("CN");
    expect(fullDayLabel("2026-10-05")).toBe("Thứ 2, 05/10/2026");
  });
});
