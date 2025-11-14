import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (memberName: string, parentName: string) => void;
  columns?: string[];
  existingMembers: Set<string>;
}

export function AddMemberDialog({
  isOpen,
  onClose,
  onAdd,
  existingMembers,
}: AddMemberDialogProps) {
  const [memberName, setMemberName] = useState('');
  const [parentName, setParentName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMemberName('');
      setParentName('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberName.trim()) {
      setError('Member name is required');
      return;
    }

    if (existingMembers.has(memberName.trim())) {
      setError('Member name already exists');
      return;
    }

    if (parentName.trim() && !existingMembers.has(parentName.trim())) {
      setError('Parent member does not exist');
      return;
    }

    onAdd(memberName.trim(), parentName.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add New Member</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="memberName" className="block text-sm font-medium mb-1">
              Member Name <span className="text-destructive">*</span>
            </label>
            <input
              id="memberName"
              type="text"
              value={memberName}
              onChange={(e) => {
                setMemberName(e.target.value);
                setError('');
              }}
              className={cn(
                'w-full px-3 py-2 border rounded-md',
                'bg-background focus:outline-none focus:ring-2 focus:ring-ring'
              )}
              placeholder="Enter member name"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="parentName" className="block text-sm font-medium mb-1">
              Parent Member
            </label>
            <input
              id="parentName"
              type="text"
              value={parentName}
              onChange={(e) => {
                setParentName(e.target.value);
                setError('');
              }}
              className={cn(
                'w-full px-3 py-2 border rounded-md',
                'bg-background focus:outline-none focus:ring-2 focus:ring-ring'
              )}
              placeholder="Leave empty for root node"
              list="parent-suggestions"
            />
            <datalist id="parent-suggestions">
              {Array.from(existingMembers).map((member) => (
                <option key={member} value={member} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to create a root node
            </p>
          </div>

          {error && (
            <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md',
                'border border-input hover:bg-accent transition-colors'
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'transition-colors'
              )}
            >
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
