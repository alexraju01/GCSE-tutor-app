import { auth } from "@auth";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES: Record<string, ("TEACHER" | "STUDENT")[]> = {
	"/dashboard/teacher": ["TEACHER"],
	"/dashboard/student": ["STUDENT"],
};

// Instead of a direct re-export, wrap the auth call to inject custom routing logic
export const proxy = auth((req) => {
	const { nextUrl } = req;
	const isAuthenticated = !!req.auth;
	const userRole = req.auth?.user?.role; // Strictly typed string literal from auth.d.ts
	const matchedPath = Object.keys(PROTECTED_ROUTES).find((path) =>
		nextUrl.pathname.startsWith(path),
	);

	if (matchedPath) {
		if (!isAuthenticated) {
			return NextResponse.redirect(new URL("/sign-in", nextUrl));
		}

		// 2. Role authorization check
		const allowedRoles = PROTECTED_ROUTES[matchedPath];
		if (!userRole || !allowedRoles.includes(userRole)) {
			// Safely bounce them back to their appropriate home layout
			const fallbackRoute = userRole === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student";
			return NextResponse.redirect(new URL(fallbackRoute, nextUrl));
		}
	}

	return NextResponse.next();
});

export const config = {
	matcher: ["/dashboard/:path*"],
};
