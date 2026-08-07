import type { Role } from "@generated/enums.ts";

export interface UserPayload {
  id: string;
  email?: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user: UserPayload;
    }
  }
}

export {};
