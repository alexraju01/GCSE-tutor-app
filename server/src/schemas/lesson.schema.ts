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
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  // 1-12. Only meaningful alongside year — filtering by month alone with no
  // year would be ambiguous about which year's month is meant.
  month: z.coerce.number().int().min(1).max(12).optional(),
  sort: z.enum(["asc", "desc"]).default("asc"),
});

export type GetLessonsQuery = z.infer<typeof getLessonsQuerySchema>;

// no startTime/endTime here on purpose - we pull those off the Availability
// row by availabilityId instead. otherwise a student could book any time or
// duration they want as long as the id belonged to the right teacher
export const createLessonSchema = z.object({
  teacherProfileId: z.uuid({ message: "Invalid teacherProfileId format" }),
  availabilityId: z.uuid({ message: "Invalid availabilityId format" }),
  subject: z.enum(Subject, {
    message: `Invalid subject. Available options: ${Object.values(Subject).join(", ")}`,
  }),
  topic: z.string().trim().max(255).optional(),
  notes: z.string().trim().max(255).optional(),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
