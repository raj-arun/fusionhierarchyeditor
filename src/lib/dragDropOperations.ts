import type { HierarchyNode, ParsedData } from '../types/hierarchy';

/**
 * Move a node to a new parent in the hierarchy
 */
export function moveNodeToNewParent(
  parsedData: ParsedData,
  nodeId: string,
  newParentId: string | null
): ParsedData | null {
  const node = parsedData.nodes.get(nodeId);
  if (!node) return null;

  // Can't move to self
  if (nodeId === newParentId) return null;

  // Check for circular dependency (can't move a parent into its own child)
  if (newParentId && isDescendant(parsedData, newParentId, nodeId)) {
    return null;
  }

  const oldParent = node.parent;

  // Remove from old parent
  if (!oldParent) {
    parsedData.roots = parsedData.roots.filter(n => n.id !== nodeId);
  } else {
    const parent = parsedData.nodes.get(oldParent);
    if (parent) {
      parent.children = parent.children.filter(n => n.id !== nodeId);
    }
  }

  // Update node's parent
  node.parent = newParentId || '';

  // Update properties (second column is parent field)
  const secondColName = parsedData.columns[1];
  if (secondColName) {
    node.properties[secondColName] = newParentId || '';
  }

  // Add to new parent
  if (!newParentId) {
    // Moving to root
    node.level = 0;
    parsedData.roots.push(node);
    parsedData.roots.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const newParent = parsedData.nodes.get(newParentId);
    if (newParent) {
      node.level = newParent.level + 1;
      newParent.children.push(node);
      newParent.children.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  // Update levels of all descendants
  updateDescendantLevels(node);

  return { ...parsedData };
}

/**
 * Check if a node is a descendant of another node
 */
function isDescendant(
  parsedData: ParsedData,
  potentialDescendantId: string,
  ancestorId: string
): boolean {
  const node = parsedData.nodes.get(potentialDescendantId);
  if (!node) return false;

  if (node.parent === ancestorId) return true;
  if (!node.parent) return false;

  return isDescendant(parsedData, node.parent, ancestorId);
}

/**
 * Update levels for all descendants recursively
 */
function updateDescendantLevels(node: HierarchyNode): void {
  node.children.forEach(child => {
    child.level = node.level + 1;
    updateDescendantLevels(child);
  });
}
