export interface PaginationMeta {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const getPaginationOptions = (queryPage?: unknown, queryLimit?: unknown) => {
  const page = Math.max(1, Number(queryPage) || 1);
  const limit = Math.max(1, Math.min(100, Number(queryLimit) || 10)); // Cap max limit at 100
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPagination = (
  totalResults: number,
  page: number,
  limit: number,
): PaginationMeta => {
  const totalPages = Math.ceil(totalResults / limit) || 1;

  return {
    page,
    limit,
    totalResults,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
