import type { RequestHandler } from "express";
import type { z } from "zod";

type ValidationTarget = "body" | "query" | "params";

export const validate =
  (schema: z.ZodTypeAny, target: ValidationTarget = "body"): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) return next(result.error);

    if (target === "body") {
      req.body = result.data;
    } else {
      // Mutate the existing query or params object instead of reassigning the property
      Object.defineProperty(req, target, {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };
