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

  interface SocialSyncBody {
    email: string;
    name: string;
    image?: string;
    provider: "google" | "github";
    providerId: string;
  }

  // Map the signature: ExpressHandler<Params, ResBody, ReqBody, Query>
  type SocialSyncHandler = ExpressHandler<
    unknown,
    ApiResponse<User>, // Assuming your Prisma model type is 'User'
    SocialSyncBody
  >;

  // Define helpers for specific scenarios
  type GetAllHandler<T> = ExpressHandler<unknown, ApiResponse<T[]>>;
  type GetOneHandler<T, P = { id: string }> = ExpressHandler<P, ApiResponse<T | null>>;
  type CreateHandler<T, B = Partial<T>> = ExpressHandler<unknown, ApiResponse<T>, B>;
  type UpdateHandler<T, P = { id: string }, B = Partial<T>> = ExpressHandler<
    P,
    ApiResponse<T | null>,
    B
  >;
  type DeleteHandler<P = { id: string }> = ExpressHandler<P, ApiResponse<null>>;

  type LogoutHandler = ExpressHandler<unknown, ApiResponse<null>>;
}
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  image: string | null;
  passwordChangedAt: Date | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
