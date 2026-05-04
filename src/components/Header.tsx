"use client";

import { SignInButton, SignUpButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Clock, Activity } from "lucide-react";
import { AdminButton } from "@/components/AdminButton";
import { useJobs } from "@/context/JobContext";

export const Header = () => {
  const { isSignedIn } = useAuth();
  const { pendingJobs } = useJobs();

  return (
    <nav className="flex justify-between items-center p-4 h-16 bg-gray-800 shadow-md">
      <div className="flex items-center gap-6">
        <Link href="/upload" className="hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-white cursor-pointer">SPDI AI</h1>
        </Link>
        
        {/* Global Pending Jobs Widget */}
        {pendingJobs.length > 0 && (
          <Link href="/results">
            <div className="flex items-center gap-2 bg-blue-900/40 border border-blue-500/50 px-3 py-1.5 rounded-full hover:bg-blue-800/50 transition-colors cursor-pointer group">
              <Activity size={16} className="text-blue-400 animate-pulse" />
              <span className="text-sm font-medium text-blue-300 group-hover:text-blue-200">
                Analysis in Progress...
              </span>
            </div>
          </Link>
        )}
      </div>
      <div>
        {!isSignedIn && (
          <div className="flex items-center gap-4">
            <SignInButton
              appearance={{
                elements: {
                  button:
                    "bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition",
                },
              }}
            >
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                Sign In
              </button>
            </SignInButton>

            {/* Custom Sign Up Button */}
            <SignUpButton
              appearance={{
                elements: {
                  button:
                    "bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition",
                },
              }}
            >
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        )}

        {isSignedIn && (
          <div className="flex items-center gap-4">
            <UserButton />
            <Link
              href="/history"
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-gray-200 hover:text-white transition-all"
            >
              <Clock size={18} />
              <span>History</span>
            </Link>
            <AdminButton />
          </div>
        )}
      </div>
    </nav>
  );
};
