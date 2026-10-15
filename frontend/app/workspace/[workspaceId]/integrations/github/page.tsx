"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, FolderGit2, Lock, Globe2, Star, GitFork, GitBranch, Clock, ExternalLink, CheckCircle2, XCircle, Link2, Unplug, Settings } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppHeader } from "@/components/app-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type GithubRepo = {
  id?: number | string;
  name?: string;
  full_name?: string;
  description?: string | null;
  html_url?: string;
  private?: boolean;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  default_branch?: string;
  updated_at?: string;
};

type WorkspaceEndpoint = {
  id: string;
  name: string;
  githubRepoId?: string | number;
  githubhookId?: number | null;
  events?: string[];
};

type GithubDelivery = {
  id?: number | string;
  deliveryId?: number | string;
  event?: string;
  type?: string;
  name?: string;
  status_code?: number;
  statusCode?: number;
  responseStatus?: number;
  status?: string;
  duration?: number;
  durationMs?: number;
  delivered_at?: string;
  createdAt?: string;
  created_at?: string;
  timestamp?: string;
  success?: boolean;
  succeeded?: boolean;
  ok?: boolean;
  response?: { statusCode?: number; durationMs?: number; ok?: boolean };
};

type Delivery = {
  id?: number | string;
  event: string;
  status: string | number;
  durationMs: number | null;
  createdAt: string | null;
  success: boolean;
};

const GITHUB_WEBHOOK_EVENTS = ["push", "pull_request", "issues", "issue_comment", "pull_request_review", "release", "fork", "watch", "workflow_run", "discussion"] as const;

