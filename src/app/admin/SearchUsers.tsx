"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

export const SearchUsers = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(
        `${pathname}?search=${encodeURIComponent(searchTerm.trim())}`
      );
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    router.push(pathname);
  };

  return (
    <div className="w-full mb-6">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xl">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            id="search"
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-12 bg-gray-700 border border-gray-600 rounded-md text-base text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
            placeholder="Search users by name or email..."
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center font-medium text-base shadow-sm"
        >
          Search Users
        </button>
      </form>

      {searchParams.get("search") && (
        <div className="mt-4 flex items-center">
          <span className="text-gray-400 mr-2">Showing results for:</span>
          <span className="bg-blue-900/50 text-blue-300 py-1 px-3 rounded-full text-sm font-medium flex items-center">
            {searchParams.get("search")}
            <button
              onClick={clearSearch}
              className="ml-2 text-blue-300 hover:text-white"
            >
              <X size={14} />
            </button>
          </span>
        </div>
      )}
    </div>
  );
};
