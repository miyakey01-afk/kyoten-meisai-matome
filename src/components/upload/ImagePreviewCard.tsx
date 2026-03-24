"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UploadedImage } from "@/lib/types/branch";

interface ImagePreviewCardProps {
  image: UploadedImage;
  onTypeChange: (type: "property" | "sales" | null) => void;
  onBranchNameChange: (name: string) => void;
  onRemove: () => void;
  existingBranches: string[];
}

export function ImagePreviewCard({
  image,
  onTypeChange,
  onBranchNameChange,
  onRemove,
  existingBranches,
}: ImagePreviewCardProps) {
  return (
    <div className="border rounded-lg p-3 bg-white shadow-sm">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative w-32 h-24 flex-shrink-0 rounded overflow-hidden border bg-gray-100">
          <Image
            src={image.preview}
            alt="Screenshot"
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label className="text-xs text-gray-500">種別</Label>
              {image.isDetecting ? (
                <div className="h-8 flex items-center text-xs text-gray-400">検出中...</div>
              ) : (
              <Select
                value={image.type || ""}
                onValueChange={(v) =>
                  onTypeChange(v as "property" | "sales" | null)
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="種別を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property">A: 物件一覧</SelectItem>
                  <SelectItem value="sales">B: 売上履歴</SelectItem>
                </SelectContent>
              </Select>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 h-8 w-8 p-0 self-end"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          <div>
            <Label className="text-xs text-gray-500">拠点名</Label>
            {image.isDetecting ? (
              <div className="h-8 flex items-center text-xs text-gray-400">検出中...</div>
            ) : existingBranches.length > 0 ? (
              <div className="flex gap-1">
                <Input
                  value={image.branchName}
                  onChange={(e) => onBranchNameChange(e.target.value)}
                  placeholder="拠点名を入力"
                  className="h-8 text-sm flex-1"
                />
                <Select
                  value=""
                  onValueChange={(v) => v && onBranchNameChange(v)}
                >
                  <SelectTrigger className="h-8 w-10 text-sm p-1">
                    <span className="text-xs">▼</span>
                  </SelectTrigger>
                  <SelectContent>
                    {existingBranches.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Input
                value={image.branchName}
                onChange={(e) => onBranchNameChange(e.target.value)}
                placeholder="拠点名を入力"
                className="h-8 text-sm"
              />
            )}
          </div>
        </div>
      </div>

      {/* Validation indicators */}
      <div className="flex gap-2 mt-2">
        {image.type && (
          <span className={`text-xs px-2 py-0.5 rounded ${
            image.type === "property" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
          }`}>
            {image.type === "property" ? "物件一覧" : "売上履歴"}
          </span>
        )}
        {image.branchName && (
          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
            {image.branchName}
          </span>
        )}
        {!image.type && (
          <span className="text-xs text-orange-500">※種別を選択してください</span>
        )}
        {!image.branchName && (
          <span className="text-xs text-orange-500">※拠点名を入力してください</span>
        )}
      </div>
    </div>
  );
}
