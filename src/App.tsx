import { useState, useCallback, useMemo, useEffect } from 'react';
import { Download, Network, ChevronsRight, ChevronsDown, Plus, Grid3x3, User } from 'lucide-react';
import { ThemeToggle } from './components/theme-toggle';
import { FileUpload } from './components/file-upload';
import { TreeView } from './components/tree-view';
import { HierarchyGrid } from './components/hierarchy-grid';
import { PropertiesGrid } from './components/properties-grid';
import { ResizablePane } from './components/resizable-pane';
import { ContextMenu } from './components/context-menu';
import { AddMemberDialog } from './components/add-member-dialog';
import { ExportDialog } from './components/export-dialog';
import { ViewSelector } from './components/view-selector';
import { SaveViewDialog } from './components/save-view-dialog';
import { ManageViewsDialog } from './components/manage-views-dialog';
import { exportToCSV, exportToExcel } from './lib/fileExporter';
import { getVisibleNodes, getAllNodeIds } from './lib/hierarchyUtils';
import { addMemberToHierarchy, deleteNodeFromHierarchy, duplicateNode, generateUniqueName, moveNodeUp, moveNodeDown } from './lib/nodeOperations';
import { moveNodeToNewParent } from './lib/dragDropOperations';
import { cn } from './lib/utils';
import type { HierarchyNode, ParsedData } from './types/hierarchy';
import type { ColumnView } from './types/views';
import { initializeViews, loadViews, getActiveViewId, setActiveViewId, createView, updateView, deleteView, createDefaultView } from './lib/viewsService';

type ViewMode = 'grid' | 'single';

