export interface Commit {
  id: string;
  message: string;
  branchId: string;
  parentIds: string[];
  order: number;
  isMergeCommit?: boolean;
  isConflict?: boolean;
  cherryPickedFrom?: string;
}

export interface Branch {
  id: string;
  name: string;
  color: string;
  forkedFromCommitId: string;
  createdOrder: number;
}

export interface StashEntry {
  id: string;
  message: string;
  branchId: string;
  fromCommitId: string;
}

export type OperationMode =
  | 'none'
  | 'create-branch'
  | 'commit'
  | 'merge'
  | 'rebase'
  | 'cherry-pick'
  | 'stash'
  | 'pop-stash'
  | 'reset';

export interface LayoutNode {
  commit: Commit;
  x: number;
  y: number;
  branchColor: string;
}

export interface LayoutEdge {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  isMerge?: boolean;
  isFork?: boolean;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  branchLanes: { branchId: string; name: string; color: string; y: number; minX: number; maxX: number }[];
  width: number;
  height: number;
}
