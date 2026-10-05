import type { FundingSource } from "./domain";

export type ReceiptLine = {
  itemName: string;
  ingredientId: string | null;
  category: string | null;
  purchaseUnit: string | null;
  packageQuantity: number | null;
  costUnit: string | null;
  packageCount: number | null;
  totalAmount: number | null;
  warnings: string[];
};
export type ReceiptScan = {
  receiptId: string;
  purchaseDate: string | null;
  supplier: string | null;
  invoiceNumber: string | null;
  totalAmount: number | null;
  warnings: string[];
  lines: ReceiptLine[];
};
export type ReceiptDraftLine = {
  key: string;
  included: boolean;
  source: "existing" | "new";
  ingredientId: string;
  name: string;
  category: string;
  purchaseUnit: string;
  packageQuantity: string;
  costUnit: string;
  count: string;
  amount: string;
  warnings: string[];
  billUnit: string;
};
export type ReceiptDraft = {
  receiptId: string;
  date: string;
  supplier: string;
  invoiceNumber: string;
  billTotal: number | null;
  funding: FundingSource | "";
  note: string;
  warnings: string[];
  lines: ReceiptDraftLine[];
};
