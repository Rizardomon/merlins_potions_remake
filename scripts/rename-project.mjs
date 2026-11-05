#!/usr/bin/env node
/**
 * rename-project.mjs — troca os placeholders do template pelo nome do seu projeto.
 *
 * Uso:
 *   node scripts/rename-project.mjs <slug> ["Nome de Exibição"]
 *   node scripts/rename-project.mjs --dry-run <slug>     # mostra o que mudaria
 *
 * Exemplo:
 *   node scripts/rename-project.mjs portal-rh "Portal RH"
 *
 * O que ele substitui:
 *   @app/…        → @<slug>/…        (escopo dos pacotes do workspace)
 *   app-template  → <slug>           (nome do pacote raiz e do repo)
 *   App Template  → <Nome>           (títulos exibidos: <title>, sidebar, Swagger)
 *   [app-server]  → [<slug>-server]  (prefixo do log de boot)
 *
 * Rode-o UMA vez, logo após clonar, e **antes do `pnpm install`** — o escopo dos pacotes
 * do workspace muda, e o lockfile é reescrito junto para continuar batendo.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;

/** Pastas que nunca são varridas (build, deps, histórico). */
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "tmp",
]);

/** Só arquivos de texto que podem conter os placeholders. */
const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".yaml",
  ".yml",
  ".css",
  ".sh",
  ".example",
  ".sql",
]);

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const rest = argv.filter((a) => a !== "--dry-run");
  const [slug, displayName] = rest;

  if (!slug) {
    console.error(
      "Uso: node scripts/rename-project.mjs [--dry-run] <slug> [\"Nome de Exibição\"]",
    );
    process.exit(1);
  }
  // O slug vira escopo npm (@slug/web) e nome de pacote — o npm só aceita esse formato.
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error(
      `Slug inválido: "${slug}". Use minúsculas, números e hífens (ex.: portal-rh).`,
    );
    process.exit(1);
  }

  return {
    dryRun,
    slug,
    // Sem nome de exibição, deriva do slug: "portal-rh" → "Portal Rh".
    displayName:
      displayName ??
      slug
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" "),
  };
}

/** Ordem importa: o mais específico primeiro, senão um prefixo come o outro. */
function replacements({ slug, displayName }) {
  return [
    [/\[app-server\]/g, `[${slug}-server]`],
    [/@app\//g, `@${slug}/`],
    [/app-template/g, slug],
    [/App Template/g, displayName],
  ];
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      yield* walk(path);
    } else if ([...EXTENSIONS].some((ext) => entry.endsWith(ext))) {
      yield path;
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const rules = replacements(options);
  const changed = [];

  for (const path of walk(ROOT)) {
    // O próprio script contém os placeholders na documentação — pular evita
    // reescrevê-lo e perder as instruções.
    if (path.endsWith("rename-project.mjs")) continue;

    const original = readFileSync(path, "utf8");
    let next = original;
    for (const [pattern, value] of rules) next = next.replace(pattern, value);

    if (next !== original) {
      changed.push(relative(ROOT, path));
      if (!options.dryRun) writeFileSync(path, next);
    }
  }

  const verb = options.dryRun ? "seriam alterados" : "alterados";
  console.log(`${changed.length} arquivo(s) ${verb}:`);
  for (const path of changed) console.log(`  ${path}`);

  if (options.dryRun) return;

  console.log(`\n✅ Projeto renomeado para "${options.displayName}" (@${options.slug}).`);
  console.log("\nPróximos passos:");
  console.log("  1. pnpm install");
  console.log("  2. Troque a marca em apps/web/src/components/layout/sidebar.tsx");
  console.log("  3. Revise o README.md e o AGENTS.md com o contexto do projeto");
}

main();
