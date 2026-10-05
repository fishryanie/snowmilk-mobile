export type Entity = { id?: string; _id?: string };
export type FundingSource =
  "sales_revenue" | "owner_capital" | "loan" | "other";
export type Ingredient = Entity & {
  code: string;
  name: string;
  category: string;
  purchaseUnit: string;
  packageQuantity: number;
  costUnit: string;
  referencePackagePrice: number;
  averageUnitCost: number;
  isActive: boolean;
  note?: string;
};
export type Purchase = Entity & {
  ingredientId?: string;
  purchaseDate: string;
  itemCode: string;
  itemName: string;
  category: string;
  purchaseUnit?: string;
  packageCount: number;
  packageQuantity: number;
  costUnit: string;
  totalAmount: number;
  convertedQuantity: number;
  fundingSource?: FundingSource;
  supplier?: string;
  note?: string;
  sterilizationOutsourcedLiters?: number;
  sterilizationUnitPrice?: number;
  sterilizationProvider?: string;
  sterilizationCost?: number;
  sterilizationPaymentStatus?: "paid" | "unpaid";
};
export type Expense = Entity & {
  expenseDate: string;
  category: string;
  description: string;
  amount: number;
  paymentStatus?: "paid" | "unpaid";
  fundingSource?: FundingSource;
  accountingTreatment?: "operating_expense" | "inventory_cost";
  milkLiters?: number;
  milkUnitPrice?: number;
  provider?: string;
  isRecurring?: boolean;
  note?: string;
  purchaseId?: string;
  sourceType?: string;
  sourcePurchaseId?: string;
  paymentId?: string;
};
export type Product = Entity & {
  code: string;
  name: string;
  groupName: string;
  sellingPrice: number;
  fullCost: number;
  variableCost: number;
  milkCost: number;
  toppingCost: number;
  packagingCost: number;
  isActive: boolean;
  hasCostWarning: boolean;
  productMode?: string;
  milkBatchId?: string;
  milkMl?: number;
  toppingItems?: Product["ingredientItems"];
  toppingIngredientId?: string;
  sizeId?: string;
  toppingGrams?: number;
  ingredientItems?: {
    source: "batch" | "ingredient";
    batchId?: string;
    ingredientId?: string;
    quantity: number;
    unit: string;
  }[];
  packagingItems?: { ingredientId: string; quantity: number }[];
  note?: string;
};
export type Employee = Entity & {
  name: string;
  role: string;
  phone: string;
  email: string;
  sharePercent: number;
  joinedAt: string;
  isActive: boolean;
};
export type Allocation = {
  employeeId: string;
  employeeName: string;
  role: string;
  sharePercent: number;
  amount: number;
};
export type PayrollPeriod = {
  period: string;
  isClosed: boolean;
  closedAt: string | null;
  periodRevenue: number;
  periodCostTotal: number;
  distributablePool: number;
  allocatedTotal: number;
  reserveFundsTotal: number;
  unallocatedPool: number;
  allocations: Allocation[];
};
export type Withdrawal = Entity & {
  employeeId: string;
  employeeName: string;
  period: string;
  amount: number;
  withdrawalDate: string;
  note: string;
};
export type Dashboard = {
  kpis: {
    revenue: number;
    cashIn: number;
    cashOut: number;
    netCashFlow: number;
    estimatedProfit: number;
    totalCups: number;
    businessCashBalance: number;
    purchaseTotal: number;
    expenseTotal: number;
    cashExpenseTotal: number;
    outstandingExpenseTotal: number;
    payrollTotal: number;
    reserveFundTransferTotal: number;
    equipmentTotal: number;
    snowMilkRevenue: number;
    freshMilkRevenue: number;
    activeProducts: number;
  };
  daily: {
    date: string;
    revenue: number;
    cashIn: number;
    cashOut: number;
    netCashFlow: number;
  }[];
  products: { product: string; cups: number; revenue: number }[];
  health: {
    lastSaleDate: string | null;
    issues: {
      key: string;
      severity: string;
      title: string;
      description: string;
      href: string;
    }[];
  };
};
export type Inventory = {
  snapshotDate: string;
  saved: boolean;
  note: string;
  totalInventoryValue: number;
  ingredientLines: {
    itemKey: string;
    itemCode: string;
    itemName: string;
    category: string;
    unit: string;
    onHandQuantity: number;
    unitCost: number;
    inventoryValue: number;
  }[];
  milkBatchLines: {
    batchKey: string;
    batchName: string;
    remainingLiters: number;
    costPerLiter: number;
  }[];
};
export type SaleContext = {
  freshMilkProduct: { sellingPrice: number; name: string } | null;
  countedProducts: { id: string; name: string; sellingPrice: number }[];
  batches: { id: string; name: string; costPerMl: number; cookedAt?: string }[];
};
export type DailySale = Entity & {
  saleDate: string;
  cashReceived: number;
  bankTransferReceived: number;
  batchId?: string;
};
export type DailySales = SaleContext & { history: DailySale[] };
