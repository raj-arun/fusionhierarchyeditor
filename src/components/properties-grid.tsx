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
import { ArrowUpDown, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import type { HierarchyNode } from '../types/hierarchy';

interface PropertiesGridProps {
  node: HierarchyNode | null;
  columns: string[];
  onPropertyChange: (nodeId: string, property: string, value: string) => void;
}

export function PropertiesGrid({
  node,
  columns,
  onPropertyChange,
}: PropertiesGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const data = useMemo(() => {
    if (!node) return [];
    return [node.properties];
  }, [node]);

  const tableColumns = useMemo<ColumnDef<Record<string, string>>[]>(() => {
    return columns.map((column) => ({
      accessorKey: column,
      header: ({ column: col }) => {
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => col.toggleSorting(col.getIsSorted() === 'asc')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {column}
              <ArrowUpDown className="h-3 w-3" />
            </button>
          </div>
        );
      },
      cell: ({ row }) => {
        const value = row.getValue(column) as string;
        const [isEditing, setIsEditing] = useState(false);
        const [editValue, setEditValue] = useState(value);

        const handleSave = () => {
          if (node && editValue !== value) {
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
          }
        };

        return (
          <div className="px-2 py-1">
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
                className="cursor-text px-2 py-1 rounded hover:bg-accent/50 transition-colors"
              >
                {value || <span className="text-muted-foreground italic">Empty</span>}
              </div>
            )}
          </div>
        );
      },
    }));
  }, [columns, node, onPropertyChange]);

  const table = useReactTable({
    data,
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

  if (!node) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Select a node to view its properties</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/50 backdrop-blur z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b">
                <th className="text-left font-medium p-2 w-48 bg-muted/80">
                  <div className="flex items-center gap-2">
                    Property
                    <Filter className="h-3 w-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="text-left font-medium p-2 bg-muted/80">Value</th>
              </tr>
            ))}
          </thead>
          <tbody>
            {columns.map((column, index) => (
              <tr
                key={column}
                className={cn(
                  'border-b transition-colors hover:bg-muted/50',
                  index % 2 === 0 && 'bg-muted/20'
                )}
              >
                <td className="p-2 font-medium text-muted-foreground">
                  {column}
                </td>
                <td className="p-0">
                  {table.getRowModel().rows[0] &&
                    flexRender(
                      tableColumns[index].cell,
                      table.getRowModel().rows[0].getAllCells()[index].getContext()
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
