import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/claude/client";
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

    const client = getAnthropicClient();
    const prompt =
      extractionType === "property"
        ? buildPropertyPrompt(branchName)
        : buildSalesPrompt(branchName);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json(
        { error: "No text response from Claude" },
        { status: 500 }
      );
    }

    const responseText = textContent.text;

    if (extractionType === "property") {
      const result = parsePropertyResponse(responseText, branchName);
      return NextResponse.json({
        type: "property",
        customerInfo: result.customerInfo,
        data: result.items,
        confidence: result.confidence,
        warnings: result.warnings,
      });
    } else {
      const result = parseSalesResponse(responseText, branchName);
      return NextResponse.json({
        type: "sales",
        latestMonth: result.latestMonth,
        data: result.items,
        confidence: result.confidence,
        warnings: result.warnings,
      });
    }
  } catch (error) {
    console.error("Extraction error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
