import { describe, expect, test } from 'bun:test';
import { compareCashFlow, isoDay, numeric } from './finance';
import { monthRange, shiftMonth, dayKey } from './format';
import { calculateMilkPurchaseCost, resolveOutsourcedSterilizationLiters } from './milk-sterilization';
describe('Financial figures and input boundaries', () => {
  test('keeps cash margin distinct from estimated profit margin', () => {
    expect(compareCashFlow(10000000, 7500000, 1800000)).toEqual({ cashIn: 10000000, cashOut: 7500000, difference: 2500000, cashFlowMargin: 25, profitMargin: 18 });
  });
  test('does not display a misleading percentage without revenue', () => {
    expect(compareCashFlow(0, 500000, -500000).cashFlowMargin).toBeNull();
    expect(compareCashFlow(0, 0, 0).profitMargin).toBeNull();
    expect(compareCashFlow(1000000, 1500000, -100000).cashFlowMargin).toBe(-50);
  });
  test('accepts decimal quantities but requires whole VND amounts', () => {
    expect(numeric('2,5', 'Số lít', { positive: true })).toBe(2.5);
    expect(numeric('1000000', 'Tiền', { integer: true })).toBe(1000000);
    for (const input of ['', 'abc', '-10', '1.000.000', 'Infinity']) expect(() => numeric(input, 'Tiền')).toThrow();
    expect(() => numeric('1.5', 'Tiền', { integer: true })).toThrow();
  });
  test('uses Vietnamese dates across month/year boundaries', () => {
    expect(dayKey(new Date('2026-09-30T18:00:00Z'))).toBe('2026-10-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(monthRange('2028-02').to).toBe('2028-02-29');
    expect(() => isoDay('2026-02-30')).toThrow();
  });
  test('includes sterilization in inventory cost without adding it to the purchase cash amount', () => {
    const result = calculateMilkPurchaseCost({ goodsAmount: 1000000, totalLiters: 50, outsourcedLiters: 20 });
    expect(result.sterilizationCost).toBe(100000);
    expect(result.inventoryCostAmount).toBe(1100000);
    expect(result.landedUnitCost).toBe(22000);
    expect(() => resolveOutsourcedSterilizationLiters('partial', 50, 50)).toThrow();
  });
});
