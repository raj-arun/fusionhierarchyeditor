import { useState } from 'react';
import { X, FileDown, FolderOpen } from 'lucide-react';
import { cn } from '../lib/utils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel', includeHiddenColumns: boolean, fileName: string, filePath?: string) => void;
  hasHiddenColumns: boolean;
}

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  hasHiddenColumns,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [includeHiddenColumns, setIncludeHiddenColumns] = useState(true);
  const [fileName, setFileName] = useState('hierarchy-export');
  const [selectedPath, setSelectedPath] = useState<string>('');

  const isElectron = typeof (window as any).electronAPI !== 'undefined';

  const handleChooseLocation = async () => {
    if (!isElectron) return;

    const extension = format === 'csv' ? '.csv' : '.xlsx';
    const fullFileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;

    const result = await (window as any).electronAPI.showSaveDialog({
      defaultPath: fullFileName,
      filters: [
        format === 'csv'
          ? { name: 'CSV Files', extensions: ['csv'] }
          : { name: 'Excel Files', extensions: ['xlsx'] }
      ]
    });

    if (result && !result.canceled && result.filePath) {
      setSelectedPath(result.filePath);
    }
  };

  const handleExport = () => {
    onExport(format, includeHiddenColumns, fileName, selectedPath || undefined);
    onClose();
  };

  const handleClose = () => {
    // Reset to defaults
    setFormat('csv');
    setIncludeHiddenColumns(true);
    setFileName('hierarchy-export');
    setSelectedPath('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Export Data
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="Enter file name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <div className="flex gap-2">
              <label className="flex-1 flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-sm">CSV</div>
                  <div className="text-xs text-muted-foreground">Comma-separated values</div>
                </div>
              </label>
              <label className="flex-1 flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === 'excel'}
                  onChange={() => setFormat('excel')}
                  className="w-4 h-4"
                />
                <div>
                  <div className="font-medium text-sm">Excel</div>
                  <div className="text-xs text-muted-foreground">XLSX format</div>
                </div>
              </label>
            </div>
          </div>

          {hasHiddenColumns && (
            <div className="p-3 border rounded-md bg-muted/30">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHiddenColumns}
                  onChange={(e) => setIncludeHiddenColumns(e.target.checked)}
                  className="w-4 h-4 mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium">Include Hidden Columns</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Some columns are currently hidden. Check this to include them in the export.
                  </div>
                </div>
              </label>
            </div>
          )}

          {isElectron && (
            <div>
              <label className="block text-sm font-medium mb-2">Save Location</label>
              <button
                onClick={handleChooseLocation}
                type="button"
                className={cn(
                  'w-full px-3 py-2 border rounded-md',
                  'hover:bg-accent transition-colors flex items-center gap-2 justify-center'
                )}
              >
                <FolderOpen className="h-4 w-4" />
                Choose Location
              </button>
              {selectedPath && (
                <div className="mt-2 p-2 bg-muted/30 rounded-md">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Selected:</div>
                  <div className="text-xs break-all">{selectedPath}</div>
                </div>
              )}
            </div>
          )}

          {!isElectron && (
            <div className="p-2 bg-muted/20 rounded-md">
              <div className="text-xs text-muted-foreground">
                The file will be saved to your browser's default download folder.
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!fileName.trim()}
              className={cn(
                'px-4 py-2 rounded-md transition-colors flex items-center gap-2',
                fileName.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <FileDown className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
