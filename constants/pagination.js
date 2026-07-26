export const PAGE_SIZE_OPTIONS = [10, 20, 40, 60];

export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_FRESHNESS_PAGE_SIZE = 40;

export function pageRange(page, pageSize, total) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize) || 1);
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const rangeStart = total ? (currentPage - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(currentPage * pageSize, total);
  return { currentPage, pageCount, rangeStart, rangeEnd };
}
