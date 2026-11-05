import { proxyToApi } from "@/lib/bff";

/** Proxy de papel por id: atualiza e remove. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  return proxyToApi(`/roles/${encodeURIComponent(id)}`, { method: "PUT", body });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToApi(`/roles/${encodeURIComponent(id)}`, { method: "DELETE" });
}
