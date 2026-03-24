import { NextRequest, NextResponse } from "next/server";
import { generateExcel } from "@/lib/excel/generator";
import { applyPropertyRules } from "@/lib/rules/propertyRules";
import { applySalesRules } from "@/lib/rules/salesRules";
import type { PropertyItem } from "@/lib/types/property";
import type { SalesRecord } from "@/lib/types/sales";
import type { ExclusionRecord } from "@/lib/types/extraction";

interface BranchInput {
  branchName: string;
  properties: PropertyItem[];
  sales: SalesRecord[];
  latestMonth: string;
}

interface GenerateRequest {
  branches: BranchInput[];
  customerName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { branches, customerName } = body;

    if (!branches || branches.length === 0) {
      return NextResponse.json(
        { error: "branches array is required" },
        { status: 400 }
      );
    }

    const allIncludedProperties: PropertyItem[] = [];
    const allExclusions: ExclusionRecord[] = [];
    const allSalesIncluded: import("@/lib/types/sales").AggregatedSalesRecord[] =
      [];

    for (const branch of branches) {
      // Apply property rules
      const propertyResult = applyPropertyRules(branch.properties);
      allIncludedProperties.push(...propertyResult.included);
      allExclusions.push(...propertyResult.excluded);

      // Apply sales rules
      const salesResult = applySalesRules(branch.sales, branch.latestMonth);
      allSalesIncluded.push(...salesResult.included);
      allExclusions.push(...salesResult.excluded);
    }

    const buffer = await generateExcel({
      properties: allIncludedProperties,
      sales: allSalesIncluded,
      exclusions: allExclusions,
      customerName,
    });

    const today = new Date().toISOString().split("T")[0];
    const safeName = customerName
      ? customerName.replace(/[^a-zA-Z0-9_-]/g, "_")
      : "customer";
    const filename = `contracts_${safeName}_${today}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Excel generation error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
