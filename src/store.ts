import { create } from 'zustand';
import type { Commit, Branch, StashEntry, OperationMode } from './types';
import { getBranchColor } from './utils/colors';

let idCounter = 0;
function genId() {
  return `id_${++idCounter}_${Date.now()}`;
}

interface Snapshot {
  commits: Record<string, Commit>;
  branches: Record<string, Branch>;
  activeBranchId: string;
  stash: StashEntry[];
  nextOrder: number;
  branchCount: number;
}

interface GraphStore {
  commits: Record<string, Commit>;
  branches: Record<string, Branch>;
  activeBranchId: string;
  selectedCommitId: string | null;
  stash: StashEntry[];
  nextOrder: number;
  branchCount: number;
  operationMode: OperationMode;

  // Undo/Redo
  undoStack: Snapshot[];
  redoStack: Snapshot[];

  // Actions
  setOperationMode: (mode: OperationMode) => void;
  selectCommit: (id: string | null) => void;
  switchBranch: (branchId: string) => void;
  addCommit: (message: string) => void;
  createBranch: (name: string, fromCommitId?: string) => void;
  mergeBranch: (sourceBranchId: string) => void;
  rebaseBranch: (branchId: string, ontoBranchId: string) => void;
  cherryPick: (commitId: string) => void;
  stashChanges: (message: string) => void;
  popStash: () => void;
  resetToCommit: (commitId: string) => void;
  deleteBranch: (branchId: string) => void;
  undo: () => void;
  redo: () => void;
  getHeadCommit: () => Commit | null;
  getBranchCommits: (branchId: string) => Commit[];
  hasConflict: (sourceBranchId: string, targetBranchId: string) => boolean;
}

function takeSnapshot(state: GraphStore): Snapshot {
  return {
    commits: { ...state.commits },
    branches: { ...state.branches },
    activeBranchId: state.activeBranchId,
    stash: [...state.stash],
    nextOrder: state.nextOrder,
    branchCount: state.branchCount,
  };
}

// Create initial state
const initialCommitId = genId();
const mainBranchId = 'main';

const initialCommit: Commit = {
  id: initialCommitId,
  message: 'Initial commit',
  branchId: mainBranchId,
  parentIds: [],
  order: 0,
};

const mainBranch: Branch = {
  id: mainBranchId,
  name: 'main',
  color: getBranchColor(0),
  forkedFromCommitId: initialCommitId,
  createdOrder: 0,
};

