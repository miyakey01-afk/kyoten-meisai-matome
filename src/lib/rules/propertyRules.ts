import type { PropertyItem } from "@/lib/types/property";
import type { ExclusionRecord } from "@/lib/types/extraction";

export interface PropertyRuleResult {
  included: PropertyItem[];
  excluded: ExclusionRecord[];
}

export function applyPropertyRules(items: PropertyItem[]): PropertyRuleResult {
  const included: PropertyItem[] = [];
  const excluded: ExclusionRecord[] = [];

  for (const item of items) {
    const exclusionReason = getExclusionReason(item);
    if (exclusionReason) {
      excluded.push({
        branchName: item.branchName,
        type: "property",
        identifier: item.propertyNo || "(NO不明)",
        reason: exclusionReason,
        note: `${item.maker} ${item.model}`.trim(),
      });
    } else {
      included.push(item);
    }
  }

  return { included, excluded };
}

function getExclusionReason(item: PropertyItem): string | null {
  // Rule 1: 物件NOが「他」で始まる行は除外
  if (item.propertyNo.startsWith("他")) {
    return "他社導入（物件NOが「他」）";
  }

  // Rule 1b: 物件NOが「自」で始まらない場合も除外
  if (!item.propertyNo.startsWith("自")) {
    return `当社導入でない可能性（物件NO: ${item.propertyNo}）`;
  }

  // Rule 2: グレー行は除外
  if (item.isGrayRow) {
    return "グレー表示（非アクティブ）";
  }

  // Rule 3: ステータスが終了系
  const endStatuses = ["終了", "当社解約", "撤去", "解約"];
  for (const status of endStatuses) {
    if (item.propertyStatus.includes(status) || item.leaseStatus.includes(status)) {
      return `ステータス: ${item.propertyStatus || item.leaseStatus}`;
    }
  }

  // Rule 4: 「他社UP不明」等
  if (
    item.propertyStatus.includes("他社UP不明") ||
    item.note.includes("他社UP不明")
  ) {
    return "他社UP不明";
  }

  // Rule 5: 月額0円（契約がリース/レンタルの場合のみ）
  const leaseTypes = ["リース", "レンタル"];
  if (
    leaseTypes.some((t) => item.contractType.includes(t)) &&
    item.monthlyAmount === 0
  ) {
    return "月額0円（リース/レンタル）";
  }

  return null;
}
