import type { SalesRecord, AggregatedSalesRecord } from "@/lib/types/sales";
import type { ExclusionRecord } from "@/lib/types/extraction";

export interface SalesRuleResult {
  included: AggregatedSalesRecord[];
  excluded: ExclusionRecord[];
  targetMonth: string;
}

/**
 * YYYY-MM形式の年月から1つ前の月を算出する
 * 例: "2025-03" → "2025-02", "2025-01" → "2024-12"
 */
export function getPreviousMonth(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split("-");
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function applySalesRules(
  items: SalesRecord[],
  targetMonth: string
): SalesRuleResult {
  const excluded: ExclusionRecord[] = [];
  const forAggregation: SalesRecord[] = [];

  // Step 1: Filter to target month only
  for (const item of items) {
    if (item.billingMonth !== targetMonth) {
      // Not target month — just skip
      continue;
    }

    const exclusionReason = getExclusionReason(item);
    if (exclusionReason) {
      excluded.push({
        branchName: item.branchName,
        type: "sales",
        identifier: item.orderNo || "(受注NO不明)",
        reason: exclusionReason,
        note: `${item.salesCategory} / ${item.amount}円`,
      });
    } else {
      forAggregation.push(item);
    }
  }

  // Step 2: Aggregate by billingMonth × orderNo
  const aggregated = aggregateByOrderNo(forAggregation);

  return {
    included: aggregated,
    excluded,
    targetMonth,
  };
}

function getExclusionReason(item: SalesRecord): string | null {
  // Rule 1: 売上分類が「障害」
  if (item.salesCategory.includes("障害")) {
    return "売上分類: 障害（単発）";
  }

  // Rule 2: 金額が0円
  if (item.amount === 0) {
    return "金額0円";
  }

  return null;
}

function aggregateByOrderNo(items: SalesRecord[]): AggregatedSalesRecord[] {
  const groupMap = new Map<
    string,
    {
      records: SalesRecord[];
      totalAmount: number;
    }
  >();

  for (const item of items) {
    const key = `${item.billingMonth}_${item.orderNo}`;
    const existing = groupMap.get(key);
    if (existing) {
      existing.records.push(item);
      existing.totalAmount += item.amount;
    } else {
      groupMap.set(key, {
        records: [item],
        totalAmount: item.amount,
      });
    }
  }

  const result: AggregatedSalesRecord[] = [];
  for (const [, group] of groupMap) {
    const first = group.records[0];
    result.push({
      branchName: first.branchName,
      billingMonth: first.billingMonth,
      orderNo: first.orderNo,
      salesCategory: first.salesCategory,
      totalAmount: group.totalAmount,
      billingNo: first.billingNo,
      note:
        group.records.length > 1
          ? `${group.records.length}行を合算`
          : first.note,
      originalCount: group.records.length,
    });
  }

  return result;
}
