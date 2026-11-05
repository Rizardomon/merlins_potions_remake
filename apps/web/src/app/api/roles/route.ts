import { proxyToApi } from "@/lib/bff";

/** Proxy do catálogo de papéis: lista e cria. */
export function GET() {
  return proxyToApi("/roles");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  return proxyToApi("/roles", { method: "POST", body });
}
