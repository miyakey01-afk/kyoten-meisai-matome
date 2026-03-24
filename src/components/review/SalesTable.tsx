"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SalesRecord } from "@/lib/types/sales";

interface SalesTableProps {
  items: SalesRecord[];
  latestMonth: string;
  onUpdateItem: (id: string, updates: Partial<SalesRecord>) => void;
}

export function SalesTable({
  items,
  latestMonth,
  onUpdateItem,
}: SalesTableProps) {
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
  } | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        売上データがありません
      </p>
    );
  }

  const latestMonthItems = items.filter((i) => i.billingMonth === latestMonth);
  const otherItems = items.filter((i) => i.billingMonth !== latestMonth);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">最新月: {latestMonth}</Badge>
        <span className="text-xs text-gray-500">
          最新月: {latestMonthItems.length}件 / 全体: {items.length}件
        </span>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-green-50">
              <TableHead className="text-xs">請求年月</TableHead>
              <TableHead className="text-xs">受注NO</TableHead>
              <TableHead className="text-xs">売上分類</TableHead>
              <TableHead className="text-xs">金額</TableHead>
              <TableHead className="text-xs">請求先NO</TableHead>
              <TableHead className="text-xs">備考</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestMonthItems.map((item) => {
              const isExcluded =
                item.salesCategory.includes("障害") || item.amount === 0;

              return (
                <TableRow
                  key={item.id}
                  className={isExcluded ? "bg-red-50 line-through text-gray-400" : ""}
                >
                  <TableCell className="p-1 text-xs">
                    <Badge variant="default" className="text-[10px]">
                      {item.billingMonth}
                    </Badge>
                  </TableCell>
                  <TableCell className="p-1 text-xs">{item.orderNo}</TableCell>
                  <TableCell className="p-1 text-xs">
                    {item.salesCategory}
                    {item.salesCategory.includes("障害") && (
                      <Badge variant="destructive" className="text-[10px] ml-1">
                        除外
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="p-1 text-xs text-right">
                    <EditableAmount
                      value={item.amount}
                      isEditing={
                        editingCell?.id === item.id &&
                        editingCell?.field === "amount"
                      }
                      onStartEdit={() =>
                        setEditingCell({ id: item.id, field: "amount" })
                      }
                      onSave={(v) => {
                        onUpdateItem(item.id, { amount: v });
                        setEditingCell(null);
                      }}
                      onCancel={() => setEditingCell(null)}
                    />
                  </TableCell>
                  <TableCell className="p-1 text-xs">
                    {item.billingNo}
                  </TableCell>
                  <TableCell className="p-1 text-xs">{item.note}</TableCell>
                </TableRow>
              );
            })}
            {otherItems.length > 0 && (
              <>
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-xs text-gray-400 bg-gray-50 text-center py-1"
                  >
                    以下は最新月以外（参考表示・Excel出力対象外）
                  </TableCell>
                </TableRow>
                {otherItems.map((item) => (
                  <TableRow key={item.id} className="opacity-40">
                    <TableCell className="p-1 text-xs">
                      {item.billingMonth}
                    </TableCell>
                    <TableCell className="p-1 text-xs">
                      {item.orderNo}
                    </TableCell>
                    <TableCell className="p-1 text-xs">
                      {item.salesCategory}
                    </TableCell>
                    <TableCell className="p-1 text-xs text-right">
                      {item.amount.toLocaleString()}円
                    </TableCell>
                    <TableCell className="p-1 text-xs">
                      {item.billingNo}
                    </TableCell>
                    <TableCell className="p-1 text-xs">{item.note}</TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function EditableAmount({
  value,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
}: {
  value: number;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: number) => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState(String(value));

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => onSave(Number(editValue) || 0)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(Number(editValue) || 0);
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
        className="h-6 text-xs p-1 text-right"
      />
    );
  }

  return (
    <span
      onClick={onStartEdit}
      className="cursor-pointer hover:bg-yellow-50 px-1 rounded"
    >
      {value.toLocaleString()}円
    </span>
  );
}
