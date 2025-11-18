import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { hierarchyDB } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../public/vite.svg'),
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  // Initialize database
  hierarchyDB.init();
});

app.on('window-all-closed', () => {
  // Close database before quitting
  hierarchyDB.close();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle save dialog
ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

// Handle file save
ipcMain.handle('save-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Database IPC Handlers
ipcMain.handle('db:import', async (event, parsedData) => {
  try {
    hierarchyDB.importData(parsedData);
    return { success: true };
  } catch (error) {
    console.error('Database import error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:export', async () => {
  try {
    const data = hierarchyDB.exportData();
    return { success: true, data };
  } catch (error) {
    console.error('Database export error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:update-property', async (event, { nodeId, propertyName, value }) => {
  try {
    hierarchyDB.updateProperty(nodeId, propertyName, value);
    return { success: true };
  } catch (error) {
    console.error('Database update error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:add-node', async (event, nodeData) => {
  try {
    const result = hierarchyDB.addNode(nodeData);
    return { success: result };
  } catch (error) {
    console.error('Database add node error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:delete-node', async (event, nodeId) => {
  try {
    const result = hierarchyDB.deleteNode(nodeId);
    return { success: result };
  } catch (error) {
    console.error('Database delete error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:move-up', async (event, nodeId) => {
  try {
    const result = hierarchyDB.moveNodeUp(nodeId);
    return { success: result };
  } catch (error) {
    console.error('Database move up error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:move-down', async (event, nodeId) => {
  try {
    const result = hierarchyDB.moveNodeDown(nodeId);
    return { success: result };
  } catch (error) {
    console.error('Database move down error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:stats', async () => {
  try {
    const stats = hierarchyDB.getStats();
    return { success: true, stats };
  } catch (error) {
    console.error('Database stats error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:backup', async (event, backupPath) => {
  try {
    await hierarchyDB.backup(backupPath);
    return { success: true, path: backupPath };
  } catch (error) {
    console.error('Database backup error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:search', async (event, { propertyName, searchValue }) => {
  try {
    const results = hierarchyDB.searchNodes(propertyName, searchValue);
    return { success: true, results };
  } catch (error) {
    console.error('Database search error:', error);
    return { success: false, error: error.message };
  }
});

// Views IPC Handlers
ipcMain.handle('views:init', async (event, columns) => {
  try {
    hierarchyDB.initializeDefaultView(columns);
    return { success: true };
  } catch (error) {
    console.error('Views init error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('views:getAll', async () => {
  try {
    const views = hierarchyDB.getAllViews();
    return { success: true, views };
  } catch (error) {
    console.error('Views getAll error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('views:create', async (event, viewData) => {
  try {
    const view = hierarchyDB.createView(viewData);
    return { success: true, view };
  } catch (error) {
    console.error('Views create error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('views:update', async (event, { viewId, updates }) => {
  try {
    const result = hierarchyDB.updateView(viewId, updates);
    return { success: result };
  } catch (error) {
    console.error('Views update error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('views:delete', async (event, viewId) => {
  try {
    const result = hierarchyDB.deleteView(viewId);
    return { success: result };
  } catch (error) {
    console.error('Views delete error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('views:getActive', async () => {
  try {
    const viewId = hierarchyDB.getActiveViewId();
    return { success: true, viewId };
  } catch (error) {
    console.error('Views getActive error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('views:setActive', async (event, viewId) => {
  try {
    hierarchyDB.setActiveViewId(viewId);
    return { success: true };
  } catch (error) {
    console.error('Views setActive error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('views:get', async (event, viewId) => {
  try {
    const view = hierarchyDB.getView(viewId);
    return { success: true, view };
  } catch (error) {
    console.error('Views get error:', error);
    return { success: false, error: error.message };
  }
});
