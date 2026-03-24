import { v4 as uuidv4 } from "uuid";
import type { PropertyItem, CustomerInfo } from "@/lib/types/property";
import type { SalesRecord } from "@/lib/types/sales";

function extractJson(text: string): string {
  // Remove markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  // Try to find JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return text.trim();
}

export interface ParsedPropertyResult {
  customerInfo?: CustomerInfo;
  items: PropertyItem[];
  confidence: number;
  warnings: string[];
}

export function parsePropertyResponse(
  responseText: string,
  branchName: string
): ParsedPropertyResult {
  const jsonStr = extractJson(responseText);
  const parsed = JSON.parse(jsonStr);

  const customerInfo: CustomerInfo | undefined = parsed.customerInfo
    ? {
        customerName: String(parsed.customerInfo.customerName || ""),
        customerAbbr: String(parsed.customerInfo.customerAbbr || ""),
        customerNo: String(parsed.customerInfo.customerNo || ""),
        headOfficeNo: String(parsed.customerInfo.headOfficeNo || ""),
      }
    : undefined;

  const items: PropertyItem[] = (parsed.items || []).map(
    (item: Record<string, unknown>) => ({
      id: uuidv4(),
      branchName,
      propertyCategory: String(item.propertyCategory || ""),
      propertyNo: String(item.propertyNo || ""),
      contractType: String(item.contractType || ""),
      maker: String(item.maker || ""),
      model: String(item.model || ""),
      quantity: Number(item.quantity) || 1,
      installDate: String(item.installDate || ""),
      leaseCompany: String(item.leaseCompany || ""),
      leasePeriodMonths:
        item.leasePeriodMonths != null ? Number(item.leasePeriodMonths) : null,
      monthlyAmount: Number(item.monthlyAmount) || 0,
      remainingMonths:
        item.remainingMonths != null ? Number(item.remainingMonths) : null,
      leaseStatus: String(item.leaseStatus || ""),
      maintenance: String(item.maintenance || ""),
      propertyStatus: String(item.propertyStatus || ""),
      salesRep: String(item.salesRep || ""),
      note: String(item.note || ""),
      isGrayRow: Boolean(item.isGrayRow),
    })
  );

  return {
    customerInfo,
    items,
    confidence: Number(parsed.confidence) || 0.5,
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.map(String)
      : [],
  };
}

export interface ParsedSalesResult {
  latestMonth: string;
  items: SalesRecord[];
  confidence: number;
  warnings: string[];
}

export function parseSalesResponse(
  responseText: string,
  branchName: string
): ParsedSalesResult {
  const jsonStr = extractJson(responseText);
  const parsed = JSON.parse(jsonStr);

  const items: SalesRecord[] = (parsed.items || []).map(
    (item: Record<string, unknown>) => ({
      id: uuidv4(),
      branchName,
      billingMonth: String(item.billingMonth || ""),
      orderNo: String(item.orderNo || ""),
      salesCategory: String(item.salesCategory || ""),
      amount: Number(item.amount) || 0,
      billingNo: String(item.billingNo || ""),
      note: String(item.note || ""),
    })
  );

  return {
    latestMonth: String(parsed.latestMonth || ""),
    items,
    confidence: Number(parsed.confidence) || 0.5,
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.map(String)
      : [],
  };
}
