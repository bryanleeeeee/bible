import { NextRequest, NextResponse } from "next/server";
import { askAssistant } from "@/lib/assistant";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  const reply = await askAssistant(question.slice(0, 500));
  return NextResponse.json(reply);
}
