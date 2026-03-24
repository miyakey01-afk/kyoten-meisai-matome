"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PropertyTable } from "./PropertyTable";
import { SalesTable } from "./SalesTable";
import type { PropertyItem } from "@/lib/types/property";
import type { SalesRecord } from "@/lib/types/sales";

interface BranchReviewData {
  branchName: string;
  properties: PropertyItem[];
  sales: SalesRecord[];
  latestMonth: string;
  targetMonth: string;
  propertyConfidence: number;
  salesConfidence: number;
  warnings: string[];
}

interface ReviewPanelProps {
  branches: BranchReviewData[];
  onUpdateProperty: (
    branchName: string,
    itemId: string,
    updates: Partial<PropertyItem>
  ) => void;
  onTogglePropertyGray: (branchName: string, itemId: string) => void;
  onUpdateSales: (
    branchName: string,
    itemId: string,
    updates: Partial<SalesRecord>
  ) => void;
}

export function ReviewPanel({
  branches,
  onUpdateProperty,
  onTogglePropertyGray,
  onUpdateSales,
}: ReviewPanelProps) {
  if (branches.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        抽出されたデータがありません
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          抽出されたデータを確認してください。セルをクリックして編集できます。
          グレー行のチェックボックスで除外対象をマークできます。
        </p>
      </div>

      <Tabs defaultValue={branches[0]?.branchName}>
        <TabsList className="flex-wrap h-auto gap-1">
          {branches.map((branch) => (
            <TabsTrigger
              key={branch.branchName}
              value={branch.branchName}
              className="text-sm"
            >
              {branch.branchName}
              {(branch.propertyConfidence < 0.7 ||
                branch.salesConfidence < 0.7) && (
                <Badge variant="destructive" className="ml-1 text-[10px]">
                  低信頼度
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {branches.map((branch) => (
          <TabsContent
            key={branch.branchName}
            value={branch.branchName}
            className="space-y-6"
          >
            {/* Warnings */}
            {branch.warnings.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-800 mb-1">
                  注意事項:
                </p>
                <ul className="text-xs text-orange-700 list-disc pl-4">
                  {branch.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confidence indicators */}
            <div className="flex gap-4 text-xs">
              <span>
                物件一覧 信頼度:{" "}
                <ConfidenceBadge confidence={branch.propertyConfidence} />
              </span>
              <span>
                売上履歴 信頼度:{" "}
                <ConfidenceBadge confidence={branch.salesConfidence} />
              </span>
            </div>

            {/* Property Table */}
            <div>
              <h3 className="text-sm font-medium mb-2">
                物件一覧 ({branch.properties.length}件)
              </h3>
              <PropertyTable
                items={branch.properties}
                onUpdateItem={(id, updates) =>
                  onUpdateProperty(branch.branchName, id, updates)
                }
                onToggleGray={(id) =>
                  onTogglePropertyGray(branch.branchName, id)
                }
              />
            </div>

            {/* Sales Table */}
            <div>
              <h3 className="text-sm font-medium mb-2">
                売上履歴 ({branch.sales.length}件)
              </h3>
              <SalesTable
                items={branch.sales}
                latestMonth={branch.latestMonth}
                targetMonth={branch.targetMonth}
                onUpdateItem={(id, updates) =>
                  onUpdateSales(branch.branchName, id, updates)
                }
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  let variant: "default" | "secondary" | "destructive" = "default";
  if (confidence < 0.7) variant = "destructive";
  else if (confidence < 0.85) variant = "secondary";

  return (
    <Badge variant={variant} className="text-[10px]">
      {pct}%
    </Badge>
  );
}
