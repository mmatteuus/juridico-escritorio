import { Button } from "@/components/ui/button";
import type { OfficePaginationState } from "@/components/office/useOfficePagination";

export function OfficePaginationControls({ pagination }: { pagination: OfficePaginationState }) {
  const pageSizes = [3, 5, 10, 25, 50];
  if (pagination.total === 0) return null;

  return (
    <nav aria-label="Paginação da lista" className="mt-4 flex flex-col gap-3 rounded-lg border bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Exibindo <span className="tabular-nums">{pagination.start}–{pagination.end}</span> de <span className="tabular-nums">{pagination.total}</span> {pagination.total === 1 ? "registro" : "registros"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Itens por página
          <select
            aria-label="Itens por página"
            className="h-9 rounded-md border bg-background px-2 text-foreground"
            value={pagination.pageSize}
            onChange={(event) => pagination.onPageSizeChange(Number(event.target.value))}
          >
            {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <span className="min-w-20 text-center text-sm tabular-nums text-muted-foreground" aria-label={`Página ${pagination.page} de ${pagination.pageCount}`}>
          {pagination.page} / {pagination.pageCount}
        </span>
        <Button type="button" size="sm" variant="outline" aria-label="Página anterior" disabled={pagination.page <= 1} onClick={() => pagination.onPageChange(pagination.page - 1)}>
          Anterior
        </Button>
        <Button type="button" size="sm" variant="outline" aria-label="Próxima página" disabled={pagination.page >= pagination.pageCount} onClick={() => pagination.onPageChange(pagination.page + 1)}>
          Próxima
        </Button>
      </div>
    </nav>
  );
}
