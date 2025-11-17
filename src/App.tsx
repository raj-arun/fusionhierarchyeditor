import { useState, useCallback, useMemo } from 'react';
import { Download, Network, ChevronsRight, ChevronsDown, Plus, Grid3x3, User } from 'lucide-react';
import { ThemeToggle } from './components/theme-toggle';
import { FileUpload } from './components/file-upload';
import { TreeView } from './components/tree-view';
import { HierarchyGrid } from './components/hierarchy-grid';
import { PropertiesGrid } from './components/properties-grid';
import { ResizablePane } from './components/resizable-pane';
import { ContextMenu } from './components/context-menu';
import { AddMemberDialog } from './components/add-member-dialog';
import { exportToCSV, exportToExcel } from './lib/fileExporter';
import { getVisibleNodes, getAllNodeIds } from './lib/hierarchyUtils';
import { addMemberToHierarchy, deleteNodeFromHierarchy, duplicateNode, generateUniqueName } from './lib/nodeOperations';
import { moveNodeToNewParent } from './lib/dragDropOperations';
import { cn } from './lib/utils';
import type { HierarchyNode, ParsedData } from './types/hierarchy';

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

  const handleDataLoaded = useCallback((data: ParsedData) => {
    setParsedData(data);
    setSelectedNode(null);
    setShowUpload(false);
    // Expand all nodes by default for grid view
    setExpandedNodes(getAllNodeIds(data.roots));
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

  const handleExportCSV = useCallback(() => {
    if (!parsedData) return;
    exportToCSV(parsedData.roots, parsedData.columns);
  }, [parsedData]);

  const handleExportExcel = useCallback(async () => {
    if (!parsedData) return;
    await exportToExcel(parsedData.roots, parsedData.columns);
  }, [parsedData]);

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
                  onClick={handleExportCSV}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'transition-colors flex items-center gap-2'
                  )}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'transition-colors flex items-center gap-2'
                  )}
                >
                  <Download className="h-4 w-4" />
                  Export Excel
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
                    nodes={parsedData.roots}
                    selectedNode={selectedNode}
                    onNodeSelect={setSelectedNode}
                    expandedNodes={expandedNodes}
                    onToggleExpand={handleToggleExpand}
                    onContextMenu={handleContextMenu}
                    onNodeMove={handleNodeMove}
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
    </div>
  );
}

export default App;
