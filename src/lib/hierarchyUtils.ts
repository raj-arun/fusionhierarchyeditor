import type { HierarchyNode } from '../types/hierarchy';

/**
 * Gets all visible nodes based on the expansion state
 * A node is visible if it's at root level or all its ancestors are expanded
 */
export function getVisibleNodes(
  roots: HierarchyNode[],
  expandedNodes: Set<string>
): HierarchyNode[] {
  const visibleNodes: HierarchyNode[] = [];

  const traverse = (node: HierarchyNode) => {
    visibleNodes.push(node);

    // If this node is expanded, add its children
    if (expandedNodes.has(node.id) && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  };

  roots.forEach(traverse);
  return visibleNodes;
}

/**
 * Expands all nodes in the hierarchy
 */
export function getAllNodeIds(roots: HierarchyNode[]): Set<string> {
  const nodeIds = new Set<string>();

  const traverse = (node: HierarchyNode) => {
    nodeIds.add(node.id);
    node.children.forEach(traverse);
  };

  roots.forEach(traverse);
  return nodeIds;
}
