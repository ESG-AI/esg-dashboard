"use client";

import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { Clock } from "lucide-react";
import { AdminButton } from "@/components/AdminButton";

export const Header = () => {
  return (
    <nav className="flex justify-between items-center p-4 h-16 bg-gray-800 shadow-md">
      <Link href="/upload" className="hover:opacity-80 transition-opacity">
        <h1 className="text-xl font-bold text-white cursor-pointer">SPDI AI</h1>
      </Link>
      <div>
        <SignedOut>
          <div className="flex items-center gap-4">
            {/* Custom Sign In Button */}
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
        </SignedOut>

        <SignedIn>
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
        </SignedIn>
      </div>
    </nav>
  );
};
