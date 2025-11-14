import { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { parseFile } from '../lib/fileParser';
import type { ParsedData } from '../types/hierarchy';

interface FileUploadProps {
  onDataLoaded: (data: ParsedData) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await parseFile(file);
        setFileName(file.name);
        onDataLoaded(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse file');
        setFileName(null);
      } finally {
        setIsLoading(false);
      }
    },
    [onDataLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setFileName(null);
    setError(null);
  }, []);

  return (
    <div className="w-full">
      {!fileName ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-12 transition-colors',
            'flex flex-col items-center justify-center gap-4 cursor-pointer',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
          )}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />

          <Upload className="h-12 w-12 text-muted-foreground" />

          <div className="text-center">
            <p className="text-lg font-medium">
              {isLoading ? 'Processing...' : 'Upload your file'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Supports CSV and Excel files (.csv, .xlsx, .xls)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 border rounded-lg bg-accent/50">
          <FileSpreadsheet className="h-8 w-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">File loaded successfully</p>
          </div>
          <button
            onClick={clearFile}
            className={cn(
              'rounded-md p-1 hover:bg-destructive/10 transition-colors',
              'text-muted-foreground hover:text-destructive'
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
