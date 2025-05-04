"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function PendingApprovalPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-200">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>

        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-blue-300">
            Your account is currently awaiting admin approval. You'll be
            notified once your access is granted.
          </p>
        </div>

        <div className="mb-6">
          <p className="text-gray-400 mb-2">
            Email: {user?.primaryEmailAddress?.emailAddress}
          </p>
          <p className="text-gray-400">
            Name: {user?.firstName} {user?.lastName}
          </p>
        </div>

        <Link
          href="/"
          className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
