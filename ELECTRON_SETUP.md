# Desktop App Setup Guide

This guide will help you set up and run the Fusion Hierarchy Editor as a desktop application using Electron.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation Steps

### 1. Install Electron Dependencies

Since Electron wasn't installed during the initial setup, you need to install it manually:

```bash
npm install -D electron electron-builder concurrently wait-on cross-env
```

This will install:
- `electron` - The Electron framework
- `electron-builder` - Tool to package and build your app
- `concurrently` - Run multiple commands simultaneously
- `wait-on` - Wait for resources before running commands
- `cross-env` - Cross-platform environment variables

### 2. Verify Installation

Check that Electron was installed successfully:

```bash
npx electron --version
```

You should see an Electron version number (e.g., `v32.0.0`).

## Running the Desktop App

### Development Mode

To run the app in development mode with hot-reload:

```bash
npm run electron:dev
```

This will:
1. Start the Vite dev server on `http://localhost:5173`
2. Wait for the server to be ready
3. Launch Electron and load the app
4. Open DevTools automatically for debugging

**Features in dev mode:**
- Hot Module Replacement (HMR) - changes update automatically
- DevTools for debugging
- Console logs visible in terminal and DevTools

### Production Build

To build the desktop app for distribution:

```bash
npm run electron:build
```

This will:
1. Build the optimized web assets (`npm run build`)
2. Package the Electron app with `electron-builder`
3. Create installers in the `release/` directory

**Output files (in `release/` folder):**
- **Windows**: `.exe` installer and portable `.exe`
- **macOS**: `.dmg` disk image and `.zip` archive
- **Linux**: `.AppImage` and `.deb` package

## Desktop App Features

### Electron-Specific Features

1. **Native File Dialogs**
   - When exporting, you'll see native save dialogs
   - Better integration with your operating system

2. **Window Management**
   - Remembers window size and position
   - Native window controls (minimize, maximize, close)

3. **Offline Support**
   - Works without internet connection
   - All data stored locally

4. **System Integration**
   - App icon in taskbar/dock
   - Native notifications (if implemented)
   - File associations (can be configured)

### Keyboard Shortcuts (Desktop)

- **Ctrl/Cmd + Q**: Quit application
- **Ctrl/Cmd + W**: Close window
- **F12**: Toggle DevTools (development mode only)
- **F5**: Reload window (development mode)

## Building for Different Platforms

### Build for Windows (from any OS)

```bash
npm run electron:build -- --win
```

### Build for macOS (requires macOS)

```bash
npm run electron:build -- --mac
```

### Build for Linux

```bash
npm run electron:build -- --linux
```

## Customization

### Change App Icon

1. Replace `public/vite.svg` with your icon files:
   - Windows: 256x256 PNG or .ico
   - macOS: 512x512 PNG or .icns
   - Linux: 512x512 PNG

2. Update icon paths in `package.json` under the `build` section

### Change App Name

Edit `package.json`:
```json
{
  "name": "your-app-name",
  "build": {
    "productName": "Your App Display Name"
  }
}
```

### Window Size and Settings

Edit `electron/main.js`:
```javascript
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,      // Change width
    height: 900,      // Change height
    minWidth: 800,    // Add minimum width
    minHeight: 600,   // Add minimum height
    // ... other options
  });
}
```

## Troubleshooting

### Electron fails to install

**Issue**: `403 Forbidden` or network errors during install

**Solution**:
```bash
# Use a different mirror
ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm install -D electron

# Or skip binary download and install manually
ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm install -D electron
npx electron-rebuild
```

### "Cannot find module 'electron'"

**Solution**:
```bash
# Reinstall electron
rm -rf node_modules
npm install
```

### App window is blank

**Solution**:
1. Check console for errors
2. Verify the dev server is running (for dev mode)
3. Ensure `dist/` folder exists (for production build)
4. Check `electron/main.js` for correct paths

### Build fails with code signing errors (macOS)

**Solution**:
```bash
# Skip code signing for local builds
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run electron:build
```

## File Locations

- **Electron main process**: `electron/main.js`
- **Electron preload script**: `electron/preload.js`
- **Build configuration**: `package.json` (under `build` key)
- **Built app output**: `release/` directory

## Advanced Configuration

### Auto-updates

To enable auto-updates, configure electron-builder:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "your-repo"
    }
  }
}
```

### Custom Menu

Add to `electron/main.js`:
```javascript
const { Menu } = require('electron');

const menu = Menu.buildFromTemplate([
  {
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  }
]);

Menu.setApplicationMenu(menu);
```

## Support

If you encounter issues:
1. Check the [Electron documentation](https://www.electronjs.org/docs)
2. Check the [electron-builder documentation](https://www.electron.build/)
3. Create an issue in this repository

## Next Steps

After setting up the desktop app, you can:
- Customize the app icon and branding
- Add native menus and keyboard shortcuts
- Implement auto-updates
- Add system tray functionality
- Package for distribution

Happy building! 🚀
