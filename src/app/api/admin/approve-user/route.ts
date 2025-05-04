import { clerkClient } from "@clerk/clerk-sdk-node";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get current user from auth - await the Promise
    const authObject = await auth();
    const { userId } = authObject;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin
    const currentUser = await clerkClient.users.getUser(userId);
    const isAdmin = currentUser.publicMetadata?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user ID from request body
    const { userId: targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get target user to preserve existing metadata
    const targetUser = await clerkClient.users.getUser(targetUserId);
    const existingMetadata = targetUser.publicMetadata || {};

    // Update user metadata, preserving existing fields
    await clerkClient.users.updateUser(targetUserId, {
      publicMetadata: {
        ...existingMetadata,
        isApproved: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error approving user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
