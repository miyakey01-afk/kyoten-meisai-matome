export function buildPropertyPrompt(branchName?: string): string {
  const branchContext = branchName
    ? `この画像は拠点「${branchName}」のものです。`
    : "";

  return `あなたは顧客管理システムのスクリーンショットからデータを抽出するエキスパートです。
${branchContext}

この画像から以下の情報を抽出してください：

## 1. 画面上部の顧客情報（存在する場合）
- 顧客名
- 顧客略称（拠点名）
- 顧客NO
- 本店NO

## 2. 物件一覧テーブル（全行を抽出）
各行について以下のフィールドを抽出してください：
- propertyCategory: 物件区分
- propertyNo: 物件NO（「自-XXXX」「他-XXXX」など。先頭の「自」「他」を正確に読み取ること）
- contractType: 契約（リース/レンタル/買取 等）
- maker: メーカー
- model: 型式
- quantity: 台数（数値）
- installDate: 設置日（YYYY/MM/DD形式）
- leaseCompany: リース会社
- leasePeriodMonths: 期間(月)（数値、なければnull）
- monthlyAmount: 月額(円)（数値、カンマ・円記号を除去）
- remainingMonths: 残数（数値、なければnull）
- leaseStatus: リース状況
- maintenance: メンテ
- propertyStatus: 物件状況
- salesRep: 営業担当
- note: 備考
- isGrayRow: この行がグレー（灰色）背景で表示されているか（true/false）

## 重要な注意事項
- 物件NOの先頭文字（「自」または「他」）は最も重要な情報です。必ず正確に読み取ってください。
- グレー背景の行は isGrayRow: true としてください。
- 読み取れない・不明確なセルは空文字列("")としてください。
- 金額は数値のみ（カンマ、円記号なし）で返してください。

以下のJSON形式で返してください（JSONのみ、マークダウンのコードブロックなし）：
{
  "customerInfo": {
    "customerName": "顧客名",
    "customerAbbr": "顧客略称",
    "customerNo": "顧客NO",
    "headOfficeNo": "本店NO"
  },
  "items": [
    {
      "propertyCategory": "",
      "propertyNo": "",
      "contractType": "",
      "maker": "",
      "model": "",
      "quantity": 1,
      "installDate": "",
      "leaseCompany": "",
      "leasePeriodMonths": null,
      "monthlyAmount": 0,
      "remainingMonths": null,
      "leaseStatus": "",
      "maintenance": "",
      "propertyStatus": "",
      "salesRep": "",
      "note": "",
      "isGrayRow": false
    }
  ],
  "confidence": 0.9,
  "warnings": []
}`;
}

export function buildSalesPrompt(branchName?: string): string {
  const branchContext = branchName
    ? `この画像は拠点「${branchName}」のものです。`
    : "";

  return `あなたは顧客管理システムのスクリーンショットからデータを抽出するエキスパートです。
${branchContext}

この画像は「売上履歴」画面のスクリーンショットです。以下の情報を抽出してください：

## 売上履歴テーブル（全行を抽出）
各行について以下のフィールドを抽出してください：
- billingMonth: 日付/請求年月（YYYY-MM形式に変換。例：2025年3月 → 2025-03）
- orderNo: 受注NO
- salesCategory: 売上分類
- amount: 金額（数値、カンマ・円記号を除去。マイナスの場合は負の数値）
- billingNo: 請求先NO（あれば）
- note: 備考（あれば）

## 重要な注意事項
- 最上段の日付が最新月です。最新月を特定して返してください。
- 全ての行を抽出してください（最新月以外も含む）。
- 読み取れない・不明確なセルは空文字列("")としてください。
- 金額は数値のみ（カンマ、円記号なし）で返してください。

以下のJSON形式で返してください（JSONのみ、マークダウンのコードブロックなし）：
{
  "latestMonth": "YYYY-MM",
  "items": [
    {
      "billingMonth": "YYYY-MM",
      "orderNo": "",
      "salesCategory": "",
      "amount": 0,
      "billingNo": "",
      "note": ""
    }
  ],
  "confidence": 0.9,
  "warnings": []
}`;
}
