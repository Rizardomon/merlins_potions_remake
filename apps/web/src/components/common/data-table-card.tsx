"use client";

import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { InputWithIcon } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { Page } from "@merlins-potions-remake/shared";

/** Tamanho de página padrão das tabelas de listagem. */
export const TABLE_PAGE_SIZE = 12;

export interface DataColumn<T> {
  /** Conteúdo do cabeçalho da coluna. */
  header: ReactNode;
  /** Render da célula para um item. */
  cell: (item: T) => ReactNode;
  headClassName?: string;
  cellClassName?: string;
}

/**
 * Tabela de listagem padrão: header com título à esquerda e busca à direita,
 * corpo por configuração de colunas, estados de carregando/vazio e paginação. Dona do
 * estado de `search`/`page`; os dados vêm de `useData(search, page)` (hook TanStack Query
 * para dados do backend, ou paginação local via `localTablePage`). Ver docs/padroes/ui-web.md.
 */
export function DataTableCard<T>({
  title,
  columns,
  useData,
  rowKey,
  onRowClick,
  searchPlaceholder = "Pesquisar...",
  emptyText = "Nenhum registro encontrado.",
  headerRight,
  paginated = true,
  stickyHeader = false,
}: {
  title: string;
  columns: DataColumn<T>[];
  useData: (search: string, page: number) => { data?: Page<T>; isLoading: boolean };
  rowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Ação opcional à esquerda da busca no header (ex.: botão adicionar). */
  headerRight?: ReactNode;
  /** `false` → lista completa, sem controle de paginação (o `useData` deve devolver tudo). */
  paginated?: boolean;
  /** Cabeçalho fixo enquanto as linhas rolam. Abre mão do scroll horizontal interno. */
  stickyHeader?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useData(search, page);

  const items = data?.items ?? [];
  const pageSize = data?.pageSize ?? TABLE_PAGE_SIZE;
  const total = data?.total ?? 0;
  const colCount = columns.length;

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const countLabel = isLoading
    ? "Carregando…"
    : total === 0
      ? "Nenhum registro"
      : paginated
        ? `Mostrando ${from}–${to} de ${total}`
        : `${total} ${total === 1 ? "registro" : "registros"}`;

  return (
    // `min-w-0`: sem isso o card (filho flex) cresce com a tabela larga em vez de deixá-la
    // rolar no `overflow-x-auto` interno — a última coluna vazava para fora do card.
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div className="flex items-center gap-2">
          {headerRight}
          <InputWithIcon
            icon={<Search className="h-4 w-4" strokeWidth={2} />}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            wrapperClassName="w-[240px]"
            className="h-10"
          />
        </div>
      </CardHeader>

      <Table stickyHeader={stickyHeader}>
        <THead sticky={stickyHeader}>
          <TR>
            {columns.map((c, i) => (
              <TH key={i} className={c.headClassName}>
                {c.header}
              </TH>
            ))}
          </TR>
        </THead>
        <TBody>
          {isLoading ? (
            Array.from({ length: pageSize }).map((_, i) => (
              <TR key={i}>
                <TD colSpan={colCount}>
                  <Skeleton className="h-6 w-full" />
                </TD>
              </TR>
            ))
          ) : items.length ? (
            items.map((item) => (
              <TR
                key={rowKey(item)}
                clickable={Boolean(onRowClick)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((c, i) => (
                  <TD key={i} className={c.cellClassName}>
                    {c.cell(item)}
                  </TD>
                ))}
              </TR>
            ))
          ) : (
            <TR>
              <TD colSpan={colCount} className="py-10 text-center text-content-3">
                {emptyText}
              </TD>
            </TR>
          )}
        </TBody>
      </Table>

      <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-3">
        <span className="text-[13px] text-content-3">{countLabel}</span>
        {paginated && (
          <Pagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
        )}
      </div>
    </Card>
  );
}

/**
 * Adapta uma lista local (em memória/estado) ao formato consumido pelo `DataTableCard`,
 * aplicando busca e paginação client-side. Use quando a listagem já tem todos os itens em
 * mãos, em vez de vir paginada do backend.
 */
export function localTablePage<T>(
  all: T[],
  search: string,
  page: number,
  matches: (item: T, q: string) => boolean,
  pageSize = TABLE_PAGE_SIZE,
): { data: Page<T>; isLoading: false } {
  const q = search.trim().toLowerCase();
  const filtered = q ? all.filter((i) => matches(i, q)) : all;
  const start = (page - 1) * pageSize;
  return {
    data: {
      items: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize,
    },
    isLoading: false,
  };
}
