import type { Metadata } from 'next';
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Clerk Next.js Quickstart',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-gray-900 text-gray-200">
          <header className="flex justify-between items-center p-4 h-16 bg-gray-800 shadow-md">
            <h1 className="text-xl font-bold">
              ESG AI
            </h1>
            <div className="flex gap-4">
              <SignedOut>
                {/* Custom Sign In Button */}
                <SignInButton
                  appearance={{
                    elements: {
                      button: 'bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition',
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
                      button: 'bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition',
                    },
                  }}
                >
                  <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}