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
});