function App() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [showUpload, setShowUpload] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [contextMenu, setContextMenu] = useState<{
    node: HierarchyNode;
    x: number;
    y: number;
  } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [views, setViews] = useState<ColumnView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string>('default');
  const [showSaveViewDialog, setShowSaveViewDialog] = useState(false);
  const [showManageViewsDialog, setShowManageViewsDialog] = useState(false);
  const [viewToRename, setViewToRename] = useState<ColumnView | null>(null);

  // Get current view
  const currentView = useMemo(() => {
    const view = views.find(v => v.id === currentViewId);
    if (view) return view;
    // Fallback to default view if current view not found
    return views.find(v => v.isDefault) || createDefaultView([]);
  }, [views, currentViewId]);

  const handleDataLoaded = useCallback((data: ParsedData) => {
    setParsedData(data);
    setSelectedNode(null);
    setShowUpload(false);
    // Start with all nodes collapsed
    setExpandedNodes(new Set());

    // Initialize views with default view
    const initializedViews = initializeViews(data.columns);
    setViews(initializedViews);

    // Load and set active view
    const activeViewId = getActiveViewId();
    setCurrentViewId(activeViewId);
  }, []);

  const handlePropertyChange = useCallback(
    (nodeId: string, property: string, value: string) => {
      if (!parsedData) return;

      const node = parsedData.nodes.get(nodeId);
      if (node) {
        node.properties[property] = value;
        // Force re-render by creating new state
        setParsedData({ ...parsedData });
        if (selectedNode?.id === nodeId) {
          setSelectedNode({ ...node });
        }
      }
    },
    [parsedData, selectedNode]
  );

  const handleExport = useCallback(async (format: 'csv' | 'excel', includeHiddenColumns: boolean, fileName: string, filePath?: string) => {
    if (!parsedData) return;

    // Determine which columns to export
    let columnsToExport = parsedData.columns;
    if (!includeHiddenColumns && hiddenColumns.length > 0) {
      columnsToExport = parsedData.columns.filter(col => !hiddenColumns.includes(col));
    }

    // Add appropriate file extension if not present
    const extension = format === 'csv' ? '.csv' : '.xlsx';
    const fullFileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;

    // Check if we're in Electron with a chosen path
    const isElectron = typeof (window as any).electronAPI !== 'undefined';

    if (isElectron && filePath) {
      // Export to the chosen location using Electron API
      try {
        if (format === 'csv') {
          // Generate CSV content
          const Papa = await import('papaparse');
          const { flattenHierarchy } = await import('./lib/fileExporter');
          const rows = flattenHierarchy(parsedData.roots, columnsToExport);
          const csv = Papa.default.unparse({
            fields: columnsToExport,
            data: rows,
          });

          await (window as any).electronAPI.saveFile({ filePath, content: csv });
        } else {
          // Generate Excel content
          const ExcelJS = await import('exceljs');
          const { flattenHierarchy } = await import('./lib/fileExporter');
          const rows = flattenHierarchy(parsedData.roots, columnsToExport);

          const workbook = new ExcelJS.default.Workbook();
          const worksheet = workbook.addWorksheet('Hierarchy');

          worksheet.addRow(columnsToExport);
          rows.forEach(row => worksheet.addRow(row));

          worksheet.columns = columnsToExport.map((col, i) => {
            const columnData = [col, ...rows.map((row) => row[i] || '')];
            const maxWidth = Math.max(...columnData.map((cell) => String(cell).length));
            return {
              header: col,
              key: col,
              width: Math.min(maxWidth + 2, 50)
            };
          });

          worksheet.getRow(1).font = { bold: true };

          const buffer = await workbook.xlsx.writeBuffer();
          await (window as any).electronAPI.saveFile({ filePath, content: Buffer.from(buffer) });
        }
      } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export file. Please try again.');
      }
    } else {
      // Browser mode or no path chosen - use standard download
      if (format === 'csv') {
        exportToCSV(parsedData.roots, columnsToExport, fullFileName);
      } else {
        await exportToExcel(parsedData.roots, columnsToExport, fullFileName);
      }
    }
  }, [parsedData, hiddenColumns]);

  const handleNewFile = useCallback(() => {
    setShowUpload(true);
    setParsedData(null);
    setSelectedNode(null);
    setExpandedNodes(new Set());
    setViewMode('grid');
  }, []);

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!parsedData) return;
    setExpandedNodes(getAllNodeIds(parsedData.roots));
  }, [parsedData]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  const handleContextMenu = useCallback((node: HierarchyNode, x: number, y: number) => {
    setContextMenu({ node, x, y });
  }, []);

  const handleViewProperties = useCallback(() => {
    if (contextMenu) {
      setSelectedNode(contextMenu.node);
      setViewMode('single');
    }
  }, [contextMenu]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!parsedData) return;

    const node = parsedData.nodes.get(nodeId);
    if (!node) return;

    if (node.children.length > 0) {
      alert('Cannot delete parent nodes. Only leaf nodes can be deleted.');
      return;
    }

    if (confirm(`Delete member "${node.name}"? This action cannot be undone.`)) {
      const updated = deleteNodeFromHierarchy(parsedData, nodeId);
      if (updated) {
        setParsedData(updated);
        if (selectedNode?.id === nodeId) {
          setSelectedNode(null);
        }
      }
    }
  }, [parsedData, selectedNode]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    if (!parsedData) return;

    const node = parsedData.nodes.get(nodeId);
    if (!node) return;

    const existingNames = new Set(parsedData.nodes.keys());
    const newName = generateUniqueName(node.name, existingNames);

    const updated = duplicateNode(parsedData, nodeId, newName);
    if (updated) {
      setParsedData(updated);
      // Expand parent to show the new node
      if (node.parent && !expandedNodes.has(node.parent)) {
        setExpandedNodes(prev => new Set(prev).add(node.parent));
      }
    } else {
      alert('Failed to duplicate member. Please try again.');
    }
  }, [parsedData, expandedNodes]);

  const handleMoveNodeUp = useCallback((nodeId: string) => {
    if (!parsedData) return;
    const updated = moveNodeUp(parsedData, nodeId);
    if (updated) {
      setParsedData(updated);
    }
  }, [parsedData]);

  const handleMoveNodeDown = useCallback((nodeId: string) => {
    if (!parsedData) return;
    const updated = moveNodeDown(parsedData, nodeId);
    if (updated) {
      setParsedData(updated);
    }
  }, [parsedData]);

  const handleAddMember = useCallback((memberName: string, parentName: string) => {
    if (!parsedData) return;

    const updated = addMemberToHierarchy(parsedData, memberName, parentName, parsedData.columns);
    setParsedData(updated);

    // Expand parent to show the new node
    if (parentName && !expandedNodes.has(parentName)) {
      setExpandedNodes(prev => new Set(prev).add(parentName));
    }
  }, [parsedData, expandedNodes]);

  const handleNodeMove = useCallback((nodeId: string, newParentId: string | null) => {
    if (!parsedData) return;

    const updated = moveNodeToNewParent(parsedData, nodeId, newParentId);
    if (updated) {
      setParsedData(updated);
      // Expand the new parent to show the moved node
      if (newParentId && !expandedNodes.has(newParentId)) {
        setExpandedNodes(prev => new Set(prev).add(newParentId));
      }
      // Highlight the moved node to show its new location
      const movedNode = updated.nodes.get(nodeId);
      if (movedNode) {
        setSelectedNode(movedNode);
      }
    } else {
      alert('Cannot move node: This would create a circular dependency or invalid hierarchy.');
    }
  }, [parsedData, expandedNodes]);

  // View management handlers
  const handleSelectView = useCallback((viewId: string) => {
    setCurrentViewId(viewId);
    setActiveViewId(viewId);
  }, []);

  const handleSaveNewView = useCallback((application: string, instance: string, dimension: string, name: string) => {
    if (!parsedData) return;

    // Get current column visibility from hiddenColumns
    const columnVisibility: Record<string, boolean> = {};
    parsedData.columns.forEach(col => {
      columnVisibility[col] = !hiddenColumns.includes(col);
    });

    const result = createView(application, instance, dimension, name, columnVisibility);
    if ('error' in result) {
      alert(result.error);
    } else {
      // Reload views and switch to the new view
      const updatedViews = loadViews();
      setViews(updatedViews);
      handleSelectView(result.id);
    }
  }, [parsedData, hiddenColumns, handleSelectView]);

  const handleUpdateCurrentView = useCallback(() => {
    if (!parsedData || currentView.isDefault) return;

    // Get current column visibility from hiddenColumns
    const columnVisibility: Record<string, boolean> = {};
    parsedData.columns.forEach(col => {
      columnVisibility[col] = !hiddenColumns.includes(col);
    });

    const success = updateView(currentView.id, { columnVisibility });
    if (success) {
      // Reload views
      const updatedViews = loadViews();
      setViews(updatedViews);
    }
  }, [parsedData, currentView, hiddenColumns]);

  const handleRenameView = useCallback((application: string, instance: string, dimension: string, name: string) => {
    if (!viewToRename) return;

    const success = updateView(viewToRename.id, { application, instance, dimension, name });
    if (success) {
      // Reload views
      const updatedViews = loadViews();
      setViews(updatedViews);
      setViewToRename(null);
    }
  }, [viewToRename]);

  const handleDeleteView = useCallback((viewId: string) => {
    const success = deleteView(viewId);
    if (success) {
      // Reload views
      const updatedViews = loadViews();
      setViews(updatedViews);
    }
  }, []);

  const handleManageViewsRename = useCallback((view: ColumnView) => {
    setViewToRename(view);
    setShowManageViewsDialog(false);
    setShowSaveViewDialog(true);
  }, []);

  // Apply current view's column visibility
  useEffect(() => {
    if (!parsedData || !currentView) return;

    const hidden: string[] = [];
    parsedData.columns.forEach(col => {
      if (currentView.columnVisibility[col] === false) {
        hidden.push(col);
      }
    });
    setHiddenColumns(hidden);
  }, [currentView, parsedData]);

  const visibleNodes = useMemo(() => {
    if (!parsedData) return [];
    return getVisibleNodes(parsedData.roots, expandedNodes);
  }, [parsedData, expandedNodes]);

  const existingMemberNames = useMemo(() => {
    if (!parsedData) return new Set<string>();
    return new Set(parsedData.nodes.keys());
  }, [parsedData]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Network className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Fusion Hierarchy Editor</h1>
              <p className="text-sm text-muted-foreground">
                View and edit hierarchical data structures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {parsedData && (
              <>
                <ViewSelector
                  views={views}
                  currentView={currentView}
                  onSelectView={handleSelectView}
                  onSaveNewView={() => {
                    setViewToRename(null);
                    setShowSaveViewDialog(true);
                  }}
                  onUpdateCurrentView={handleUpdateCurrentView}
                  onManageViews={() => setShowManageViewsDialog(true)}
                />
                <div className="h-6 w-px bg-border mx-1" />
                <button
                  onClick={() => setShowAddDialog(true)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'transition-colors flex items-center gap-2'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  New Member
                </button>
                <button
                  onClick={handleNewFile}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md',
                    'border border-input hover:bg-accent transition-colors'
                  )}
                >
                  New File
                </button>
                <button
                  onClick={() => setShowExportDialog(true)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'transition-colors flex items-center gap-2'
                  )}
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {showUpload || !parsedData ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <FileUpload onDataLoaded={handleDataLoaded} />
            </div>
          </div>
        ) : (
          <ResizablePane
            leftPane={
              <div className="h-full bg-card flex flex-col border-r">
                <div className="border-b px-4 py-3 bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold">Hierarchy Tree</h2>
                    <div className="flex gap-1">
                      <button
                        onClick={handleExpandAll}
                        className={cn(
                          'p-1 rounded hover:bg-accent transition-colors',
                          'text-muted-foreground hover:text-foreground'
                        )}
                        title="Expand All"
                      >
                        <ChevronsDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCollapseAll}
                        className={cn(
                          'p-1 rounded hover:bg-accent transition-colors',
                          'text-muted-foreground hover:text-foreground'
                        )}
                        title="Collapse All"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {parsedData.nodes.size} nodes • {visibleNodes.length} visible
                  </p>
                </div>
                <div className="flex-1 overflow-hidden">
                  <TreeView
                    nodes={visibleNodes}
                    selectedNode={selectedNode}
                    onNodeSelect={setSelectedNode}
                    expandedNodes={expandedNodes}
                    onToggleExpand={handleToggleExpand}
                    onContextMenu={handleContextMenu}
                    onNodeMove={handleNodeMove}
                    onMoveUp={handleMoveNodeUp}
                    onMoveDown={handleMoveNodeDown}
                  />
                </div>
              </div>
            }
            rightPane={
              <div className="h-full bg-background flex flex-col">
                <div className="border-b px-4 py-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold">
                        {viewMode === 'grid' ? 'Properties Grid' : `Properties: ${selectedNode?.name || 'Select a member'}`}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {viewMode === 'grid'
                          ? 'Edit multiple members • Right-click for options'
                          : selectedNode
                          ? `Level ${selectedNode.level} • ${selectedNode.children.length} children`
                          : 'Select a member to view properties'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          'p-2 rounded transition-colors',
                          viewMode === 'grid'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        title="Grid View"
                      >
                        <Grid3x3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('single')}
                        className={cn(
                          'p-2 rounded transition-colors',
                          viewMode === 'single'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                        title="Single Member View"
                      >
                        <User className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden p-4">
                  {viewMode === 'grid' ? (
                    <HierarchyGrid
                      visibleNodes={visibleNodes}
                      columns={parsedData.columns}
                      onPropertyChange={handlePropertyChange}
                      onDeleteNode={handleDeleteNode}
                      onDuplicateNode={handleDuplicateNode}
                      onMoveUp={handleMoveNodeUp}
                      onMoveDown={handleMoveNodeDown}
                      parsedData={parsedData}
                      onColumnVisibilityChange={setHiddenColumns}
                      hiddenColumns={hiddenColumns}
                    />
                  ) : (
                    <PropertiesGrid
                      node={selectedNode}
                      columns={parsedData.columns}
                      onPropertyChange={handlePropertyChange}
                    />
                  )}
                </div>
              </div>
            }
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-2 text-xs text-muted-foreground bg-card">
        <div className="flex items-center justify-between">
          <span>
            Drag & drop to move members • Right-click for options • Drag divider to resize
          </span>
          {parsedData && (
            <span>
              {parsedData.columns.length} columns • {parsedData.nodes.size} total nodes
            </span>
          )}
        </div>
      </footer>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onViewProperties={handleViewProperties}
          onDuplicate={() => handleDuplicateNode(contextMenu.node.id)}
          onDelete={() => handleDeleteNode(contextMenu.node.id)}
          canDelete={contextMenu.node.children.length === 0}
          canDuplicate={contextMenu.node.children.length === 0}
        />
      )}

      {/* Add Member Dialog */}
      <AddMemberDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={handleAddMember}
        columns={parsedData?.columns || []}
        existingMembers={existingMemberNames}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={handleExport}
        hasHiddenColumns={hiddenColumns.length > 0}
      />

      {/* Save View Dialog */}
      <SaveViewDialog
        isOpen={showSaveViewDialog}
        onClose={() => {
          setShowSaveViewDialog(false);
          setViewToRename(null);
        }}
        onSave={viewToRename ? handleRenameView : handleSaveNewView}
        existingView={viewToRename ? {
          application: viewToRename.application,
          instance: viewToRename.instance,
          dimension: viewToRename.dimension,
          name: viewToRename.name,
        } : undefined}
      />

      {/* Manage Views Dialog */}
      <ManageViewsDialog
        isOpen={showManageViewsDialog}
        onClose={() => setShowManageViewsDialog(false)}
        views={views}
        onRenameView={handleManageViewsRename}
        onDeleteView={handleDeleteView}
      />
    </div>
  );
}

export default App;
