import { NextRequest, NextResponse } from "next/server";
import { proxyToApi } from "@/lib/bff";

const THIRTY_DAYS_IN_SECONDS = 30 * 24 * 60 * 60;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const response = await proxyToApi("/auth/sign-up", { method: "POST", body });

  if (!response.ok) {
    return response;
  }

  const data = await response.json();
  const { sessionToken } = data;

  const res = NextResponse.json(data, { status: response.status });

  res.cookies.set("mp_session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: THIRTY_DAYS_IN_SECONDS,
  });

  return res;
}
