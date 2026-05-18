import { useState, useEffect } from "react";
import { Search, X, ChevronDown, Check, CircleDashed, PlayCircle, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TaskStatus } from "./types";
import type { Membership } from "@/features/workspaces/types";

interface TaskFiltersProps {
  search: string;
  selectedStatuses: TaskStatus[];
  selectedAssignees: string[];
  memberships: Membership[];
  onSearchChange: (value: string) => void;
  onStatusToggle: (status: TaskStatus) => void;
  onAssigneeToggle: (userId: string) => void;
  onClearAll: () => void;
}

const STATUS_OPTIONS = [
  { value: TaskStatus.TODO, label: "To Do", icon: CircleDashed, className: "text-muted-foreground" },
  { value: TaskStatus.IN_PROGRESS, label: "In Progress", icon: PlayCircle, className: "text-blue-500" },
  { value: TaskStatus.DONE, label: "Done", icon: CheckCircle2, className: "text-green-500" },
];

export function TaskFilters({
  search,
  selectedStatuses,
  selectedAssignees,
  memberships,
  onSearchChange,
  onStatusToggle,
  onAssigneeToggle,
  onClearAll,
}: TaskFiltersProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const hasFilters = search.length > 0 || selectedStatuses.length > 0 || selectedAssignees.length > 0;

  // Sync local input when URL changes externally (e.g. clear filters, browser back)
  useEffect(() => { setLocalSearch(search); }, [search]);

  const handleSearchInput = (value: string) => {
    setLocalSearch(value);
    onSearchChange(value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative w-56">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm..."
          value={localSearch}
          onChange={(e) => handleSearchInput(e.target.value)}
          className="h-8 pl-8 text-sm"
        />
      </div>

      {/* Status dropdown */}
      <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            Trạng thái
            {selectedStatuses.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                {selectedStatuses.length}
              </Badge>
            )}
            <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" align="start">
          {STATUS_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedStatuses.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => onStatusToggle(opt.value)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
              >
                <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                  {isSelected && <Check className="h-3 w-3 text-primary" />}
                </div>
                <Icon className={`h-4 w-4 ${opt.className}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      {/* Assignee dropdown */}
      <Popover open={isAssigneeOpen} onOpenChange={setIsAssigneeOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 border-dashed">
            Người phụ trách
            {selectedAssignees.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">
                {selectedAssignees.length}
              </Badge>
            )}
            <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          {memberships.map((m) => {
            const isSelected = selectedAssignees.includes(m.userId);
            return (
              <button
                key={m.userId}
                onClick={() => onAssigneeToggle(m.userId)}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
              >
                <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                  {isSelected && <Check className="h-3 w-3 text-primary" />}
                </div>
                <div className="h-5 w-5 rounded-full bg-primary shrink-0 flex items-center justify-center text-[9px] text-primary-foreground font-semibold uppercase">
                  {m.user.email.substring(0, 2)}
                </div>
                <span className="truncate">{m.user.email}</span>
              </button>
            );
          })}
        </PopoverContent>
      </Popover>

      {/* Clear all */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearAll} className="h-8 px-2 text-xs text-muted-foreground">
          <X className="h-3.5 w-3.5 mr-1" />
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}
