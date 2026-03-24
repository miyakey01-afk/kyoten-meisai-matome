export interface PropertyItem {
  id: string;
  branchName: string;       // 拠点名
  propertyCategory: string; // 物件区分
  propertyNo: string;       // 物件NO（例: 自-0001, 他-0032）
  contractType: string;     // 契約（リース/レンタル/買取 等）
  maker: string;            // メーカー
  model: string;            // 型式
  quantity: number;         // 台数
  installDate: string;      // 設置日
  leaseCompany: string;     // リース会社
  leasePeriodMonths: number | null; // 期間(月)
  monthlyAmount: number;    // 月額(円)
  remainingMonths: number | null;   // 残数
  leaseStatus: string;      // リース状況
  maintenance: string;      // メンテ
  propertyStatus: string;   // 物件状況
  salesRep: string;         // 営業担当
  note: string;             // 備考
  isGrayRow: boolean;       // グレー行（非アクティブ）判定
}

export interface CustomerInfo {
  customerName: string;     // 顧客名
  customerAbbr: string;     // 顧客略称（拠点名）
  customerNo: string;       // 顧客NO
  headOfficeNo: string;     // 本店NO
}
