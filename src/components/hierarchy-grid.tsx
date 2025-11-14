import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '../lib/utils';
import type { HierarchyNode } from '../types/hierarchy';

interface HierarchyGridProps {
  visibleNodes: HierarchyNode[];
  columns: string[];
  onPropertyChange: (nodeId: string, property: string, value: string) => void;
}

export function HierarchyGrid({
  visibleNodes,
  columns,
  onPropertyChange,
}: HierarchyGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const tableColumns = useMemo<ColumnDef<HierarchyNode>[]>(() => {
    return columns.map((column) => ({
      accessorFn: (row) => row.properties[column] || '',
      id: column,
      header: ({ column: col }) => {
        return (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => col.toggleSorting(col.getIsSorted() === 'asc')}
              className="flex items-center gap-1 hover:text-foreground transition-colors font-medium"
            >
              {column}
              <ArrowUpDown className="h-3 w-3" />
            </button>
            <input
              type="text"
              placeholder="Filter..."
              value={(col.getFilterValue() as string) ?? ''}
              onChange={(e) => col.setFilterValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'px-2 py-1 text-xs border rounded w-full',
                'bg-background focus:outline-none focus:ring-1 focus:ring-ring'
              )}
            />
          </div>
        );
      },
      cell: ({ row }) => {
        const node = row.original;
        const value = node.properties[column] || '';
        const [isEditing, setIsEditing] = useState(false);
        const [editValue, setEditValue] = useState(value);

        const handleSave = () => {
          if (editValue !== value) {
            onPropertyChange(node.id, column, editValue);
          }
          setIsEditing(false);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === 'Enter') {
            handleSave();
          } else if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
          } else if (e.key === 'Tab') {
            handleSave();
          }
        };

        return (
          <div className="min-w-[100px]">
            {isEditing ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className={cn(
                  'w-full px-2 py-1 text-sm border rounded',
                  'bg-background focus:outline-none focus:ring-2 focus:ring-ring'
                )}
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-text px-2 py-1 rounded hover:bg-accent/50 transition-colors min-h-[32px]"
              >
                {value || <span className="text-muted-foreground italic text-xs">Empty</span>}
              </div>
            )}
          </div>
        );
      },
    }));
  }, [columns, onPropertyChange]);

  const table = useReactTable({
    data: visibleNodes,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  if (visibleNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No data to display. Upload a file to get started.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto border rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left p-2 border-b border-r last:border-r-0 min-w-[150px]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  'border-b transition-colors hover:bg-muted/50',
                  index % 2 === 0 && 'bg-muted/20'
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-0 border-r last:border-r-0">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Showing {table.getFilteredRowModel().rows.length} of {visibleNodes.length} rows
        {columnFilters.length > 0 && ` (${columnFilters.length} filter${columnFilters.length > 1 ? 's' : ''} active)`}
      </div>
    </div>
  );
}
