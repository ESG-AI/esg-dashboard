import { WebhookEvent } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Verify webhook (add your webhook secret from Clerk Dashboard)
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!WEBHOOK_SECRET || !svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Handle user creation event
  if (payload.type === "user.created") {
    const { id: userId } = payload.data;

    try {
      // Set isApproved to false for new users
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          isApproved: false,
        },
      });

      console.log(`User ${userId} created with approval status: pending`);

      // Optional: Notify admin via email or other method
      // await notifyAdmin(userId);
    } catch (error) {
      console.error("Error updating user metadata:", error);
      return NextResponse.json(
        { error: "Failed to set approval status" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
