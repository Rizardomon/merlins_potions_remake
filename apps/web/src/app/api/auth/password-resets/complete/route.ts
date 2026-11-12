import { NextRequest, NextResponse } from "next/server";
import { proxyToApi } from "@/lib/bff";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const response = await proxyToApi("/auth/password-resets/complete", {
    method: "POST",
    body,
  });

  if (response.ok) {
    const res = new NextResponse(response.body, { status: response.status });
    res.cookies.delete("mp_session");
    return res;
  }

  return response;
}
