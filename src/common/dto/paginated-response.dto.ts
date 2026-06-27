export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  pendingTotal: number;
  answeredTotal: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

export function buildPaginatedMeta(
  page: number,
  limit: number,
  total: number,
  pendingTotal: number,
  answeredTotal: number,
): PaginatedMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    pendingTotal,
    answeredTotal,
  };
}
