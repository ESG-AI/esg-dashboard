"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Shield } from "lucide-react"; // Import the Shield icon

export function AdminButton() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  // If not admin, don't render anything
  if (!isAdmin) {
    return null;
  }

  // Only render for admin users
  return (
    <Link
      href="/admin"
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
    >
      <Shield size={18} /> {/* Replace the span with the Shield icon */}
      Admin
    </Link>
  );
}
