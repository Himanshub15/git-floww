import { useStore } from '../store';

export default function Sidebar() {
  const branches = useStore((s) => s.branches);
  const commits = useStore((s) => s.commits);
  const activeBranchId = useStore((s) => s.activeBranchId);
  const selectedCommitId = useStore((s) => s.selectedCommitId);
  const stash = useStore((s) => s.stash);

  const switchBranch = useStore((s) => s.switchBranch);
  const selectCommit = useStore((s) => s.selectCommit);
  const deleteBranch = useStore((s) => s.deleteBranch);

  const selectedCommit = selectedCommitId ? commits[selectedCommitId] : null;
  const branchList = Object.values(branches).sort((a, b) => a.createdOrder - b.createdOrder);

  const getBranchCommitCount = (branchId: string) =>
    Object.values(commits).filter((c) => c.branchId === branchId).length;

  return (
    <div className="sidebar">
      {/* Branches */}
      <div className="sidebar-section">
        <div className="sidebar-header">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#8b949e">
            <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6c0 .73-.593 1.322-1.325 1.322H9.457l-1.932 2.298A2.25 2.25 0 115 12.878v-.628a2.25 2.25 0 111.5 0v.628c0 .07.058.122.128.122h1.747l2.332-2.773A2.25 2.25 0 019.5 8.25V5.372a2.25 2.25 0 01-1.5-2.122h1.5z"/>
          </svg>
          Branches
        </div>
        <div className="branch-list">
          {branchList.map((branch) => (
            <div
              key={branch.id}
              className={`branch-item ${branch.id === activeBranchId ? 'active' : ''}`}
              onClick={() => switchBranch(branch.id)}
            >
              <span className="branch-color" style={{ background: branch.color }} />
              <span className="branch-name">{branch.name}</span>
              <span className="branch-count">{getBranchCommitCount(branch.id)}</span>
              {branch.id !== 'main' && branch.id !== activeBranchId && (
                <button
                  className="branch-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBranch(branch.id);
                  }}
                  title="Delete branch"
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Commit Details */}
      {selectedCommit && (
        <div className="sidebar-section">
          <div className="sidebar-header">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#8b949e">
              <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1112 0A6 6 0 012 8z"/>
            </svg>
            Commit Details
          </div>
          <div className="commit-details">
            <div className="detail-row">
              <span className="detail-label">Message</span>
              <span className="detail-value">{selectedCommit.message}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Branch</span>
              <span className="detail-value">
                <span
                  className="branch-color"
                  style={{ background: branches[selectedCommit.branchId]?.color }}
                />
                {branches[selectedCommit.branchId]?.name}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">ID</span>
              <span className="detail-value mono">{selectedCommit.id.slice(0, 12)}</span>
            </div>
            {selectedCommit.isMergeCommit && (
              <div className="detail-badge merge">Merge Commit</div>
            )}
            {selectedCommit.isConflict && (
              <div className="detail-badge conflict">Conflict</div>
            )}
            {selectedCommit.cherryPickedFrom && (
              <div className="detail-badge cherry">Cherry-picked</div>
            )}
            <div className="detail-row">
              <span className="detail-label">Parents</span>
              <span className="detail-value mono">
                {selectedCommit.parentIds.length > 0
                  ? selectedCommit.parentIds.map((p) => p.slice(0, 8)).join(', ')
                  : 'none (root)'}
              </span>
            </div>
          </div>
          <button className="deselect-btn" onClick={() => selectCommit(null)}>
            Deselect
          </button>
        </div>
      )}

      {/* Stash */}
      {stash.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-header">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="#8b949e">
              <path d="M1 3h14v2H1V3zm1 3h12v2H2V6zm1 3h10v2H3V9zm2 3h6v2H5v-2z"/>
            </svg>
            Stash ({stash.length})
          </div>
          <div className="stash-list">
            {stash.map((entry, i) => (
              <div key={entry.id} className="stash-item">
                <span className="stash-index">stash@&#123;{i}&#125;</span>
                <span className="stash-message">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help */}
      <div className="sidebar-section sidebar-help">
        <div className="sidebar-header">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="#8b949e">
            <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9-3a1 1 0 11-2 0 1 1 0 012 0zM7 7.5h2V12H7V7.5z"/>
          </svg>
          Quick Tips
        </div>
        <div className="help-content">
          <p>Scroll to zoom, drag to pan</p>
          <p>Click commits to see details</p>
          <p>Ctrl+Z / Ctrl+Shift+Z to undo/redo</p>
        </div>
      </div>
    </div>
  );
}
