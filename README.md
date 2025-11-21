# Fusion Hierarchy Editor

A modern, cross-platform desktop and web application for visualizing and editing hierarchical data structures from CSV and Excel files.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **📁 File Support**: Import CSV and Excel (.xlsx, .xls) files
- **🌳 Tree Visualization**: Interactive hierarchical tree view with expand/collapse
- **✏️ Inline Editing**: Click any property value to edit it directly
- **🔍 Column Filtering**: Filter and sort data by any column
- **💾 Export**: Export modified data back to CSV or Excel format
- **🎨 Modern UI**: Clean, responsive interface with dark/light theme support
- **🖥️ Cross-Platform**: Runs as a web app or desktop application (Windows, macOS, Linux)
- **🎯 Smart Icons**: Visual distinction between root, parent, and leaf nodes
- **🔄 Dynamic Fields**: Automatically adapts to any CSV/Excel structure

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Data Grid**: TanStack Table
- **File Parsing**: PapaParse (CSV) + SheetJS (Excel)
- **Icons**: Lucide React
- **Desktop**: Electron (optional)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/raj-arun/fusionhierarchyeditor.git
cd fusionhierarchyeditor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

#### Web Application

```bash
npm run build
npm run preview
```

The built files will be in the `dist/` directory.

#### Desktop Application

First, install Electron dependencies:
```bash
npm install -D electron electron-builder concurrently wait-on cross-env
```

Then:

**Development Mode:**
```bash
npm run electron:dev
```

**Build Desktop App:**
```bash
npm run electron:build
```

This will create installers for your platform in the `release/` directory.

## Usage

### Data Format

Your CSV/Excel file should follow this structure:

- **First column**: Member name (node identifier)
- **Second column**: Parent member name (blank for root nodes)
- **Additional columns**: Any properties you want to display/edit

Example:
```csv
Projects, Parent, Alias: Default, Description, ...
All_Projects, Projects, All Projects, Top level project, ...
P_102345, All_Projects, 102345 - Sample Project, Sample project description, ...
```

### Workflow

1. **Upload File**: Drag and drop or click to browse for your CSV/Excel file
2. **Navigate Tree**: Click chevrons to expand/collapse nodes
3. **View Properties**: Click any node to see its properties in the grid
4. **Edit Data**: Click any property value to edit it inline
5. **Export**: Use the Export CSV or Export Excel buttons to save your changes

### Keyboard Shortcuts

- **Enter**: Save edit and close
- **Escape**: Cancel edit
- **Click outside**: Save edit

## File Structure

```
fusionhierarchyeditor/
├── electron/                 # Electron main process files
│   ├── main.js              # Electron entry point
│   └── preload.js           # Preload script for IPC
├── src/
│   ├── components/          # React components
│   │   ├── file-upload.tsx  # File upload with drag-drop
│   │   ├── tree-view.tsx    # Hierarchical tree component
│   │   ├── properties-grid.tsx # Editable properties grid
│   │   ├── theme-provider.tsx  # Theme context provider
│   │   └── theme-toggle.tsx    # Dark/light theme toggle
│   ├── lib/                 # Utilities and helpers
│   │   ├── fileParser.ts    # CSV/Excel parsing logic
│   │   ├── fileExporter.ts  # CSV/Excel export logic
│   │   └── utils.ts         # Common utilities
│   ├── types/               # TypeScript type definitions
│   │   └── hierarchy.ts     # Data model types
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles with theme variables
├── public/                  # Static assets
├── Sample_CSV_Metadata.csv  # Example data file
└── package.json
```

## Features in Detail

### Tree View

- **Smart Icons**:
  - 🌐 Network icon for root nodes (top-most)
  - 📁 Folder icon for intermediate parent nodes
  - 📄 File icon for leaf nodes
- **Node Count**: Shows number of children for parent nodes
- **Expand/Collapse**: Click chevron to toggle node visibility
- **Selection**: Click node name to view properties

### Properties Grid

- **Editable Cells**: Click any value to edit inline
- **Empty Values**: Shows "Empty" placeholder for blank fields
- **Auto-save**: Changes saved on blur or Enter key
- **Responsive**: Adapts to any number of columns

### Theme Support

- **Light Mode**: Clean, bright interface
- **Dark Mode**: Easy on the eyes for extended use
- **System Sync**: Automatically matches system preference
- **Toggle**: Click sun/moon icon to switch

### Export Options

- **CSV Export**: Download as comma-separated values
- **Excel Export**: Download as .xlsx with auto-sized columns
- **Preserves Hierarchy**: Maintains parent-child relationships
- **All Changes Included**: Exports your edited data

## Desktop vs Web

### Web Application
- Runs in any modern browser
- No installation required
- File downloads handled by browser
- Perfect for quick edits

### Desktop Application
- Native OS integration
- File system access
- Custom save dialogs
- Offline capable
- Better performance for large files

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Known Limitations

- Large files (>10,000 nodes) may experience performance degradation in the browser
- Excel files with multiple sheets will only load the first sheet
- File encoding must be UTF-8 for proper display

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Made with ❤️ for hierarchical data management
