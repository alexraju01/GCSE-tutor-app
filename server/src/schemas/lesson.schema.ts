import { LessonStatus, Subject } from "@generated/enums.js";
import { z } from "zod";

const createEnumTransformer = <T extends Record<string, string>>(enumObj: T, paramName: string) => {
  const allowedValues = Object.values(enumObj);
  return z
    .string()
    .toLowerCase()
    .optional()
    .transform((val, ctx) => {
      if (!val) return undefined;

      const matchedEnum = allowedValues.find((enumValue) => enumValue.toLowerCase() === val);

      if (!matchedEnum) {
        ctx.addIssue({
          code: "custom",
          message: `Invalid ${paramName}. Allowed values: ${allowedValues
            .map((v) => v.toLowerCase())
            .join(", ")}`,
        });
        return z.NEVER;
      }

      return matchedEnum as T[keyof T];
    });
};

export const getLessonsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(5),
  status: createEnumTransformer(LessonStatus, "status"),
  subject: createEnumTransformer(Subject, "subject"),
});

export type GetLessonsQuery = z.infer<typeof getLessonsQuerySchema>;

export const createLessonSchema = z
  .object({
    teacherProfileId: z.uuid({ message: "Invalid teacherProfileId format" }),
    availabilityId: z.uuid({ message: "Invalid availabilityId format" }),
    startTime: z.iso.datetime({ message: "startTime must be a valid ISO 8601 date-time" }),
    endTime: z.iso.datetime({ message: "endTime must be a valid ISO 8601 date-time" }),
    subject: z.enum(Subject, {
      message: `Invalid subject. Available options: ${Object.values(Subject).join(", ")}`,
    }),
    topic: z.string().trim().max(255).optional(),
    notes: z.string().trim().max(255).optional(),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    error: "endTime must be after startTime",
    path: ["endTime"],
  });

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
