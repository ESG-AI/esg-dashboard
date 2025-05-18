import { redirect } from "next/navigation";
import { checkRole } from "@app-utils/roles";
import { SearchUsers } from "./SearchUsers";
import { clerkClient } from "@clerk/nextjs/server";
import { removeRole, setRole } from "./_actions";
import { Shield, UserCheck, UserCog, UserMinus } from "lucide-react";

export default async function AdminDashboard(params: {
  searchParams: Promise<{ search?: string }>;
}) {
  const isAdmin = await checkRole("admin");
  if (!isAdmin) {
    redirect("/");
  }

  const query = (await params.searchParams).search;

  const client = await clerkClient();
  const { data, totalCount } = query
    ? await client.users.getUserList({ query })
    : await client.users.getUserList({
        orderBy: "-created_at",
        limit: 10,
      });
  console.log("Users:", data);
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">
          Manage users and their permissions in your ESG Scoring Dashboard.
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Find Users</h2>
        <SearchUsers />
      </div>

      {/* Users List */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h2 className="text-xl font-semibold text-white mb-4">
          {data.length > 0 ? `Users (${data.length})` : "Users"}
        </h2>

        <div className="space-y-4">
          {data.map((user) => (
            <div
              key={user.id}
              className="bg-gray-750 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition"
            >
              <div className="md:flex justify-between items-start">
                {/* User Info */}
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">
                      {user.firstName} {user.lastName}
                    </h3>
                    {typeof user.publicMetadata.role === "string" && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          user.publicMetadata.role === "admin"
                            ? "bg-blue-900 text-blue-300"
                            : user.publicMetadata.role === "prompt_admin"
                            ? "bg-green-900 text-green-300"
                            : "bg-yellow-900 text-yellow-300"
                        }`}
                      >
                        {user.publicMetadata.role === "admin"
                          ? "Admin"
                          : user.publicMetadata.role === "prompt_admin"
                          ? "Prompt Admin"
                          : "Member"}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400">
                    {
                      user.emailAddresses.find(
                        (email) => email.id === user.primaryEmailAddressId
                      )?.emailAddress
                    }
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <form action={setRole}>
                    <input type="hidden" value={user.id} name="id" />
                    <input type="hidden" value="admin" name="role" />
                    <button
                      type="submit"
                      className={`bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors ${
                        typeof user.publicMetadata.role === "string" &&
                        user.publicMetadata.role === "admin"
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                      disabled={
                        typeof user.publicMetadata.role === "string" &&
                        user.publicMetadata.role === "admin"
                      }
                    >
                      <Shield size={16} />
                      Make Admin
                    </button>
                  </form>

                  <form action={setRole}>
                    <input type="hidden" value={user.id} name="id" />
                    <input type="hidden" value="prompt_admin" name="role" />
                    <button
                      type="submit"
                      className={`bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors ${
                        typeof user.publicMetadata.role === "string" &&
                        user.publicMetadata.role === "prompt_admin"
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                      disabled={
                        typeof user.publicMetadata.role === "string" &&
                        user.publicMetadata.role === "prompt_admin"
                      }
                    >
                      <UserCog size={16} />
                      Make Prompt Admin
                    </button>
                  </form>

                  <form action={setRole}>
                    <input type="hidden" value={user.id} name="id" />
                    <input type="hidden" value="member" name="role" />
                    <button
                      type="submit"
                      className={`bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded flex items-center gap-2 text-sm transition-colors ${
                        typeof user.publicMetadata.role === "string" &&
                        user.publicMetadata.role === "member"
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                      disabled={
                        typeof user.publicMetadata.role === "string" &&
                        user.publicMetadata.role === "member"
                      }
                    >
                      <UserCheck size={16} />
                      Make Member
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
