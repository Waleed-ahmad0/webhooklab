"use client";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        setAuthenticated(true);
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    });
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          <span className="text-sm text-zinc-600">Authenticating...</span>
        </div>
      </div>
    );

  return authenticated ? <>{children}</> : null;
}