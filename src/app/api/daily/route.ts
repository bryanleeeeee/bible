import { NextResponse } from "next/server";
import { getDaily } from "@/lib/daily";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getDaily());
}
