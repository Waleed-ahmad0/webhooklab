'use client'
import { useEffect, useState } from "react";
import { getSession } from "@/lib/api";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

  if (loading) return <div>Loading...</div>;
  return authenticated ? <>{children}</> : null;
}