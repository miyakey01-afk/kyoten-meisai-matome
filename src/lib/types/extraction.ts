import type { PropertyItem, CustomerInfo } from "./property";
import type { SalesRecord } from "./sales";

export type ExtractionStatus = "pending" | "processing" | "success" | "error";

export interface PropertyExtractionResult {
  status: ExtractionStatus;
  customerInfo?: CustomerInfo;
  data: PropertyItem[];
  warnings: string[];
  confidence: number;       // 0-1
  error?: string;
}

export interface SalesExtractionResult {
  status: ExtractionStatus;
  data: SalesRecord[];
  warnings: string[];
  confidence: number;
  error?: string;
}

export interface ExclusionRecord {
  branchName: string;       // 拠点
  type: "property" | "sales"; // 種別（物件/売上）
  identifier: string;       // 識別子（物件NO / 受注NO）
  reason: string;           // 除外理由
  note: string;             // 備考
}
