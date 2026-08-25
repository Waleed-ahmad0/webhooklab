'use client'

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

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

  const userId = "cmt5jcmwt0000izpdt5r2v3k0";

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/webhook/api/workspaces/${userId}`, { method: 'GET' });
      setWorkspaces(data);
      setError(null);
    } catch (err) {
      setError("Failed to load workspaces");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      setCreating(true);
      await apiFetch('/webhook/api/workspace', {
        method: 'POST',
        body: JSON.stringify({ name: newWorkspaceName.trim(), ownerId: userId }),
      });
      setNewWorkspaceName("");
      setShowCreateModal(false);
      await fetchWorkspaces();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-tight">WebhookLab</span>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 cursor-pointer active:scale-[0.97]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Workspace
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Your Workspaces
          </h1>
          <p className="mt-2 text-zinc-500 text-sm">
            Manage your webhook endpoints and monitor incoming requests.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse"
              >
                <div className="h-5 w-32 bg-zinc-800 rounded mb-4" />
                <div className="h-3 w-24 bg-zinc-800/60 rounded mb-6" />
                <div className="flex gap-3">
                  <div className="h-8 w-20 bg-zinc-800/40 rounded-lg" />
                  <div className="h-8 w-20 bg-zinc-800/40 rounded-lg" />
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
              onClick={fetchWorkspaces}
              className="px-4 py-2 text-sm bg-white/[0.06] hover:bg-white/[0.1] rounded-lg transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && workspaces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-400/10 border border-white/[0.06] flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-zinc-300 mb-2">No workspaces yet</h2>
            <p className="text-zinc-600 text-sm mb-6 max-w-sm text-center">
              Create your first workspace to start receiving and inspecting webhook requests.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all duration-200 shadow-lg shadow-violet-500/20 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Workspace
            </button>
          </div>
        )}

        {/* Workspace Grid */}
        {!loading && !error && workspaces.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workspaces.map((ws, index) => (
              <Link
                key={ws.id}
                href={`/workspace/${ws.id}`}
                className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 p-6 cursor-pointer"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative">
                  {/* Icon + Name */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-400/10 border border-white/[0.06] flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white group-hover:text-violet-200 transition-colors">
                          {ws.name}
                        </h3>
                        <p className="text-xs text-zinc-600 font-mono mt-0.5 truncate max-w-[160px]">
                          {ws.id}
                        </p>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-zinc-600">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                      </svg>
                      {formatDate(ws.createdAt)}
                    </span>
                    {ws.endpoints && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                        {ws.endpoints.length} endpoint{ws.endpoints.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}

            {/* Create New Card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="group rounded-xl border border-dashed border-white/[0.08] hover:border-violet-500/30 bg-transparent hover:bg-violet-500/[0.03] transition-all duration-300 p-6 flex flex-col items-center justify-center gap-3 min-h-[140px] cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-white/[0.04] group-hover:bg-violet-500/10 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-zinc-600 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className="text-sm text-zinc-600 group-hover:text-zinc-400 transition-colors">New Workspace</span>
            </button>
          </div>
        )}
      </main>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-white/[0.08] bg-zinc-950/95 backdrop-blur-xl shadow-2xl p-6 animate-[modalIn_0.2s_ease-out]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Create Workspace</h2>
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
                <label htmlFor="workspace-name" className="block text-sm font-medium text-zinc-400 mb-2">
                  Workspace Name
                </label>
                <input
                  id="workspace-name"
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                  placeholder="e.g. Production Hooks"
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
                  onClick={handleCreateWorkspace}
                  disabled={creating || !newWorkspaceName.trim()}
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

      {/* Modal animation keyframes */}
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