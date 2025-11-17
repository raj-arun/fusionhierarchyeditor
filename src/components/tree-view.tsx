import { useCallback, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Network,
} from 'lucide-react';
import { cn } from '../lib/utils';
import type { HierarchyNode } from '../types/hierarchy';

interface TreeViewProps {
  nodes: HierarchyNode[];
  selectedNode: HierarchyNode | null;
  onNodeSelect: (node: HierarchyNode) => void;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onContextMenu?: (node: HierarchyNode, x: number, y: number) => void;
  onNodeMove?: (nodeId: string, newParentId: string | null) => void;
}

interface TreeNodeProps {
  node: HierarchyNode;
  isSelected: boolean;
  onSelect: (node: HierarchyNode) => void;
  isExpanded: boolean;
  onToggle: () => void;
  onContextMenu?: (node: HierarchyNode, x: number, y: number) => void;
  onDragStart?: (nodeId: string) => void;
  onDragOver?: (nodeId: string, node: HierarchyNode) => void;
  onDrop?: (nodeId: string, node: HierarchyNode) => void;
  isDragOver?: boolean;
}

function TreeNode({
  node,
  isSelected,
  onSelect,
  isExpanded,
  onToggle,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: TreeNodeProps) {
  const hasChildren = node.children.length > 0;

  const handleClick = useCallback(() => {
    onSelect(node);
  }, [node, onSelect]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(node, e.clientX, e.clientY);
    }
  }, [node, onContextMenu]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    if (onDragStart) {
      onDragStart(node.id);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', node.id);
    }
  }, [node.id, onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (onDragOver) {
      onDragOver(node.id, node);
    }
  }, [node, onDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(node.id, node);
    }
  }, [node, onDrop]);

  const getIcon = () => {
    if (node.level === 0) {
      // Top-most node (root)
      return <Network className="h-4 w-4 text-blue-500" />;
    } else if (hasChildren) {
      // Intermediate parent node
      return isExpanded ? (
        <FolderOpen className="h-4 w-4 text-amber-500" />
      ) : (
        <Folder className="h-4 w-4 text-amber-500" />
      );
    } else {
      // Leaf node
      return <FileText className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="select-none">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-move',
          'hover:bg-accent transition-colors',
          isSelected && 'bg-primary/10 hover:bg-primary/15',
          isDragOver && 'bg-primary/20 ring-2 ring-primary'
        )}
        style={{ paddingLeft: `${node.level * 20 + 8}px` }}
      >
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center justify-center w-4 h-4',
            !hasChildren && 'invisible'
          )}
        >
          {hasChildren &&
            (isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ))}
        </button>

        <div
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          {getIcon()}
          <span className="text-sm truncate">{node.name}</span>
          {hasChildren && (
            <span className="text-xs text-muted-foreground">
              ({node.children.length})
            </span>
          )}
        </div>
      </div>

    </div>
  );
}

export function TreeView({
  nodes,
  selectedNode,
  onNodeSelect,
  expandedNodes,
  onToggleExpand,
  onContextMenu,
  onNodeMove,
}: TreeViewProps) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

  // Helper to find node by ID in the tree
  const findNode = useCallback((nodeId: string, nodes: HierarchyNode[]): HierarchyNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      const found = findNode(nodeId, node.children);
      if (found) return found;
    }
    return null;
  }, []);

  const handleDragStart = useCallback((nodeId: string) => {
    setDraggedNodeId(nodeId);
  }, []);

  const handleDragOver = useCallback((nodeId: string, node: HierarchyNode) => {
    // Only allow drag over if target is not a leaf node (has children or can have children)
    // Allow root drops (when parent nodes are expanded)
    if (node.children.length > 0) {
      setDragOverNodeId(nodeId);
    } else {
      setDragOverNodeId(null);
    }
  }, []);

  const handleDrop = useCallback((targetNodeId: string, targetNode: HierarchyNode) => {
    if (draggedNodeId && draggedNodeId !== targetNodeId && onNodeMove) {
      // Only allow drop if target is not a leaf node
      if (targetNode.children.length > 0) {
        onNodeMove(draggedNodeId, targetNodeId);
      }
    }
    setDraggedNodeId(null);
    setDragOverNodeId(null);
  }, [draggedNodeId, onNodeMove]);

  const handleDragEnd = useCallback(() => {
    setDraggedNodeId(null);
    setDragOverNodeId(null);
  }, []);

  const renderNode = (node: HierarchyNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isDragOver = dragOverNodeId === node.id;

    return (
      <div key={node.id} onDragEnd={handleDragEnd}>
        <TreeNode
          node={node}
          isSelected={selectedNode?.id === node.id}
          onSelect={onNodeSelect}
          isExpanded={isExpanded}
          onToggle={() => onToggleExpand(node.id)}
          onContextMenu={onContextMenu}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragOver={isDragOver}
        />
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full h-full overflow-auto p-2">
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">No data loaded</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {nodes.map((node) => renderNode(node))}
        </div>
      )}
    </div>
  );
}
