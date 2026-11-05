"use client";

import { Dialog } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { useTheme, type Theme } from "@/components/theme/theme-provider";

/** Versão exibida nas configurações — atualize a cada release do projeto. */
const VERSION = "v0.1.0";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5 last:border-0">
      <span className="text-[11px] font-bold uppercase tracking-[.06em] text-content-3">
        {label}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * Configurações da aplicação. Com autenticação plugada, é aqui que entram os dados do
 * usuário logado e o botão de sair.
 */
export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onClose={onClose} title="Configurações">
      <div className="px-6 py-2">
        <Row label="Tema">
          <Segmented<Theme>
            value={theme}
            onValueChange={setTheme}
            options={[
              { value: "light", label: "Claro" },
              { value: "dark", label: "Escuro" },
            ]}
          />
        </Row>
        <Row label="Versão">
          <span className="font-mono text-[13px] text-content-2">{VERSION}</span>
        </Row>
      </div>
    </Dialog>
  );
}
