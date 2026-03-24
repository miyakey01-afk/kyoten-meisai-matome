import type { Worksheet } from "exceljs";
import type { ExclusionRecord } from "@/lib/types/extraction";

const COLUMNS = [
  { header: "拠点", key: "branchName", width: 18 },
  { header: "種別", key: "type", width: 10 },
  { header: "識別子", key: "identifier", width: 16 },
  { header: "除外理由", key: "reason", width: 30 },
  { header: "備考", key: "note", width: 30 },
];

export function buildExclusionSheet(
  ws: Worksheet,
  exclusions: ExclusionRecord[]
): void {
  ws.columns = COLUMNS;

  // Header styling
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFC00000" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  for (const item of exclusions) {
    ws.addRow({
      branchName: item.branchName,
      type: item.type === "property" ? "物件" : "売上",
      identifier: item.identifier,
      reason: item.reason,
      note: item.note,
    });
  }
}
