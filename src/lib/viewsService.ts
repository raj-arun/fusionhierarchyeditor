import type { ColumnView } from '../types/views';

const STORAGE_KEY = 'fusion-hierarchy-views';
const ACTIVE_VIEW_KEY = 'fusion-hierarchy-active-view';

// Check if running in Electron
const isElectron = typeof (window as any).electronAPI !== 'undefined';

/**
 * Migrate views from localStorage to SQLite (Electron only)
 */
async function migrateFromLocalStorage(columns: string[]): Promise<void> {
  if (!isElectron) return;

  try {
    // Check if localStorage has views
    const localStorageViews = localStorage.getItem(STORAGE_KEY);
    if (!localStorageViews) return;

    const views: ColumnView[] = JSON.parse(localStorageViews);
    if (views.length === 0) return;

    console.log(`Migrating ${views.length} views from localStorage to SQLite...`);

    // Initialize default view first
    await (window as any).electronAPI.views.init(columns);

    // Migrate each view
    for (const view of views) {
      if (!view.isDefault) { // Skip default view as it's already created
        const viewData = {
          id: view.id,
          application: view.application,
          instance: view.instance,
          dimension: view.dimension,
          name: view.name,
          columnVisibility: view.columnVisibility
        };
        await (window as any).electronAPI.views.create(viewData);
      }
    }

    // Migrate active view
    const activeViewId = localStorage.getItem(ACTIVE_VIEW_KEY);
    if (activeViewId) {
      await (window as any).electronAPI.views.setActive(activeViewId);
    }

    // Clear localStorage after successful migration
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_VIEW_KEY);

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    // Don't throw - fall back to localStorage if migration fails
  }
}

/**
 * Creates the default view with all columns visible
 */
