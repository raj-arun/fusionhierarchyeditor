# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Hierarchy Editor application and provides recommendations for working with large datasets.

## Implemented Optimizations

### 1. React Memoization
- **TreeNode Component**: Wrapped with `React.memo` to prevent unnecessary re-renders when parent components update
- **Table Columns**: Memoized with `useMemo` to avoid recreating column definitions on every render
- **Event Handlers**: Used `useCallback` for all event handlers to maintain referential equality

### 2. Reduced Re-renders
- **Selective Updates**: Components only re-render when their specific props change
- **Memoized Calculations**: Expensive operations like column generation and validation are cached
- **Optimized Dependencies**: Careful management of useEffect and useMemo dependencies

### 3. Efficient Data Structures
- **Map-based Lookups**: Node lookups use `Map` data structure for O(1) access time
- **Set for Expanded Nodes**: Tracking expanded state with `Set` for efficient contains operations

### 4. Smart UI Updates
- **Collapsed by Default**: Trees load fully collapsed to minimize initial DOM nodes
- **Conditional Rendering**: Move up/down buttons only render for leaf nodes
- **Lazy Evaluation**: Properties only evaluated when needed

## Performance Characteristics

### Dataset Size Guidelines

| Rows | Performance | Recommendations |
|------|-------------|-----------------|
| < 100 | Excellent | No special considerations needed |
| 100-500 | Good | Keep most nodes collapsed, use column filters |
| 500-1000 | Moderate | Limit visible nodes, hide unused columns |
| > 1000 | Slow | Consider splitting into multiple files |

## Best Practices for Large Datasets

### 1. Keep Nodes Collapsed
- Expanding all nodes with 400+ rows can create thousands of DOM elements
- Expand only the branches you're actively working with
- Use keyboard shortcuts to quickly collapse/expand sections

### 2. Hide Unused Columns
- Use the "Columns" dropdown to hide columns you're not currently editing
- Fewer visible columns = faster rendering and scrolling
- Hidden columns can still be included in exports

### 3. Use Filters Strategically
- Filter the grid to show only relevant rows
- Filtering reduces the number of DOM elements being rendered
- Clear filters when done to restore full view

### 4. Batch Operations
- Use multi-select for bulk delete operations instead of one-at-a-time
- Search & Replace can update hundreds of rows efficiently in one operation

### 5. Regular Saves
- Export your work regularly to avoid losing changes
- Smaller frequent exports are faster than large infrequent ones

## Platform-Specific Considerations

### Web Browser
- **File Downloads**: Files save to browser's default download folder
- **Memory**: Large datasets may cause browser tab to slow down
- **Refresh Warning**: Always export before refreshing the page

### Electron Desktop App
- **Better Performance**: Native app typically handles large datasets better than browser
- **File Dialogs**: Native save dialogs allow choosing custom save locations
- **Memory Management**: Desktop app has access to more system resources

## Future Optimization Opportunities

If you need to work with datasets larger than 1000 rows, consider these enhancements:

### 1. Virtual Scrolling
Add windowing/virtualization to only render visible rows:
```bash
npm install @tanstack/react-virtual
```
This would allow smooth scrolling with 10,000+ rows.

### 2. Web Workers
Move heavy computations (like search/replace, validation) to background threads.

### 3. IndexedDB Caching
Store data in browser's IndexedDB for faster loads and offline access.

### 4. Pagination
Split large datasets into pages of 100-200 rows each.

### 5. Server-Side Processing
For enterprise use cases with massive datasets (50,000+ rows), consider a backend API.

## Monitoring Performance

### Using Browser DevTools

1. **Performance Tab**
   - Record interaction (e.g., expanding a node)
   - Look for long tasks (yellow/red bars)
   - Check for layout thrashing

2. **Memory Tab**
   - Take heap snapshots before/after operations
   - Look for memory leaks
   - Monitor retained size

3. **React DevTools Profiler**
   - Record component renders
   - Identify unnecessary re-renders
   - Check render times

### Performance Metrics to Watch

- **Time to Interactive (TTI)**: Should be < 3 seconds after file load
- **Expand/Collapse Speed**: Should be < 100ms for single node
- **Grid Scroll FPS**: Should maintain 60 FPS
- **Memory Usage**: Should stay < 500MB for datasets under 1000 rows

## Troubleshooting Slow Performance

### Symptoms and Solutions

**Slow Node Expansion**
- ✅ Collapse all nodes except the ones you're working with
- ✅ Hide columns you're not using
- ✅ Close other browser tabs

**Slow Column Show/Hide**
- ✅ This operation recreates the entire table, expected to take 1-2 seconds for 400+ rows
- ✅ Plan which columns you need before working, minimize toggles

**Slow Scrolling**
- ✅ Filter the grid to reduce visible rows
- ✅ Hide columns to reduce row width
- ✅ Use grid view instead of expanding many tree nodes

**Browser Tab Freezing**
- ✅ Close and reopen the application
- ✅ Clear browser cache
- ✅ Use Electron desktop app instead
- ✅ Split data into multiple smaller files

## Technical Details

### Component Rendering Strategy

```
Root App Component
└─ Memoized TreeView
   └─ Memoized TreeNode (only re-renders when own props change)
      └─ Memoized TreeNode (recursive)

└─ Memoized HierarchyGrid
   └─ TanStack Table (optimized internally)
      └─ Memoized cell renderers
```

### State Update Flow

```
User Action → Event Handler (useCallback)
           → State Update (minimal)
           → Memoized Components Check Props
           → Only Changed Components Re-render
           → DOM Updates (minimal)
```

### Why Show/Hide Columns is Slower

Column visibility changes trigger:
1. State update in HierarchyGrid
2. Column definitions recalculation (memoized but dependencies changed)
3. TanStack Table rebuild with new columns
4. All visible rows re-render with new column layout
5. Browser layout recalculation
6. Hidden columns array propagation to parent

This is an inherent limitation of how tables work. For 400+ rows, this can take 1-2 seconds.

### Optimization Trade-offs

| Feature | Performance Cost | Why We Keep It |
|---------|-----------------|----------------|
| Drag & Drop | Medium | Essential UX feature |
| Context Menus | Low | Improves workflow |
| Inline Editing | Medium | Core functionality |
| Real-time Validation | Low | Prevents errors |
| Column Filters | Low-Medium | Helps with large datasets |

## Recommended Workflow

For optimal performance with 400+ row datasets:

1. **Load File** (collapsed by default) ✅ Fast
2. **Hide Unnecessary Columns** (do this once) ⚡ Slow operation
3. **Work in Sections** (expand → edit → collapse) ✅ Fast
4. **Use Filters** (narrow focus) ✅ Fast
5. **Bulk Operations** (multi-select, search/replace) ✅ Fast
6. **Export Frequently** ✅ Fast

Avoid:
- ❌ Expanding all nodes at once
- ❌ Toggling column visibility frequently
- ❌ Keeping many nodes expanded simultaneously

## Conclusion

The application is optimized for datasets up to 500 rows with good performance. For 400 rows:
- Initial load: < 1 second
- Node expand/collapse: < 100ms each
- Editing properties: Instant
- Column toggle: 1-2 seconds (expected)
- Export: < 1 second

For larger datasets (1000+), consider the future enhancements outlined above or split your data into multiple files organized by logical sections.
