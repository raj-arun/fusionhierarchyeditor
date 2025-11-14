import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUpDown, Trash2, Copy } from 'lucide-react';
import { cn } from '../lib/utils';
import type { HierarchyNode } from '../types/hierarchy';

interface HierarchyGridProps {
  visibleNodes: HierarchyNode[];
  columns: string[];
  onPropertyChange: (nodeId: string, property: string, value: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
}

export function HierarchyGrid({
  visibleNodes,
  columns,
  onPropertyChange,
  onDeleteNode,
  onDuplicateNode,
}: HierarchyGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const tableColumns: ColumnDef<HierarchyNode>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 cursor-pointer"
        />
      ),
      size: 40,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const node = row.original;
        const isLeaf = node.children.length === 0;

        return (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDuplicateNode(node.id)}
              className={cn(
                'p-1 rounded hover:bg-accent transition-colors',
                'text-muted-foreground hover:text-foreground'
              )}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDeleteNode(node.id)}
              disabled={!isLeaf}
              className={cn(
                'p-1 rounded transition-colors',
                isLeaf
                  ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                  : 'text-muted-foreground/30 cursor-not-allowed'
              )}
              title={isLeaf ? 'Delete' : 'Cannot delete parent nodes'}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
      size: 100,
    },
    ...columns.map((column): ColumnDef<HierarchyNode> => ({
      accessorFn: (row: HierarchyNode) => row.properties[column] || '',
      id: column,
      header: ({ column: col }: any) => {
        return (
          <div className="flex flex-col gap-1.5 min-w-[150px]">
            <button
              onClick={() => col.toggleSorting(col.getIsSorted() === 'asc')}
              className="flex items-center gap-1 hover:text-foreground transition-colors font-medium text-left"
            >
              <span className="truncate">{column}</span>
              <ArrowUpDown className="h-3 w-3 flex-shrink-0" />
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
      cell: ({ row }: any) => {
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
          <div className="min-w-[150px]">
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
      size: Math.max(column.length * 10, 150),
    })),
  ];

  const table = useReactTable({
    data: visibleNodes,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;

  const handleDeleteSelected = () => {
    const leafNodes = selectedRows.filter(row => row.original.children.length === 0);
    if (leafNodes.length === 0) {
      alert('Cannot delete selected rows. Only leaf nodes can be deleted.');
      return;
    }

    if (confirm(`Delete ${leafNodes.length} selected member(s)? This action cannot be undone.`)) {
      leafNodes.forEach(row => onDeleteNode(row.original.id));
      setRowSelection({});
    }
  };

  if (visibleNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No data to display. Upload a file to get started.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {selectedRows.length > 0 && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <span className="text-sm font-medium">{selectedRows.length} selected</span>
          <button
            onClick={handleDeleteSelected}
            className={cn(
              'px-3 py-1 text-sm rounded-md',
              'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              'transition-colors flex items-center gap-2'
            )}
          >
            <Trash2 className="h-4 w-4" />
            Delete Selected
          </button>
        </div>
      )}
      <div className="flex-1 overflow-auto border rounded-lg">
        <table className="text-sm border-collapse">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left p-2 border-b border-r last:border-r-0"
                    style={{ width: header.getSize() }}
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
                  index % 2 === 0 && 'bg-muted/20',
                  row.getIsSelected() && 'bg-primary/10'
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
