/**
 * SQLite Database Service for Hierarchy Editor
 * Handles all database operations for storing hierarchical data
 */

import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

class HierarchyDatabase {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  /**
   * Initialize the database with a file path
   * @param {string} filePath - Path to the database file
   */
  init(filePath) {
    // Use provided path or default to app data directory
    this.dbPath = filePath || path.join(app.getPath('userData'), 'hierarchy.db');

    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Open database connection
    this.db = new Database(this.dbPath, { verbose: console.log });
    this.db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better performance
    this.db.pragma('foreign_keys = ON'); // Enable foreign keys

    // Create tables if they don't exist
    this.createTables();

    console.log(`Database initialized at: ${this.dbPath}`);
  }

  /**
   * Create database tables
   */
  createTables() {
    this.db.exec(`
      -- Nodes table: stores all hierarchy members
      CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        level INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
        FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
      );

      -- Properties table: stores custom properties for each node
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id TEXT NOT NULL,
        property_name TEXT NOT NULL,
        property_value TEXT,
        FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
        UNIQUE(node_id, property_name)
      );

      -- Columns table: stores metadata about columns
      CREATE TABLE IF NOT EXISTS columns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        column_name TEXT NOT NULL UNIQUE,
        column_order INTEGER NOT NULL DEFAULT 0,
        is_system BOOLEAN NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
      );

      -- Indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_nodes_parent ON nodes(parent_id);
      CREATE INDEX IF NOT EXISTS idx_nodes_level ON nodes(level);
      CREATE INDEX IF NOT EXISTS idx_nodes_position ON nodes(position);
      CREATE INDEX IF NOT EXISTS idx_properties_node ON properties(node_id);
      CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(property_name);
    `);
  }

