"use client";

import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppHeader } from "@/components/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Link2, ChevronRight, Loader2, AlertCircle, Copy, Check, Settings, Trash2, FolderGit2, Edit3 } from "lucide-react";

interface Endpoint {
  id: string;
  name: string;
  token: string;
  workspaceId: string;
  createdAt: string;
  _count?: { requests: number };
}

export default function WorkspaceDetailPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const [todaysRequest, setTodaysRequest] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEndpointName, setNewEndpointName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [settingsView, setSettingsView] = useState<"menu" | "rename" | "delete" | null>(null);
  const [workspaceName, setWorkspaceName] = useState(workspaceId);
  const [renameDraft, setRenameDraft] = useState(workspaceName);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchEndpoints = useCallback(async () => {
    try {
      const data = await apiFetch(`/webhook/api/workspaces/endpoints/${workspaceId}`, { method: "GET" });
      setTotalRequests(data.totalRequests ?? 0);
      setTodaysRequest(data.todaysRequest ?? 0);
      setEndpoints(data.endpoints);
      setWorkspaceName(data.workspaceName || workspaceId);
      setRenameDraft(data.workspaceName || workspaceId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load endpoints.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    async function load() {
      await fetchEndpoints();
    }
    load();
  }, [fetchEndpoints]);

  const openCreateDialog = () => {
    setActionError(null);
    setNewEndpointName("");
    setShowCreateModal(true);
  };

  const handleCreateEndpoint = async () => {
    if (creating || !newEndpointName.trim()) return;
    try {
      setCreating(true);
      setActionError(null);
      await apiFetch("/webhook/api/endpoint", {
        method: "POST",
        body: JSON.stringify({ name: newEndpointName.trim(), workspaceId }),
      });
      setNewEndpointName("");
      setShowCreateModal(false);
      await fetchEndpoints();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to create endpoint. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      setCopyError(null);
      await navigator.clipboard.writeText(new URL(text, window.location.origin).href);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopyError("Unable to copy the URL. Select and copy it manually.");
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const getWebhookUrl = (token: string) => `${process.env.NEXT_PUBLIC_API_URL ?? ""}/webhook/api/h/${token}`;

  const handleRenameWorkspace = async () => {
    const name = renameDraft.trim();
    if (isRenaming || !name || name === workspaceName) return;
    try {
      setIsRenaming(true);
      setActionError(null);
      const updatedWorkspace = await apiFetch(`/webhook/api/workspace/${workspaceId}`, {
        method: "PATCH", body: JSON.stringify({ name }),
      });
      setWorkspaceName(updatedWorkspace.name);
      setRenameDraft(updatedWorkspace.name);
      setSettingsView(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to rename workspace. Please try again.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      setActionError(null);
      await apiFetch(`/webhook/api/workspace/${workspaceId}`, { method: "DELETE" });
      setSettingsView(null);
      router.push("/workspace");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to delete workspace. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader breadcrumbs={[{ label: "Workspaces", href: "/workspace" }, { label: workspaceName }]} />
        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-3xl">{workspaceName}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Create webhook endpoints and monitor incoming requests.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
              <Link href={`/workspace/${workspaceId}/integrations/github`} className={buttonVariants({ variant: "secondary", className: "w-fit" })}>
                <FolderGit2 className="h-4 w-4" /> GitHub
              </Link>
              <Button variant="primary" onClick={openCreateDialog} className="w-fit"><Plus className="h-4 w-4" /> New endpoint</Button>
              <Button variant="outline" size="icon" aria-label="Workspace settings" title="Workspace settings" aria-haspopup="dialog" aria-expanded={settingsView !== null} onClick={() => { setActionError(null); setRenameDraft(workspaceName); setSettingsView("menu"); }}><Settings className="h-4 w-4" /></Button>
            </div>
          </div>

          <dl className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { label: "Endpoints", value: endpoints.length },
              { label: "Total requests", value: totalRequests },
              { label: "Requests today (UTC)", value: todaysRequest },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between gap-3 rounded-xl border-2 border-border-default bg-surface shadow-panel p-4 sm:block sm:p-5">
                <dt className="text-sm text-muted-foreground">{stat.label}</dt>
                <dd className="text-2xl font-semibold tabular-nums sm:mt-3">{loading || error ? "—" : stat.value.toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-base font-semibold">Endpoints</h2><span className="text-sm text-muted-foreground">{loading || error ? "" : `${endpoints.length} total`}</span></div>
          {copyError && <p role="alert" className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{copyError}</p>}
          <span role="status" className="sr-only">{copiedId ? "Webhook URL copied to clipboard." : ""}</span>

          {loading && (
            <div role="status" aria-label="Loading endpoints" className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="animate-pulse rounded-xl border-2 border-border-default bg-surface shadow-panel p-5"><div className="mb-4 h-4 w-32 rounded bg-surface-elevated" /><div className="h-8 w-full rounded bg-surface-raised" /></div>)}
            </div>
          )}
          {error && !loading && (
            <div role="alert" className="flex flex-col items-center rounded-xl border-2 border-border-default bg-surface shadow-panel px-5 py-14 text-center">
              <AlertCircle className="mb-4 h-7 w-7 text-red-400" />
              <h3 className="text-base font-medium">Unable to load endpoints</h3>
              <p className="mb-5 mt-2 max-w-lg break-words text-sm text-muted-foreground">{error}</p>
              <Button variant="secondary" onClick={async () => { setLoading(true); await fetchEndpoints(); }}>Try again</Button>
            </div>
          )}
          {!loading && !error && endpoints.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border-default bg-surface px-5 py-16 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-border-default bg-surface-raised"><Link2 className="h-6 w-6 text-secondary-foreground" /></div>
              <h3 className="text-lg font-medium">No endpoints yet</h3>
              <p className="mb-6 mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Create an endpoint to get a unique URL for receiving webhook requests.</p>
              <Button variant="primary" onClick={openCreateDialog}><Plus className="h-4 w-4" /> Create endpoint</Button>
            </div>
          )}
          {!loading && !error && endpoints.length > 0 && (
            <div className="space-y-3">
              {endpoints.map((endpoint) => (
                <article key={endpoint.id} className="min-w-0 rounded-xl border-2 border-border-default bg-surface shadow-panel p-4 transition-colors hover:border-border-strong sm:p-5">
                  <Link href={`/workspace/${workspaceId}/endpoint/${endpoint.id}`} className="group flex min-w-0 items-start gap-3 rounded-md">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-default bg-surface-raised"><Link2 className="h-4 w-4 text-secondary-foreground" /></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-medium [overflow-wrap:anywhere] group-hover:text-foreground">{endpoint.name}</h3>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-muted-foreground"><span>Created {formatDate(endpoint.createdAt)}</span><span>{(endpoint._count?.requests ?? 0).toLocaleString()} requests</span></div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  </Link>
                  <div className="mt-4 flex min-w-0 items-center gap-2 rounded-lg border border-border-default bg-surface-raised py-1 pl-3 pr-1">
                    <span className="hidden text-xs font-medium text-muted-foreground sm:inline">URL</span>
                    <code title={getWebhookUrl(endpoint.token)} className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap py-2 font-mono text-xs text-secondary-foreground sm:ml-1 sm:border-l sm:border-border-default sm:pl-3">{getWebhookUrl(endpoint.token)}</code>
                    <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={async () => { await copyToClipboard(getWebhookUrl(endpoint.token), endpoint.id); }} aria-label={copiedId === endpoint.id ? "URL copied" : `Copy URL for ${endpoint.name}`} title="Copy webhook URL">{copiedId === endpoint.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}</Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <Dialog open={showCreateModal} onClose={() => { if (!creating) setShowCreateModal(false); }} title="Create endpoint" description="Each endpoint gets a unique URL for receiving webhooks.">
          <form className="space-y-5" onSubmit={async (event) => { event.preventDefault(); await handleCreateEndpoint(); }}>
            <div className="space-y-2"><Label htmlFor="endpoint-name">Endpoint name</Label><Input id="endpoint-name" value={newEndpointName} onChange={(event) => setNewEndpointName(event.target.value)} placeholder="e.g. Stripe payments" required autoFocus disabled={creating} /></div>
            {actionError && <p role="alert" className="break-words rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{actionError}</p>}
            <div className="flex flex-wrap items-center justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} disabled={creating}>Cancel</Button><Button type="submit" variant="primary" disabled={creating || !newEndpointName.trim()}>{creating && <Loader2 className="h-4 w-4 animate-spin" />}{creating ? "Creating…" : "Create endpoint"}</Button></div>
          </form>
        </Dialog>

        <Dialog open={settingsView !== null} onClose={() => { if (!isRenaming && !isDeleting) setSettingsView(null); }} title={settingsView === "rename" ? "Rename workspace" : settingsView === "delete" ? "Delete workspace?" : "Workspace settings"}>
          {settingsView === "menu" && <div className="space-y-2">
            <Button variant="ghost" autoFocus className="w-full justify-start text-foreground" onClick={() => { setRenameDraft(workspaceName); setActionError(null); setSettingsView("rename"); }}><Edit3 className="h-4 w-4" aria-hidden="true" />Rename workspace<ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden="true" /></Button>
            <Button variant="ghost" className="w-full justify-start text-red-300 hover:bg-red-500/10 hover:text-red-200" onClick={() => { setActionError(null); setSettingsView("delete"); }}><Trash2 className="h-4 w-4" aria-hidden="true" />Delete workspace<ChevronRight className="ml-auto h-4 w-4" aria-hidden="true" /></Button>
          </div>}
          {settingsView === "rename" && <form className="space-y-5" onSubmit={async (event) => { event.preventDefault(); await handleRenameWorkspace(); }}>
            <div className="space-y-2"><Label htmlFor="workspace-rename">Workspace name</Label><Input id="workspace-rename" value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} required autoFocus disabled={isRenaming} /></div>
            {actionError && <p role="alert" className="break-words rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{actionError}</p>}
            <div className="flex flex-wrap items-center justify-end gap-2"><Button type="button" variant="secondary" onClick={() => setSettingsView("menu")} disabled={isRenaming}>Cancel</Button><Button type="submit" variant="primary" disabled={isRenaming || !renameDraft.trim() || renameDraft.trim() === workspaceName}>{isRenaming && <Loader2 className="h-4 w-4 animate-spin" />}{isRenaming ? "Saving…" : "Save changes"}</Button></div>
          </form>}
          {settingsView === "delete" && <div className="space-y-5">
            <p className="text-sm leading-6 text-secondary-foreground">This will permanently delete <strong className="break-words font-medium text-foreground [overflow-wrap:anywhere]">{workspaceName}</strong> and all its endpoints. This action cannot be undone.</p>
            {actionError && <p role="alert" className="break-words rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{actionError}</p>}
            <div className="flex flex-wrap items-center justify-end gap-2"><Button variant="secondary" autoFocus onClick={() => setSettingsView("menu")} disabled={isDeleting}>Cancel</Button><Button variant="destructive" onClick={handleDeleteWorkspace} disabled={isDeleting}>{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{isDeleting ? "Deleting…" : "Delete workspace"}</Button></div>
          </div>}
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
