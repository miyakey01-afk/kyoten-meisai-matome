import type { Worksheet } from "exceljs";
import type { PropertyItem } from "@/lib/types/property";
import type { AggregatedSalesRecord } from "@/lib/types/sales";

const COLUMNS = [
  { header: "拠点", key: "branchName", width: 22 },
  { header: "物件区分", key: "propertyCategory", width: 14 },
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
  { header: "備考", key: "note", width: 16 },
];

export function buildSummarySheet(
  ws: Worksheet,
  properties: PropertyItem[],
  sales: AggregatedSalesRecord[]
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

  // Collect unique branches (preserve order)
  const branches: string[] = [];
  for (const p of properties) {
    if (!branches.includes(p.branchName)) branches.push(p.branchName);
  }
  for (const s of sales) {
    if (!branches.includes(s.branchName)) branches.push(s.branchName);
  }

  // Output per branch: properties first, then sales
  for (const branch of branches) {
    const branchProps = properties.filter((p) => p.branchName === branch);
    const branchSales = sales.filter((s) => s.branchName === branch);

    // Property rows
    for (const item of branchProps) {
      ws.addRow({
        branchName: item.branchName,
        propertyCategory: item.propertyCategory,
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
        note: item.note,
      });
    }

    // Sales rows (mapped to unified columns)
    for (const item of branchSales) {
      ws.addRow({
        branchName: item.branchName,
        propertyCategory: item.salesCategory,
        contractType: "",
        maker: "",
        model: "",
        quantity: "",
        installDate: "",
        leaseCompany: "",
        leasePeriodMonths: "",
        monthlyAmount: item.totalAmount,
        remainingMonths: "",
        leaseStatus: "",
        note: item.billingMonth,
      });
    }
  }

  // Number format
  ws.getColumn("monthlyAmount").numFmt = "#,##0";
}
