import { Prisma } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import { ZodError } from "zod";
import type { NextFunction, Request, Response } from "express";

interface ErrorMiddleware extends Error {
  statusCode: number;
  status: string;
  message: string;
  stack?: string;
  name: string;
  isOperational?: boolean;
}

const handleZodError = (err: ZodError) => {
  const messages = err.issues.map((issue) => {
    // 1. Handle Unrecognized Keys (Zod v4 structure)
    if (issue.code === "unrecognized_keys") {
      const keys = issue.keys.join(", ");
      return `"We couldn't process some of the information submitted (${keys}). Please refresh and try again." `;
    }

    if (issue.code === "invalid_value") {
      if (issue.message.includes("expected")) {
        const dynamicOptions = issue.message
          .replace(/expected/i, "Expected one of:")
          .replace(/"/g, "'");
        return `Invalid option selected. ${dynamicOptions}`;
      }
    }

    // 3. Fallback for all other errors (e.g., missing fields, wrong types)
    return issue.message.replace(/"/g, "'");
  });

  const finalMessage = messages.join(", ");
  return new AppError(finalMessage, 400);
};

const sendErrorDev = (err: ErrorMiddleware, res: Response) => {
  res.status(err.statusCode || 500).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: ErrorMiddleware, req: Request, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  console.error("ERROR:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

interface PrismaDriverError {
  cause?: {
    constraint?: {
      fields: string[];
    };
  };
}

const handleUniqueConstraintViolationErrorDB = (err: Prisma.PrismaClientKnownRequestError) => {
  const modelName = err.meta?.modelName ?? "Resource";

  const meta = err.meta;
  const driverAdapterError = meta?.driverAdapterError as PrismaDriverError | undefined;

  const fields = driverAdapterError?.cause?.constraint?.fields ?? [];
  const field = fields[0] ?? "field";
  const message =
    fields.length > 1 && modelName
      ? `Duplicate field value: ${fields.join(", ")}. Please use another value!`
      : `${modelName} with this ${field} already exists`;

  return new AppError(message, 400);
};

const handlePrismaValidationError = () => {
  return new AppError("Invalid input data. Please check your request fields and types.", 400);
};

const handleRecordNotFoundErrorDB = (err: Prisma.PrismaClientKnownRequestError) => {
  const modelName = err.meta?.modelName ?? "Resource";
  return new AppError(`${modelName} not found`, 404);
};

export const globalErrorHandler = (
  err: ErrorMiddleware,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // 1. Establish basic default fallback targets
  let error = err;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || "error";

  // 2. INTERCEPT & RE-FORMAT CRITICAL INTERFACES FIRST
  if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = handlePrismaValidationError();
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      error = handleUniqueConstraintViolationErrorDB(err);
    } else if (err.code === "P2025") {
      error = handleRecordNotFoundErrorDB(err);
    }
  }

  // 3. Route clean data payloads to the right environment reporter
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, req, res);
  }
  next();
};
