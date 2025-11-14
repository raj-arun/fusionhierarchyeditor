import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { FileData, HierarchyNode, ParsedData } from '../types/hierarchy';

export function parseCSV(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }

        // Remove BOM if present
        const headers = data[0].map(h => h.replace(/^\ufeff/, '').trim());
        const rows = data.slice(1).filter(row => row.some(cell => cell.trim()));

        resolve({ headers, rows });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export function parseExcel(file: File): Promise<FileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];

        if (jsonData.length < 2) {
          reject(new Error('File must contain at least a header row and one data row'));
          return;
        }

        // Remove BOM if present
        const headers = jsonData[0].map(h => String(h || '').replace(/^\ufeff/, '').trim());
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && String(cell).trim()));

        resolve({ headers, rows: rows.map(row => row.map(cell => String(cell || ''))) });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

export function buildHierarchy(fileData: FileData): ParsedData {
  const { headers, rows } = fileData;

  if (headers.length < 2) {
    throw new Error('File must have at least 2 columns (member name and parent)');
  }

  const nodes = new Map<string, HierarchyNode>();
  const roots: HierarchyNode[] = [];

  // First pass: create all nodes
  rows.forEach((row) => {
    const memberName = row[0]?.trim();
    const parentName = row[1]?.trim();

    if (!memberName) return;

    const properties: Record<string, string> = {};
    headers.forEach((header, index) => {
      properties[header] = row[index] || '';
    });

    const node: HierarchyNode = {
      id: memberName,
      name: memberName,
      parent: parentName || '',
      properties,
      children: [],
      level: 0,
    };

    nodes.set(memberName, node);
  });

  // Second pass: build parent-child relationships
  nodes.forEach((node) => {
    if (!node.parent) {
      roots.push(node);
    } else {
      const parent = nodes.get(node.parent);
      if (parent) {
        parent.children.push(node);
        node.level = parent.level + 1;
      } else {
        // If parent doesn't exist, treat as root
        roots.push(node);
      }
    }
  });

  // Sort children alphabetically for consistent display
  const sortChildren = (node: HierarchyNode) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortChildren);
  };

  roots.forEach(sortChildren);
  roots.sort((a, b) => a.name.localeCompare(b.name));

  return {
    columns: headers,
    nodes,
    roots,
  };
}

export async function parseFile(file: File): Promise<ParsedData> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  let fileData: FileData;

  if (extension === 'csv') {
    fileData = await parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    fileData = await parseExcel(file);
  } else {
    throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
  }

  return buildHierarchy(fileData);
}
