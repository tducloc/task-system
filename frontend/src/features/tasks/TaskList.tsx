import { Fragment, useMemo, useState } from "react";
import { flexRender, useReactTable, getCoreRowModel, type SortingState } from "@tanstack/react-table";
import { Loader2, Plus, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import TaskActivityTimeline from "./TaskActivityTimeline";
import { useTasksQuery } from "./api";
import { SortBy, OrderBy } from "./types";
import { useMembershipsQuery } from "@/features/workspaces/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskFilters } from "./TaskFilters";
import { TaskPagination } from "./TaskPagination";
import { useTaskActions } from "./useTaskActions";
import { useTaskFilters } from "./useTaskFilters";
import { columns } from "./columns";
import type { TaskTableMeta } from "./columns";

const SORT_FIELD_MAP: Record<string, SortBy> = {
  title: SortBy.TITLE,
  status: SortBy.STATUS,
  createdAt: SortBy.CREATED_AT,
  updatedAt: SortBy.UPDATED_AT,
};

interface TaskListProps {
  workspaceId: string;
}

export default function TaskList({ workspaceId }: TaskListProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const filters = useTaskFilters();
  const { queryParams } = filters;

  const { data: response, isLoading: isLoadingTasks } = useTasksQuery(workspaceId, queryParams);
  const { data: memberships, isLoading: isLoadingMembers } = useMembershipsQuery(workspaceId);
  const actions = useTaskActions(workspaceId, queryParams, filters.handlePageChange);

  const tasks = response?.data ?? [];
  const meta = response?.meta;

  const sorting: SortingState = useMemo(() => {
    if (!queryParams.sortBy) return [];
    return [{ id: queryParams.sortBy, desc: queryParams.orderBy === OrderBy.DESC }];
  }, [queryParams.sortBy, queryParams.orderBy]);

  const tableMeta: TaskTableMeta = useMemo(() => ({
    memberships: memberships ?? [],
    updatingId: actions.updateMutation.isPending ? actions.updateMutation.variables?.id : undefined,
    deletingId: actions.deleteMutation.isPending ? (actions.deleteMutation.variables as string) : undefined,
    onStatusChange: actions.handleStatusChange,
    onAssigneeChange: actions.handleAssigneeChange,
    onDelete: actions.handleDelete,
  }), [memberships, actions]);

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (next.length === 0) {
        filters.handleClearSort();
      } else {
        const field = SORT_FIELD_MAP[next[0].id];
        if (field) { filters.handleSortChange(field, next[0].desc); }
      }
    },
    meta: tableMeta,
  });

  if (isLoadingTasks || isLoadingMembers) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">Tasks Database</h2>
      <TaskFilters
        search={filters.searchInput}
        selectedStatuses={queryParams.statuses ?? []}
        selectedAssignees={queryParams.assignees ?? []}
        memberships={memberships ?? []}
        onSearchChange={filters.handleSearchChange}
        onStatusToggle={filters.handleStatusToggle}
        onAssigneeToggle={filters.handleAssigneeToggle}
        onClearAll={filters.handleClearFilters}
      />
      <div className="border rounded-xl shadow-sm bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} className={getHeaderClass(header.id)}>
                      {header.column.getCanSort() ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon direction={header.column.getIsSorted()} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => {
                const taskId = row.original.id;
                const isExpanded = expandedTaskId === taskId;
                return (
                  <Fragment key={row.id}>
                    <TableRow
                      className={`group transition-colors hover:bg-muted/30 cursor-pointer ${isExpanded ? "bg-muted/20" : ""}`}
                      onClick={() => setExpandedTaskId(isExpanded ? null : taskId)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className={getCellClass(cell.column.id)}>
                          <div onClick={cell.column.id === "actions" || cell.column.id === "status" || cell.column.id === "assignee" ? (e) => e.stopPropagation() : undefined}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${row.id}-activity`}>
                        <TableCell colSpan={columns.length} className="bg-muted/10 px-6 py-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Lịch sử hoạt động
                          </p>
                          <TaskActivityTimeline workspaceId={workspaceId} taskId={taskId} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
              <TableRow className="bg-muted/5 hover:bg-muted/10 border-t-border/50">
                <TableCell className="text-center text-muted-foreground">
                  <Plus className="h-4 w-4 mx-auto opacity-50" />
                </TableCell>
                <TableCell colSpan={columns.length - 1} className="p-0">
                  <form onSubmit={actions.handleCreate} className="flex h-full w-full items-center px-4 py-2">
                    <input
                      type="text"
                      placeholder="Thêm một dòng mới... (Nhấn Enter để lưu)"
                      value={actions.newTaskTitle}
                      onChange={(e) => actions.setNewTaskTitle(e.target.value)}
                      className="flex-1 bg-transparent border-none text-sm font-medium outline-none placeholder:text-muted-foreground focus:ring-0"
                    />
                  </form>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {meta && <TaskPagination meta={meta} onPageChange={filters.handlePageChange} />}
      </div>
    </div>
  );
}

function getHeaderClass(id: string): string {
  const base: Record<string, string> = {
    index: "w-10 text-center",
    title: "min-w-[180px]",
    status: "w-[150px]",
    assignee: "w-[180px]",
    createdAt: "w-[100px] hidden lg:table-cell",
    updatedAt: "w-[100px] hidden lg:table-cell",
    actions: "w-[50px]",
  };
  return base[id] ?? "";
}

function getCellClass(id: string): string {
  const base: Record<string, string> = {
    index: "text-center text-muted-foreground tabular-nums",
    createdAt: "hidden lg:table-cell",
    updatedAt: "hidden lg:table-cell",
    actions: "text-right",
  };
  return base[id] ?? "";
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (direction === "asc") return <ArrowUp className="h-3.5 w-3.5 text-foreground" />;
  if (direction === "desc") return <ArrowDown className="h-3.5 w-3.5 text-foreground" />;
  return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
}
