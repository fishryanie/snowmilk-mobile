import { describe, expect, test } from "bun:test";
import type { DailySales } from "../types/domain";
import { buildDailySaleInput } from "./daily-sales";

const context: DailySales = {
  freshMilkProduct: null,
  countedProducts: [],
  batches: [
    { id: "000000000000000000000001", name: "Mẻ mới", costPerMl: 32 },
    { id: "000000000000000000000002", name: "Mẻ đang bán", costPerMl: 34 },
  ],
  history: [
    {
      saleDate: "2026-10-01T17:00:00.000Z",
      cashReceived: 100000,
      bankTransferReceived: 200000,
      batchId: "000000000000000000000002",
    },
  ],
};
const draft = { date: "2026-10-03", cash: "1200000", bank: "800000" };

describe("daily revenue closing", () => {
  test("sends two amounts and inherits the most recent sale's valid batch", () => {
    const input = buildDailySaleInput(draft, context, "2026-10-03");
    expect(input.cashReceived).toBe(1200000);
    expect(input.bankTransferReceived).toBe(800000);
    expect(input.batchId).toBe(context.batches[1].id);
    expect(input.overwrite).toBe(false);
    expect(context.history).toHaveLength(1);
  });
  test("allows only one payment method", () => {
    expect(
      buildDailySaleInput({ ...draft, bank: "" }, context, "2026-10-03")
        .bankTransferReceived,
    ).toBe(0);
  });
  test("protects an existing Vietnamese calendar day from replacement", () => {
    expect(() =>
      buildDailySaleInput(
        { ...draft, date: "2026-10-02" },
        context,
        "2026-10-03",
      ),
    ).toThrow("đã chốt");
  });
  test("rejects invalid, future and zero-value entries", () => {
    for (const change of [
      { date: "2026-02-30" },
      { date: "2026-10-04" },
      { cash: "0", bank: "0" },
      { cash: "-1" },
      { bank: "0.5" },
    ]) {
      expect(() =>
        buildDailySaleInput({ ...draft, ...change }, context, "2026-10-03"),
      ).toThrow();
    }
  });
  test("does not use future batches or a batch without a valid cost", () => {
    const unavailable = {
      ...context,
      history: [],
      batches: [
        { ...context.batches[0], costPerMl: 0 },
        { ...context.batches[1], cookedAt: "2026-10-04T12:00:00+07:00" },
      ],
    };
    expect(() => buildDailySaleInput(draft, unavailable, "2026-10-03")).toThrow(
      "Chưa có mẻ sữa hợp lệ",
    );
  });
  test("starts from the newest valid batch when there is no history", () => {
    expect(
      buildDailySaleInput(draft, { ...context, history: [] }, "2026-10-03")
        .batchId,
    ).toBe(context.batches[0].id);
  });
  test("does not inherit a later day's batch when backfilling", () => {
    const withFutureSale = {
      ...context,
      history: [
        {
          ...context.history[0],
          saleDate: "2026-10-04T12:00:00+07:00",
          batchId: context.batches[0].id,
        },
        ...context.history,
      ],
    };
    expect(
      buildDailySaleInput(draft, withFutureSale, "2026-10-03").batchId,
    ).toBe(context.batches[1].id);
  });
});
