"use client";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    async function checkSession() {
      try {
        const session = await getSession();
        if (!active) return;
        if (session) setAuthenticated(true);
        else router.replace("/login");
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    checkSession();
    return () => { active = false; };
  }, [router]);

  if (error) return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p role="alert" className="text-sm text-secondary-foreground">Unable to verify your session. Please try again.</p>
      <Button onClick={() => window.location.reload()}>Try again</Button>
    </main>
  );

  if (loading)
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div role="status" className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-secondary-foreground animate-spin" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">Authenticating...</span>
        </div>
      </div>
    );

  return authenticated ? <>{children}</> : null;
}
