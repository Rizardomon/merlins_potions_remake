import { NextRequest } from "next/server";
import { proxyToApi } from "@/lib/bff";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return proxyToApi("/auth/password-resets", { method: "POST", body });
}
