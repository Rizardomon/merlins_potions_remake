import { NextResponse } from "next/server";
import { proxyToApiWithAuth } from "@/lib/bff";

export async function POST() {
  const response = await proxyToApiWithAuth("/auth/sign-out", { method: "POST" });

  if (response.ok) {
    const res = new NextResponse(response.body, { status: response.status });
    res.cookies.delete("mp_session");
    return res;
  }

  return response;
}
