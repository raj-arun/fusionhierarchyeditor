import { useEffect, useRef } from 'react';
import { Eye, Copy, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onViewProperties: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function ContextMenu({
  x,
  y,
  onClose,
  onViewProperties,
  onDuplicate,
  onDelete,
  canDelete,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-card border rounded-md shadow-lg py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={() => {
          onViewProperties();
          onClose();
        }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2"
      >
        <Eye className="h-4 w-4" />
        View Properties
      </button>
      <button
        onClick={() => {
          onDuplicate();
          onClose();
        }}
        className="w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2"
      >
        <Copy className="h-4 w-4" />
        Duplicate
      </button>
      <div className="border-t my-1" />
      <button
        onClick={() => {
          if (canDelete) {
            onDelete();
            onClose();
          }
        }}
        disabled={!canDelete}
        className={cn(
          'w-full px-3 py-2 text-sm text-left transition-colors flex items-center gap-2',
          canDelete
            ? 'hover:bg-destructive/10 hover:text-destructive'
            : 'text-muted-foreground/50 cursor-not-allowed'
        )}
        title={canDelete ? 'Delete member' : 'Cannot delete parent nodes'}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );
}
