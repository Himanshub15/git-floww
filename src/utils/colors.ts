export const BRANCH_COLORS = [
  '#6ea8fe', // periwinkle blue (main)
  '#4ade80', // emerald green
  '#fb923c', // warm amber
  '#c084fc', // lavender purple
  '#f472b6', // hot pink
  '#22d3ee', // electric cyan
  '#facc15', // sunflower
  '#a78bfa', // soft violet
  '#34d399', // mint
  '#f87171', // coral red
];

export function getBranchColor(index: number): string {
  return BRANCH_COLORS[index % BRANCH_COLORS.length];
}
