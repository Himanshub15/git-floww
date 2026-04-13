import type { Commit, Branch, LayoutResult, LayoutNode, LayoutEdge } from '../types';

const COMMIT_SPACING = 120;
const BRANCH_SPACING = 80;
const PADDING_X = 80;
const PADDING_Y = 60;

export function computeLayout(
  commits: Record<string, Commit>,
  branches: Record<string, Branch>
): LayoutResult {
  const branchList = Object.values(branches).sort((a, b) => a.createdOrder - b.createdOrder);
  const commitList = Object.values(commits).sort((a, b) => a.order - b.order);

  // Assign Y lanes to branches
  const branchYMap: Record<string, number> = {};
  branchList.forEach((branch, index) => {
    branchYMap[branch.id] = PADDING_Y + index * BRANCH_SPACING;
  });

  // Assign X positions to commits based on order
  const commitXMap: Record<string, number> = {};
  commitList.forEach((commit, index) => {
    commitXMap[commit.id] = PADDING_X + index * COMMIT_SPACING;
  });

  // Build nodes
  const nodes: LayoutNode[] = commitList.map((commit) => ({
    commit,
    x: commitXMap[commit.id],
    y: branchYMap[commit.branchId] ?? PADDING_Y,
    branchColor: branches[commit.branchId]?.color ?? '#8b949e',
  }));

  // Build edges
  const edges: LayoutEdge[] = [];
  for (const commit of commitList) {
    for (const parentId of commit.parentIds) {
      const parent = commits[parentId];
      if (!parent) continue;

      const isCrossBranch = parent.branchId !== commit.branchId;
      edges.push({
        fromId: parentId,
        toId: commit.id,
        fromX: commitXMap[parentId],
        fromY: branchYMap[parent.branchId] ?? PADDING_Y,
        toX: commitXMap[commit.id],
        toY: branchYMap[commit.branchId] ?? PADDING_Y,
        color: branches[commit.branchId]?.color ?? '#8b949e',
        isMerge: isCrossBranch && commit.isMergeCommit,
        isFork: isCrossBranch && !commit.isMergeCommit,
      });
    }
  }

  // Build branch lanes
  const branchLanes = branchList.map((branch) => {
    const branchCommits = commitList.filter((c) => c.branchId === branch.id);
    const xs = branchCommits.map((c) => commitXMap[c.id]);
    return {
      branchId: branch.id,
      name: branch.name,
      color: branch.color,
      y: branchYMap[branch.id],
      minX: xs.length > 0 ? Math.min(...xs) : PADDING_X,
      maxX: xs.length > 0 ? Math.max(...xs) : PADDING_X,
    };
  });

  const allX = nodes.map((n) => n.x);
  const allY = nodes.map((n) => n.y);
  const width = Math.max(...allX, 400) + PADDING_X * 2;
  const height = Math.max(...allY, 200) + PADDING_Y * 2;

  return { nodes, edges, branchLanes, width, height };
}
