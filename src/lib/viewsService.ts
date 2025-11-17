import type { ColumnView } from '../types/views';

const STORAGE_KEY = 'fusion-hierarchy-views';
const ACTIVE_VIEW_KEY = 'fusion-hierarchy-active-view';
const MAX_VIEWS = 20;

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
 * Loads all views from localStorage
 */
export function loadViews(): ColumnView[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load views:', error);
    return [];
  }
}

/**
 * Saves views to localStorage
 */
export function saveViews(views: ColumnView[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch (error) {
    console.error('Failed to save views:', error);
  }
}

/**
 * Gets the active view ID from localStorage
 */
export function getActiveViewId(): string {
  try {
    return localStorage.getItem(ACTIVE_VIEW_KEY) || 'default';
  } catch (error) {
    console.error('Failed to load active view:', error);
    return 'default';
  }
}

/**
 * Sets the active view ID in localStorage
 */
export function setActiveViewId(viewId: string): void {
  try {
    localStorage.setItem(ACTIVE_VIEW_KEY, viewId);
  } catch (error) {
    console.error('Failed to save active view:', error);
  }
}

/**
 * Creates a new view
 */
export function createView(
  application: string,
  instance: string,
  dimension: string,
  name: string,
  columnVisibility: Record<string, boolean>
): ColumnView | { error: string } {
  const views = loadViews();

  // Check view limit (excluding default)
  const nonDefaultViews = views.filter(v => !v.isDefault);
  if (nonDefaultViews.length >= MAX_VIEWS) {
    return { error: `Maximum of ${MAX_VIEWS} views reached. Please delete a view before creating a new one.` };
  }

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

  views.push(newView);
  saveViews(views);
  return newView;
}

/**
 * Updates an existing view
 */
export function updateView(
  viewId: string,
  updates: {
    application?: string;
    instance?: string;
    dimension?: string;
    name?: string;
    columnVisibility?: Record<string, boolean>;
  }
): boolean {
  const views = loadViews();
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
  saveViews(views);
  return true;
}

/**
 * Deletes a view
 */
export function deleteView(viewId: string): boolean {
  const views = loadViews();
  const view = views.find(v => v.id === viewId);

  // Cannot delete default view
  if (!view || view.isDefault) return false;

  const filteredViews = views.filter(v => v.id !== viewId);
  saveViews(filteredViews);

  // If deleted view was active, switch to default
  if (getActiveViewId() === viewId) {
    setActiveViewId('default');
  }

  return true;
}

/**
 * Gets a specific view by ID
 */
export function getView(viewId: string): ColumnView | null {
  const views = loadViews();
  return views.find(v => v.id === viewId) || null;
}

/**
 * Initializes views with default view if needed
 */
export function initializeViews(columns: string[]): ColumnView[] {
  let views = loadViews();

  // Ensure default view exists
  const hasDefault = views.some(v => v.isDefault);
  if (!hasDefault) {
    const defaultView = createDefaultView(columns);
    views.unshift(defaultView);
    saveViews(views);
  }

  return views;
}
