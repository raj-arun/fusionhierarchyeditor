import type { HierarchyNode, ParsedData } from '../types/hierarchy';

/**
 * Add a new member to the hierarchy
 */
export function addMemberToHierarchy(
  parsedData: ParsedData,
  memberName: string,
  parentName: string,
  columns: string[]
): ParsedData {
  // Create new node
  const properties: Record<string, string> = {};
  columns.forEach((col, index) => {
    if (index === 0) {
      properties[col] = memberName;
    } else if (index === 1) {
      properties[col] = parentName;
    } else {
      properties[col] = '';
    }
  });

  const newNode: HierarchyNode = {
    id: memberName,
    name: memberName,
    parent: parentName,
    properties,
    children: [],
    level: 0,
  };

  // Add to nodes map
  parsedData.nodes.set(memberName, newNode);

  // Update parent-child relationships
  if (!parentName) {
    // Root node
    parsedData.roots.push(newNode);
    parsedData.roots.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const parent = parsedData.nodes.get(parentName);
    if (parent) {
      newNode.level = parent.level + 1;
      parent.children.push(newNode);
      parent.children.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Parent doesn't exist, treat as root
      parsedData.roots.push(newNode);
      parsedData.roots.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return { ...parsedData };
}

/**
 * Delete a node from the hierarchy (only leaf nodes)
 */
export function deleteNodeFromHierarchy(
  parsedData: ParsedData,
  nodeId: string
): ParsedData | null {
  const node = parsedData.nodes.get(nodeId);
  if (!node) return null;

  // Only allow deleting leaf nodes
  if (node.children.length > 0) {
    return null;
  }

  // Remove from parent's children or roots
  if (!node.parent) {
    parsedData.roots = parsedData.roots.filter(n => n.id !== nodeId);
  } else {
    const parent = parsedData.nodes.get(node.parent);
    if (parent) {
      parent.children = parent.children.filter(n => n.id !== nodeId);
    }
  }

  // Remove from nodes map
  parsedData.nodes.delete(nodeId);

  return { ...parsedData };
}

/**
 * Duplicate a node
 */
export function duplicateNode(
  parsedData: ParsedData,
  nodeId: string,
  newName: string
): ParsedData | null {
  const originalNode = parsedData.nodes.get(nodeId);
  if (!originalNode) return null;

  // Check if new name already exists
  if (parsedData.nodes.has(newName)) {
    return null;
  }

  // Create duplicate with new name
  const duplicateNode: HierarchyNode = {
    id: newName,
    name: newName,
    parent: originalNode.parent,
    properties: {
      ...originalNode.properties,
      [Object.keys(originalNode.properties)[0]]: newName, // Update first column (member name)
    },
    children: [],
    level: originalNode.level,
  };

  // Add to nodes map
  parsedData.nodes.set(newName, duplicateNode);

  // Add to parent's children or roots
  if (!originalNode.parent) {
    parsedData.roots.push(duplicateNode);
    parsedData.roots.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    const parent = parsedData.nodes.get(originalNode.parent);
    if (parent) {
      parent.children.push(duplicateNode);
      parent.children.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return { ...parsedData };
}

/**
 * Generate a unique name for duplicated member
 */
export function generateUniqueName(baseName: string, existingNames: Set<string>): string {
  let counter = 1;
  let newName = `${baseName}_copy`;

  while (existingNames.has(newName)) {
    counter++;
    newName = `${baseName}_copy${counter}`;
  }

  return newName;
}
