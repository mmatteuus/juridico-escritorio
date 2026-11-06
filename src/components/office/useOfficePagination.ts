import { useEffect, useState } from "react";

export type OfficePaginationState = {
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  start: number;
  end: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export function useOfficePagination<T>(items: T[], resetKey: string) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = items.length ? (currentPage - 1) * pageSize : 0;
  const endIndex = Math.min(startIndex + pageSize, items.length);

  useEffect(() => setPage(1), [resetKey]);
  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);

  return {
    items: items.slice(startIndex, endIndex),
    total: items.length,
    page: currentPage,
    pageCount,
    pageSize,
    start: items.length ? startIndex + 1 : 0,
    end: endIndex,
    onPageChange: setPage,
    onPageSizeChange: (size: number) => {
      setPageSize(size);
      setPage(1);
    },
  };
}
