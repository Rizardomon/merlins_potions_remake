import { proxyToApi } from "@/lib/bff";

/** Proxy do menu de navegação — alimenta a sidebar e os títulos da topbar. */
export function GET() {
  return proxyToApi("/menu");
}
