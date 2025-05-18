import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isUploadRoute = createRouteMatcher(["/upload(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isHistoryRoute = createRouteMatcher(["/history(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

   // Not logged in - redirect to sign-in for protected routes
   if (!userId) {
    if (isUploadRoute(req) || isAdminRoute(req) || isHistoryRoute(req)) {
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  // Get user session and role
  const session = await auth();
  const userRole = session.sessionClaims?.metadata?.role

  // Admin route protection - only admin role can access
  if (isAdminRoute(req) && userRole !== "admin") {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }

  // Upload route protection - only admin and prompt_admin can access
  if (isUploadRoute(req) && userRole !== "admin" && userRole !== "prompt_admin") {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }

  // History route protection - only admin and prompt_admin can access
  if (isHistoryRoute(req) && userRole !== "admin" && userRole !== "prompt_admin") {
    const url = new URL('/', req.url);
    return NextResponse.redirect(url);
  }

  // Default - allow access
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
