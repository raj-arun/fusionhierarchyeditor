import { useState, useRef, useEffect } from 'react';
import { Eye, ChevronDown, Plus, Settings, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ColumnView } from '../types/views';

interface ViewSelectorProps {
  views: ColumnView[];
  currentView: ColumnView;
  onSelectView: (viewId: string) => void;
  onSaveNewView: () => void;
  onUpdateCurrentView: () => void;
  onManageViews: () => void;
}

export function ViewSelector({
  views,
  currentView,
  onSelectView,
  onSaveNewView,
  onUpdateCurrentView,
  onManageViews,
}: ViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const filteredViews = views.filter(view =>
    view.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectView = (viewId: string) => {
    onSelectView(viewId);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 border rounded-md',
          'hover:bg-accent transition-colors text-sm'
        )}
      >
        <Eye className="h-4 w-4" />
        <span className="font-medium">Current:</span>
        <span className="max-w-[200px] truncate">{currentView.displayName}</span>
        <ChevronDown className={cn(
          'h-4 w-4 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-96 bg-card border rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col">
          {/* Search bar */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search views..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm"
              autoFocus
            />
          </div>

          {/* Views list */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredViews.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No views found
              </div>
            ) : (
              <div className="space-y-1">
                {filteredViews.map(view => (
                  <button
                    key={view.id}
                    onClick={() => handleSelectView(view.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                      'hover:bg-accent',
                      view.id === currentView.id && 'bg-accent font-medium'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{view.displayName}</span>
                      {view.isDefault && (
                        <span className="text-xs text-muted-foreground ml-2">Default</span>
                      )}
                    </div>
                    {view.updatedAt && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Updated: {new Date(view.updatedAt).toLocaleDateString()}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t p-2 space-y-1">
            {!currentView.isDefault && (
              <button
                onClick={() => {
                  onUpdateCurrentView();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                  'hover:bg-accent transition-colors'
                )}
              >
                <Save className="h-4 w-4" />
                Update Current View
              </button>
            )}
            <button
              onClick={() => {
                onSaveNewView();
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                'hover:bg-accent transition-colors'
              )}
            >
              <Plus className="h-4 w-4" />
              Save as New View
            </button>
            <button
              onClick={() => {
                onManageViews();
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                'hover:bg-accent transition-colors'
              )}
            >
              <Settings className="h-4 w-4" />
              Manage Views
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
