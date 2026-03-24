import type { Worksheet } from "exceljs";
import type { PropertyItem } from "@/lib/types/property";

const COLUMNS = [
  { header: "拠点", key: "branchName", width: 18 },
  { header: "物件区分", key: "propertyCategory", width: 12 },
  { header: "物件NO", key: "propertyNo", width: 14 },
  { header: "契約", key: "contractType", width: 10 },
  { header: "メーカー", key: "maker", width: 14 },
  { header: "型式", key: "model", width: 18 },
  { header: "台数", key: "quantity", width: 6 },
  { header: "設置日", key: "installDate", width: 12 },
  { header: "リース会社", key: "leaseCompany", width: 14 },
  { header: "期間(月)", key: "leasePeriodMonths", width: 9 },
  { header: "月額(円)", key: "monthlyAmount", width: 12 },
  { header: "残数", key: "remainingMonths", width: 6 },
  { header: "リース状況", key: "leaseStatus", width: 12 },
  { header: "メンテ", key: "maintenance", width: 10 },
  { header: "物件状況", key: "propertyStatus", width: 12 },
  { header: "営業担当", key: "salesRep", width: 10 },
  { header: "備考", key: "note", width: 20 },
];

export function buildPropertySheet(
  ws: Worksheet,
  items: PropertyItem[]
): void {
  ws.columns = COLUMNS;

  // Header styling
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Data rows
  for (const item of items) {
    ws.addRow({
      branchName: item.branchName,
      propertyCategory: item.propertyCategory,
      propertyNo: item.propertyNo,
      contractType: item.contractType,
      maker: item.maker,
      model: item.model,
      quantity: item.quantity,
      installDate: item.installDate,
      leaseCompany: item.leaseCompany,
      leasePeriodMonths: item.leasePeriodMonths ?? "",
      monthlyAmount: item.monthlyAmount,
      remainingMonths: item.remainingMonths ?? "",
      leaseStatus: item.leaseStatus,
      maintenance: item.maintenance,
      propertyStatus: item.propertyStatus,
      salesRep: item.salesRep,
      note: item.note,
    });
  }

  // Format amount column
  ws.getColumn("monthlyAmount").numFmt = "#,##0";
}
