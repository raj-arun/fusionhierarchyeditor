import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  type VisibilityState,
  type ColumnSizingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Trash2, Copy, ChevronUp, ChevronsDown, Columns3, Search, FilterX } from 'lucide-react';
import { cn } from '../lib/utils';
import type { HierarchyNode, ParsedData } from '../types/hierarchy';
import { SearchReplaceDialog } from './search-replace-dialog';

interface HierarchyGridProps {
  visibleNodes: HierarchyNode[];
  columns: string[];
  onPropertyChange: (nodeId: string, property: string, value: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onMoveUp?: (nodeId: string) => void;
  onMoveDown?: (nodeId: string) => void;
  parsedData?: ParsedData;
  onColumnVisibilityChange?: (hiddenColumns: string[]) => void;
}

export function HierarchyGrid({
  visibleNodes,
  columns,
  onPropertyChange,
  onDeleteNode,
  onDuplicateNode,
  onMoveUp,
  onMoveDown,
  parsedData,
  onColumnVisibilityChange,
}: HierarchyGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
    };

    if (showColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColumnMenu]);

  // Notify parent when column visibility changes
  useEffect(() => {
    if (onColumnVisibilityChange) {
      const hidden = columns.filter(col => columnVisibility[col] === false);
      onColumnVisibilityChange(hidden);
    }
  }, [columnVisibility, columns, onColumnVisibilityChange]);

  // Helper function to check if node has siblings
  const hasMultipleSiblings = (node: HierarchyNode): boolean => {
    if (!parsedData || node.children.length > 0) return false;
    const siblings = node.parent
      ? parsedData.nodes.get(node.parent)?.children
      : parsedData.roots;
    return siblings ? siblings.length > 1 : false;
  };

  // Helper function to determine if a node can move up/down
  const canMoveUp = (node: HierarchyNode): boolean => {
    if (!parsedData || node.children.length > 0) return false;
    const siblings = node.parent
      ? parsedData.nodes.get(node.parent)?.children
      : parsedData.roots;
    if (!siblings || siblings.length <= 1) return false; // Disable if only child
    const index = siblings.findIndex(n => n.id === node.id);
    return index > 0;
  };

  const canMoveDown = (node: HierarchyNode): boolean => {
    if (!parsedData || node.children.length > 0) return false;
    const siblings = node.parent
      ? parsedData.nodes.get(node.parent)?.children
      : parsedData.roots;
    if (!siblings || siblings.length <= 1) return false; // Disable if only child
    const index = siblings.findIndex(n => n.id === node.id);
    return index >= 0 && index < siblings.length - 1;
  };

  const tableColumns: ColumnDef<HierarchyNode>[] = useMemo(() => [
    {
      id: 'select',
      header: 'Select',
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
        const hasSiblings = hasMultipleSiblings(node);
        const canUp = canMoveUp(node);
        const canDown = canMoveDown(node);

        return (
          <div className="flex items-center gap-1">
            {isLeaf && hasSiblings && onMoveUp && (
              <button
                onClick={() => onMoveUp(node.id)}
                disabled={!canUp}
                className={cn(
                  'p-1 rounded transition-colors',
                  canUp
                    ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    : 'text-muted-foreground/30 cursor-not-allowed'
                )}
                title={canUp ? 'Move up' : 'Already at top'}
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            )}
            {isLeaf && hasSiblings && onMoveDown && (
              <button
                onClick={() => onMoveDown(node.id)}
                disabled={!canDown}
                className={cn(
                  'p-1 rounded transition-colors',
                  canDown
                    ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    : 'text-muted-foreground/30 cursor-not-allowed'
                )}
                title={canDown ? 'Move down' : 'Already at bottom'}
              >
                <ChevronsDown className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onDuplicateNode(node.id)}
              disabled={!isLeaf}
              className={cn(
                'p-1 rounded transition-colors',
                isLeaf
                  ? 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  : 'text-muted-foreground/30 cursor-not-allowed'
              )}
              title={isLeaf ? 'Duplicate' : 'Only leaf nodes can be duplicated'}
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
      size: 140,
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
  ], [columns, onPropertyChange, onDeleteNode, onDuplicateNode, onMoveUp, onMoveDown, parsedData]);

  const table = useReactTable({
    data: visibleNodes,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
      columnSizing,
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;

  const handleDeleteSelected = useCallback(() => {
    const leafNodes = selectedRows.filter(row => row.original.children.length === 0);
    if (leafNodes.length === 0) {
      alert('Cannot delete selected rows. Only leaf nodes can be deleted.');
      return;
    }

    if (confirm(`Delete ${leafNodes.length} selected member(s)? This action cannot be undone.`)) {
      leafNodes.forEach(row => onDeleteNode(row.original.id));
      setRowSelection({});
    }
  }, [selectedRows, onDeleteNode]);

  const handleSearchReplace = useCallback((column: string, searchText: string, replaceText: string): number => {
    let count = 0;
    visibleNodes.forEach(node => {
      const currentValue = node.properties[column] || '';
      if (currentValue.includes(searchText)) {
        const newValue = currentValue.replace(new RegExp(searchText, 'g'), replaceText);
        onPropertyChange(node.id, column, newValue);
        count++;
      }
    });
    return count;
  }, [visibleNodes, onPropertyChange]);

  const handleClearFilters = useCallback(() => {
    setColumnFilters([]);
  }, []);

  if (visibleNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">No data to display. Upload a file to get started.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-2 flex items-center gap-2">
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
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
        <div className="ml-auto flex items-center gap-2">
          {columnFilters.length > 0 && (
            <button
              onClick={handleClearFilters}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md border',
                'hover:bg-accent transition-colors flex items-center gap-2',
                'bg-muted/50'
              )}
              title={`Clear ${columnFilters.length} active filter${columnFilters.length > 1 ? 's' : ''}`}
            >
              <FilterX className="h-4 w-4" />
              Clear Filters ({columnFilters.length})
            </button>
          )}
          <button
            onClick={() => setShowSearchReplace(true)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md border',
              'hover:bg-accent transition-colors flex items-center gap-2'
            )}
          >
            <Search className="h-4 w-4" />
            Find & Replace
          </button>
          <div className="relative" ref={columnMenuRef}>
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md border',
                'hover:bg-accent transition-colors flex items-center gap-2'
              )}
            >
              <Columns3 className="h-4 w-4" />
              Columns
            </button>
          {showColumnMenu && (
            <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-lg z-20 p-2 min-w-[200px]">
              <div className="text-xs font-medium mb-2 text-muted-foreground">Show/Hide Columns</div>
              <div className="max-h-[300px] overflow-y-auto">
                {table.getAllLeafColumns().map((column) => {
                  // Skip the select and actions columns
                  if (column.id === 'select' || column.id === 'actions') return null;
                  return (
                    <label
                      key={column.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-accent rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm">{column.id}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto border rounded-lg">
        <table className="text-sm border-collapse">
          <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left p-2 border-b border-r last:border-r-0 relative"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          'absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none',
                          'hover:bg-primary hover:w-[2px]',
                          header.column.getIsResizing() && 'bg-primary w-[2px]'
                        )}
                      />
                    )}
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

      <SearchReplaceDialog
        isOpen={showSearchReplace}
        onClose={() => setShowSearchReplace(false)}
        columns={columns}
        onReplace={handleSearchReplace}
      />
    </div>
  );
}
