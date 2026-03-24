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
import type { PropertyItem } from "@/lib/types/property";

interface PropertyTableProps {
  items: PropertyItem[];
  onUpdateItem: (id: string, updates: Partial<PropertyItem>) => void;
  onToggleGray: (id: string) => void;
}

export function PropertyTable({
  items,
  onUpdateItem,
  onToggleGray,
}: PropertyTableProps) {
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
  } | null>(null);

  const handleCellEdit = (
    id: string,
    field: keyof PropertyItem,
    value: string | number
  ) => {
    onUpdateItem(id, { [field]: value });
    setEditingCell(null);
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        物件データがありません
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-50">
            <TableHead className="text-xs w-8">グレー</TableHead>
            <TableHead className="text-xs">物件NO</TableHead>
            <TableHead className="text-xs">物件区分</TableHead>
            <TableHead className="text-xs">契約</TableHead>
            <TableHead className="text-xs">メーカー</TableHead>
            <TableHead className="text-xs">型式</TableHead>
            <TableHead className="text-xs">台数</TableHead>
            <TableHead className="text-xs">月額(円)</TableHead>
            <TableHead className="text-xs">リース状況</TableHead>
            <TableHead className="text-xs">物件状況</TableHead>
            <TableHead className="text-xs">備考</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const isExcluded =
              item.isGrayRow ||
              !item.propertyNo.startsWith("自") ||
              ["終了", "当社解約", "撤去"].some(
                (s) =>
                  item.propertyStatus.includes(s) ||
                  item.leaseStatus.includes(s)
              );

            return (
              <TableRow
                key={item.id}
                className={`${item.isGrayRow ? "bg-gray-100 opacity-60" : ""} ${
                  isExcluded ? "line-through text-gray-400" : ""
                }`}
              >
                <TableCell className="p-1">
                  <input
                    type="checkbox"
                    checked={item.isGrayRow}
                    onChange={() => onToggleGray(item.id)}
                    className="w-4 h-4"
                  />
                </TableCell>
                <TableCell className="p-1">
                  <EditableField
                    value={item.propertyNo}
                    isEditing={
                      editingCell?.id === item.id &&
                      editingCell?.field === "propertyNo"
                    }
                    onStartEdit={() =>
                      setEditingCell({ id: item.id, field: "propertyNo" })
                    }
                    onSave={(v) => handleCellEdit(item.id, "propertyNo", v)}
                    onCancel={() => setEditingCell(null)}
                  />
                  {item.propertyNo.startsWith("自") && (
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      自社
                    </Badge>
                  )}
                  {item.propertyNo.startsWith("他") && (
                    <Badge variant="destructive" className="text-[10px] ml-1">
                      他社
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="p-1 text-xs">
                  {item.propertyCategory}
                </TableCell>
                <TableCell className="p-1 text-xs">
                  {item.contractType}
                </TableCell>
                <TableCell className="p-1 text-xs">{item.maker}</TableCell>
                <TableCell className="p-1 text-xs">{item.model}</TableCell>
                <TableCell className="p-1 text-xs text-center">
                  {item.quantity}
                </TableCell>
                <TableCell className="p-1 text-xs text-right">
                  <EditableField
                    value={String(item.monthlyAmount)}
                    isEditing={
                      editingCell?.id === item.id &&
                      editingCell?.field === "monthlyAmount"
                    }
                    onStartEdit={() =>
                      setEditingCell({ id: item.id, field: "monthlyAmount" })
                    }
                    onSave={(v) =>
                      handleCellEdit(item.id, "monthlyAmount", Number(v) || 0)
                    }
                    onCancel={() => setEditingCell(null)}
                    formatDisplay={(v) =>
                      Number(v).toLocaleString() + "円"
                    }
                  />
                </TableCell>
                <TableCell className="p-1 text-xs">
                  {item.leaseStatus}
                </TableCell>
                <TableCell className="p-1 text-xs">
                  {item.propertyStatus}
                </TableCell>
                <TableCell className="p-1 text-xs">
                  <EditableField
                    value={item.note}
                    isEditing={
                      editingCell?.id === item.id &&
                      editingCell?.field === "note"
                    }
                    onStartEdit={() =>
                      setEditingCell({ id: item.id, field: "note" })
                    }
                    onSave={(v) => handleCellEdit(item.id, "note", v)}
                    onCancel={() => setEditingCell(null)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function EditableField({
  value,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  formatDisplay,
}: {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  formatDisplay?: (value: string) => string;
}) {
  const [editValue, setEditValue] = useState(value);

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => onSave(editValue)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(editValue);
          if (e.key === "Escape") onCancel();
        }}
        autoFocus
        className="h-6 text-xs p-1"
      />
    );
  }

  return (
    <span
      onClick={onStartEdit}
      className="cursor-pointer hover:bg-yellow-50 px-1 rounded text-xs"
    >
      {formatDisplay ? formatDisplay(value) : value || "-"}
    </span>
  );
}