  /**
   * Import data from parsed CSV/Excel
   * @param {Object} parsedData - The parsed hierarchy data
   */
  importData(parsedData) {
    const insertNode = this.db.prepare(`
      INSERT OR REPLACE INTO nodes (id, name, parent_id, level, position)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertProperty = this.db.prepare(`
      INSERT OR REPLACE INTO properties (node_id, property_name, property_value)
      VALUES (?, ?, ?)
    `);

    const insertColumn = this.db.prepare(`
      INSERT OR IGNORE INTO columns (column_name, column_order, is_system)
      VALUES (?, ?, ?)
    `);

    // Start transaction for better performance
    const importTransaction = this.db.transaction(() => {
      // Clear existing data
      this.db.prepare('DELETE FROM properties').run();
      this.db.prepare('DELETE FROM nodes').run();
      this.db.prepare('DELETE FROM columns WHERE is_system = 0').run();

      // Insert columns
      parsedData.columns.forEach((columnName, index) => {
        const isSystem = index < 2; // First two columns (name and parent) are system columns
        insertColumn.run(columnName, index, isSystem ? 1 : 0);
      });

      // Insert nodes and properties
      const insertNodeRecursive = (node, position) => {
        insertNode.run(
          node.id,
          node.name,
          node.parent || null,
          node.level,
          position
        );

        // Insert properties
        Object.entries(node.properties).forEach(([key, value]) => {
          insertProperty.run(node.id, key, value || '');
        });

        // Insert children
        node.children.forEach((child, childPosition) => {
          insertNodeRecursive(child, childPosition);
        });
      };

      parsedData.roots.forEach((root, position) => {
        insertNodeRecursive(root, position);
      });
    });

    importTransaction();
    console.log(`Imported ${parsedData.nodes.size} nodes`);
  }

  /**
   * Export all data in the format expected by the app
   * @returns {Object} ParsedData structure
   */
  exportData() {
    const columns = this.db.prepare(`
      SELECT column_name FROM columns ORDER BY column_order
    `).all().map(row => row.column_name);

    const allNodes = this.db.prepare(`
      SELECT id, name, parent_id, level, position
      FROM nodes
      ORDER BY level, position
    `).all();

    const properties = this.db.prepare(`
      SELECT node_id, property_name, property_value FROM properties
    `).all();

    // Build property map
    const propertyMap = new Map();
    properties.forEach(prop => {
      if (!propertyMap.has(prop.node_id)) {
        propertyMap.set(prop.node_id, {});
      }
      propertyMap.get(prop.node_id)[prop.property_name] = prop.property_value;
    });

    // Build node map
    const nodes = new Map();
    const roots = [];

    allNodes.forEach(nodeData => {
      const node = {
        id: nodeData.id,
        name: nodeData.name,
        parent: nodeData.parent_id,
        properties: propertyMap.get(nodeData.id) || {},
        children: [],
        level: nodeData.level
      };
      nodes.set(nodeData.id, node);

      if (!nodeData.parent_id) {
        roots.push(node);
      }
    });

    // Build parent-child relationships
    nodes.forEach(node => {
      if (node.parent) {
        const parentNode = nodes.get(node.parent);
        if (parentNode) {
          parentNode.children.push(node);
        }
      }
    });

    return {
      columns,
      nodes,
      roots
    };
  }

  /**
   * Get a single node by ID
   * @param {string} nodeId
   * @returns {Object|null}
   */
  getNode(nodeId) {
    const nodeData = this.db.prepare(`
      SELECT * FROM nodes WHERE id = ?
    `).get(nodeId);

    if (!nodeData) return null;

    const properties = this.db.prepare(`
      SELECT property_name, property_value FROM properties WHERE node_id = ?
    `).all(nodeId);

    const propertyObj = {};
    properties.forEach(prop => {
      propertyObj[prop.property_name] = prop.property_value;
    });

    return {
      id: nodeData.id,
      name: nodeData.name,
      parent: nodeData.parent_id,
      level: nodeData.level,
      position: nodeData.position,
      properties: propertyObj
    };
  }

  /**
   * Update node property
   * @param {string} nodeId
   * @param {string} propertyName
   * @param {string} value
   */
  updateProperty(nodeId, propertyName, value) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO properties (node_id, property_name, property_value)
      VALUES (?, ?, ?)
    `);

    stmt.run(nodeId, propertyName, value);

    // Update node timestamp
    this.db.prepare(`
      UPDATE nodes SET updated_at = strftime('%s','now') WHERE id = ?
    `).run(nodeId);
  }

