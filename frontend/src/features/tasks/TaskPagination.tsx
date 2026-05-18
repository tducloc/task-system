import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { PaginationMeta } from "./types";

interface TaskPaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

const MAX_VISIBLE_PAGES = 5;

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];

  if (current > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push("ellipsis");
  }

  pages.push(total);
  return pages;
}

export function TaskPagination({ meta, onPageChange }: TaskPaginationProps) {
  const { page, totalPage, total } = meta;

  if (totalPage <= 1) return null;

  const pages = getPageNumbers(page, totalPage);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <span className="text-sm text-muted-foreground hidden sm:inline">
        Tổng {total} mục
      </span>
      <span className="text-sm text-muted-foreground sm:hidden">
        {page}/{totalPage}
      </span>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(page - 1)}
              className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>

          {/* Page numbers — hidden on mobile */}
          {pages.map((p, i) => (
            <PaginationItem key={`${p}-${i}`} className="hidden sm:inline-flex">
              {p === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={p === page}
                  onClick={() => onPageChange(p)}
                  className="cursor-pointer"
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(page + 1)}
              className={page >= totalPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
