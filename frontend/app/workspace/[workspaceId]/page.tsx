'use client'

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Endpoint {
  id: string;
  name: string;
  token: string;
  workspaceId: string;
  createdAt: string;
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEndpointName, setNewEndpointName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/webhook/api/workspaces/endpoints/${workspaceId}`, { method: 'GET' });
      setEndpoints(data);
      setError(null);
    } catch (err) {
      setError("Failed to load endpoints");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchEndpoints();
  }, [workspaceId]);

  const handleCreateEndpoint = async () => {
    if (!newEndpointName.trim()) return;
    try {
      setCreating(true);
      await apiFetch('/webhook/api/endpoint', {
        method: 'POST',
        body: JSON.stringify({ name: newEndpointName.trim(), workspaceId }),
      });
      setNewEndpointName("");
      setShowCreateModal(false);
      await fetchEndpoints();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      console.error("Failed to copy");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getWebhookUrl = (token: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/webhook/api/h/${token}`;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/workspace" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                </div>
                <span className="text-lg font-semibold tracking-tight group-hover:text-violet-200 transition-colors">WebhookLab</span>
              </Link>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 cursor-pointer active:scale-[0.97]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Endpoint
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-zinc-600 mb-6">
          <Link href="/workspace" className="hover:text-zinc-400 transition-colors">Workspaces</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-zinc-400 font-mono text-xs">{workspaceId}</span>
        </div>

        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Endpoints
          </h1>
          <p className="mt-2 text-zinc-500 text-sm">
            Create webhook endpoints and monitor incoming requests in real-time.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 w-40 bg-zinc-800 rounded mb-2" />
                    <div className="h-3 w-64 bg-zinc-800/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <p className="text-zinc-400 mb-4">{error}</p>
            <button
              onClick={fetchEndpoints}
              className="px-4 py-2 text-sm bg-white/[0.06] hover:bg-white/[0.1] rounded-lg transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && endpoints.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-400/10 border border-white/[0.06] flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-300 mb-2">No endpoints yet</h2>
            <p className="text-zinc-600 text-sm mb-6 max-w-sm text-center">
              Create your first endpoint to get a unique URL for receiving webhook requests.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-violet-500/20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Endpoint
            </button>
          </div>
        )}

        {/* Endpoints List */}
        {!loading && !error && endpoints.length > 0 && (
          <div className="space-y-3">
            {endpoints.map((ep, index) => (
              <div
                key={ep.id}
                className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Endpoint Icon */}
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-400/10 border border-white/[0.06] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-white">{ep.name}</h3>
                        <p className="text-xs text-zinc-600 mt-0.5">{formatDate(ep.createdAt)}</p>
                      </div>
                    </div>

                    <Link
                      href={`/workspace/${workspaceId}/endpoint/${ep.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/[0.06] hover:border-white/[0.1]"
                    >
                      View Requests
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  </div>

                  {/* Webhook URL */}
                  <div className="mt-4 flex items-center gap-2 bg-black/30 rounded-lg border border-white/[0.04] px-3 py-2">
                    <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      URL
                    </span>
                    <code className="text-xs text-zinc-400 font-mono flex-1 truncate">
                      {getWebhookUrl(ep.token)}
                    </code>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        copyToClipboard(getWebhookUrl(ep.token), ep.id);
                      }}
                      className="shrink-0 p-1.5 rounded-md hover:bg-white/[0.06] transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedId === ep.id ? (
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-zinc-600 hover:text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Endpoint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/[0.08] bg-zinc-950/95 backdrop-blur-xl shadow-2xl p-6 animate-[modalIn_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Create Endpoint</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="endpoint-name" className="block text-sm font-medium text-zinc-400 mb-2">
                  Endpoint Name
                </label>
                <input
                  id="endpoint-name"
                  type="text"
                  value={newEndpointName}
                  onChange={(e) => setNewEndpointName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateEndpoint()}
                  placeholder="e.g. Stripe Payments"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-zinc-600 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEndpoint}
                  disabled={creating || !newEndpointName.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20 cursor-pointer"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
