const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  saveFile: (data) => ipcRenderer.invoke('save-file', data),

  // Database operations
  db: {
    import: (parsedData) => ipcRenderer.invoke('db:import', parsedData),
    export: () => ipcRenderer.invoke('db:export'),
    updateProperty: (nodeId, propertyName, value) =>
      ipcRenderer.invoke('db:update-property', { nodeId, propertyName, value }),
    addNode: (nodeData) => ipcRenderer.invoke('db:add-node', nodeData),
    deleteNode: (nodeId) => ipcRenderer.invoke('db:delete-node', nodeId),
    moveUp: (nodeId) => ipcRenderer.invoke('db:move-up', nodeId),
    moveDown: (nodeId) => ipcRenderer.invoke('db:move-down', nodeId),
    getStats: () => ipcRenderer.invoke('db:stats'),
    backup: (backupPath) => ipcRenderer.invoke('db:backup', backupPath),
    search: (propertyName, searchValue) =>
      ipcRenderer.invoke('db:search', { propertyName, searchValue }),
  },

  // Views operations
  views: {
    init: (columns) => ipcRenderer.invoke('views:init', columns),
    getAll: () => ipcRenderer.invoke('views:getAll'),
    create: (viewData) => ipcRenderer.invoke('views:create', viewData),
    update: (viewId, updates) => ipcRenderer.invoke('views:update', { viewId, updates }),
    delete: (viewId) => ipcRenderer.invoke('views:delete', viewId),
    getActive: () => ipcRenderer.invoke('views:getActive'),
    setActive: (viewId) => ipcRenderer.invoke('views:setActive', viewId),
    get: (viewId) => ipcRenderer.invoke('views:get', viewId),
  },
});
