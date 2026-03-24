import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/claude/client";
import { buildPropertyPrompt, buildSalesPrompt } from "@/lib/claude/prompts";
import { parsePropertyResponse, parseSalesResponse } from "@/lib/claude/parser";

export const maxDuration = 60;

interface ExtractRequest {
  imageBase64: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  extractionType: "property" | "sales";
  branchName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtractRequest = await request.json();
    const { imageBase64, mediaType, extractionType, branchName } = body;

    if (!imageBase64 || !mediaType || !extractionType) {
      return NextResponse.json(
        { error: "imageBase64, mediaType, extractionType are required" },
        { status: 400 }
      );
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt =
      extractionType === "property"
        ? buildPropertyPrompt(branchName)
        : buildSalesPrompt(branchName);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: imageBase64,
        },
      },
      { text: prompt },
    ]);

    const response = result.response;
    const responseText = response.text();

    if (!responseText) {
      return NextResponse.json(
        { error: "No text response from Gemini" },
        { status: 500 }
      );
    }

    if (extractionType === "property") {
      const parsed = parsePropertyResponse(responseText, branchName);
      return NextResponse.json({
        type: "property",
        customerInfo: parsed.customerInfo,
        data: parsed.items,
        confidence: parsed.confidence,
        warnings: parsed.warnings,
      });
    } else {
      const parsed = parseSalesResponse(responseText, branchName);
      return NextResponse.json({
        type: "sales",
        latestMonth: parsed.latestMonth,
        data: parsed.items,
        confidence: parsed.confidence,
        warnings: parsed.warnings,
      });
    }
  } catch (error) {
    console.error("Extraction error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
