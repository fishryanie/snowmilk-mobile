import { describe, expect, test } from "bun:test";
import type { Ingredient } from "../types/domain";
import type { ReceiptScan } from "../types/receipt";
import { createReceiptDraft, receiptPurchasePayload, receiptDraftTotal } from "./receipt";

const ingredient: Ingredient = {
  id: "a".repeat(24), name: "Sữa tươi", code: "NL001", category: "Nguyên liệu",
  purchaseUnit: "chai", packageQuantity: 1.5, costUnit: "lít", referencePackagePrice: 0,
  averageUnitCost: 0, isActive: true,
};
const scan: ReceiptScan = {
  receiptId: "b".repeat(64), purchaseDate: "2026-09-30", supplier: "Nhà cung cấp",
  invoiceNumber: "HD-12", totalAmount: 120000, warnings: [],
  lines: [{ itemName: "Sữa tươi", ingredientId: ingredient.id!, category: "Nguyên liệu",
    purchaseUnit: "chai", packageQuantity: 1.5, costUnit: "lít", packageCount: 4,
    totalAmount: 120000, warnings: [] }],
};

describe("receipt inventory drafts", () => {
  test("keeps the bill date in Vietnam and uses purchased units, not converted liters", () => {
    const draft = createReceiptDraft(scan);
    draft.funding = "owner_capital";
    const payload = receiptPurchasePayload(draft, [ingredient]);
    expect(payload.lines[0]).toMatchObject({
      purchaseDate: "2026-09-30T12:00:00+07:00", packageCount: 4, totalAmount: 120000,
      ingredientId: ingredient.id, fundingSource: "owner_capital",
    });
    expect(draft.lines[0].packageQuantity).toBe("1.5");
  });
  test("does not replace unreadable date, count or amount with invented defaults", () => {
    const draft = createReceiptDraft({ ...scan, purchaseDate: null,
      lines: [{ ...scan.lines[0], packageCount: null, totalAmount: null }] });
    expect(draft.date).toBe("");
    expect(draft.lines[0].count).toBe("");
    expect(draft.lines[0].amount).toBe("");
    expect(() => receiptPurchasePayload(draft, [ingredient])).toThrow("Ngày");
  });
  test("requires payment funding and a real active catalog match", () => {
    const draft = createReceiptDraft(scan);
    expect(() => receiptPurchasePayload(draft, [ingredient])).toThrow("nguồn tiền");
    draft.funding = "sales_revenue";
    expect(() => receiptPurchasePayload(draft, [{ ...ingredient, isActive: false }])).toThrow("danh mục");
  });
  test("blocks incomplete new-item package specifications", () => {
    const draft = createReceiptDraft(scan);
    draft.funding = "sales_revenue";
    draft.lines[0].source = "new";
    draft.lines[0].packageQuantity = "";
    expect(() => receiptPurchasePayload(draft, [])).toThrow("quy cách");
    draft.lines[0].packageQuantity = "1,5";
    expect(receiptPurchasePayload(draft, []).lines[0]).toMatchObject({ source: "new", packageQuantity: 1.5, saveToCatalog: true });
  });
  test("omits removed lines without changing the remaining rows or original bill", () => {
    const draft = createReceiptDraft({ ...scan, lines: [scan.lines[0], { ...scan.lines[0], itemName: "Bỏ dòng này" }] });
    draft.funding = "sales_revenue";
    draft.lines[1].included = false;
    expect(receiptDraftTotal(draft.lines)).toBe(120000);
    expect(receiptPurchasePayload(draft, [ingredient]).lines).toHaveLength(1);
    expect(draft.lines).toHaveLength(2);
  });
  test("rejects fractional money and impossible or future dates without mutating draft", () => {
    const draft = createReceiptDraft(scan);
    draft.funding = "sales_revenue";
    draft.lines[0].amount = "120000,5";
    expect(() => receiptPurchasePayload(draft, [ingredient])).toThrow("không hợp lệ");
    expect(draft.lines[0].amount).toBe("120000,5");
    draft.date = "2026-02-30";
    expect(() => receiptPurchasePayload(draft, [ingredient])).toThrow("Ngày không tồn tại");
    draft.date = "2999-01-01";
    expect(() => receiptPurchasePayload(draft, [ingredient])).toThrow("sau hôm nay");
  });
});
