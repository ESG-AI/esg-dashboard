"use client";

import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-200">
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Unauthorized Access</h1>

        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-300">
            You don't have permission to access this page.
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
