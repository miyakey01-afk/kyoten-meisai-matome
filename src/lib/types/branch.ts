export interface UploadedImage {
  id: string;
  file: File;
  preview: string;          // Object URL for thumbnail
  base64: string;           // For sending to Claude API
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  type: "property" | "sales" | null;  // A: 物件一覧 / B: 売上履歴
  branchName: string;       // 拠点名
  isDetecting?: boolean;    // 拠点名・種別を自動検出中
}

export interface BranchPair {
  branchName: string;
  propertyImages: UploadedImage[];  // Type A (複数枚対応)
  salesImages: UploadedImage[];     // Type B (複数枚対応)
}

export interface BranchData {
  branchName: string;
  customerInfo?: {
    customerName: string;
    customerAbbr: string;
    customerNo: string;
    headOfficeNo: string;
  };
  properties: import("./property").PropertyItem[];
  sales: import("./sales").SalesRecord[];
}
