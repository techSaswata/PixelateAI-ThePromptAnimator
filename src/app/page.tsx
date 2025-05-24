"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "../components/landing-page";
import { useAuth } from "../contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    // Only redirect if we're not loading and user is authenticated
    if (!loading && session) {
      router.push("/create");
    }
  }, [session, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Show landing page if not authenticated
  return <LandingPage />;
}
