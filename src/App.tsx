import { useEffect, useRef } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import { useStore } from './store';
import { useTheme } from './hooks/useTheme';

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="app">
      <Toolbar canvasRef={canvasRef} theme={theme} onToggleTheme={toggle} />
      <div className="main-content">
        <Sidebar />
        <Canvas ref={canvasRef} />
      </div>
    </div>
  );
}
