import { prisma } from "@db/prisma.js";
import { type User, Role, type Subject } from "@generated/client.js";
import { AppError } from "@utils/AppError.js";
import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { CredentialsInput, SocialSyncInput } from "../schemas/auth.schema.js";
import type { Level } from "@generated/enums.js";

// A pre-computed hash with no matching plaintext. Comparing against this when a
// user isn't found keeps login's response time indistinguishable from a real
// user with a wrong password, so timing can't be used to enumerate accounts.
const DUMMY_PASSWORD_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8G8s.dl1a9E4x2P1kD5xR6h6Y5j0lC";

interface TeacherFieldsPayload {
  bio?: string;
  qualifications?: string;
  hourlyRate?: number;
  teaches: { subject: Subject; level: Level }[];
}

export const getProfileData = (role: Role, body: TeacherFieldsPayload) => {
  switch (role) {
    case Role.Teacher:
      return {
        teacher: {
          create: {
            bio: body.bio || "",
            qualifications: body.qualifications || "",
            hourlyRate: body.hourlyRate || 0,
            // Maps the array of items to match the Teaches relationship model
            teaches: {
              create: (body.teaches || []).map((t: { subject: Subject; level: Level }) => ({
                subject: t.subject,
                level: t.level,
              })),
            },
          },
        },
      };
    case Role.Student:
      return { student: { create: {} } };
    default:
      return {};
  }
};

export const registerUser = async (credentialsData: CredentialsInput): Promise<User> => {
  const { name, email, password, role } = credentialsData;
  const normalizedEmail = email.toLowerCase().trim();

  // Only the Teacher variant of the discriminated union carries these fields.
  const { bio, qualifications, hourlyRate, teaches } = credentialsData as TeacherFieldsPayload;

  const hashedPassword = await bcrypt.hash(password, 12);
  const profileRelation = getProfileData(role, { bio, qualifications, hourlyRate, teaches });

  return prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      ...profileRelation,
    },
  });
};

export const verifyLoginCredentials = async (email: string, password: string): Promise<User> => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Always run bcrypt.compare, even when no user/password exists, so a
  // missing account doesn't respond measurably faster than a wrong password
  // (see DUMMY_PASSWORD_HASH above).
  const isPasswordCorrect = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);

  if (!user || !user.password || !isPasswordCorrect) {
    throw new AppError("Incorrect email or password", 401);
  }

  return user;
};

/**
 * Server-to-server only — the caller (see requireInternalService middleware)
 * must have already verified the OAuth handshake with the provider. This
 * trusts that the email it's given has been verified by that provider.
 */
export const syncSocialUser = (input: SocialSyncInput): Promise<User> => {
  const { email, name, image, provider, providerId, role } = input;
  const normalizedEmail = email.toLowerCase().trim();

  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { name, image, providerId },
    create: {
      email: normalizedEmail,
      name,
      image,
      provider,
      providerId,
      role,
      ...getProfileData(role, { teaches: [] }),
    },
  });
};

export const signAuthToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ id: userId }, env.JWT_SECRET, options);
};
