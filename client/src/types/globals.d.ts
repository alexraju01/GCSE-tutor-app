interface PaginationMeta {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface APIResponse<T = unknown> {
  status?: string;
  results?: number;
  data?: T;
  message?: string;
  pagination?: PaginationMeta;
}

interface AuthCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type AuthResponse = APIResponse<{ user: User }> & {
  token: string;
};
