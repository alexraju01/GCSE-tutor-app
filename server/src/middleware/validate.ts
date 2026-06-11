import { type RequestHandler } from "express";
import { type z } from "zod";

export const validate =
  (schema: z.ZodTypeAny): RequestHandler =>
  (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Simply pass the ZodError instance to next().
      // The globalErrorHandler will catch this instance via 'instanceof ZodError'.
      return next(result.error);
    }

    req.body = result.data;
    next();
  };
