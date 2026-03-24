"use client";

import { UploadZone } from "./UploadZone";
import { ImagePreviewCard } from "./ImagePreviewCard";
import type { UploadedImage } from "@/lib/types/branch";

interface UploadManagerProps {
  images: UploadedImage[];
  onAddImages: (files: File[]) => void;
  onUpdateImage: (id: string, updates: Partial<UploadedImage>) => void;
  onRemoveImage: (id: string) => void;
}

export function UploadManager({
  images,
  onAddImages,
  onUpdateImage,
  onRemoveImage,
}: UploadManagerProps) {
  const existingBranches = [
    ...new Set(images.map((i) => i.branchName).filter(Boolean)),
  ];

  const allValid = images.length > 0 && images.every((i) => i.type && i.branchName);

  // Group by branch for summary
  const branchSummary = new Map<string, { property: number; sales: number }>();
  for (const img of images) {
    if (!img.branchName) continue;
    const existing = branchSummary.get(img.branchName) || { property: 0, sales: 0 };
    if (img.type === "property") existing.property++;
    if (img.type === "sales") existing.sales++;
    branchSummary.set(img.branchName, existing);
  }

  return (
    <div className="space-y-6">
      <UploadZone onFilesAdded={onAddImages} />

      {images.length > 0 && (
        <>
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              アップロード状況: {images.length}枚
            </h3>
            {branchSummary.size > 0 && (
              <div className="flex flex-wrap gap-2">
                {Array.from(branchSummary.entries()).map(([branch, counts]) => (
                  <span
                    key={branch}
                    className="text-xs px-2 py-1 rounded bg-white border"
                  >
                    {branch}: 物件{counts.property}枚 / 売上{counts.sales}枚
                  </span>
                ))}
              </div>
            )}
            {!allValid && (
              <p className="text-xs text-orange-600 mt-2">
                全ての画像に種別と拠点名を設定してください
              </p>
            )}
          </div>

          {/* Image cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {images.map((image) => (
              <ImagePreviewCard
                key={image.id}
                image={image}
                onTypeChange={(type) => onUpdateImage(image.id, { type })}
                onBranchNameChange={(branchName) =>
                  onUpdateImage(image.id, { branchName })
                }
                onRemove={() => onRemoveImage(image.id)}
                existingBranches={existingBranches}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
