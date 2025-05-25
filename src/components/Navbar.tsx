"use client";

import Link from "next/link";
import { Sparkles, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#222]">
      <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-md flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">PixelateAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/create"
              className="text-lg font-bold tracking-wide text-white/70 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 transition-all transform hover:scale-105"
            >
              Create
            </Link>
            <Link
              href="/gallery"
              className="text-lg font-bold tracking-wide text-white/70 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 transition-all transform hover:scale-105"
            >
              Gallery
            </Link>
            <Link
              href="/projects"
              className="text-lg font-bold tracking-wide text-white/70 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-500 transition-all transform hover:scale-105"
            >
              Projects
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex relative">
            <input
              type="text"
              placeholder="Search animations..."
              className="w-64 px-3 py-1.5 bg-[#111] border border-[#333] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-white/40"
              style={{ color: '#ffffff' }}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white/40 border border-[#333] rounded px-1.5 py-0.5">
              /
            </kbd>
          </div>
          
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-sm">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-semibold border border-red-600/30"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 