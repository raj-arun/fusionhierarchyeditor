import { useState, useCallback } from 'react';
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
}

interface TreeNodeProps {
  node: HierarchyNode;
  isSelected: boolean;
  onSelect: (node: HierarchyNode) => void;
}

function TreeNode({ node, isSelected, onSelect }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children.length > 0;

  const handleToggle = useCallback(() => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  }, [hasChildren, isExpanded]);

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
          onClick={handleToggle}
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

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TreeView({ nodes, selectedNode, onNodeSelect }: TreeViewProps) {
  return (
    <div className="w-full h-full overflow-auto p-2">
      {nodes.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p className="text-sm">No data loaded</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {nodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onSelect={onNodeSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