export default function GithubIntegrationsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [workspaceEndpoints, setWorkspaceEndpoints] = useState<WorkspaceEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workspaceName, setWorkspaceName] = useState(workspaceId);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["push", "pull_request", "issues"]);
  const [confirmingConnection, setConfirmingConnection] = useState(false);
  const [managementMode, setManagementMode] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [actionError, setActionError] = useState("");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [deliveryError, setDeliveryError] = useState("");

  const fetchWorkspaceEndpoints = useCallback(async () => {
    const data = await apiFetch(`/webhook/api/workspaces/endpoints/${workspaceId}`, { method: "GET" });
    setWorkspaceEndpoints(data?.endpoints ?? []);
    setWorkspaceName(data?.workspaceName || workspaceId);
  }, [workspaceId]);

  const fetchGithubRepos = useCallback(async () => {
    try {
      const [data] = await Promise.all([
        apiFetch("/api/github_data", { method: "GET" }),
        fetchWorkspaceEndpoints(),
      ]);
      setRepos(Array.isArray(data) ? data : Array.isArray(data?.repositories) ? data.repositories : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load GitHub repositories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [fetchWorkspaceEndpoints]);

  useEffect(() => {
    async function load() {
      await fetchGithubRepos();
    }
    load();
  }, [fetchGithubRepos]);

  const getEndpointForRepo = (repo: GithubRepo) => workspaceEndpoints.find((endpoint) =>
    endpoint.githubRepoId != null && String(endpoint.githubRepoId).trim() === String(repo.id) && endpoint.githubhookId != null
  );

  const closeDialog = () => {
    if (confirmingConnection) return;
    setSelectedRepo(null);
    setManagementMode(false);
    setConfirmDisconnect(false);
    setActionError("");
  };

  const openConnectCard = (repo: GithubRepo) => {
    setSelectedRepo(repo);
    setSelectedEvents(["push", "pull_request", "issues"]);
    setManagementMode(false);
    setConfirmDisconnect(false);
    setActionError("");
  };

  const openManageCard = async (repo: GithubRepo) => {
    const endpoint = getEndpointForRepo(repo);
    if (!endpoint) return;
    setSelectedRepo(repo);
    setSelectedEvents(endpoint.events ?? ["push", "pull_request", "issues"]);
    setManagementMode(true);
    setConfirmDisconnect(false);
    setActionError("");
    setDeliveryError("");
    setDeliveries([]);
    setLoadingDeliveries(true);
    try {
      const data = await apiFetch(`/webhook/api/endpoint/${endpoint.id}/github/deliveries`, { method: "GET" });
      const list: GithubDelivery[] = Array.isArray(data) ? data : Array.isArray(data?.deliveries) ? data.deliveries : [];
      setDeliveries(list.map((delivery) => {
        const statusCode = delivery.status_code ?? delivery.statusCode ?? delivery.responseStatus ?? delivery.response?.statusCode;
        return {
          id: delivery.id ?? delivery.deliveryId,
          event: delivery.event || delivery.type || delivery.name || "Unknown event",
          status: statusCode ?? delivery.status ?? "—",
          // GitHub reports duration in seconds; alternate API fields use milliseconds.
          durationMs: delivery.durationMs ?? delivery.response?.durationMs ?? (delivery.duration == null ? null : delivery.duration * 1000),
          createdAt: delivery.delivered_at ?? delivery.createdAt ?? delivery.created_at ?? delivery.timestamp ?? null,
          success: statusCode != null ? statusCode >= 200 && statusCode < 400 : ["ok", "success"].includes(delivery.status?.toLowerCase() ?? "") || Boolean(delivery.success ?? delivery.succeeded ?? delivery.ok ?? delivery.response?.ok),
        };
      }));
    } catch (err) {
      setDeliveryError(err instanceof Error ? err.message : "Unable to load recent deliveries.");
    } finally {
      setLoadingDeliveries(false);
    }
  };

  const toggleEvent = (eventName: string) => setSelectedEvents((current) => current.includes(eventName) ? current.filter((event) => event !== eventName) : [...current, eventName]);

  const handleConnect = async () => {
    if (confirmingConnection || !selectedRepo?.full_name || !workspaceId || selectedEvents.length === 0) return;
    const [owner, name] = selectedRepo.full_name.split("/");
    if (!owner || !name) return;
    try {
      setConfirmingConnection(true);
      setActionError("");
      await apiFetch("/webhook/api/endpoint", {
        method: "POST",
        body: JSON.stringify({ githubRepo: selectedRepo.full_name, owner, name, githubRepoId: String(selectedRepo.id), workspaceId, events: selectedEvents }),
      });
      setSelectedRepo(null);
      await fetchGithubRepos();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to connect repository. Please try again.");
    } finally {
      setConfirmingConnection(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirmingConnection || !selectedRepo) return;
    const endpoint = getEndpointForRepo(selectedRepo);
    if (!endpoint) return;
    try {
      setConfirmingConnection(true);
      setActionError("");
      const result = await apiFetch("/webhook/api/endpoint", {
        method: "DELETE", body: JSON.stringify({ endpointId: endpoint.id, repo: selectedRepo.full_name, message: "disconnect" }),
      });
      if (result.error) throw new Error(result.error);
      setSelectedRepo(null);
      setManagementMode(false);
      setConfirmDisconnect(false);
      await fetchGithubRepos();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to disconnect repository. Please try again.");
    } finally {
      setConfirmingConnection(false);
    }
  };

  const handleSave = async () => {
    if (confirmingConnection || !selectedRepo || selectedEvents.length === 0) return;
    const endpoint = getEndpointForRepo(selectedRepo);
    if (!endpoint) return;
    try {
      setConfirmingConnection(true);
      setActionError("");
      await apiFetch("/webhook/api/endpoint", {
        method: "PATCH", body: JSON.stringify({ repo: selectedRepo.full_name, githubRepoId: String(selectedRepo.id), events: selectedEvents, endpointId: endpoint.id }),
      });
      setSelectedRepo(null);
      setManagementMode(false);
      await fetchGithubRepos();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to save webhook events. Please try again.");
    } finally {
      setConfirmingConnection(false);
    }
  };

  const formatUpdated = (dateStr: string) => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const formatDuration = (ms: number | null) => ms == null ? "—" : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
  const formatDeliveryTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader breadcrumbs={[{ label: "Workspaces", href: "/workspace" }, { label: workspaceName, href: `/workspace/${workspaceId}` }, { label: "GitHub" }]} />
        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl"><FolderGit2 className="h-6 w-6 shrink-0 text-secondary-foreground" /> GitHub repositories</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Connect a repository to receive its GitHub events in this workspace.</p>
            </div>
            <Link href={`/workspace/${workspaceId}`} className={buttonVariants({ variant: "secondary", className: "shrink-0" })}><Link2 className="h-4 w-4" /> View endpoints</Link>
          </div>

          {loading && <div role="status" className="flex flex-col items-center rounded-xl border-2 border-border-default bg-surface shadow-panel px-5 py-16"><Loader2 className="mb-3 h-6 w-6 animate-spin text-secondary-foreground" /><p className="text-sm text-muted-foreground">Loading repositories…</p></div>}
          {!loading && error && (
            <div role="alert" className="rounded-xl border border-red-400/20 bg-surface p-5 sm:p-6">
              <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" /><div className="min-w-0"><h2 className="text-base font-medium">Unable to load repositories</h2><p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{error}</p></div></div>
              <div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" onClick={async () => { setLoading(true); await fetchGithubRepos(); }}>Try again</Button><Link href="/profile" className={buttonVariants({ variant: "outline" })}>Account settings</Link></div>
            </div>
          )}
          {!loading && !error && repos.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border-default bg-surface px-5 py-16 text-center"><FolderGit2 className="mb-4 h-8 w-8 text-muted-foreground" /><h2 className="text-lg font-medium">No repositories found</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Repositories available to your connected GitHub account will appear here.</p><Button variant="secondary" className="mt-5" onClick={async () => { setLoading(true); await fetchGithubRepos(); }}>Refresh repositories</Button></div>
          )}
          {!loading && !error && repos.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {repos.map((repo) => {
                const repoName = repo.full_name || repo.name || "Unnamed repository";
                const connected = Boolean(getEndpointForRepo(repo));
                return (
                  <article key={repo.id ?? repoName} className="flex min-w-0 flex-col rounded-xl border-2 border-border-default bg-surface shadow-panel p-4 transition-colors hover:border-border-strong sm:p-5">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <h2 className="min-w-0 flex-1 text-base font-medium [overflow-wrap:anywhere]">{repo.html_url ? <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-foreground transition-colors hover:text-foreground">{repoName}<ExternalLink className="ml-2 inline h-3.5 w-3.5 text-muted-foreground" /><span className="sr-only"> (opens in a new tab)</span></a> : repoName}</h2>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border-default bg-surface-raised px-2 py-1 text-xs text-secondary-foreground">{repo.private ? <Lock className="h-3 w-3" /> : <Globe2 className="h-3 w-3" />}{repo.private ? "Private" : "Public"}</span>
                    </div>
                    <p className="mb-4 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{repo.description || "No description provided."}</p>
                    <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      {repo.language && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-zinc-300" />{repo.language}</span>}
                      {typeof repo.stargazers_count === "number" && <span className="flex items-center gap-1.5" aria-label={`${repo.stargazers_count} stars`}><Star className="h-3.5 w-3.5" />{repo.stargazers_count}</span>}
                      {typeof repo.forks_count === "number" && <span className="flex items-center gap-1.5" aria-label={`${repo.forks_count} forks`}><GitFork className="h-3.5 w-3.5" />{repo.forks_count}</span>}
                      {repo.default_branch && <span className="flex min-w-0 items-center gap-1.5"><GitBranch className="h-3.5 w-3.5 shrink-0" /><span className="break-all">{repo.default_branch}</span></span>}
                      {repo.updated_at && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Updated {formatUpdated(repo.updated_at)}</span>}
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border-subtle pt-4">
                      {connected ? <><span className="inline-flex items-center gap-1.5 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Connected</span><Button variant="secondary" className="ml-auto" onClick={async () => { await openManageCard(repo); }}><Settings className="h-4 w-4" /> Manage</Button></> : <Button variant="primary" onClick={() => openConnectCard(repo)} disabled={!repo.full_name || repo.id == null} className="w-fit self-start"><Link2 className="h-4 w-4" /> Connect repository</Button>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>

        <Dialog open={selectedRepo !== null} onClose={closeDialog} title={confirmDisconnect ? "Disconnect repository?" : managementMode ? "Manage GitHub webhook" : "Connect repository"} description={selectedRepo?.full_name || selectedRepo?.name} className="max-w-2xl">
          {selectedRepo && (confirmDisconnect ? (
            <div className="space-y-5">
              <p className="text-sm leading-6 text-muted-foreground">This will stop new GitHub events from being delivered to this webhook.</p>
              {actionError && <p role="alert" className="break-words rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{actionError}</p>}
              <div className="flex flex-wrap items-center justify-end gap-2"><Button variant="secondary" onClick={() => { setConfirmDisconnect(false); setActionError(""); }} disabled={confirmingConnection}>Keep connection</Button><Button variant="destructive" onClick={handleDisconnect} disabled={confirmingConnection}>{confirmingConnection ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}{confirmingConnection ? "Disconnecting…" : "Disconnect"}</Button></div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={async (event) => { event.preventDefault(); if (managementMode) await handleSave(); else await handleConnect(); }}>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 rounded-lg border border-border-default bg-surface-raised p-4 text-sm">
                <dt className="text-muted-foreground">Owner</dt><dd className="break-words text-right [overflow-wrap:anywhere]">{selectedRepo.full_name?.split("/")[0] || "—"}</dd>
                <dt className="text-muted-foreground">Repository</dt><dd className="break-words text-right [overflow-wrap:anywhere]">{selectedRepo.name || selectedRepo.full_name?.split("/")[1]}</dd>
                <dt className="text-muted-foreground">Visibility</dt><dd className="text-right">{selectedRepo.private ? "Private" : "Public"}</dd>
                <dt className="text-muted-foreground">Workspace</dt><dd className="break-words text-right [overflow-wrap:anywhere]">{workspaceName}</dd>
              </dl>

              {managementMode && <section aria-labelledby="deliveries-title" className="rounded-lg border border-border-default bg-surface-raised p-4">
                <h3 id="deliveries-title" className="mb-3 text-sm font-medium">Recent deliveries</h3>
                {loadingDeliveries ? <p role="status" className="flex items-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading deliveries…</p> : deliveryError ? <p role="alert" className="break-words text-sm text-red-300">{deliveryError}</p> : deliveries.length === 0 ? <p className="text-sm text-muted-foreground">No deliveries yet.</p> : <div className="max-h-52 space-y-3 overflow-y-auto pr-1">
                  {deliveries.map((delivery, index) => <div key={delivery.id ?? index} className="flex flex-col gap-2 border-t border-border-subtle pt-3 first:border-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">{delivery.success ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Successful delivery" /> : <XCircle className="h-4 w-4 shrink-0 text-red-400" aria-label="Failed delivery" />}<span className="break-words text-sm [overflow-wrap:anywhere]">{delivery.event}</span></div>
                    <dl className="flex flex-wrap gap-x-3 gap-y-1 pl-6 text-xs text-muted-foreground sm:shrink-0 sm:pl-0"><div><dt className="sr-only">Status</dt><dd>{delivery.status}</dd></div><div><dt className="sr-only">Duration</dt><dd>{formatDuration(delivery.durationMs)}</dd></div><div><dt className="sr-only">Delivered</dt><dd>{formatDeliveryTime(delivery.createdAt)}</dd></div></dl>
                  </div>)}
                </div>}
              </section>}

              <fieldset disabled={confirmingConnection}>
                <legend className="text-sm font-medium">Webhook events</legend><p className="mb-3 mt-1 text-sm leading-6 text-muted-foreground">Choose at least one event to send to this endpoint.</p>
                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                  {GITHUB_WEBHOOK_EVENTS.map((eventName) => <label key={eventName} className={`flex min-h-11 min-w-0 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${selectedEvents.includes(eventName) ? "border-border-strong bg-surface-raised text-foreground" : "border-border-default bg-surface-raised text-secondary-foreground hover:border-border-strong"}`}><input type="checkbox" checked={selectedEvents.includes(eventName)} onChange={() => toggleEvent(eventName)} className="h-4 w-4 shrink-0 accent-white" /><span className="break-words [overflow-wrap:anywhere]">{eventName}</span></label>)}
                </div>
              </fieldset>
              {actionError && <p role="alert" className="break-words rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{actionError}</p>}
              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle pt-5">
                {managementMode && <Button type="button" variant="destructive" className="sm:mr-auto" onClick={() => { setActionError(""); setConfirmDisconnect(true); }} disabled={confirmingConnection}><Unplug className="h-4 w-4" /> Disconnect</Button>}
                <Button type="button" variant="secondary" onClick={closeDialog} disabled={confirmingConnection}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={selectedEvents.length === 0 || confirmingConnection}>{confirmingConnection && <Loader2 className="h-4 w-4 animate-spin" />}{confirmingConnection ? managementMode ? "Saving…" : "Connecting…" : managementMode ? "Save changes" : "Connect repository"}</Button>
              </div>
            </form>
          ))}
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
