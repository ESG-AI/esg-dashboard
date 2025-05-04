import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require approval
const publicRoutes = ["/", "/sign-in", "/sign-up", "/api/clerk-webhooks"];

// Define admin routes
const adminRoutes = ["/admin", "/admin/users", "/api/admin"];

// Define approval-pending page
const pendingApprovalRoute = "/pending-approval";

export default clerkMiddleware((auth, req) => {
  // Use type assertion to work around TypeScript error
  const authObj = auth as any;
  const userId = authObj.userId || authObj.auth?.userId;
  const path = req.nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some((route) => path.startsWith(route))) {
    return NextResponse.next();
  }

  // If user is not logged in, allow Clerk to handle authentication
  if (!userId) {
    return NextResponse.next();
  }

  // For logged in users:

  // Allow accessing the pending-approval page
  if (path === pendingApprovalRoute) {
    return NextResponse.next();
  }

  // Check for admin routes
  if (adminRoutes.some((route) => path.startsWith(route))) {
    // Use type assertion for accessing metadata
    const metadata = (authObj.sessionClaims?.publicMetadata ||
      authObj.auth?.sessionClaims?.publicMetadata) as any;
    const isAdmin = metadata?.role === "admin";

    if (!isAdmin) {
      // Redirect non-admin users to unauthorized page
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  }

  // Check approval status for protected routes
  // Use type assertion for accessing metadata
  const metadata = (authObj.sessionClaims?.publicMetadata ||
    authObj.auth?.sessionClaims?.publicMetadata) as any;
  const isApproved = metadata?.isApproved === true;

  if (!isApproved && path !== pendingApprovalRoute) {
    // Redirect unapproved users to pending approval page
    return NextResponse.redirect(new URL(pendingApprovalRoute, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
