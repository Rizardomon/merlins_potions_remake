import { NextResponse } from "next/server";
import { proxyToApiWithAuth } from "@/lib/bff";

export async function GET() {
  return proxyToApiWithAuth("/auth/session");
}
