import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/claude/client";

export const maxDuration = 30;

interface DetectRequest {
  imageBase64: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
}

export async function POST(request: NextRequest) {
  try {
    const body: DetectRequest = await request.json();
    const { imageBase64, mediaType } = body;

    if (!imageBase64 || !mediaType) {
      return NextResponse.json(
        { error: "imageBase64 and mediaType are required" },
        { status: 400 }
      );
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `この画像は顧客管理システムのスクリーンショットです。以下の2点を判定してJSON形式で返してください。

1. branchName: 画面に「顧客略称」というフィールドがあれば、その値を返してください。なければ空文字。
2. type: この画面が「物件一覧」（物件区分・物件NO・型式などの表がある）なら "property"、「売上履歴」（日付・受注NO・売上分類・金額などの表がある）なら "sales" を返してください。判定できなければ null。

JSONのみ返してください（マークダウンのコードブロックなし）：
{"branchName": "", "type": null}`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: imageBase64,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    try {
      const parsed = JSON.parse(responseText.trim());
      return NextResponse.json({
        branchName: parsed.branchName || "",
        type: parsed.type === "property" || parsed.type === "sales" ? parsed.type : null,
      });
    } catch {
      return NextResponse.json({ branchName: "", type: null });
    }
  } catch (error) {
    console.error("Detect info error:", error);
    return NextResponse.json({ branchName: "", type: null });
  }
}
