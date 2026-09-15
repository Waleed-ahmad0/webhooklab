'use client';
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Loader2,
  AlertCircle,
  FolderGit2,
  Lock,
  Star,
  GitFork,
  GitBranch,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

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
  token: string;
  workspaceId: string;
  createdAt: string;
  githubRepoId?: string;
  events?: string[];
};


const GITHUB_WEBHOOK_EVENTS = [
  'push',
  'pull_request',
  'issues',
  'issue_comment',
  'pull_request_review',
  'release',
  'fork',
  'watch',
  'workflow_run',
  'discussion',
] as const;

export default function GithubIntegrationsPage() {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [workspaceEndpoints, setWorkspaceEndpoints] = useState<WorkspaceEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspaceName, setworkspaceName] = useState<string>('')
  const [selectedRepo, setSelectedRepo] = useState<GithubRepo | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['push', 'pull_request', 'issues']);
  const [confirmingConnection, setConfirmingConnection] = useState(false);
  const [managementMode, setManagementMode] = useState(false);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const pathname = usePathname();
  const workspaceId = pathname.split('/')[2] ?? '';

  const fetchWorkspaceEndpoints = useCallback(async () => {
    if (!workspaceId) return;

    try {
      const data = await apiFetch(`/webhook/api/workspaces/endpoints/${workspaceId}`, {
        method: 'GET',
      });
      setWorkspaceEndpoints((data) ? data.endpoints : []);
      setworkspaceName((data) ? data.workspaceName : '');
    } catch (err) {
      console.error('Failed to load workspace endpoints', err);
    }
  }, [workspaceId]);

  const fetchGithubRepos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch('/api/github_data', {
        method: 'GET',
      });
      const repoList = Array.isArray(data)
        ? data
        : Array.isArray(data?.repositories)
          ? data.repositories
          : [];

      setRepos(repoList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong while fetching GitHub repositories.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchGithubRepos();
    void fetchWorkspaceEndpoints();
  }, [fetchGithubRepos, fetchWorkspaceEndpoints]);



  const isRepoConnected = (repo: GithubRepo) => {
    return workspaceEndpoints.some((endpoint) =>
      endpoint.githubRepoId?.trim().toLowerCase() === String(repo.id)
    );
  };

  const getEndpointForRepo = (repo: GithubRepo) => {
    const getendpoint = workspaceEndpoints.find((endpoint) => endpoint.githubRepoId?.trim().toLowerCase() === String(repo.id));

    return getendpoint

  };

  const openConnectCard = (repo: GithubRepo) => {
    setSelectedRepo(repo);
    setSelectedEvents(['push', 'pull_request', 'issues']);
    setConfirmingConnection(false);
    setManagementMode(false);
  };
  const openManageCard = async (repo: GithubRepo) => {
    const endpoint = getEndpointForRepo(repo)
    if (!endpoint) {
      console.error('No endpoint found for the selected repository');
      return;
    }
    const getdeliveries = await apiFetch(`/webhook/api/endpoint/${endpoint.id}/github/deliveries`, { method: 'GET' });

    const list = Array.isArray(getdeliveries)
      ? getdeliveries
      : Array.isArray(getdeliveries?.deliveries)
      ? getdeliveries.deliveries
      : [];

    const mapped = list.map((d: any) => {
      const id = d.id ?? d.deliveryId;
      const event = d.event || d.type || d.name || 'unknown';

      // GitHub API: `status_code` is the numeric HTTP code, `status` is a string like "success"
      const rawStatusCode = d.status_code ?? d.statusCode ?? d.responseStatus ?? d.response?.statusCode;
      const statusNum = Number(rawStatusCode);

      const durationMs = d.duration ?? d.durationMs ?? d.response?.durationMs ?? null;
      const createdAt = d.delivered_at ?? d.createdAt ?? d.created_at ?? d.timestamp ?? null;

      // Determine success: prefer numeric HTTP status code, fall back to status string
      let success: boolean;
      if (!Number.isNaN(statusNum)) {
        success = statusNum >= 200 && statusNum < 400;
      } else if (typeof d.status === 'string') {
        const s = d.status.toLowerCase();
        success = s === 'ok' || s === 'success';
      } else {
        success = Boolean(d.success ?? d.succeeded ?? d.ok ?? d.response?.ok);
      }

      return {
        id,
        event,
        status: !Number.isNaN(statusNum) ? statusNum : rawStatusCode ?? d.status ?? '-',
        durationMs,
        createdAt,
        success,
      };
    });

    setDeliveries(mapped);

    setSelectedRepo(repo);
    const events = endpoint.events ?? ['push', 'pull_request', 'issues']; setSelectedEvents(events);
    setConfirmingConnection(false);
    setManagementMode(true);
  };

  const toggleEvent = (eventName: string) => {
    setSelectedEvents((current) =>
      current.includes(eventName)
        ? current.filter((event) => event !== eventName)
        : [...current, eventName]
    );
  };

  const autocreatehook = async () => {
    if (!selectedRepo?.full_name || !workspaceId || selectedEvents.length === 0) {
      return;
    }

    const [owner, name] = selectedRepo.full_name.split('/');

    if (!owner || !name) {
      return;
    }

    try {
      setConfirmingConnection(true);
      await apiFetch('/webhook/api/endpoint', {
        method: 'POST',
        body: JSON.stringify({
          githubRepo: selectedRepo.full_name,
          owner,
          name,
          githubRepoId: String(selectedRepo.id),
          workspaceId,
          events: selectedEvents,
        }),
      });

      setSelectedRepo(null);
      await fetchWorkspaceEndpoints();
    } catch (error) {
      console.error('Failed to create webhook', error);
    } finally {
      setConfirmingConnection(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedRepo) return;
    const endpoint = getEndpointForRepo(selectedRepo);
    if (!endpoint) {
      setSelectedRepo(null);
      setManagementMode(false);
      return;
    }

    try {
      const check = await apiFetch(`/webhook/api/endpoint`, { method: 'DELETE', body: JSON.stringify({ endpointId: endpoint.id, repo: selectedRepo?.full_name }) });
      console.log(check, 'check')
    } catch (err) {
      console.error('Failed to delete endpoint', err);
    } finally {
      setWorkspaceEndpoints((prev) => prev.filter((e) => e.id !== endpoint.id));
      setSelectedRepo(null);
      setManagementMode(false);
      void fetchWorkspaceEndpoints();
    }
  };

  const handlesave = async () => {
    // console.log('save clicked', selectedRepo, selectedEvents);
    const sendpatch = await apiFetch('/webhook/api/endpoint', {
      method: 'PATCH',
      body: JSON.stringify({
        repo: selectedRepo?.full_name,
        githubRepoId: String(selectedRepo?.id),
        events: selectedEvents,
        endpointId: getEndpointForRepo(selectedRepo as GithubRepo)?.id
      })
    })
    console.log(sendpatch, 'sendpatch')
    setSelectedRepo(null);
    setManagementMode(false);
    void fetchWorkspaceEndpoints();
  };

  const formatUpdated = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDuration = (ms: number | null) => {
    if (ms == null) return '-';
    const s = (Number(ms) / 1000);
    if (s < 1) return `${s.toFixed(2)}s`;
    return `${s.toFixed(2)}s`;
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-white/20">
      <div className="pointer-events-none fixed inset-0 grid-pattern" />

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.08] bg-black/80 backdrop-blur-md">
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center h-14">
            <Link href="/workspace" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded bg-white flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="text-base font-medium tracking-tight group-hover:text-zinc-300 transition-colors">
                WebhookLab
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-white flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-zinc-400" />
            GitHub Repositories
          </h1>
          <p className="text-[13px] text-zinc-400 mt-1.5">
            Your connected GitHub repositories, ready to wire up to a webhook endpoint.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0A0A0A] border border-white/[0.08] rounded-lg">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400 mb-3" />
            <p className="text-[13px] text-zinc-400">Loading repositories...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex items-start gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-medium text-red-400">Couldn&apos;t load repositories</p>
              <p className="text-[13px] text-red-400/70 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && repos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0A0A0A] border border-white/[0.08] rounded-lg">
            <FolderGit2 className="w-8 h-8 text-zinc-600 mb-3" />
            <p className="text-[14px] text-zinc-300">No GitHub repositories found for this account</p>
          </div>
        )}

        {!loading && !error && repos.length > 0 && (
          <div className="grid gap-3">
            {repos.map((repo) => {
              const repoName = repo.full_name || repo.name || 'Unnamed repository';
              const description = repo.description || 'No description provided.';
              const connected = isRepoConnected(repo);
              // console.log(connected, 'connected')

              return (
                <article
                  key={repo.id ?? repoName}
                  className="bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-5 hover:border-white/[0.15] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <a
                      href={repo.html_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-[15px] font-medium text-white hover:text-zinc-300 transition-colors group"
                    >
                      {repoName}
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    </a>

                    {repo.private ? (
                      <span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.05] border border-white/[0.08] text-zinc-300">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    ) : (<span className="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.05] border border-white/[0.08] text-zinc-300">
                      <Lock className="w-3 h-3" />
                      public
                    </span>)}
                  </div>

                  <p className="text-[13px] text-zinc-400 leading-relaxed mb-4">
                    {description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[12px] text-zinc-500 mb-4">
                    {repo.language && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        {repo.language}
                      </span>
                    )}
                    {typeof repo.stargazers_count === 'number' && (
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" />
                        {repo.stargazers_count}
                      </span>
                    )}
                    {typeof repo.forks_count === 'number' && (
                      <span className="flex items-center gap-1.5">
                        <GitFork className="w-3.5 h-3.5" />
                        {repo.forks_count}
                      </span>
                    )}
                    {repo.default_branch && (
                      <span className="flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" />
                        {repo.default_branch}
                      </span>
                    )}
                    {repo.updated_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Updated {formatUpdated(repo.updated_at)}
                      </span>
                    )}
                  </div>

                  {!connected && (
                    <button
                      onClick={() => {
                        if (repo.full_name) {
                          openConnectCard(repo);
                        }
                      }}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[13px] font-medium transition-all bg-white/[0.05] border border-white/[0.08] text-white hover:bg-white/[0.1] hover:border-white/[0.15]`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Connect & Create Webhook
                    </button>
                  )}

                  {connected && (
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-[13px] font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        <Zap className="w-3.5 h-3.5" />
                        Connected
                      </span>
                      <button
                        onClick={() => openManageCard(repo)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-[13px] font-medium bg-white/[0.03] border border-white/[0.08] text-white hover:bg-white/[0.06]"
                      >
                        Manage
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      {selectedRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setSelectedRepo(null); setManagementMode(false); }}
          />
          <div className="relative w-full max-w-xl rounded-xl border border-white/[0.08] bg-[#0A0A0A] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 mb-2">
                  GitHub webhook
                </p>
                <h2 className="text-xl font-semibold text-white">{selectedRepo.full_name || selectedRepo.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedRepo(null); setManagementMode(false); }}
                className="rounded border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[12px] text-zinc-300 hover:bg-white/[0.06]"
              >
                Cancel
              </button>
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-[#111111] p-4 mb-5">
              <p className="text-[13px] text-zinc-400 mb-2">Repository details</p>
              <div className="space-y-2 text-[13px] text-zinc-300">
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Owner</span>
                  <span className="font-medium text-white">
                    {selectedRepo.full_name?.split('/')[0] || selectedRepo.name}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Name</span>
                  <span className="font-medium text-white">{selectedRepo.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Visibility</span>
                  <span className="font-medium text-white">
                    {selectedRepo.private ? 'Private' : 'Public'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-zinc-500">Workspace</span>
                  <span className="font-medium text-white">{workspaceName}</span>
                </div>
              </div>
            </div>

            {managementMode && deliveries.length > 0 && (
              <div className="rounded-lg border border-white/[0.08] bg-[#0F0F0F] p-3 mb-5 max-h-44 overflow-y-auto text-[13px] text-zinc-300">
                <p className="text-[13px] text-zinc-400 mb-2">Recent Deliveries</p>
                <div className="space-y-1">
                  {deliveries.map((d) => (
                    <div key={d.id ?? `${d.event}-${d.createdAt}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={d.success ? 'text-emerald-400 w-4' : 'text-red-400 w-4'}>
                          {d.success ? '✓' : '✗'}
                        </span>
                        <span className="w-40 truncate font-medium text-white">{d.event}</span>
                      </div>

                      <div className="flex items-center gap-4 text-zinc-400">
                        <span className="w-12 text-right">{d.status}</span>
                        <span className="w-14 text-right">{formatDuration(d.durationMs)}</span>
                        <span className="w-28 text-right text-zinc-500">{formatTimeAgo(d.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="text-[13px] text-zinc-400 mb-3">Choose the GitHub events to send to this webhook</p>
              <div className="grid grid-cols-2 gap-2">
                {GITHUB_WEBHOOK_EVENTS.map((eventName) => (
                  <label
                    key={eventName}
                    className="flex cursor-pointer items-center gap-2 rounded border border-white/[0.08] bg-[#111111] px-3 py-2 text-[13px] text-zinc-200 transition hover:border-white/[0.16]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(eventName)}
                      onChange={() => toggleEvent(eventName)}
                      className="h-4 w-4 accent-white"
                    />
                    <span>{eventName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              {managementMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleDisconnect()}
                    className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] font-medium text-red-400 hover:bg-red-500/20"
                  >
                    Disconnect
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedRepo(null); setManagementMode(false); }}
                    className="rounded border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={(e) => handlesave()}
                    className="rounded bg-white px-3 py-2 text-[13px] font-medium text-black transition hover:bg-zinc-200"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedRepo(null)}
                    className="rounded border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] font-medium text-zinc-300 hover:bg-white/[0.06]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedEvents.length > 0) {
                        void autocreatehook();
                      }
                    }}
                    disabled={selectedEvents.length === 0 || confirmingConnection}
                    className="rounded bg-white px-3 py-2 text-[13px] font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {confirmingConnection ? 'Connecting...' : 'Confirm Connect'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}