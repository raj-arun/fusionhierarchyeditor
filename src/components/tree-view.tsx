import { useCallback } from 'react';
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
}

interface TreeNodeProps {
  node: HierarchyNode;
  isSelected: boolean;
  onSelect: (node: HierarchyNode) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function TreeNode({ node, isSelected, onSelect, isExpanded, onToggle }: TreeNodeProps) {
  const hasChildren = node.children.length > 0;

  const handleClick = useCallback(() => {
    onSelect(node);
  }, [node, onSelect]);

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
        className={cn(
          'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer',
          'hover:bg-accent transition-colors',
          isSelected && 'bg-primary/10 hover:bg-primary/15'
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

export function TreeView({ nodes, selectedNode, onNodeSelect, expandedNodes, onToggleExpand }: TreeViewProps) {
  const renderNode = (node: HierarchyNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <TreeNode
          node={node}
          isSelected={selectedNode?.id === node.id}
          onSelect={onNodeSelect}
          isExpanded={isExpanded}
          onToggle={() => onToggleExpand(node.id)}
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
