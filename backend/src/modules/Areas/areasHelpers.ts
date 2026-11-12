interface AreaRow {
  id: string;
  name: string;
  feeMinor: number;
  sortOrder: number;
  isActive: boolean;
  archivedAt: Date | null;
}

export const toAreaDto = (a: AreaRow) => ({
  id: a.id,
  name: a.name,
  feeMinor: a.feeMinor,
  sortOrder: a.sortOrder,
  isActive: a.isActive,
  archivedAt: a.archivedAt ? a.archivedAt.toISOString() : null,
});
