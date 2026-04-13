import { useEffect, useRef, useMemo, forwardRef } from 'react';
import * as d3 from 'd3';
import { useStore } from '../store';
import { computeLayout } from '../utils/layout';
import type { LayoutNode, LayoutEdge } from '../types';

const Canvas = forwardRef<HTMLDivElement>((_props, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement | null>(null);

  const commits = useStore((s) => s.commits);
  const branches = useStore((s) => s.branches);
  const selectedCommitId = useStore((s) => s.selectedCommitId);
  const activeBranchId = useStore((s) => s.activeBranchId);
  const selectCommit = useStore((s) => s.selectCommit);
  const operationMode = useStore((s) => s.operationMode);
  const cherryPick = useStore((s) => s.cherryPick);
  const resetToCommit = useStore((s) => s.resetToCommit);
  const createBranch = useStore((s) => s.createBranch);
  const setOperationMode = useStore((s) => s.setOperationMode);

  const layout = useMemo(() => computeLayout(commits, branches), [commits, branches]);

  // Setup D3 zoom
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom);

    // Fit content on first render
    const svgEl = svgRef.current;
    if (svgEl) {
      const { width: svgW, height: svgH } = svgEl.getBoundingClientRect();
      const scale = Math.min(
        svgW / (layout.width + 100),
        svgH / (layout.height + 100),
        1.5
      );
      const tx = (svgW - layout.width * scale) / 2;
      const ty = (svgH - layout.height * scale) / 2;
      svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
  }, [layout.width, layout.height]);

  const handleCommitClick = (node: LayoutNode) => {
    if (operationMode === 'cherry-pick') {
      if (node.commit.branchId !== activeBranchId) {
        cherryPick(node.commit.id);
        setOperationMode('none');
      }
      return;
    }
    if (operationMode === 'reset') {
      if (node.commit.branchId === activeBranchId) {
        resetToCommit(node.commit.id);
        setOperationMode('none');
      }
      return;
    }
    if (operationMode === 'create-branch') {
      const name = prompt('Branch name:');
      if (name) {
        createBranch(name, node.commit.id);
        setOperationMode('none');
      }
      return;
    }
    selectCommit(node.commit.id === selectedCommitId ? null : node.commit.id);
  };

  const renderEdge = (edge: LayoutEdge, i: number) => {
    const dx = edge.toX - edge.fromX;
    const dy = edge.toY - edge.fromY;

    let path: string;
    if (dy === 0) {
      // Same branch — straight line
      path = `M ${edge.fromX} ${edge.fromY} L ${edge.toX} ${edge.toY}`;
    } else {
      // Cross-branch — bezier curve
      const cx1 = edge.fromX + dx * 0.4;
      const cx2 = edge.toX - dx * 0.4;
      path = `M ${edge.fromX} ${edge.fromY} C ${cx1} ${edge.fromY}, ${cx2} ${edge.toY}, ${edge.toX} ${edge.toY}`;
    }

    return (
      <path
        key={`edge-${i}`}
        d={path}
        fill="none"
        stroke={edge.color}
        strokeWidth={2.5}
        strokeOpacity={edge.isMerge ? 0.6 : 0.8}
        strokeDasharray={edge.isMerge ? '6,4' : undefined}
      />
    );
  };

  const renderNode = (node: LayoutNode) => {
    const isSelected = node.commit.id === selectedCommitId;
    const isHead = (() => {
      const branchCommits = Object.values(commits)
        .filter((c) => c.branchId === node.commit.branchId)
        .sort((a, b) => a.order - b.order);
      return branchCommits[branchCommits.length - 1]?.id === node.commit.id;
    })();

    const isClickable =
      operationMode === 'cherry-pick'
        ? node.commit.branchId !== activeBranchId
        : operationMode === 'reset'
        ? node.commit.branchId === activeBranchId
        : operationMode === 'create-branch'
        ? true
        : true;

    return (
      <g
        key={node.commit.id}
        className={`commit-node ${isClickable ? 'clickable' : 'disabled'}`}
        onClick={() => handleCommitClick(node)}
      >
        {/* Glow effect */}
        {(isSelected || isHead) && (
          <circle
            cx={node.x}
            cy={node.y}
            r={isSelected ? 18 : 14}
            fill={node.branchColor}
            opacity={0.15}
          />
        )}

        {/* Conflict indicator */}
        {node.commit.isConflict && (
          <circle
            cx={node.x}
            cy={node.y}
            r={16}
            fill="none"
            stroke="#f85149"
            strokeWidth={2}
            strokeDasharray="3,3"
          >
            <animate
              attributeName="r"
              values="16;20;16"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="1;0.4;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Main circle */}
        <circle
          cx={node.x}
          cy={node.y}
          r={node.commit.isMergeCommit ? 10 : 8}
          fill={isSelected ? node.branchColor : 'var(--canvas-bg)'}
          stroke={node.branchColor}
          strokeWidth={isSelected ? 3 : 2.5}
          className="node-circle"
        />

        {/* Cherry-pick icon */}
        {node.commit.cherryPickedFrom && (
          <text
            x={node.x}
            y={node.y + 4}
            textAnchor="middle"
            fontSize="10"
            fill={node.branchColor}
          >
            C
          </text>
        )}

        {/* HEAD indicator */}
        {isHead && (
          <text
            x={node.x}
            y={node.y - 18}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill={node.branchColor}
            className="head-label"
          >
            HEAD
          </text>
        )}

        {/* Commit message tooltip */}
        <title>{node.commit.message}</title>

        {/* Commit message label */}
        <text
          x={node.x}
          y={node.y + 24}
          textAnchor="middle"
          fontSize="11"
          fill="#8b949e"
          className="commit-label"
        >
          {node.commit.message.length > 20
            ? node.commit.message.slice(0, 18) + '...'
            : node.commit.message}
        </text>
      </g>
    );
  };

  return (
    <div ref={ref} className="canvas-container">
      <svg ref={svgRef} width="100%" height="100%">
        <g ref={(el) => { gRef.current = el; }}>
          {/* Branch lane backgrounds */}
          {layout.branchLanes.map((lane) => (
            <g key={lane.branchId}>
              <line
                x1={lane.minX - 40}
                y1={lane.y}
                x2={lane.maxX + 40}
                y2={lane.y}
                stroke={lane.color}
                strokeWidth={1}
                strokeOpacity={0.1}
              />
              <text
                x={lane.minX - 55}
                y={lane.y + 4}
                textAnchor="end"
                fontSize="12"
                fontWeight="600"
                fill={lane.color}
                opacity={0.7}
              >
                {lane.name}
              </text>
            </g>
          ))}

          {/* Edges */}
          {layout.edges.map(renderEdge)}

          {/* Nodes */}
          {layout.nodes.map(renderNode)}
        </g>
      </svg>

      {operationMode !== 'none' && (
        <div className="mode-indicator">
          <span className="mode-dot" />
          {operationMode === 'cherry-pick' && 'Click a commit from another branch to cherry-pick'}
          {operationMode === 'reset' && 'Click a commit on the active branch to reset to'}
          {operationMode === 'create-branch' && 'Click a commit to branch from'}
          <button className="mode-cancel" onClick={() => setOperationMode('none')}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
});

Canvas.displayName = 'Canvas';
export default Canvas;
