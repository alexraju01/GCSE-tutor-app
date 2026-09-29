import { Prisma } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import { DB_CONSTRAINTS, isConstraintViolation } from "@utils/dbErrors.js";
import { ZodError } from "zod";
import type { NextFunction, Request, Response } from "express";

interface ErrorMiddleware extends Error {
  statusCode: number;
  status: string;
  message: string;
  stack?: string;
  name: string;
  isOperational?: boolean;
  details?: Record<string, unknown>;
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
    ...(err.details && { details: err.details }),
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: ErrorMiddleware, req: Request, res: Response) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.details && { details: err.details }),
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

  // Extract fields from driverAdapterError or fallback to err.meta.target if standard Prisma engine is used
  const fields =
    driverAdapterError?.cause?.constraint?.fields ??
    (Array.isArray(meta?.target) ? (meta.target as string[]) : []);

  // 1. Specific check for Teaches composite unique constraint (teacherId + subject + level)
  if (modelName === "Teaches" || (fields.includes("subject") && fields.includes("level"))) {
    return new AppError("You already have this teaching info", 400);
  }

  // 2. Default unique constraint fallback message formatting
  const field = fields[0] ?? "field";
  const message =
    fields.length > 1 && modelName
      ? `Duplicate field value: ${fields.map((f) => `"${f}"`).join(", ")}. Please use another value!`
      : `${modelName} with this ${field} already exists`;

  return new AppError(message, 400);
};
const handlePrismaValidationError = () => {
  return new AppError("Invalid input data. Please check your request fields and types.", 400);
};

const handleRecordNotFoundErrorDB = (err: Prisma.PrismaClientKnownRequestError) => {
  const modelName = (err.meta?.modelName ?? ("resource" as string)) as string;
  return new AppError(`No ${modelName?.toLowerCase()} with this id`, 404);
};

// fires if a serializable transaction loses a race and postgres aborts it
const handleWriteConflictErrorDB = () => {
  return new AppError("That action conflicted with another request. Please try again.", 409);
};

// db-level booking constraints. services check these first, so hitting one
// here means another request got there first
const handleSchedulingConstraintError = (err: unknown): AppError | null => {
  if (isConstraintViolation(err, DB_CONSTRAINTS.activeSlotBooking)) {
    return new AppError(
      "Sorry — that slot was just booked by someone else. Please pick another time.",
      409,
      { reason: "slot_taken" },
    );
  }
  if (isConstraintViolation(err, DB_CONSTRAINTS.studentLessonOverlap)) {
    return new AppError("You already have a lesson booked at that time.", 409, {
      reason: "student_overlap",
    });
  }
  if (
    isConstraintViolation(err, DB_CONSTRAINTS.availabilityLength) ||
    isConstraintViolation(err, DB_CONSTRAINTS.lessonDuration)
  ) {
    return new AppError("Lessons must be 1 hour, 1.5 hours or 2 hours long.", 400, {
      reason: "invalid_duration",
    });
  }
  if (isConstraintViolation(err, DB_CONSTRAINTS.availabilityOverlap)) {
    return new AppError("This time overlaps with availability you've already scheduled.", 409, {
      reason: "availability_overlap",
    });
  }
  return null;
};

// lessons use onDelete: Restrict, so deleting something they reference fails
const handleForeignKeyRestrictErrorDB = () =>
  new AppError(
    "This can't be deleted because lesson history still refers to it. Please contact support.",
    409,
  );

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
  const schedulingError = handleSchedulingConstraintError(err);

  if (schedulingError) {
    error = schedulingError;
  } else if (err instanceof ZodError) {
    error = handleZodError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    error = handlePrismaValidationError();
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      error = handleUniqueConstraintViolationErrorDB(err);
    } else if (err.code === "P2025") {
      error = handleRecordNotFoundErrorDB(err);
    } else if (err.code === "P2034") {
      error = handleWriteConflictErrorDB();
    } else if (err.code === "P2003") {
      error = handleForeignKeyRestrictErrorDB();
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
