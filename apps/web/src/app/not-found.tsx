import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-bg text-content">
      <p className="text-[64px] font-extrabold leading-none text-accent">404</p>
      <p className="text-content-2">Página não encontrada.</p>
      <Link
        href="/dashboard"
        className="rounded-input bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
