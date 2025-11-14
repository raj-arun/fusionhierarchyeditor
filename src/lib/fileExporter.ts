import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import type { HierarchyNode } from '../types/hierarchy';

export function flattenHierarchy(
  nodes: HierarchyNode[],
  columns: string[]
): string[][] {
  const rows: string[][] = [];

  const traverse = (node: HierarchyNode) => {
    const row = columns.map((col) => node.properties[col] || '');
    rows.push(row);
    node.children.forEach(traverse);
  };

  nodes.forEach(traverse);
  return rows;
}

export function exportToCSV(
  nodes: HierarchyNode[],
  columns: string[],
  filename: string = 'hierarchy-export.csv'
) {
  const rows = flattenHierarchy(nodes, columns);
  const csv = Papa.unparse({
    fields: columns,
    data: rows,
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
}

export async function exportToExcel(
  nodes: HierarchyNode[],
  columns: string[],
  filename: string = 'hierarchy-export.xlsx'
) {
  const rows = flattenHierarchy(nodes, columns);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Hierarchy');

  // Add header row
  worksheet.addRow(columns);

  // Add data rows
  rows.forEach(row => {
    worksheet.addRow(row);
  });

  // Auto-size columns
  worksheet.columns = columns.map((col, i) => {
    const columnData = [col, ...rows.map((row) => row[i] || '')];
    const maxWidth = Math.max(...columnData.map((cell) => String(cell).length));
    return {
      header: col,
      key: col,
      width: Math.min(maxWidth + 2, 50)
    };
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  downloadFile(blob, filename);
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// For Electron integration, we can add a file save dialog
export function requestSaveLocation(
  defaultFilename: string,
  callback: (path: string | null) => void
) {
  // In browser, use the download attribute
  // In Electron, we would use dialog.showSaveDialog
  if (typeof (window as any).electronAPI !== 'undefined') {
    (window as any).electronAPI
      .showSaveDialog({
        defaultPath: defaultFilename,
        filters: [
          { name: 'CSV Files', extensions: ['csv'] },
          { name: 'Excel Files', extensions: ['xlsx'] },
        ],
      })
      .then((result: { filePath: string | null }) => {
        callback(result.filePath);
      });
  } else {
    // Browser fallback - just use the download attribute
    callback(defaultFilename);
  }
}
