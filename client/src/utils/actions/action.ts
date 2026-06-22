"use server";

import { ZodError, type ZodType } from "zod";

import type { SessionData } from "@/types/auth";
import { auth } from "@auth";

type ActionOptions<T> = {
  params?: T;
  schema?: ZodType<T>;
  authorize?: boolean;
};

async function action<T>({
  params,
  schema,
  authorize = false,
}: ActionOptions<T>) {
  if (schema && params) {
    try {
      schema?.parse(params);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("This is action error:", error);
      } else {
        return new Error("Schema validation failed");
      }
    }
  }

  let session: SessionData | null = null;

  if (authorize) {
    session = await auth();
    if (!session) {
      return new Error("This is the authorize error");
    }
  }

  return { params, session };
}

export default action;
