import { useState } from 'react';
import { X, Trash2, Edit2 } from 'lucide-react';
import type { ColumnView } from '../types/views';

interface ManageViewsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  views: ColumnView[];
  onRenameView: (view: ColumnView) => void;
  onDeleteView: (viewId: string) => void;
}

export function ManageViewsDialog({
  isOpen,
  onClose,
  views,
  onRenameView,
  onDeleteView,
}: ManageViewsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredViews = views.filter(view =>
    view.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (viewId: string, viewName: string) => {
    if (confirm(`Are you sure you want to delete "${viewName}"?`)) {
      onDeleteView(viewId);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Manage Views</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search views..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredViews.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No views found
            </div>
          ) : (
            <div className="space-y-2">
              {filteredViews.map(view => (
                <div
                  key={view.id}
                  className="flex items-center justify-between p-4 border rounded-md hover:bg-accent/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="font-medium truncate">{view.displayName}</div>
                    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                      {view.application && (
                        <div>Application: {view.application}</div>
                      )}
                      {view.instance && (
                        <div>Instance: {view.instance}</div>
                      )}
                      {view.dimension && (
                        <div>Dimension: {view.dimension}</div>
                      )}
                      {view.name && (
                        <div>Name: {view.name}</div>
                      )}
                      <div className="text-xs mt-1">
                        Created: {new Date(view.createdAt).toLocaleDateString()}
                        {view.updatedAt && (
                          <> • Updated: {new Date(view.updatedAt).toLocaleDateString()}</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {view.isDefault ? (
                      <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                        Default
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => onRenameView(view)}
                          className="p-2 hover:bg-accent rounded transition-colors"
                          title="Rename view"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(view.id, view.displayName)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors"
                          title="Delete view"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {views.filter(v => !v.isDefault).length} / 20 views
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
