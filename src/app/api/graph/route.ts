import { NextRequest, NextResponse } from "next/server";
import { getGraph } from "@/lib/graph";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const focus = req.nextUrl.searchParams.get("focus") ?? undefined;
  const depth = Number(req.nextUrl.searchParams.get("depth") ?? 2);
  return NextResponse.json(getGraph(focus, depth));
}
