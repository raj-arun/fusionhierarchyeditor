export interface HierarchyNode {
  id: string;
  name: string;
  parent: string;
  properties: Record<string, string>;
  children: HierarchyNode[];
  level: number;
}

export interface ParsedData {
  columns: string[];
  nodes: Map<string, HierarchyNode>;
  roots: HierarchyNode[];
}

export interface FileData {
  headers: string[];
  rows: string[][];
}
