import type { Worksheet } from "exceljs";
import type { PropertyItem } from "@/lib/types/property";
import type { AggregatedSalesRecord } from "@/lib/types/sales";

interface SummaryRow {
  branchName: string;
  leaseMonthlyTotal: number;
  purchaseTotal: number;
  propertyCount: number;
  salesTotal: number;
  contractCount: number;
}

const COLUMNS = [
  { header: "拠点", key: "branchName", width: 18 },
  { header: "リース月額合計", key: "leaseMonthlyTotal", width: 16 },
  { header: "買取金額合計", key: "purchaseTotal", width: 14 },
  { header: "物件件数", key: "propertyCount", width: 10 },
  { header: "売上合計(最新月)", key: "salesTotal", width: 16 },
  { header: "契約数(受注NO数)", key: "contractCount", width: 16 },
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
    fgColor: { argb: "FFBF8F00" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  // Collect unique branches
  const branches = new Set<string>();
  for (const p of properties) branches.add(p.branchName);
  for (const s of sales) branches.add(s.branchName);

  const summaryRows: SummaryRow[] = [];
  let totalLease = 0;
  let totalPurchase = 0;
  let totalPropertyCount = 0;
  let totalSales = 0;
  let totalContracts = 0;

  for (const branch of branches) {
    const branchProps = properties.filter((p) => p.branchName === branch);
    const branchSales = sales.filter((s) => s.branchName === branch);

    const leaseMonthlyTotal = branchProps
      .filter(
        (p) =>
          p.contractType.includes("リース") ||
          p.contractType.includes("レンタル")
      )
      .reduce((sum, p) => sum + p.monthlyAmount, 0);

    const purchaseTotal = branchProps
      .filter((p) => p.contractType.includes("買取"))
      .reduce((sum, p) => sum + p.monthlyAmount, 0);

    const salesTotal = branchSales.reduce((sum, s) => sum + s.totalAmount, 0);

    const row: SummaryRow = {
      branchName: branch,
      leaseMonthlyTotal,
      purchaseTotal,
      propertyCount: branchProps.length,
      salesTotal,
      contractCount: branchSales.length,
    };

    summaryRows.push(row);
    totalLease += leaseMonthlyTotal;
    totalPurchase += purchaseTotal;
    totalPropertyCount += branchProps.length;
    totalSales += salesTotal;
    totalContracts += branchSales.length;
  }

  for (const row of summaryRows) {
    ws.addRow(row);
  }

  // Total row
  const totalRow = ws.addRow({
    branchName: "合計",
    leaseMonthlyTotal: totalLease,
    purchaseTotal: totalPurchase,
    propertyCount: totalPropertyCount,
    salesTotal: totalSales,
    contractCount: totalContracts,
  });
  totalRow.font = { bold: true };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFF2CC" },
  };

  // Number format
  ws.getColumn("leaseMonthlyTotal").numFmt = "#,##0";
  ws.getColumn("purchaseTotal").numFmt = "#,##0";
  ws.getColumn("salesTotal").numFmt = "#,##0";
}
