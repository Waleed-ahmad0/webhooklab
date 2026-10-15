"use client";

import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Zap, User, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";

export default function Page() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [firstName, setfirstName] = useState<string>("");
  const [lastName, setlastName] = useState<string>("");
  const [confirmpassword, setconfirmpassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, seterror] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handlesumit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      email.trim() === "" ||
      password.length < 8 ||
      confirmpassword.length < 8
    ) {
      seterror("Enter an email address and a password with at least 8 characters.");
      return;
    }
    if (password !== confirmpassword) {
      seterror("Passwords do not match");
      return;
    }
    seterror("");
    try {
      setIsSubmitting(true);
      const res = await apiFetch("/api/register", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password, firstName: firstName.trim(), lastName: lastName.trim() }),
      });

      if (res.message === 'success')  {
        router.push("/login");
      } else {
        seterror("Unable to create your account. Please try again.");
      }
    } catch (error) {
      seterror(error instanceof Error ? error.message.replace(/^API error:\s*/, "").trim() : "Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main id="main-content" className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative selection:bg-white/20">

      <div
        className="w-full max-w-[460px] relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" aria-label="WebhookLab home" className="flex min-h-11 items-center gap-2 rounded-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <Zap className="w-4 h-4 text-neutral-950" />
            </div>
            <span className="text-lg font-medium tracking-tight text-white">
              WebhookLab
            </span>
          </Link>
        </div>

        <Card className="border-border-default bg-surface rounded-xl shadow-panel">
          <CardHeader className="text-center pb-2 px-5 pt-6 sm:px-8 sm:pt-8">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Create an account</h1>
            <CardDescription className="text-muted-foreground mt-1">
              Sign up to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-6 pt-6 sm:px-8 sm:pb-8">
            <form onSubmit={handlesumit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs text-muted-foreground">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      autoComplete="given-name"
                      name="firstName"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setfirstName(e.target.value)}
                      placeholder="John"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs text-muted-foreground">Last Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      autoComplete="family-name"
                      name="lastName"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setlastName(e.target.value)}
                      placeholder="Doe"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-muted-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type="email"
                    autoComplete="email"
                    required
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    aria-describedby="password-help"
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="pl-9 pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <p id="password-help" className="text-xs leading-5 text-muted-foreground">Use at least 8 characters for your password.</p>

              <div className="space-y-1.5">
                <Label htmlFor="confirmpassword" className="text-xs text-muted-foreground">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    name="confirmpassword"
                    id="confirmpassword"
                    value={confirmpassword}
                    onChange={(e) => setconfirmpassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-9 pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-0.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

                {error && (
                  <div
                    role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/25 bg-red-500/10 p-3"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-300 shrink-0" />
                    <span className="text-[13px] text-red-300">{error}</span>
                  </div>
                )}

              <Button
                type="submit"
                variant="primary"
                className="mt-2 min-w-32"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-[13px] text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="rounded-sm font-medium text-secondary-foreground hover:underline"
              >
                Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}