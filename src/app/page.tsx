"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignUpButton, useAuth } from "@clerk/nextjs";

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  // Redirect signed-in users to the /upload page
  useEffect(() => {
    if (isSignedIn) {
      router.push("/upload");
    }
  }, [isSignedIn, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-200">
      {/* Header Section */}
      <header className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          AI-Powered ESG Scoring
        </h1>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
          Revolutionizing ESG (Environment, Social, Governance) scoring with AI.
          Gain actionable insights into your company's sustainability
          performance.
        </p>
      </header>

      {/* Main Content */}
      <main className="text-center max-w-3xl">
        <p className="mb-8 text-gray-300 text-lg">
          Upload your company's Sustainability Report in PDF format, and let our
          AI analyze it to provide a comprehensive ESG score.
        </p>
        <SignedOut>
          {/* Get Started Button for Signed-Out Users */}
          <SignUpButton
            appearance={{
              elements: {
                button:
                  "bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:opacity-90 transition transform hover:scale-105",
              },
            }}
          >
            <button className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:opacity-90 transition transform hover:scale-105">
              Get Started
            </button>
          </SignUpButton>
        </SignedOut>
      </main>

      {/* Footer Section */}
      <footer className="absolute bottom-4 text-sm text-gray-500">
        © 2025 ESG Scoring Dashboard. All rights reserved.
      </footer>
    </div>
  );
}