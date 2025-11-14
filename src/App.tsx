import { useState, useCallback } from 'react';
import { Download, Network } from 'lucide-react';
import { ThemeToggle } from './components/theme-toggle';
import { FileUpload } from './components/file-upload';
import { TreeView } from './components/tree-view';
import { PropertiesGrid } from './components/properties-grid';
import { exportToCSV, exportToExcel } from './lib/fileExporter';
import { cn } from './lib/utils';
import type { HierarchyNode, ParsedData } from './types/hierarchy';

function App() {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [selectedNode, setSelectedNode] = useState<HierarchyNode | null>(null);
  const [showUpload, setShowUpload] = useState(true);

  const handleDataLoaded = useCallback((data: ParsedData) => {
    setParsedData(data);
    setSelectedNode(null);
    setShowUpload(false);
  }, []);

  const handlePropertyChange = useCallback(
    (nodeId: string, property: string, value: string) => {
      if (!parsedData) return;

      const node = parsedData.nodes.get(nodeId);
      if (node) {
        node.properties[property] = value;
        // Force re-render by creating new state
        setParsedData({ ...parsedData });
        setSelectedNode({ ...node });
      }
    },
    [parsedData]
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
  }, []);

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
          <div className="h-full flex">
            {/* Tree View Panel */}
            <div className="w-1/3 border-r bg-card flex flex-col">
              <div className="border-b px-4 py-3 bg-muted/50">
                <h2 className="font-semibold">Hierarchy Tree</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {parsedData.nodes.size} nodes loaded
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                <TreeView
                  nodes={parsedData.roots}
                  selectedNode={selectedNode}
                  onNodeSelect={setSelectedNode}
                />
              </div>
            </div>

            {/* Properties Panel */}
            <div className="flex-1 bg-background flex flex-col">
              <div className="border-b px-4 py-3 bg-muted/50">
                <h2 className="font-semibold">
                  {selectedNode ? `Properties: ${selectedNode.name}` : 'Properties'}
                </h2>
                {selectedNode && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Level {selectedNode.level} • {selectedNode.children.length}{' '}
                    {selectedNode.children.length === 1 ? 'child' : 'children'}
                  </p>
                )}
              </div>
              <div className="flex-1 overflow-hidden p-4">
                <PropertiesGrid
                  node={selectedNode}
                  columns={parsedData.columns}
                  onPropertyChange={handlePropertyChange}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-2 text-xs text-muted-foreground bg-card">
        <div className="flex items-center justify-between">
          <span>
            Supports CSV and Excel files • Click to select nodes • Click values to edit
          </span>
          {parsedData && (
            <span>
              {parsedData.columns.length} columns • {parsedData.nodes.size} total nodes
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
