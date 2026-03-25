"use client";

import { useReducer, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { StepIndicator } from "./StepIndicator";
import { UploadManager } from "@/components/upload/UploadManager";
import { ReviewPanel } from "@/components/review/ReviewPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UploadedImage } from "@/lib/types/branch";
import type { PropertyItem } from "@/lib/types/property";
import type { SalesRecord } from "@/lib/types/sales";
import { getPreviousMonth } from "@/lib/rules/salesRules";

// State
interface BranchExtraction {
  branchName: string;
  properties: PropertyItem[];
  sales: SalesRecord[];
  latestMonth: string;
  targetMonth: string;
  propertyConfidence: number;
  salesConfidence: number;
  warnings: string[];
}

interface AppState {
  currentStep: number;
  images: UploadedImage[];
  extractions: BranchExtraction[];
  processingProgress: { current: number; total: number; message: string };
  isProcessing: boolean;
  customerName: string;
  isGenerating: boolean;
}

type Action =
  | { type: "ADD_IMAGES"; images: UploadedImage[] }
  | { type: "UPDATE_IMAGE"; id: string; updates: Partial<UploadedImage> }
  | { type: "REMOVE_IMAGE"; id: string }
  | { type: "SET_STEP"; step: number }
  | { type: "SET_EXTRACTIONS"; extractions: BranchExtraction[] }
  | { type: "SET_PROCESSING"; isProcessing: boolean }
  | {
      type: "SET_PROGRESS";
      progress: { current: number; total: number; message: string };
    }
  | {
      type: "UPDATE_PROPERTY";
      branchName: string;
      itemId: string;
      updates: Partial<PropertyItem>;
    }
  | { type: "TOGGLE_PROPERTY_GRAY"; branchName: string; itemId: string }
  | {
      type: "UPDATE_SALES";
      branchName: string;
      itemId: string;
      updates: Partial<SalesRecord>;
    }
  | { type: "SET_CUSTOMER_NAME"; name: string }
  | { type: "SET_GENERATING"; isGenerating: boolean };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "ADD_IMAGES":
      return { ...state, images: [...state.images, ...action.images] };
    case "UPDATE_IMAGE":
      return {
        ...state,
        images: state.images.map((img) =>
          img.id === action.id ? { ...img, ...action.updates } : img
        ),
      };
    case "REMOVE_IMAGE":
      return {
        ...state,
        images: state.images.filter((img) => img.id !== action.id),
      };
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "SET_EXTRACTIONS":
      return { ...state, extractions: action.extractions };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.isProcessing };
    case "SET_PROGRESS":
      return { ...state, processingProgress: action.progress };
    case "UPDATE_PROPERTY":
      return {
        ...state,
        extractions: state.extractions.map((ext) =>
          ext.branchName === action.branchName
            ? {
                ...ext,
                properties: ext.properties.map((p) =>
                  p.id === action.itemId ? { ...p, ...action.updates } : p
                ),
              }
            : ext
        ),
      };
    case "TOGGLE_PROPERTY_GRAY":
      return {
        ...state,
        extractions: state.extractions.map((ext) =>
          ext.branchName === action.branchName
            ? {
                ...ext,
                properties: ext.properties.map((p) =>
                  p.id === action.itemId
                    ? { ...p, isGrayRow: !p.isGrayRow }
                    : p
                ),
              }
            : ext
        ),
      };
    case "UPDATE_SALES":
      return {
        ...state,
        extractions: state.extractions.map((ext) =>
          ext.branchName === action.branchName
            ? {
                ...ext,
                sales: ext.sales.map((s) =>
                  s.id === action.itemId ? { ...s, ...action.updates } : s
                ),
              }
            : ext
        ),
      };
    case "SET_CUSTOMER_NAME":
      return { ...state, customerName: action.name };
    case "SET_GENERATING":
      return { ...state, isGenerating: action.isGenerating };
    default:
      return state;
  }
}

const initialState: AppState = {
  currentStep: 1,
  images: [],
  extractions: [],
  processingProgress: { current: 0, total: 0, message: "" },
  isProcessing: false,
  customerName: "",
  isGenerating: false,
};

