"use client";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getSession } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Zap, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [csrfToken, setCsrfToken] = useState("");
  const [loadingProvider] = useState<string | null>(null);
  const [show, setshow] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetch(`/auth/csrf`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken));

    getSession().then((session) => {
      if (session) {
        router.replace("/workspace");
      } else {
        setIsLoading(false);
      }
    });
  }, [router]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "CredentialsSignin") {
      setError("Invalid email or password");
    }
  }, [searchParams]);

  async function handleSocialSignin(provider: string) {
    const res = await fetch(`/auth/csrf`, { credentials: "include" });
    const { csrfToken } = await res.json();

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/auth/signin/${provider}`;

    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "csrfToken";
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);

    document.body.appendChild(form);
    form.submit();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!trimmedPassword) {
      setError("Password is required.");
      return;
    }

    setError(null);

    try {
      const res = await fetch(`/auth/callback/credentials`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: "manual",
        body: new URLSearchParams({
          email: trimmedEmail,
          password: trimmedPassword,
          csrfToken,
          json: "true",
        }).toString(),
      });

      const location = res.headers.get("location") ?? "";
      const normalizedLocation = location.toLowerCase();

      if (
        normalizedLocation.includes("error=credentialssignin") ||
        normalizedLocation.includes("/auth/error") ||
        normalizedLocation.includes("/login?error=credentialssignin")
      ) {
        setError("Invalid email or password");
        return;
      }

      if (normalizedLocation.includes("/workspace")) {
        router.replace("/workspace");
        return;
      }

      const sessionAfterLogin = await getSession();
      if (sessionAfterLogin) {
        router.replace("/workspace");
        return;
      }

      setError("Invalid email or password");
    } catch {
      setError("Invalid email or password");
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="w-5 h-5 text-white animate-spin" />
          <span className="text-sm text-zinc-400">Loading...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-white/20">
      <div className="pointer-events-none fixed inset-0 grid-pattern" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[380px] relative z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center">
              <Zap className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-medium tracking-tight text-white">
              WebhookLab
            </span>
          </Link>
        </div>

        <Card className="border-white/[0.1] bg-[#0A0A0A] rounded-xl shadow-2xl">
          <CardHeader className="text-center pb-2 px-8 pt-8">
            <CardTitle className="text-xl font-medium">Welcome Back</CardTitle>
            <CardDescription className="text-zinc-400 mt-1">
              Sign in to your account
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-6">
            <form
              action={`/auth/callback/credentials`}
              method="POST"
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <input type="hidden" name="csrfToken" value={csrfToken} />

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-zinc-400">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="you@example.com"
                    className="pl-9 bg-[#111] border-white/[0.08]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs text-zinc-400">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <Input
                    type={show ? "text" : "password"}
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    className="pl-9 pr-11"
                    required
                  />
                  <button
                    type="button"
                    aria-label={show ? "Hide password" : "Show password"}
                    onClick={() => setshow((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded border border-red-500/20 bg-red-500/10"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-[13px] text-red-500">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                disabled={isLoading || !email.trim() || !password.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-[13px] text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-white hover:underline transition-colors"
              >
                Register
              </Link>
            </div>

            <div className="flex items-center gap-3 my-6">
              <Separator className="flex-1 bg-white/[0.08]" />
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider">
                or continue with
              </span>
              <Separator className="flex-1 bg-white/[0.08]" />
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  name: "google",
                  label: "Google",
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  ),
                },
                {
                  name: "discord",
                  label: "Discord",
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="#5865F2" d="M19.73 4.87a18.2 18.2 0 0 0-4.6-1.44c-.21.4-.4.8-.58 1.21a16.55 16.55 0 0 0-4.94 0c-.18-.41-.37-.82-.59-1.21-1.62.27-3.14.75-4.6 1.44C2.2 9.1 1.55 13.2 1.86 17.24a18.5 18.5 0 0 0 5.63 2.79c.45-.6.85-1.24 1.2-1.92a11.8 11.8 0 0 1-1.92-.92c.16-.12.32-.24.47-.36 3.68 1.72 7.67 1.72 11.3 0 .15.12.31.24.47.36-.62.37-1.27.7-1.93.92.35.68.75 1.32 1.2 1.92a18.5 18.5 0 0 0 5.63-2.79c.4-4.53-.7-8.6-2.84-12.37zM8.7 14.8c-1.1 0-2-1.02-2-2.27 0-1.25.88-2.27 2-2.27 1.1 0 2.02 1.02 2 2.27 0 1.25-.9 2.27-2 2.27zm6.6 0c-1.1 0-2-1.02-2-2.27 0-1.25.88-2.27 2-2.27 1.1 0 2.02 1.02 2 2.27 0 1.25-.9 2.27-2 2.27z" />
                    </svg>
                  ),
                },
                {
                  name: "github",
                  label: "GitHub",
                  icon: (
                    <svg width="14" height="14" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                  ),
                },
              ].map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => handleSocialSignin(provider.name)}
                  disabled={loadingProvider !== null}
                  className="flex items-center justify-center h-9 rounded border border-white/[0.1] bg-[#111] hover:bg-white/[0.1] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={provider.label}
                >
                  {loadingProvider === provider.name ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                  ) : (
                    provider.icon
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-white animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
