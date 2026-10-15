"use client";

import { useState, useEffect, type ReactNode } from "react";
import Image from "next/image";
import { Activity, AlertCircle, CalendarDays, CheckCircle2, GitBranch, Loader2, LockKeyhole, LogOut, Mail, MessageCircle, RefreshCw, ShieldCheck, Trash2, UserRound } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  hasPassword: boolean;
  profileImage?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin: string;
  createdAt: string;
  linkedAccounts: {
    google: boolean;
    github: boolean;
    discord: boolean;
    credentials: boolean;
  };
}

const tabs = [
  { id: "profile", name: "Profile", icon: UserRound },
  { id: "security", name: "Security", icon: LockKeyhole },
  { id: "activity", name: "Activity", icon: Activity },
];

const providerIcons: Record<string, ReactNode> = {
  google: (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  ),
  github: <GitBranch aria-hidden="true" className="h-5 w-5" />,
  discord: <MessageCircle aria-hidden="true" className="h-5 w-5" />,
  credentials: <Mail aria-hidden="true" className="h-5 w-5" />,
};

function formatDate(dateString: string) {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AccountProfile() {
  const [user, setUser] = useState<UserData>();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function fetchUserProfile() {
      try {
        const response = await fetch("/api/user", { signal: controller.signal });
        if (!response.ok) throw new Error("We couldn't load your profile. Please try again.");
        const userData = await response.json();
        if (!userData) throw new Error("Your profile is unavailable. Please try again.");
        setUser({
          ...userData,
          hasPassword: userData.hasPassword ?? userData.authMethods?.includes("credentials") ?? false,
          linkedAccounts: userData.linkedAccounts ?? Object.fromEntries(
            (userData.authMethods ?? []).map((provider: string) => [provider, true])
          ),
        });
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load your profile.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    fetchUserProfile();
    return () => controller.abort();
  }, []);

  async function signOut() {
    const response = await fetch("/auth/csrf", { credentials: "include" });
    if (!response.ok) throw new Error("Unable to sign out. Please try again.");
    const { csrfToken } = await response.json();
    if (!csrfToken) throw new Error("Unable to sign out. Please try again.");
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/auth/signout";
    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "csrfToken";
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);
    document.body.appendChild(form);
    form.submit();
  }

  async function handleLogout() {
    setActionError("");
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to sign out. Please try again.");
      setIsSigningOut(false);
    }
  }

  async function handleDeleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleteConfirmInput.toLowerCase() !== "delete" || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user?.email }),
      });
      if (!response.ok) {
        let message = "Unable to delete your account. Please try again.";
        try {
          const data = await response.json();
          message = data.error || data.message || message;
        } catch {
          // The fallback remains readable if the server returns a non-JSON error.
        }
        throw new Error(message);
      }
      await signOut();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete your account. Please try again.");
      setIsDeleting(false);
    }
  }

  function closeDeleteDialog() {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeleteConfirmInput("");
    setDeleteError("");
  }

  return (
    <ProtectedRoute>
      <div className="min-h-dvh bg-background text-foreground">
        <AppHeader breadcrumbs={[{ label: "Profile" }]} />
        <main id="main-content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Account settings</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Your profile, connected accounts, and account activity.</p>
          </div>

          {isLoading ? (
            <div role="status" className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> Loading your profile…
            </div>
          ) : error ? (
            <div role="alert" className="mx-auto max-w-lg rounded-xl border-2 border-border-default bg-surface shadow-panel p-5 sm:p-8">
              <AlertCircle aria-hidden="true" className="mb-4 h-6 w-6 text-red-300" />
              <h2 className="text-lg font-semibold">Unable to load profile</h2>
              <p className="mb-6 mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
              <Button onClick={() => window.location.reload()}><RefreshCw aria-hidden="true" className="h-4 w-4" /> Try again</Button>
            </div>
          ) : user ? (
            <>
              <dl className="mb-6 grid gap-3 sm:grid-cols-3 sm:gap-4">
                {[
                  { label: "Account status", value: user.isActive ? "Active" : "Inactive", icon: CheckCircle2 },
                  { label: "Email verification", value: user.isEmailVerified ? "Verified" : "Not verified", icon: ShieldCheck },
                  { label: "Member since", value: formatDate(user.createdAt), icon: CalendarDays },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between gap-3 rounded-xl border-2 border-border-default bg-surface shadow-panel p-4 sm:p-5">
                    <div className="min-w-0"><dt className="text-xs text-muted-foreground">{stat.label}</dt><dd className="mt-2 break-words text-base font-semibold sm:text-lg">{stat.value}</dd></div>
                    <stat.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-secondary-foreground" />
                  </div>
                ))}
              </dl>

              <div className="grid items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6">
                <aside className="min-w-0 space-y-4">
                  <div className="rounded-xl border-2 border-border-default bg-surface shadow-panel p-5 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border-default bg-surface-raised">
                      {user.profileImage ? <Image src={user.profileImage} alt="Your profile" width={64} height={64} className="h-full w-full object-cover" /> : <UserRound aria-hidden="true" className="h-7 w-7 text-muted-foreground" />}
                    </div>
                    <h2 className="break-words text-base font-semibold">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "Your account"}</h2>
                    <p className="mt-1 break-all text-sm leading-6 text-muted-foreground">{user.email}</p>
                  </div>
                  <nav aria-label="Account sections" className="rounded-xl border-2 border-border-default bg-surface shadow-panel p-2">
                    <div className="grid grid-cols-3 gap-1 lg:grid-cols-1">
                      {tabs.map((tab) => (
                        <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} aria-controls="account-panel" onClick={() => setActiveTab(tab.id)} className={`flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-sm lg:justify-start lg:px-3 ${activeTab === tab.id ? "bg-surface-selected text-foreground ring-1 ring-inset ring-border-strong" : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"}`}>
                          <tab.icon aria-hidden="true" className="h-4 w-4 shrink-0" />{tab.name}
                        </button>
                      ))}
                    </div>
                  </nav>
                </aside>

                <section id="account-panel" aria-labelledby="account-panel-title" className="min-w-0 overflow-hidden rounded-xl border-2 border-border-default bg-surface shadow-panel">
                  <div className="border-b border-border-subtle p-5 sm:p-6">
                    <h2 id="account-panel-title" className="text-lg font-semibold">{activeTab === "profile" ? "Profile information" : activeTab === "security" ? "Security" : "Account activity"}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{activeTab === "profile" ? "Your personal information and account details." : activeTab === "security" ? "Review the sign-in methods connected to your account." : "Review important dates and your account status."}</p>
                  </div>
                  <div className="space-y-6 p-5 sm:p-6">
                    {activeTab === "profile" && (
                      <>
                        <dl className="grid gap-5 sm:grid-cols-2">
                          <div><dt className="mb-2 text-sm text-muted-foreground">First name</dt><dd className="break-words rounded-lg border border-border-default bg-surface-raised p-3 text-sm">{user.firstName || "Not provided"}</dd></div>
                          <div><dt className="mb-2 text-sm text-muted-foreground">Last name</dt><dd className="break-words rounded-lg border border-border-default bg-surface-raised p-3 text-sm">{user.lastName || "Not provided"}</dd></div>
                          <div className="sm:col-span-2"><dt className="mb-2 text-sm text-muted-foreground">Email address</dt><dd className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-default bg-surface-raised p-3 text-sm"><span className="min-w-0 break-all">{user.email}</span>{user.isEmailVerified && <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300"><CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />Verified</span>}</dd></div>
                        </dl>
                        <div className="space-y-4 border-t border-border-subtle pt-6">
                          <h3 className="text-sm font-semibold">Account actions</h3>
                          {actionError && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{actionError}</p>}
                          <div className="flex flex-wrap items-center gap-3">
                            <Button variant="outline" onClick={handleLogout} disabled={isSigningOut}>{isSigningOut ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <LogOut aria-hidden="true" className="h-4 w-4" />}{isSigningOut ? "Signing out…" : "Sign out"}</Button>
                            <Button variant="destructive" onClick={() => setShowDeleteModal(true)} disabled={isSigningOut}><Trash2 aria-hidden="true" className="h-4 w-4" /> Delete account</Button>
                          </div>
                        </div>
                      </>
                    )}
                    {activeTab === "security" && (
                      <>
                        <div><h3 className="mb-3 text-sm font-semibold">Connected accounts</h3>
                          <ul className="space-y-3">
                            {Object.entries(user.linkedAccounts || {}).filter(([, connected]) => connected).map(([provider]) => (
                              <li key={provider} className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-raised p-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-default text-secondary-foreground">{providerIcons[provider] || <ShieldCheck aria-hidden="true" className="h-5 w-5" />}</span>
                                <div className="min-w-0"><p className="break-words text-sm font-medium capitalize">{provider === "credentials" ? "Email and password" : provider === "github" ? "GitHub" : provider}</p><p className="mt-1 text-xs text-muted-foreground">Connected</p></div>
                              </li>
                            ))}
                          </ul>
                          {!Object.values(user.linkedAccounts || {}).some(Boolean) && <p className="text-sm leading-6 text-muted-foreground">No connected accounts to display.</p>}
                        </div>
                        {user.hasPassword && <div className="border-t border-border-subtle pt-6"><h3 className="mb-2 text-sm font-semibold">Password</h3><p className="text-sm leading-6 text-muted-foreground">Password sign-in is enabled for your account.</p></div>}
                      </>
                    )}
                    {activeTab === "activity" && (
                      <dl className="grid gap-4 sm:grid-cols-2">
                        {[{ label: "Last login", value: user.lastLogin ? formatDate(user.lastLogin) : "Not recorded" }, { label: "Account created", value: formatDate(user.createdAt) }, { label: "Email status", value: user.isEmailVerified ? "Verified" : "Not verified" }].map((item) => (
                          <div key={item.label} className="rounded-lg border border-border-default bg-surface-raised p-4"><dt className="text-sm text-muted-foreground">{item.label}</dt><dd className="mt-2 text-base font-medium">{item.value}</dd></div>
                        ))}
                      </dl>
                    )}
                  </div>
                </section>
              </div>
            </>
          ) : null}
        </main>

        <Dialog open={showDeleteModal} onClose={closeDeleteDialog} title="Delete account?" description="This permanently deletes your account and its data. This action cannot be undone.">
          <form onSubmit={handleDeleteAccount} className="space-y-5">
            {deleteError && <p role="alert" className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300">{deleteError}</p>}
            <div className="space-y-2">
              <Label htmlFor="delete-account-confirmation">Type <span className="font-mono text-foreground">delete</span> to confirm</Label>
              <Input id="delete-account-confirmation" value={deleteConfirmInput} onChange={(event) => setDeleteConfirmInput(event.target.value)} disabled={isDeleting} autoComplete="off" spellCheck={false} placeholder="delete" />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>Cancel</Button>
              <Button type="submit" variant="destructive" disabled={isDeleting || deleteConfirmInput.toLowerCase() !== "delete"}>{isDeleting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}{isDeleting ? "Deleting account…" : "Delete account"}</Button>
            </div>
          </form>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