export function StepWizard() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // File upload handlers
  const handleAddImages = useCallback(async (files: File[]) => {
    const newImages: UploadedImage[] = [];
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      const base64 = await fileToBase64(file);
      const mediaType = file.type as UploadedImage["mediaType"];
      newImages.push({
        id: uuidv4(),
        file,
        preview,
        base64,
        mediaType: mediaType || "image/png",
        type: null,
        branchName: "",
        isDetecting: true,
      });
    }
    dispatch({ type: "ADD_IMAGES", images: newImages });

    // Auto-detect branch name and type for each image (sequential to inherit branch names)
    let lastDetectedBranch = "";
    for (const img of newImages) {
      try {
        const res = await fetch("/api/detect-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: img.base64,
            mediaType: img.mediaType,
          }),
        });
        const data = await res.json();
        const updates: Partial<UploadedImage> = { isDetecting: false };
        if (data.branchName) {
          updates.branchName = data.branchName;
          lastDetectedBranch = data.branchName;
        } else if (lastDetectedBranch) {
          // Sales images don't have branch name - inherit from previous
          updates.branchName = lastDetectedBranch;
        }
        if (data.type) updates.type = data.type;
        dispatch({ type: "UPDATE_IMAGE", id: img.id, updates });
      } catch {
        dispatch({
          type: "UPDATE_IMAGE",
          id: img.id,
          updates: { isDetecting: false },
        });
      }
    }
  }, []);

  // Process images via Claude API
  const handleProcess = useCallback(async () => {
    dispatch({ type: "SET_PROCESSING", isProcessing: true });
    dispatch({ type: "SET_STEP", step: 2 });

    const images = state.images.filter((i) => i.type && i.branchName);
    const total = images.length;

    // Group by branch
    const branchMap = new Map<
      string,
      { propertyImages: UploadedImage[]; salesImages: UploadedImage[] }
    >();
    for (const img of images) {
      const existing = branchMap.get(img.branchName) || {
        propertyImages: [],
        salesImages: [],
      };
      if (img.type === "property") existing.propertyImages.push(img);
      if (img.type === "sales") existing.salesImages.push(img);
      branchMap.set(img.branchName, existing);
    }

    const extractions: BranchExtraction[] = [];
    let processed = 0;

    for (const [branchName, { propertyImages, salesImages }] of branchMap) {
      const branchExtraction: BranchExtraction = {
        branchName,
        properties: [],
        sales: [],
        latestMonth: "",
        targetMonth: "",
        propertyConfidence: 0,
        salesConfidence: 0,
        warnings: [],
      };

      // Process property images
      for (const img of propertyImages) {
        processed++;
        dispatch({
          type: "SET_PROGRESS",
          progress: {
            current: processed,
            total,
            message: `${branchName} - 物件一覧を抽出中...`,
          },
        });

        try {
          const res = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: img.base64,
              mediaType: img.mediaType,
              extractionType: "property",
              branchName,
            }),
          });
          const data = await res.json();
          if (data.error) {
            branchExtraction.warnings.push(
              `物件一覧抽出エラー: ${data.error}`
            );
          } else {
            branchExtraction.properties.push(...data.data);
            branchExtraction.propertyConfidence = Math.max(
              branchExtraction.propertyConfidence,
              data.confidence || 0
            );
            if (data.warnings) {
              branchExtraction.warnings.push(...data.warnings);
            }
            if (
              data.customerInfo?.customerName &&
              !state.customerName
            ) {
              dispatch({
                type: "SET_CUSTOMER_NAME",
                name: data.customerInfo.customerName,
              });
            }
          }
        } catch (err) {
          branchExtraction.warnings.push(
            `物件一覧抽出失敗: ${err instanceof Error ? err.message : "不明なエラー"}`
          );
        }
      }

      // Process sales images
      for (const img of salesImages) {
        processed++;
        dispatch({
          type: "SET_PROGRESS",
          progress: {
            current: processed,
            total,
            message: `${branchName} - 売上履歴を抽出中...`,
          },
        });

        try {
          const res = await fetch("/api/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: img.base64,
              mediaType: img.mediaType,
              extractionType: "sales",
              branchName,
            }),
          });
          const data = await res.json();
          if (data.error) {
            branchExtraction.warnings.push(
              `売上履歴抽出エラー: ${data.error}`
            );
          } else {
            branchExtraction.sales.push(...data.data);
            branchExtraction.latestMonth =
              data.latestMonth || branchExtraction.latestMonth;
            if (branchExtraction.latestMonth) {
              branchExtraction.targetMonth = getPreviousMonth(branchExtraction.latestMonth);
            }
            branchExtraction.salesConfidence = Math.max(
              branchExtraction.salesConfidence,
              data.confidence || 0
            );
            if (data.warnings) {
              branchExtraction.warnings.push(...data.warnings);
            }
          }
        } catch (err) {
          branchExtraction.warnings.push(
            `売上履歴抽出失敗: ${err instanceof Error ? err.message : "不明なエラー"}`
          );
        }
      }

      extractions.push(branchExtraction);
    }

    dispatch({ type: "SET_EXTRACTIONS", extractions });
    dispatch({ type: "SET_PROCESSING", isProcessing: false });
    dispatch({ type: "SET_STEP", step: 3 });
  }, [state.images, state.customerName]);

  // Generate Excel
  const handleGenerateExcel = useCallback(async () => {
    dispatch({ type: "SET_GENERATING", isGenerating: true });

    try {
      const branches = state.extractions.map((ext) => ({
        branchName: ext.branchName,
        properties: ext.properties,
        sales: ext.sales,
        targetMonth: ext.targetMonth,
      }));

      const res = await fetch("/api/generate-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branches,
          customerName: state.customerName,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Excel生成に失敗しました");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("content-disposition") || "";
      const filenameMatch = disposition.match(/filename\*=UTF-8''(.+)/);
      a.href = url;
      a.download = filenameMatch
        ? decodeURIComponent(filenameMatch[1])
        : `${state.customerName || "顧客"}_拠点明細_${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 13)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        `Excel生成エラー: ${err instanceof Error ? err.message : "不明なエラー"}`
      );
    } finally {
      dispatch({ type: "SET_GENERATING", isGenerating: false });
    }
  }, [state.extractions, state.customerName]);

  const allImagesValid =
    state.images.length > 0 &&
    state.images.every((i) => i.type && i.branchName);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-center mb-2">
        拠点明細まとめ
      </h1>
      <p className="text-sm text-gray-500 text-center mb-6">
        スクリーンショットから物件一覧・売上履歴を抽出してExcel化
      </p>

      <StepIndicator currentStep={state.currentStep} />

      {/* Step 1: Upload */}
      {state.currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Step 1: スクリーンショットのアップロード
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">アップロードの手順:</p>
              <ol className="list-decimal pl-4 text-xs space-y-1">
                <li>
                  拠点ごとに2種類のスクリーンショットをアップロードしてください
                </li>
                <li>
                  <strong>A: 物件一覧</strong> — 顧客情報＋物件一覧が見える画面
                </li>
                <li>
                  <strong>B: 売上履歴</strong> — 売上履歴タブの最新月が見える画面
                </li>
                <li>各画像に「種別」と「拠点名」を設定してください</li>
              </ol>
            </div>

            <UploadManager
              images={state.images}
              onAddImages={handleAddImages}
              onUpdateImage={(id, updates) =>
                dispatch({ type: "UPDATE_IMAGE", id, updates })
              }
              onRemoveImage={(id) => dispatch({ type: "REMOVE_IMAGE", id })}
            />

            <div className="flex justify-end">
              <Button
                onClick={handleProcess}
                disabled={!allImagesValid || state.isProcessing}
                size="lg"
              >
                データを抽出する
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Processing */}
      {state.currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Step 2: データ抽出中...
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 py-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                {state.processingProgress.message || "準備中..."}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {state.processingProgress.current} /{" "}
                {state.processingProgress.total} 枚処理済み
              </p>
              <Progress
                value={
                  state.processingProgress.total > 0
                    ? (state.processingProgress.current /
                        state.processingProgress.total) *
                      100
                    : 0
                }
                className="max-w-md mx-auto"
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              画像1枚あたり10〜30秒ほどかかります。しばらくお待ちください。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review */}
      {state.currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Step 3: データ確認・編集
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReviewPanel
              branches={state.extractions}
              onUpdateProperty={(branchName, itemId, updates) =>
                dispatch({
                  type: "UPDATE_PROPERTY",
                  branchName,
                  itemId,
                  updates,
                })
              }
              onTogglePropertyGray={(branchName, itemId) =>
                dispatch({
                  type: "TOGGLE_PROPERTY_GRAY",
                  branchName,
                  itemId,
                })
              }
              onUpdateSales={(branchName, itemId, updates) =>
                dispatch({
                  type: "UPDATE_SALES",
                  branchName,
                  itemId,
                  updates,
                })
              }
            />

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => dispatch({ type: "SET_STEP", step: 1 })}
              >
                戻る
              </Button>
              <Button
                onClick={() => dispatch({ type: "SET_STEP", step: 4 })}
                size="lg"
              >
                Excel生成へ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Generate */}
      {state.currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Step 4: Excel生成・ダウンロード
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard
                title="拠点数"
                value={String(state.extractions.length)}
              />
              <SummaryCard
                title="物件数（全体）"
                value={String(
                  state.extractions.reduce(
                    (sum, e) => sum + e.properties.length,
                    0
                  )
                )}
              />
              <SummaryCard
                title="売上レコード数"
                value={String(
                  state.extractions.reduce(
                    (sum, e) => sum + e.sales.length,
                    0
                  )
                )}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">Excel出力設定</p>
              <div>
                <Label className="text-xs">顧客名（ファイル名に使用）</Label>
                <Input
                  value={state.customerName}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_CUSTOMER_NAME",
                      name: e.target.value,
                    })
                  }
                  placeholder="例: okutsu"
                  className="max-w-xs"
                />
              </div>
              <p className="text-xs text-gray-500">
                出力ファイル名: {state.customerName || "顧客"}_拠点明細_YYYYMMDD_HHMM.xlsx
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">出力内容（4シート）:</p>
              <ul className="text-xs space-y-1 list-disc pl-4">
                <li>物件一覧（当社導入「自」のみ、グレー・終了等を除外）</li>
                <li>売上履歴（最新月、同一受注NOを合算）</li>
                <li>拠点別サマリ（リース月額合計、売上合計等）</li>
                <li>除外一覧（除外理由付き）</li>
              </ul>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => dispatch({ type: "SET_STEP", step: 3 })}
              >
                戻る
              </Button>
              <Button
                onClick={handleGenerateExcel}
                disabled={state.isGenerating}
                size="lg"
              >
                {state.isGenerating ? "生成中..." : "Excelをダウンロード"}
              </Button>
            </div>

            <p className="text-sm text-red-600 font-medium mt-4">
              出力されたEXCELファイルは当社の営業機密情報です。顧客以外への情報漏洩は法的処置に問われる場合がありますので、データの取り扱いには十分注意してください
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white border rounded-lg p-4 text-center">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/...;base64, prefix
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
