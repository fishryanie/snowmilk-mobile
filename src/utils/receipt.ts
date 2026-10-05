import type { Ingredient } from "../types/domain";
import type { ReceiptDraft, ReceiptDraftLine, ReceiptScan } from "../types/receipt";
import { numeric, isoDay } from "./finance";
import { dayKey, idOf } from "./format";

export function createReceiptDraft(scan: ReceiptScan): ReceiptDraft {
  return {
    receiptId: scan.receiptId, date: scan.purchaseDate ?? "", supplier: scan.supplier ?? "",
    invoiceNumber: scan.invoiceNumber ?? "", billTotal: scan.totalAmount,
    funding: "", note: "", warnings: scan.warnings,
    lines: scan.lines.map((line, index) => ({
      key: String(index), included: true, source: "existing", ingredientId: line.ingredientId ?? "",
      name: line.itemName, category: line.category ?? "Khác", purchaseUnit: line.purchaseUnit ?? "",
      packageQuantity: line.packageQuantity === null ? "" : String(line.packageQuantity),
      costUnit: line.costUnit ?? "", count: line.packageCount === null ? "" : String(line.packageCount),
      amount: line.totalAmount === null ? "" : String(line.totalAmount),
      warnings: line.warnings, billUnit: line.purchaseUnit ?? "chưa rõ đơn vị",
    })),
  };
}

function required(value: string, label: string) {
  if (!value.trim()) throw new Error("Vui lòng nhập " + label + ".");
  return value.trim();
}

export function receiptPurchasePayload(draft: ReceiptDraft, ingredients: Ingredient[]) {
  const purchaseDate = isoDay(draft.date);
  if (draft.date > dayKey()) throw new Error("Ngày nhập hàng không được sau hôm nay.");
  if (!draft.funding) throw new Error("Hãy chọn nguồn tiền thanh toán bill.");
  const included = draft.lines.filter((line) => line.included);
  if (!included.length) throw new Error("Hãy chọn ít nhất một mặt hàng để nhập kho.");
  return {
    receiptId: draft.receiptId,
    lines: included.map((line) => {
      const packageCount = numeric(line.count, line.name + ": số đơn vị mua", { positive: true });
      const totalAmount = numeric(line.amount, line.name + ": thành tiền", { integer: true });
      const common = {
        purchaseDate, packageCount, totalAmount, fundingSource: draft.funding, supplier: draft.supplier,
        note: ["Nhập từ ảnh bill", draft.invoiceNumber ? "Số bill: " + draft.invoiceNumber : "", draft.note].filter(Boolean).join(" · "),
        sterilizationOutsourcedLiters: 0,
      };
      if (line.source === "existing") {
        const item = ingredients.find((item) => idOf(item) === line.ingredientId && item.isActive);
        if (!item) throw new Error("Hãy chọn hàng trong danh mục cho “" + line.name + "”.");
        if (!(item.packageQuantity > 0) || !item.costUnit || !item.purchaseUnit) {
          throw new Error("Hàng “" + item.name + "” chưa có quy cách đầy đủ trong danh mục.");
        }
        return { ...common, source: "existing" as const, ingredientId: idOf(item) };
      }
      return {
        ...common, source: "new" as const, itemName: required(line.name, "tên hàng"), category: line.category,
        purchaseUnit: required(line.purchaseUnit, "đơn vị mua của “" + line.name + "”"),
        packageQuantity: numeric(line.packageQuantity, line.name + ": quy cách", { positive: true }),
        costUnit: required(line.costUnit, "đơn vị quy đổi của “" + line.name + "”"), saveToCatalog: true,
      };
    }),
  };
}

export function receiptDraftTotal(lines: ReceiptDraftLine[]) {
  return lines.filter((line) => line.included).reduce((sum, line) => sum + (Number(line.amount.replace(",", ".")) || 0), 0);
}
