import type { RequestHandler } from "express";

declare global {
  type StatusMessage = "success" | "error" | "fail";

  type ExpressHandler<
    P = unknown,
    ResBody = unknown,
    ReqBody = unknown,
    Q = unknown,
  > = RequestHandler<P, ResBody, ReqBody, Q>;

  interface ApiResponse<T = unknown> {
    status: StatusMessage;
    data: T;
    results?: number;
    message?: string;
  }

  // Define helpers for specific scenarios
  type GetAllHandler<T> = ExpressHandler<unknown, ApiResponse<T[]>>;
  type GetOneHandler<T, P = { id: string }> = ExpressHandler<P, ApiResponse<T | null>>;
  type CreateHandler<T, B = Partial<T>> = ExpressHandler<unknown, ApiResponse<T>, B>;
  type UpdateHandler<T, P = { id: string }> = ExpressHandler<P, ApiResponse<T | null>, Partial<T>>;
  type DeleteHandler<P = { id: string }> = ExpressHandler<P, ApiResponse<null>>;

  type LogoutHandler = ExpressHandler<unknown, ApiResponse<null>>;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
