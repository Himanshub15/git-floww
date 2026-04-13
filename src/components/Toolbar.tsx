import { useRef, useState } from 'react';
import { useStore } from '../store';
import { exportAsPng, exportAsSvg } from '../utils/export';
import type { Theme } from '../hooks/useTheme';

interface ToolbarProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  theme: Theme;
  onToggleTheme: () => void;
}

export default function Toolbar({ canvasRef, theme, onToggleTheme }: ToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const branches = useStore((s) => s.branches);
  const activeBranchId = useStore((s) => s.activeBranchId);
  const operationMode = useStore((s) => s.operationMode);
  const stash = useStore((s) => s.stash);
  const undoStack = useStore((s) => s.undoStack);
  const redoStack = useStore((s) => s.redoStack);

  const addCommit = useStore((s) => s.addCommit);
  const setOperationMode = useStore((s) => s.setOperationMode);
  const mergeBranch = useStore((s) => s.mergeBranch);
  const rebaseBranch = useStore((s) => s.rebaseBranch);
  const stashChanges = useStore((s) => s.stashChanges);
  const popStash = useStore((s) => s.popStash);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);

  const otherBranches = Object.values(branches).filter((b) => b.id !== activeBranchId);

  const handleCommit = () => {
    const msg = prompt('Commit message:');
    if (msg) addCommit(msg);
  };

  const handleMerge = () => {
    if (otherBranches.length === 0) return;
    if (otherBranches.length === 1) {
      mergeBranch(otherBranches[0].id);
      return;
    }
    const options = otherBranches.map((b, i) => `${i + 1}. ${b.name}`).join('\n');
    const choice = prompt(`Merge which branch into '${branches[activeBranchId].name}'?\n\n${options}\n\nEnter number:`);
    if (choice) {
      const idx = parseInt(choice) - 1;
      if (idx >= 0 && idx < otherBranches.length) {
        mergeBranch(otherBranches[idx].id);
      }
    }
  };

  const handleRebase = () => {
    if (otherBranches.length === 0) return;
    if (otherBranches.length === 1) {
      rebaseBranch(activeBranchId, otherBranches[0].id);
      return;
    }
    const options = otherBranches.map((b, i) => `${i + 1}. ${b.name}`).join('\n');
    const choice = prompt(`Rebase '${branches[activeBranchId].name}' onto:\n\n${options}\n\nEnter number:`);
    if (choice) {
      const idx = parseInt(choice) - 1;
      if (idx >= 0 && idx < otherBranches.length) {
        rebaseBranch(activeBranchId, otherBranches[idx].id);
      }
    }
  };

  const handleStash = () => {
    const msg = prompt('Stash message (optional):');
    stashChanges(msg || '');
  };

  const handleExport = async (format: 'png' | 'svg') => {
    setShowExportMenu(false);
    const el = canvasRef.current;
    if (!el) return;
    const bg = theme === 'dark' ? '#080b14' : '#f0f2f8';
    if (format === 'png') await exportAsPng(el, 'git-floww.png', bg);
    else await exportAsSvg(el, 'git-floww.svg', bg);
  };

  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-brand">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="5" cy="5" r="3" fill="var(--accent-blue)" />
            <circle cx="15" cy="5" r="3" fill="var(--accent-green)" />
            <circle cx="10" cy="15" r="3" fill="var(--accent-orange)" />
            <line x1="5" y1="8" x2="10" y2="12" stroke="var(--text-muted)" strokeWidth="1.5" />
            <line x1="15" y1="8" x2="10" y2="12" stroke="var(--text-muted)" strokeWidth="1.5" />
          </svg>
          git-floww
        </div>
        <div className="toolbar-divider" />
        <button
          className={`toolbar-btn ${operationMode === 'create-branch' ? 'active' : ''}`}
          onClick={() => setOperationMode(operationMode === 'create-branch' ? 'none' : 'create-branch')}
          title="Create Branch (click a commit)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6c0 .73-.593 1.322-1.325 1.322H9.457l-1.932 2.298A2.25 2.25 0 115 12.878v-.628a2.25 2.25 0 111.5 0v.628c0 .07.058.122.128.122h1.747l2.332-2.773A2.25 2.25 0 019.5 8.25V5.372a2.25 2.25 0 01-1.5-2.122h1.5z"/>
          </svg>
          Branch
        </button>
        <button className="toolbar-btn" onClick={handleCommit} title="Add Commit">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1112 0A6 6 0 012 8zm5-1V4h2v3h3v2H9v3H7V9H4V7h3z"/>
          </svg>
          Commit
        </button>
        <button
          className="toolbar-btn"
          onClick={handleMerge}
          disabled={otherBranches.length === 0}
          title="Merge Branch"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v5.256a2.25 2.25 0 101.5 0V5.372zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zm6.5-8.25a.75.75 0 100-1.5.75.75 0 000 1.5zM12.5 5v4.528a2.25 2.25 0 11-1.5 0V5h1.5zm-.75 6.5a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
          </svg>
          Merge
        </button>
        <button
          className="toolbar-btn"
          onClick={handleRebase}
          disabled={otherBranches.length === 0 || activeBranchId === 'main'}
          title="Rebase Branch"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 3.5l3-2v4l-3-2zm4 0h8v1H6v-1zm-4 5l3-2v4l-3-2zm4 0h8v1H6v-1zm-4 5l3-2v4l-3-2zm4 0h8v1H6v-1z"/>
          </svg>
          Rebase
        </button>
        <button
          className={`toolbar-btn ${operationMode === 'cherry-pick' ? 'active' : ''}`}
          onClick={() => setOperationMode(operationMode === 'cherry-pick' ? 'none' : 'cherry-pick')}
          disabled={otherBranches.length === 0}
          title="Cherry-pick (click a commit)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a3 3 0 00-2.83 4H1v2h4.17A3.001 3.001 0 008 9a3 3 0 002.83-2H15V5h-4.17A3.001 3.001 0 008 1zm0 4.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM4 11h8v2H4v-2z"/>
          </svg>
          Cherry-pick
        </button>
        <div className="toolbar-divider" />
        <button className="toolbar-btn" onClick={handleStash} title="Stash Changes">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 3h14v2H1V3zm1 3h12v2H2V6zm1 3h10v2H3V9zm2 3h6v2H5v-2z"/>
          </svg>
          Stash
        </button>
        <button
          className="toolbar-btn"
          onClick={popStash}
          disabled={stash.length === 0}
          title="Pop Stash"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1l4 4H9v6H7V5H4l4-4zm-5 12h10v2H3v-2z"/>
          </svg>
          Pop
        </button>
        <button
          className={`toolbar-btn ${operationMode === 'reset' ? 'active' : ''}`}
          onClick={() => setOperationMode(operationMode === 'reset' ? 'none' : 'reset')}
          title="Reset (click a commit)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.705 8.005a.75.75 0 01.834.656 5.5 5.5 0 009.592 2.97l-1.204-1.204a.25.25 0 01.177-.427h3.646a.25.25 0 01.25.25v3.646a.25.25 0 01-.427.177l-1.204-1.204A7 7 0 012.539 7.17a.75.75 0 01-.834.835zm12.59-1.01a.75.75 0 01-.834-.656 5.5 5.5 0 00-9.592-2.97l1.204 1.204a.25.25 0 01-.177.427H1.25a.25.25 0 01-.25-.25V1.104a.25.25 0 01.427-.177l1.204 1.204A7 7 0 0115.13 7.83a.75.75 0 01-.835-.835z"/>
          </svg>
          Reset
        </button>
      </div>
      <div className="toolbar-right">
        <button
          className="toolbar-btn"
          onClick={undo}
          disabled={undoStack.length === 0}
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 7l4-4v3h4a3 3 0 010 6H8v-2h4a1 1 0 000-2H8v3L4 7z"/>
          </svg>
        </button>
        <button
          className="toolbar-btn"
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo (Ctrl+Shift+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12 7L8 3v3H4a3 3 0 000 6h4v-2H4a1 1 0 010-2h4v3l4-4z"/>
          </svg>
        </button>
        <div className="toolbar-divider" />
        <button
          className="toolbar-btn theme-toggle"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 018 1zM3.17 3.17a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06L3.17 4.23a.75.75 0 010-1.06zM1 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 011 8zm2.17 4.83a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0zM8 13a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 018 13zm4.83-1.17a.75.75 0 01-1.06 0l-1.06-1.06a.75.75 0 111.06-1.06l1.06 1.06a.75.75 0 010 1.06zM13 8a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0113 8zm-1.17-4.83a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM8 5a3 3 0 100 6 3 3 0 000-6z"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6.2 1.77a.75.75 0 00-1.06-.15A7 7 0 1011.47 14a.75.75 0 00-.28-1.01 5.5 5.5 0 01-4.99-11.22z"/>
            </svg>
          )}
        </button>
        <div className="toolbar-divider" />
        <div className="export-wrapper" ref={exportRef}>
          <button
            className="toolbar-btn export-btn"
            onClick={() => setShowExportMenu(!showExportMenu)}
            title="Export"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.47 10.78a.75.75 0 001.06 0l3.75-3.75a.75.75 0 00-1.06-1.06L8.75 8.44V1.75a.75.75 0 00-1.5 0v6.69L4.78 5.97a.75.75 0 00-1.06 1.06l3.75 3.75zM3.75 13a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5z"/>
            </svg>
            Export
          </button>
          {showExportMenu && (
            <div className="export-menu">
              <button onClick={() => handleExport('png')}>Download PNG</button>
              <button onClick={() => handleExport('svg')}>Download SVG</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
