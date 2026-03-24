import type { Worksheet } from "exceljs";
import type { AggregatedSalesRecord } from "@/lib/types/sales";

const COLUMNS = [
  { header: "拠点", key: "branchName", width: 18 },
  { header: "請求年月", key: "billingMonth", width: 12 },
  { header: "受注NO", key: "orderNo", width: 14 },
  { header: "売上分類", key: "salesCategory", width: 12 },
  { header: "金額", key: "totalAmount", width: 14 },
  { header: "請求先NO", key: "billingNo", width: 12 },
  { header: "備考", key: "note", width: 20 },
];

export function buildSalesSheet(
  ws: Worksheet,
  items: AggregatedSalesRecord[]
): void {
  ws.columns = COLUMNS;

  // Header styling
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF548235" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  for (const item of items) {
    ws.addRow({
      branchName: item.branchName,
      billingMonth: item.billingMonth,
      orderNo: item.orderNo,
      salesCategory: item.salesCategory,
      totalAmount: item.totalAmount,
      billingNo: item.billingNo,
      note: item.note,
    });
  }

  ws.getColumn("totalAmount").numFmt = "#,##0";
}
