'use client'

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

interface WebhookRequest {
  id: string;
  endpointId: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  receivedAt: string;
}

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  PATCH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border-red-500/20',
  HEAD: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  OPTIONS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export default function EndpointDetailPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const endpointId = params.endpointId as string;

  const [requests, setRequests] = useState<WebhookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('body');
  const [targetUrl, setTargetUrl] = useState('');
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<string | null>(null);
  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/webhook/api/endpoint/${endpointId}/stream?`
    );

    eventSource.onmessage = (event) => {
      const newRequest = JSON.parse(event.data);
      setRequests((prev) => [newRequest, ...prev]);
    };

    return () => eventSource.close();
  }, [endpointId]);
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/webhook/api/endpoint/request/${endpointId}`, { method: 'GET' });
      setRequests(data);
      if (data.length > 0 && !selectedRequest) {
        setSelectedRequest(data[0]);
      }
      setError(null);
    } catch (err) {
      setError("Failed to load requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (endpointId) fetchRequests();
  }, [endpointId]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };
  const replayfetch = async () => {
    if (!selectedRequest || !targetUrl.trim()) return;
    try {
      setReplaying(true);
      setReplayResult(null);
      const res = await apiFetch(`/webhook/api/request/${selectedRequest.id}/replay`, {
        method: 'POST',
        body: JSON.stringify({ targetUrl: targetUrl.trim() }),
      });
      setReplayResult('Replayed successfully');
    } catch (err) {
      setReplayResult('Replay failed');
      console.error(err);
    } finally {
      setReplaying(false);
    }
  };
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#09090b] text-white relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/8 blur-[100px]" />
        </div>

        {/* Header */}
        <header className="relative z-10 border-b border-white/[0.06]">
          <div className="max-w-full mx-auto px-6 lg:px-8">
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


            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="relative z-10">
          {/* Breadcrumb */}
          <div className="max-w-full mx-auto px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Link href="/workspace" className="hover:text-zinc-400 transition-colors">Workspaces</Link>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <Link href={`/workspace/${workspaceId}`} className="hover:text-zinc-400 transition-colors font-mono text-xs">{workspaceId}</Link>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-zinc-400 font-mono text-xs">{endpointId}</span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <svg className="w-8 h-8 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-zinc-500 text-sm">Loading requests...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <p className="text-zinc-400 mb-4">{error}</p>
              <button
                onClick={fetchRequests}
                className="px-4 py-2 text-sm bg-white/[0.06] hover:bg-white/[0.1] rounded-lg transition-colors cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-400/10 border border-white/[0.06] flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5l16.5-4.125M12 6.75c-2.708 0-5.363.224-7.948.655C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169A47.865 47.865 0 0012 6.75z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-300 mb-2">No requests yet</h2>
              <p className="text-zinc-600 text-sm mb-6 max-w-sm text-center">
                Send a webhook to this endpoint&apos;s URL and it will appear here in real-time.
              </p>
            </div>
          )}

          {/* Split Pane: Request List + Detail */}
          {!loading && !error && requests.length > 0 && (
            <div className="flex h-[calc(100vh-140px)]">
              {/* Left Panel: Request List */}
              <div className="w-[400px] shrink-0 border-r border-white/[0.06] overflow-y-auto">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    {requests.length} Request{requests.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  {requests.map((req) => (
                    <button
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-all cursor-pointer ${selectedRequest?.id === req.id
                        ? 'bg-violet-500/[0.08] border-l-2 border-l-violet-500'
                        : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${methodColors[req.method.toUpperCase()] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                          {req.method}
                        </span>
                        <span className="text-[11px] text-zinc-600">
                          {formatTimeAgo(req.receivedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-mono truncate">{req.id}</p>
                      <p className="text-[11px] text-zinc-700 mt-1">
                        {formatDate(req.receivedAt)} at {formatTime(req.receivedAt)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Panel: Request Detail */}
              <div className="flex-1 overflow-y-auto">
                {selectedRequest ? (
                  <div className="p-6">
                    {/* Request Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${methodColors[selectedRequest.method.toUpperCase()] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                        {selectedRequest.method}
                      </span>
                      <div>
                        <p className="text-sm font-mono text-zinc-400">{selectedRequest.id}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          Received {formatDate(selectedRequest.receivedAt)} at {formatTime(selectedRequest.receivedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Replay Section */}
                    <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Replay Request</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={targetUrl}
                          onChange={(e) => { setTargetUrl(e.target.value); setReplayResult(null); }}
                          placeholder="https://your-target-url.com/webhook"
                          className="flex-1 px-3 py-2 text-sm font-mono bg-black/40 border border-white/[0.08] rounded-lg text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        />
                        <button
                          onClick={replayfetch}
                          disabled={replaying || !targetUrl.trim()}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                          {replaying ? (
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                          )}
                          {replaying ? 'Replaying…' : 'Replay'}
                        </button>
                      </div>
                      {replayResult && (
                        <p className={`mt-2 text-xs font-medium ${replayResult.includes('success') ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                          {replayResult}
                        </p>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-4 p-1 bg-white/[0.02] rounded-lg border border-white/[0.06] w-fit">
                      <button
                        onClick={() => setActiveTab('body')}
                        className={`px-4 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${activeTab === 'body'
                          ? 'bg-violet-500/20 text-violet-300 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                      >
                        Body
                      </button>
                      <button
                        onClick={() => setActiveTab('headers')}
                        className={`px-4 py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${activeTab === 'headers'
                          ? 'bg-violet-500/20 text-violet-300 shadow-sm'
                          : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                      >
                        Headers
                      </button>
                    </div>

                    {/* Content */}
                    {activeTab === 'body' && (
                      <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                          <span className="text-xs text-zinc-500 font-medium">Request Body</span>
                          <span className="text-[10px] text-zinc-700 font-mono">application/json</span>
                        </div>
                        <pre className="p-4 text-sm font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                          {selectedRequest.body
                            ? JSON.stringify(selectedRequest.body, null, 2)
                            : <span className="text-zinc-600 italic">No body</span>
                          }
                        </pre>
                      </div>
                    )}

                    {activeTab === 'headers' && (
                      <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-white/[0.06]">
                          <span className="text-xs text-zinc-500 font-medium">Request Headers</span>
                        </div>
                        <div className="divide-y divide-white/[0.04]">
                          {Object.entries(selectedRequest.headers).map(([key, value]) => (
                            <div key={key} className="px-4 py-2.5 flex gap-4">
                              <span className="text-xs font-mono text-violet-400/80 shrink-0 w-48 truncate">{key}</span>
                              <span className="text-xs font-mono text-zinc-400 truncate">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-zinc-600 text-sm">Select a request to view details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
