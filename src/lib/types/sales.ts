export interface SalesRecord {
  id: string;
  branchName: string;       // 拠点名
  billingMonth: string;     // 請求年月（YYYY-MM）
  orderNo: string;          // 受注NO
  salesCategory: string;    // 売上分類
  amount: number;           // 金額
  billingNo: string;        // 請求先NO
  note: string;             // 備考
}

export interface AggregatedSalesRecord {
  branchName: string;
  billingMonth: string;
  orderNo: string;
  salesCategory: string;
  totalAmount: number;      // 集約後合算金額
  billingNo: string;
  note: string;
  originalCount: number;    // 集約前の行数
}
