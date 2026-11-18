/**
 * Lightweight page snapshot for the copilot (CFB PageSnapshotContext lite).
 * Pages optionally publish; context builder merges into the model packet.
 */
export interface PageSnapshot {
  titleEl?: string;
  titleEn?: string;
  state?: string;
  summaryEl?: string;
  summaryEn?: string;
  visibleIds?: string[];
  updatedAt: number;
}

let snapshot: PageSnapshot | null = null;

export function publishPageSnapshot( partial: Omit<PageSnapshot, 'updatedAt'>): void {
  snapshot = { ...partial, updatedAt: Date.now() };
}

export function clearPageSnapshot(): void {
  snapshot = null;
}

export function readPageSnapshot(): PageSnapshot | null {
  return snapshot;
}