  /**
   * Add a new node
   * @param {Object} nodeData
   * @returns {boolean}
   */
  addNode(nodeData) {
    const { id, name, parent, properties } = nodeData;

    // Get the maximum position for siblings
    const positionQuery = parent
      ? this.db.prepare('SELECT COALESCE(MAX(position), -1) + 1 as pos FROM nodes WHERE parent_id = ?')
      : this.db.prepare('SELECT COALESCE(MAX(position), -1) + 1 as pos FROM nodes WHERE parent_id IS NULL');

    const position = positionQuery.get(parent || null).pos;

    // Get level from parent
    const level = parent
      ? this.db.prepare('SELECT level FROM nodes WHERE id = ?').get(parent).level + 1
      : 0;

    const addTransaction = this.db.transaction(() => {
      // Insert node
      this.db.prepare(`
        INSERT INTO nodes (id, name, parent_id, level, position)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name, parent || null, level, position);

      // Insert properties
      const propStmt = this.db.prepare(`
        INSERT INTO properties (node_id, property_name, property_value)
        VALUES (?, ?, ?)
      `);

      Object.entries(properties).forEach(([key, value]) => {
        propStmt.run(id, key, value || '');
      });
    });

    addTransaction();
    return true;
  }

  /**
   * Delete a node (only if it has no children)
   * @param {string} nodeId
   * @returns {boolean}
   */
  deleteNode(nodeId) {
    // Check if node has children
    const childCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM nodes WHERE parent_id = ?
    `).get(nodeId).count;

    if (childCount > 0) {
      return false; // Cannot delete node with children
    }

    this.db.prepare('DELETE FROM nodes WHERE id = ?').run(nodeId);
    return true;
  }

  /**
   * Move node up in its sibling list
   * @param {string} nodeId
   * @returns {boolean}
   */
  moveNodeUp(nodeId) {
    const node = this.db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId);
    if (!node || node.position === 0) return false;

    const moveTransaction = this.db.transaction(() => {
      // Get sibling above
      const siblingAbove = this.db.prepare(`
        SELECT id FROM nodes
        WHERE ${node.parent_id ? 'parent_id = ?' : 'parent_id IS NULL'}
        AND position = ?
      `).get(node.parent_id ? [node.parent_id, node.position - 1] : [node.position - 1]);

      if (!siblingAbove) return false;

      // Swap positions
      this.db.prepare('UPDATE nodes SET position = ? WHERE id = ?').run(node.position, siblingAbove.id);
      this.db.prepare('UPDATE nodes SET position = ? WHERE id = ?').run(node.position - 1, nodeId);
    });

    moveTransaction();
    return true;
  }

  /**
   * Move node down in its sibling list
   * @param {string} nodeId
   * @returns {boolean}
   */
  moveNodeDown(nodeId) {
    const node = this.db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId);
    if (!node) return false;

    // Check if last in siblings
    const maxPosition = this.db.prepare(`
      SELECT MAX(position) as max_pos FROM nodes
      WHERE ${node.parent_id ? 'parent_id = ?' : 'parent_id IS NULL'}
    `).get(node.parent_id || null).max_pos;

    if (node.position >= maxPosition) return false;

    const moveTransaction = this.db.transaction(() => {
      // Get sibling below
      const siblingBelow = this.db.prepare(`
        SELECT id FROM nodes
        WHERE ${node.parent_id ? 'parent_id = ?' : 'parent_id IS NULL'}
        AND position = ?
      `).get(node.parent_id ? [node.parent_id, node.position + 1] : [node.position + 1]);

      if (!siblingBelow) return false;

      // Swap positions
      this.db.prepare('UPDATE nodes SET position = ? WHERE id = ?').run(node.position, siblingBelow.id);
      this.db.prepare('UPDATE nodes SET position = ? WHERE id = ?').run(node.position + 1, nodeId);
    });

    moveTransaction();
    return true;
  }

  /**
   * Search for nodes by property value
   * @param {string} propertyName
   * @param {string} searchValue
   * @returns {Array}
   */
  searchNodes(propertyName, searchValue) {
    return this.db.prepare(`
      SELECT DISTINCT n.id, n.name, n.parent_id, n.level
      FROM nodes n
      JOIN properties p ON n.id = p.node_id
      WHERE p.property_name = ? AND p.property_value LIKE ?
      ORDER BY n.level, n.position
    `).all(propertyName, `%${searchValue}%`);
  }

  /**
   * Get database statistics
   * @returns {Object}
   */
  getStats() {
    const nodeCount = this.db.prepare('SELECT COUNT(*) as count FROM nodes').get().count;
    const propertyCount = this.db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
    const columnCount = this.db.prepare('SELECT COUNT(*) as count FROM columns').get().count;
    const dbSize = fs.statSync(this.dbPath).size;

    return {
      nodes: nodeCount,
      properties: propertyCount,
      columns: columnCount,
      dbSize: `${(dbSize / 1024 / 1024).toFixed(2)} MB`,
      dbPath: this.dbPath
    };
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database closed');
    }
  }

  /**
   * Create a backup of the database
   * @param {string} backupPath
   */
  backup(backupPath) {
    if (!this.db) throw new Error('Database not initialized');

    const backup = this.db.backup(backupPath);
    return new Promise((resolve, reject) => {
      backup.step(-1, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Backup created at: ${backupPath}`);
          resolve(backupPath);
        }
      });
    });
  }
}

// Export singleton instance
export const hierarchyDB = new HierarchyDatabase();
