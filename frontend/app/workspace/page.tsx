"use client";

import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FolderOpen, Calendar, Link2, ChevronRight, Loader2, AlertCircle } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  endpoints?: { id: string }[];
}

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = await apiFetch("/webhook/api/workspaces", { method: "GET" });
      setWorkspaces(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function load() {
      await fetchWorkspaces();
    }
    load();
  }, [fetchWorkspaces]);

  const openCreateDialog = () => {
    setCreateError(null);
    setNewWorkspaceName("");
    setShowCreateModal(true);
  };

  const handleCreateWorkspace = async () => {
    if (creating || !newWorkspaceName.trim()) return;
    try {
      setCreating(true);
      setCreateError(null);
      await apiFetch("/webhook/api/workspace", {
        method: "POST",
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });
      setNewWorkspaceName("");
      setShowCreateModal(false);
      await fetchWorkspaces();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unable to create workspace. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader breadcrumbs={[{ label: "Workspaces" }]} />
        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your workspaces</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Organize your endpoints and monitor incoming webhook requests.
              </p>
            </div>
            <Button variant="primary" onClick={openCreateDialog} className="w-fit self-start">
              <Plus className="h-4 w-4" /> New workspace
            </Button>
          </div>

          {loading && (
            <div role="status" aria-label="Loading workspaces" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border-2 border-border-default bg-surface shadow-panel p-5">
                  <div className="mb-4 h-4 w-32 rounded bg-surface-elevated" />
                  <div className="mb-5 h-3 w-24 rounded bg-surface-raised" />
                  <div className="h-6 w-36 rounded bg-surface-raised" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <div role="alert" className="flex flex-col items-center rounded-xl border-2 border-border-default bg-surface shadow-panel px-5 py-14 text-center">
              <AlertCircle className="mb-4 h-7 w-7 text-red-400" />
              <h2 className="text-base font-medium">Unable to load workspaces</h2>
              <p className="mb-5 mt-2 max-w-lg break-words text-sm text-muted-foreground">{error}</p>
              <Button variant="secondary" onClick={async () => { setLoading(true); await fetchWorkspaces(); }}>Try again</Button>
            </div>
          )}

          {!loading && !error && workspaces.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border-default bg-surface px-5 py-16 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-border-default bg-surface-raised">
                <FolderOpen className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h2 className="text-lg font-medium">No workspaces yet</h2>
              <p className="mb-6 mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Create a workspace to start receiving and inspecting webhook requests.</p>
              <Button variant="primary" onClick={openCreateDialog}><Plus className="h-4 w-4" /> Create workspace</Button>
            </div>
          )}

          {!loading && !error && workspaces.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.map((ws) => (
                <Link key={ws.id} href={`/workspace/${ws.id}`} className="group min-w-0 rounded-xl border-2 border-border-default bg-surface shadow-panel p-5 transition-colors hover:border-border-strong hover:bg-surface-raised">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-default bg-surface-raised">
                      <FolderOpen className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words text-base font-medium [overflow-wrap:anywhere]">{ws.name}</h2>
                      <p title={ws.id} className="mt-1 truncate font-mono text-xs text-muted-foreground">{ws.id}</p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(ws.createdAt)}</span>
                    {ws.endpoints && <span className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" /> {ws.endpoints.length} endpoint{ws.endpoints.length !== 1 ? "s" : ""}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>

        <Dialog open={showCreateModal} onClose={() => { if (!creating) setShowCreateModal(false); }} title="Create workspace" description="Keep related webhook endpoints together in one workspace.">
          <form onSubmit={async (event) => { event.preventDefault(); await handleCreateWorkspace(); }} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input id="workspace-name" value={newWorkspaceName} onChange={(event) => setNewWorkspaceName(event.target.value)} placeholder="e.g. Production webhooks" required autoFocus disabled={creating} />
            </div>
            {createError && <p role="alert" className="break-words rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{createError}</p>}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} disabled={creating}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={creating || !newWorkspaceName.trim()}>{creating && <Loader2 className="h-4 w-4 animate-spin" />}{creating ? "Creating…" : "Create workspace"}</Button>
            </div>
          </form>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
