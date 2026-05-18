import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SortBy, OrderBy, TaskStatus } from "./types";
import type { TaskQueryParams } from "./types";

export const DEFAULT_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 400;

function parsePageParam(value: string | null): number {
  const n = Number(value);
  return n > 0 ? n : 1;
}

function parseEnumArray<T extends string>(values: string[], validValues: T[]): T[] | undefined {
  const filtered = values.filter((v): v is T => validValues.includes(v as T));
  return filtered.length > 0 ? filtered : undefined;
}

export function useTaskFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout>>();

  // Read state from URL
  const queryParams: TaskQueryParams = useMemo(() => ({
    page: parsePageParam(searchParams.get("page")),
    limit: DEFAULT_LIMIT,
    sortBy: parseEnumArray([searchParams.get("sortBy") ?? ""], Object.values(SortBy))?.[0],
    orderBy: parseEnumArray([searchParams.get("orderBy") ?? ""], Object.values(OrderBy))?.[0],
    statuses: parseEnumArray(searchParams.getAll("statuses"), Object.values(TaskStatus)),
    assignees: searchParams.getAll("assignees").length > 0 ? searchParams.getAll("assignees") : undefined,
    search: searchParams.get("search") || undefined,
  }), [searchParams]);

  const searchInput = searchParams.get("search") ?? "";

  // Write state to URL (replaces history entry to avoid polluting back button)
  const updateParams = useCallback((updater: (prev: TaskQueryParams) => TaskQueryParams) => {
    setSearchParams((prev) => {
      const currentParams: TaskQueryParams = {
        page: parsePageParam(prev.get("page")),
        limit: DEFAULT_LIMIT,
        sortBy: parseEnumArray([prev.get("sortBy") ?? ""], Object.values(SortBy))?.[0],
        orderBy: parseEnumArray([prev.get("orderBy") ?? ""], Object.values(OrderBy))?.[0],
        statuses: parseEnumArray(prev.getAll("statuses"), Object.values(TaskStatus)),
        assignees: prev.getAll("assignees").length > 0 ? prev.getAll("assignees") : undefined,
        search: prev.get("search") || undefined,
      };

      const next = updater(currentParams);
      const sp = new URLSearchParams();

      if (next.page > 1) { sp.set("page", String(next.page)); }
      if (next.sortBy) { sp.set("sortBy", next.sortBy); }
      if (next.orderBy) { sp.set("orderBy", next.orderBy); }
      if (next.search) { sp.set("search", next.search); }
      next.statuses?.forEach((s) => sp.append("statuses", s));
      next.assignees?.forEach((a) => sp.append("assignees", a));

      return sp;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSearchChange = useCallback((value: string) => {
    if (debounceTimer) { clearTimeout(debounceTimer); }
    const timer = setTimeout(() => {
      updateParams((prev) => ({ ...prev, search: value || undefined, page: 1 }));
    }, SEARCH_DEBOUNCE_MS);
    setDebounceTimer(timer);
  }, [debounceTimer, updateParams]);

  const handleStatusToggle = useCallback((status: TaskStatus) => {
    updateParams((prev) => {
      const current = prev.statuses ?? [];
      const next = current.includes(status) ? current.filter((s) => s !== status) : [...current, status];
      return { ...prev, statuses: next.length > 0 ? next : undefined, page: 1 };
    });
  }, [updateParams]);

  const handleAssigneeToggle = useCallback((userId: string) => {
    updateParams((prev) => {
      const current = prev.assignees ?? [];
      const next = current.includes(userId) ? current.filter((a) => a !== userId) : [...current, userId];
      return { ...prev, assignees: next.length > 0 ? next : undefined, page: 1 };
    });
  }, [updateParams]);

  const handleClearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleSortChange = useCallback((field: SortBy, isDesc: boolean) => {
    updateParams((prev) => ({
      ...prev,
      sortBy: field,
      orderBy: isDesc ? OrderBy.DESC : OrderBy.ASC,
    }));
  }, [updateParams]);

  const handleClearSort = useCallback(() => {
    updateParams((prev) => ({ ...prev, sortBy: undefined, orderBy: undefined }));
  }, [updateParams]);

  const handlePageChange = useCallback((page: number) => {
    updateParams((prev) => ({ ...prev, page }));
  }, [updateParams]);

  return {
    queryParams,
    searchInput,
    handleSearchChange,
    handleStatusToggle,
    handleAssigneeToggle,
    handleClearFilters,
    handleSortChange,
    handleClearSort,
    handlePageChange,
  };
}
