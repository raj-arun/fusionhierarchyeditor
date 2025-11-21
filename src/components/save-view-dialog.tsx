import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { COMMON_APPLICATIONS, COMMON_INSTANCES, COMMON_DIMENSIONS } from '../types/views';

interface SaveViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (application: string, instance: string, dimension: string, name: string) => void;
  existingView?: {
    application: string;
    instance: string;
    dimension: string;
    name: string;
  };
}

export function SaveViewDialog({
  isOpen,
  onClose,
  onSave,
  existingView,
}: SaveViewDialogProps) {
  const [application, setApplication] = useState('');
  const [instance, setInstance] = useState('');
  const [dimension, setDimension] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (existingView) {
      setApplication(existingView.application);
      setInstance(existingView.instance);
      setDimension(existingView.dimension);
      setName(existingView.name);
    }
  }, [existingView]);

  const handleSave = () => {
    onSave(application.trim(), instance.trim(), dimension.trim(), name.trim());
    handleClose();
  };

  const handleClose = () => {
    // Reset to defaults
    setApplication('');
    setInstance('');
    setDimension('');
    setName('');
    onClose();
  };

  const displayName = [application, instance, dimension, name]
    .filter(part => part.trim())
    .join(':') || 'Unnamed View';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Save className="h-5 w-5" />
            {existingView ? 'Rename View' : 'Save View'}
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
            <label className="block text-sm font-medium mb-2">Application</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={application}
                onChange={(e) => setApplication(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md bg-background"
                placeholder="e.g., Planning, ARCS, FCC"
                list="applications"
              />
              <datalist id="applications">
                {COMMON_APPLICATIONS.map(app => (
                  <option key={app} value={app} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Instance</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={instance}
                onChange={(e) => setInstance(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md bg-background"
                placeholder="e.g., Dev, PROD, TEST"
                list="instances"
              />
              <datalist id="instances">
                {COMMON_INSTANCES.map(inst => (
                  <option key={inst} value={inst} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dimension</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md bg-background"
                placeholder="e.g., Account, Projects, Entity"
                list="dimensions"
              />
              <datalist id="dimensions">
                {COMMON_DIMENSIONS.map(dim => (
                  <option key={dim} value={dim} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
              placeholder="e.g., Default Alias, Consolidated View"
            />
          </div>

          <div className="p-3 bg-muted/30 rounded-md border">
            <div className="text-xs font-medium text-muted-foreground mb-1">Preview:</div>
            <div className="text-sm font-medium">{displayName}</div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim()}
              className={cn(
                'px-4 py-2 rounded-md transition-colors flex items-center gap-2',
                name.trim()
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <Save className="h-4 w-4" />
              {existingView ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
