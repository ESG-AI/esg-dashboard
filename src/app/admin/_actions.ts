"use server";

import { checkRole } from "@app-utils/roles";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function setRole(formData: FormData) {
  const client = await clerkClient();

  if (!(await checkRole("admin"))) {
    return;
  }

  try {
    const userId = formData.get("id") as string;
    const role = formData.get("role") as string;

    console.log(`Setting role ${role} for user ${userId}`);

    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    revalidatePath("/admin");
  } catch (err) {
    console.error("Error setting role:", err);
  }
}

export async function removeRole(formData: FormData) {
  const client = await clerkClient();
  const currentUserData = await currentUser();

  try {
    const userId = formData.get("id") as string;
    console.log(`Removing role for user ${userId}`);

    // Check if user is removing their own admin privileges
    const isSelfDemotion = currentUserData?.id === userId;

    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: null },
    });

    revalidatePath("/admin");

    // If the user removed their own admin privileges, redirect them away
    if (isSelfDemotion) {
      // Add a small delay to allow Clerk to process the change
      await new Promise((resolve) => setTimeout(resolve, 100));
      redirect("/");
    }
  } catch (err) {
    console.error("Error removing role:", err);
  }
}
