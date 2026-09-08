// src/types/roles.ts

// export const UserRole = {
// 	Student: "Student",
// 	Teacher: "Teacher",
// 	// Admin: "Admin",
// } as const;

export enum UserRole {
  Student = "Student",
  Teacher = "Teacher",
  // Admin = "Admin", // Adding a role later only happens here
}

// export type UserRole = (typeof UserRole)[keyof typeof UserRole];
// // Union type: "Student" | "Teacher"