export const useStore = create<GraphStore>((set, get) => ({
  commits: { [initialCommitId]: initialCommit },
  branches: { [mainBranchId]: mainBranch },
  activeBranchId: mainBranchId,
  selectedCommitId: null,
  stash: [],
  nextOrder: 1,
  branchCount: 1,
  operationMode: 'none',
  undoStack: [],
  redoStack: [],

  setOperationMode: (mode) => set({ operationMode: mode }),

  selectCommit: (id) => set({ selectedCommitId: id }),

  switchBranch: (branchId) => {
    const state = get();
    if (state.branches[branchId]) {
      set({ activeBranchId: branchId });
    }
  },

  addCommit: (message) => {
    const state = get();
    const snapshot = takeSnapshot(state);
    const head = state.getHeadCommit();
    const commitId = genId();
    const newCommit: Commit = {
      id: commitId,
      message,
      branchId: state.activeBranchId,
      parentIds: head ? [head.id] : [],
      order: state.nextOrder,
    };
    set({
      commits: { ...state.commits, [commitId]: newCommit },
      nextOrder: state.nextOrder + 1,
      undoStack: [...state.undoStack, snapshot],
      redoStack: [],
    });
  },

  createBranch: (name, fromCommitId) => {
    const state = get();
    const snapshot = takeSnapshot(state);
    const head = fromCommitId
      ? state.commits[fromCommitId]
      : state.getHeadCommit();
    if (!head) return;

    const branchId = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (state.branches[branchId]) return;

    const newBranch: Branch = {
      id: branchId,
      name,
      color: getBranchColor(state.branchCount),
      forkedFromCommitId: head.id,
      createdOrder: state.branchCount,
    };

    // Create a fork commit on the new branch
    const forkCommitId = genId();
    const forkCommit: Commit = {
      id: forkCommitId,
      message: `Branch '${name}' created`,
      branchId,
      parentIds: [head.id],
      order: state.nextOrder,
    };

    set({
      branches: { ...state.branches, [branchId]: newBranch },
      commits: { ...state.commits, [forkCommitId]: forkCommit },
      activeBranchId: branchId,
      nextOrder: state.nextOrder + 1,
      branchCount: state.branchCount + 1,
      undoStack: [...state.undoStack, snapshot],
      redoStack: [],
    });
  },

  mergeBranch: (sourceBranchId) => {
    const state = get();
    const snapshot = takeSnapshot(state);
    const targetBranchId = state.activeBranchId;
    if (sourceBranchId === targetBranchId) return;

    const sourceCommits = state.getBranchCommits(sourceBranchId);
    const sourceHead = sourceCommits[sourceCommits.length - 1];
    const targetHead = state.getHeadCommit();
    if (!sourceHead || !targetHead) return;

    const isConflict = state.hasConflict(sourceBranchId, targetBranchId);
    const mergeCommitId = genId();
    const mergeCommit: Commit = {
      id: mergeCommitId,
      message: `Merge '${state.branches[sourceBranchId]?.name}' into '${state.branches[targetBranchId]?.name}'`,
      branchId: targetBranchId,
      parentIds: [targetHead.id, sourceHead.id],
      order: state.nextOrder,
      isMergeCommit: true,
      isConflict,
    };

    set({
      commits: { ...state.commits, [mergeCommitId]: mergeCommit },
      nextOrder: state.nextOrder + 1,
      undoStack: [...state.undoStack, snapshot],
      redoStack: [],
    });
  },

  rebaseBranch: (branchId, ontoBranchId) => {
    const state = get();
    const snapshot = takeSnapshot(state);

    const branchCommits = state.getBranchCommits(branchId);
    const ontoCommits = state.getBranchCommits(ontoBranchId);
    const ontoHead = ontoCommits[ontoCommits.length - 1];
    if (!ontoHead || branchCommits.length === 0) return;

    // Find commits unique to the branch (after fork point)
    const forkCommitId = state.branches[branchId]?.forkedFromCommitId;
    const uniqueCommits = branchCommits.filter((c) => c.id !== forkCommitId);

    let newCommits = { ...state.commits };
    let lastParentId = ontoHead.id;
    let currentOrder = state.nextOrder;

    // Remove old unique commits
    for (const c of uniqueCommits) {
      delete newCommits[c.id];
    }

    // Re-create commits on top of onto branch
    for (const commit of uniqueCommits) {
      const newId = genId();
      newCommits[newId] = {
        id: newId,
        message: commit.message,
        branchId: branchId,
        parentIds: [lastParentId],
        order: currentOrder++,
      };
      lastParentId = newId;
    }

    const updatedBranch = {
      ...state.branches[branchId],
      forkedFromCommitId: ontoHead.id,
    };

    set({
      commits: newCommits,
      branches: { ...state.branches, [branchId]: updatedBranch },
      nextOrder: currentOrder,
      undoStack: [...state.undoStack, snapshot],
      redoStack: [],
    });
  },

  cherryPick: (commitId) => {
    const state = get();
    const snapshot = takeSnapshot(state);
    const sourceCommit = state.commits[commitId];
    if (!sourceCommit) return;

    const head = state.getHeadCommit();
    if (!head) return;

    const newCommitId = genId();
    const newCommit: Commit = {
      id: newCommitId,
      message: `${sourceCommit.message} (cherry-picked)`,
      branchId: state.activeBranchId,
      parentIds: [head.id],
      order: state.nextOrder,
      cherryPickedFrom: commitId,
    };

    set({
      commits: { ...state.commits, [newCommitId]: newCommit },
      nextOrder: state.nextOrder + 1,
      undoStack: [...state.undoStack, snapshot],
      redoStack: [],
    });
  },

  stashChanges: (message) => {
    const state = get();
    const snapshot = takeSnapshot(state);
    const head = state.getHeadCommit();
    if (!head) return;

    const entry: StashEntry = {
      id: genId(),
      message: message || 'Stashed changes',
      branchId: state.activeBranchId,
      fromCommitId: head.id,
    };

    set({
      stash: [entry, ...state.stash],
      undoStack: [...state.undoStack, snapshot],
      redoStack: [],
    });
  },

  popStash: () => {
    const state = get();
    if (state.stash.length === 0) return;
    const snapshot = takeSnapshot(state);
    const entry = state.stash[0];
    const head = state.getHeadCommit();
    if (!head) return;

    const newCommitId = genId();
    const newCommit: Commit = {
      id: newCommitId,
      message: `Applied stash: ${entry.message}`,
      branchId: state.activeBranchId,
      parentIds: [head.id],
      order: state.nextOrder,
    };

    set({
      commits: { ...state.commits, [newCommitId]: newCommit },
      stash: state.stash.slice(1),
      nextOrder: state.nextOrder + 1,
      undoStack: [...state.undoStack, snapshot],
      redoStack: [],
    });
  },

  resetToCommit: (commitId) => {
    const state = get();
    const snapshot = takeSnapshot(state);
    const targetCommit = state.commits[commitId];
    if (!targetCommit || targetCommit.branchId !== state.activeBranchId) return;

    // Remove all commits on this branch after the target
    const newCommits: Record<string, Commit> = {};
    for (const [id, commit] of Object.entries(state.commits)) {
      if (commit.branchId === state.activeBranchId && commit.order > targetCommit.order) {
        continue;
      }
      newCommits[id] = commit;
    }

    set({
      commits: newCommits,
      selectedCommitId: null,
      undoStack: [...state.undoStack, snapshot],
      redoStack: [],
    });
  },

  deleteBranch: (branchId) => {
    const state = get();
    if (branchId === 'main') return;
    if (branchId === state.activeBranchId) return;
    const snapshot = takeSnapshot(state);

    const newCommits: Record<string, Commit> = {};
    for (const [id, commit] of Object.entries(state.commits)) {
      if (commit.branchId !== branchId) {
        newCommits[id] = commit;
      }
    }

    const newBranches = { ...state.branches };
    delete newBranches[branchId];

    set({
      commits: newCommits,
      branches: newBranches,
      selectedCommitId: null,
      undoStack: [...state.undoStack, snapshot],
      redoStack: [],
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const currentSnapshot = takeSnapshot(state);
    const prev = state.undoStack[state.undoStack.length - 1];
    set({
      ...prev,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, currentSnapshot],
      selectedCommitId: null,
      operationMode: 'none',
    });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const currentSnapshot = takeSnapshot(state);
    const next = state.redoStack[state.redoStack.length - 1];
    set({
      ...next,
      undoStack: [...state.undoStack, currentSnapshot],
      redoStack: state.redoStack.slice(0, -1),
      selectedCommitId: null,
      operationMode: 'none',
    });
  },

  getHeadCommit: () => {
    const state = get();
    const branchCommits = state.getBranchCommits(state.activeBranchId);
    return branchCommits.length > 0 ? branchCommits[branchCommits.length - 1] : null;
  },

  getBranchCommits: (branchId) => {
    const state = get();
    return Object.values(state.commits)
      .filter((c) => c.branchId === branchId)
      .sort((a, b) => a.order - b.order);
  },

  hasConflict: (sourceBranchId, targetBranchId) => {
    const state = get();
    const sourceBranch = state.branches[sourceBranchId];
    const targetBranch = state.branches[targetBranchId];
    if (!sourceBranch || !targetBranch) return false;

    // Conflict if both branches have 2+ unique commits after their fork
    const sourceCommits = state.getBranchCommits(sourceBranchId);
    const targetCommits = state.getBranchCommits(targetBranchId);
    const sourceUnique = sourceCommits.filter((c) => c.id !== sourceBranch.forkedFromCommitId);
    const targetUnique = targetCommits.filter((c) => c.id !== targetBranch.forkedFromCommitId);
    return sourceUnique.length >= 2 && targetUnique.length >= 2;
  },
}));
