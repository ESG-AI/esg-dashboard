"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface UserData {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddress: string;
  createdAt: string;
  isApproved: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // Check if current user is admin
  useEffect(() => {
    if (isLoaded) {
      const userRole = user?.publicMetadata?.role;
      if (userRole !== "admin") {
        router.push("/unauthorized");
      }
    }
  }, [isLoaded, router, user]);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/admin/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data.users);
      } catch (err) {
        setError("Failed to load users. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && user?.publicMetadata?.role === "admin") {
      fetchUsers();
    }
  }, [isLoaded, user]);

  // Approve user handler
  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve user");
      }

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isApproved: true } : user
        )
      );
    } catch (err) {
      console.error("Error approving user:", err);
      alert("Failed to approve user. Please try again.");
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (user?.publicMetadata?.role !== "admin") {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-200 p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">
        Admin Dashboard: User Management
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Pending Approvals</h2>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {users.filter((user) => !user.isApproved).length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  No pending approvals at this time.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        User
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Joined
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users
                      .filter((user) => !user.isApproved)
                      .map((user) => (
                        <tr key={user.id} className="hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.firstName} {user.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {user.emailAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleApproveUser(user.id)}
                              className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-md transition"
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Approved Users</h2>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      User
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Joined
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {users
                    .filter((user) => user.isApproved)
                    .map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.emailAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="bg-green-900/50 text-green-400 py-1 px-3 rounded-full text-xs">
                            Approved
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
