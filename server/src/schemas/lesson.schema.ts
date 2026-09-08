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
