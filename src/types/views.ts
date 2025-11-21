export interface ColumnView {
  id: string;
  application: string;      // "Planning", "ARCS", "FCC", etc.
  instance: string;          // "Dev", "PROD", "TEST"
  dimension: string;         // "Account", "Projects", "Entity", etc.
  name: string;              // "Default Alias", "Consolidated View", etc.
  displayName: string;       // Computed: "Application:Instance:Dimension:Name"
  columnVisibility: Record<string, boolean>;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Common values for dropdowns
export const COMMON_APPLICATIONS = ['Planning', 'ARCS', 'FCC', 'FCCS', 'TRCS', 'EDM'];
export const COMMON_INSTANCES = ['Dev', 'PROD', 'TEST'];
export const COMMON_DIMENSIONS = ['Account', 'Projects', 'Entity', 'Period', 'Scenario', 'Version'];
