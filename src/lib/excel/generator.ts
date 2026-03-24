import ExcelJS from "exceljs";
import type { PropertyItem } from "@/lib/types/property";
import type { AggregatedSalesRecord } from "@/lib/types/sales";
import type { ExclusionRecord } from "@/lib/types/extraction";
import { buildPropertySheet } from "./sheets/propertySheet";
import { buildSalesSheet } from "./sheets/salesSheet";
import { buildSummarySheet } from "./sheets/summarySheet";
import { buildExclusionSheet } from "./sheets/exclusionSheet";

export interface ExcelGenerationInput {
  properties: PropertyItem[];
  sales: AggregatedSalesRecord[];
  exclusions: ExclusionRecord[];
  customerName?: string;
}

export async function generateExcel(
  input: ExcelGenerationInput
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "拠点明細まとめ";
  workbook.created = new Date();

  // Sheet 1: 物件一覧
  const propertyWs = workbook.addWorksheet("物件一覧");
  buildPropertySheet(propertyWs, input.properties);

  // Sheet 2: 売上履歴（最新月）
  const salesWs = workbook.addWorksheet("売上履歴（最新月）");
  buildSalesSheet(salesWs, input.sales);

  // Sheet 3: 拠点別サマリ
  const summaryWs = workbook.addWorksheet("拠点別サマリ");
  buildSummarySheet(summaryWs, input.properties, input.sales);

  // Sheet 4: 除外一覧
  const exclusionWs = workbook.addWorksheet("除外一覧");
  buildExclusionSheet(exclusionWs, input.exclusions);

  // Auto-filter on all sheets
  for (const ws of [propertyWs, salesWs, summaryWs, exclusionWs]) {
    if (ws.rowCount > 1) {
      ws.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: ws.rowCount, column: ws.columnCount },
      };
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