export function createDefaultView(columns: string[]): ColumnView {
  const columnVisibility: Record<string, boolean> = {};
  columns.forEach(col => {
    columnVisibility[col] = true;
  });

  return {
    id: 'default',
    application: '',
    instance: '',
    dimension: '',
    name: 'Default View',
    displayName: 'Default View',
    columnVisibility,
    isDefault: true,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Loads all views
 */
export async function loadViews(): Promise<ColumnView[]> {
  if (isElectron) {
    try {
      const result = await (window as any).electronAPI.views.getAll();
      if (result.success) {
        return result.views;
      }
    } catch (error) {
      console.error('Failed to load views from SQLite:', error);
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load views from localStorage:', error);
    return [];
  }
}

/**
 * Saves views (localStorage only - SQLite saves are handled per operation)
 */
function saveViewsToLocalStorage(views: ColumnView[]): void {
  if (isElectron) return; // Don't use localStorage in Electron

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch (error) {
    console.error('Failed to save views:', error);
  }
}

/**
 * Gets the active view ID
 */
export async function getActiveViewId(): Promise<string> {
  if (isElectron) {
    try {
      const result = await (window as any).electronAPI.views.getActive();
      if (result.success) {
        return result.viewId;
      }
    } catch (error) {
      console.error('Failed to get active view from SQLite:', error);
    }
  }

  // Fallback to localStorage
  try {
    return localStorage.getItem(ACTIVE_VIEW_KEY) || 'default';
  } catch (error) {
    console.error('Failed to load active view:', error);
    return 'default';
  }
}

/**
 * Sets the active view ID
 */
export async function setActiveViewId(viewId: string): Promise<void> {
  if (isElectron) {
    try {
      await (window as any).electronAPI.views.setActive(viewId);
      return;
    } catch (error) {
      console.error('Failed to set active view in SQLite:', error);
    }
  }

  // Fallback to localStorage
  try {
    localStorage.setItem(ACTIVE_VIEW_KEY, viewId);
  } catch (error) {
    console.error('Failed to save active view:', error);
  }
}

/**
 * Creates a new view
 */
export async function createView(
  application: string,
  instance: string,
  dimension: string,
  name: string,
  columnVisibility: Record<string, boolean>
): Promise<ColumnView | { error: string }> {
  const displayName = [application, instance, dimension, name]
    .filter(Boolean)
    .join(':') || 'Unnamed View';

  const newView: ColumnView = {
    id: crypto.randomUUID(),
    application,
    instance,
    dimension,
    name,
    displayName,
    columnVisibility,
    createdAt: new Date().toISOString(),
  };

  if (isElectron) {
    try {
      const result = await (window as any).electronAPI.views.create(newView);
      if (result.success) {
        return result.view;
      }
      return { error: 'Failed to create view' };
    } catch (error: any) {
      console.error('Failed to create view in SQLite:', error);
      return { error: error.message || 'Failed to create view' };
    }
  }

  // Fallback to localStorage (with 20 view limit)
  const views = await loadViews();
  const nonDefaultViews = views.filter(v => !v.isDefault);
  if (nonDefaultViews.length >= 20) {
    return { error: 'Maximum of 20 views reached. Please delete a view before creating a new one.' };
  }

  views.push(newView);
  saveViewsToLocalStorage(views);
  return newView;
}

/**
 * Updates an existing view
 */
export async function updateView(
  viewId: string,
  updates: {
    application?: string;
    instance?: string;
    dimension?: string;
    name?: string;
    columnVisibility?: Record<string, boolean>;
  }
): Promise<boolean> {
  if (isElectron) {
    try {
      const result = await (window as any).electronAPI.views.update(viewId, updates);
      return result.success;
    } catch (error) {
      console.error('Failed to update view in SQLite:', error);
      return false;
    }
  }

  // Fallback to localStorage
  const views = await loadViews();
  const viewIndex = views.findIndex(v => v.id === viewId);

  if (viewIndex === -1) return false;

  const view = views[viewIndex];

  // Update fields
  if (updates.application !== undefined) view.application = updates.application;
  if (updates.instance !== undefined) view.instance = updates.instance;
  if (updates.dimension !== undefined) view.dimension = updates.dimension;
  if (updates.name !== undefined) view.name = updates.name;
  if (updates.columnVisibility !== undefined) view.columnVisibility = updates.columnVisibility;

  // Recompute display name
  view.displayName = [view.application, view.instance, view.dimension, view.name]
    .filter(Boolean)
    .join(':') || (view.isDefault ? 'Default View' : 'Unnamed View');

  view.updatedAt = new Date().toISOString();

  views[viewIndex] = view;
  saveViewsToLocalStorage(views);
  return true;
}

/**
 * Deletes a view
 */
export async function deleteView(viewId: string): Promise<boolean> {
  if (isElectron) {
    try {
      const result = await (window as any).electronAPI.views.delete(viewId);
      return result.success;
    } catch (error) {
      console.error('Failed to delete view in SQLite:', error);
      return false;
    }
  }

  // Fallback to localStorage
  const views = await loadViews();
  const view = views.find(v => v.id === viewId);

  // Cannot delete default view
  if (!view || view.isDefault) return false;

  const filteredViews = views.filter(v => v.id !== viewId);
  saveViewsToLocalStorage(filteredViews);

  // If deleted view was active, switch to default
  const activeId = await getActiveViewId();
  if (activeId === viewId) {
    await setActiveViewId('default');
  }

  return true;
}

/**
 * Gets a specific view by ID
 */
export async function getView(viewId: string): Promise<ColumnView | null> {
  if (isElectron) {
    try {
      const result = await (window as any).electronAPI.views.get(viewId);
      if (result.success) {
        return result.view;
      }
    } catch (error) {
      console.error('Failed to get view from SQLite:', error);
    }
  }

  // Fallback to localStorage
  const views = await loadViews();
  return views.find(v => v.id === viewId) || null;
}

/**
 * Initializes views with default view if needed
 */
export async function initializeViews(columns: string[]): Promise<ColumnView[]> {
  // Try to migrate from localStorage first (Electron only)
  if (isElectron) {
    await migrateFromLocalStorage(columns);
  }

  if (isElectron) {
    try {
      // Initialize default view in SQLite
      await (window as any).electronAPI.views.init(columns);
      // Load all views
      const result = await (window as any).electronAPI.views.getAll();
      if (result.success) {
        return result.views;
      }
    } catch (error) {
      console.error('Failed to initialize views in SQLite:', error);
    }
  }

  // Fallback to localStorage
  let views = await loadViews();

  // Ensure default view exists
  const hasDefault = views.some(v => v.isDefault);
  if (!hasDefault) {
    const defaultView = createDefaultView(columns);
    views.unshift(defaultView);
    saveViewsToLocalStorage(views);
  }

  return views;
}
