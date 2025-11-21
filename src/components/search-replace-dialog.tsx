import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SearchReplaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  onReplace: (column: string, searchText: string, replaceText: string) => number;
}

export function SearchReplaceDialog({
  isOpen,
  onClose,
  columns,
  onReplace,
}: SearchReplaceDialogProps) {
  const [selectedColumn, setSelectedColumn] = useState('');
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen && columns.length > 0 && !selectedColumn) {
      setSelectedColumn(columns[0]);
    }
  }, [isOpen, columns, selectedColumn]);

  const handleReplace = () => {
    if (!selectedColumn || !searchText) {
      setMessage('Please select a column and enter search text');
      return;
    }

    const count = onReplace(selectedColumn, searchText, replaceText);
    setMessage(`Replaced in ${count} row(s)`);

    // Clear the message after 3 seconds
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClose = () => {
    setSearchText('');
    setReplaceText('');
    setMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Search and Replace</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Column</label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search Text</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="Enter text to search..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Replace With</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="Enter replacement text..."
            />
          </div>

          {message && (
            <div className={cn(
              'p-3 rounded-md text-sm',
              message.includes('Please') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            )}>
              {message}
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
              onClick={handleReplace}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
