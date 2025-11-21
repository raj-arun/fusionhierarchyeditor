import { useState, useCallback, useRef, useEffect } from 'react';

interface ResizablePaneProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export function ResizablePane({
  leftPane,
  rightPane,
  defaultWidth = 33,
  minWidth = 20,
  maxWidth = 60,
}: ResizablePaneProps) {
  const [leftWidth, setLeftWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minWidth, maxWidth]);

  return (
    <div ref={containerRef} className="flex h-full relative">
      <div style={{ width: `${leftWidth}%` }} className="flex-shrink-0">
        {leftPane}
      </div>

      <div
        onMouseDown={handleMouseDown}
        className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors flex-shrink-0 relative group"
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <div className="flex-1 min-w-0">
        {rightPane}
      </div>
    </div>
  );
}
