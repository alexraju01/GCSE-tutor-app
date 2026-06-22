interface APIResponse<T = unknown> {
  status?: string;
  results?: number;
  data?: T;
  message?: string;
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
