"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  ChevronRight,
  Play,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRightCircle,
} from "lucide-react";

interface WebhookRequest {
  id: string;
  endpointId: string;
  method: string;
  headers: Record<string, string>;
  body: Record<string, unknown> | null;
  receivedAt: string;
}

const methodColors: Record<string, string> = {
  GET: "border-green-500/20 bg-green-500/10 text-green-400",
  POST: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  PUT: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  PATCH: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  DELETE: "border-red-500/20 bg-red-500/10 text-red-400",
  HEAD: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
  OPTIONS: "border-purple-500/20 bg-purple-500/10 text-purple-400",
};

export default function EndpointDetailPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const endpointId = params.endpointId as string;

  const [requests, setRequests] = useState<WebhookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"headers" | "body">("body");
  const [targetUrl, setTargetUrl] = useState("");
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `/webhook/api/endpoint/${endpointId}/stream`,
      { withCredentials: true }
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
      const data = await apiFetch(
        `/webhook/api/endpoint/request/${endpointId}`,
        { method: "GET" }
      );
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
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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
      await apiFetch(`/webhook/api/request/${selectedRequest.id}/replay`, {
        method: "POST",
        body: JSON.stringify({ targetUrl: targetUrl.trim() }),
      });
      setReplayResult("Replayed successfully");
    } catch (err) {
      setReplayResult("Replay failed");
      console.error(err);
    } finally {
      setReplaying(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col selection:bg-white/20">
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

        {/* Sub-header / Breadcrumbs */}
        <div className="relative z-10 border-b border-white/[0.08] bg-[#050505]">
          <div className="max-w-full mx-auto px-6 py-3">
            <div className="flex items-center gap-2 text-[13px] text-zinc-400">
              <Link
                href="/workspace"
                className="hover:text-white transition-colors"
              >
                Workspaces
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/workspace/${workspaceId}`}
                className="hover:text-white transition-colors font-mono"
              >
                {workspaceId}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-zinc-200 font-mono px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.03]">
                {endpointId}
              </span>
            </div>
          </div>
        </div>

        {/* Main Interface */}
        <div className="relative z-10 flex-1 flex overflow-hidden">
          {/* Left Panel: Request List */}
          <div className="w-[340px] shrink-0 border-r border-white/[0.08] bg-[#0A0A0A] flex flex-col">
            <div className="px-4 py-3.5 border-b border-white/[0.08] bg-[#111] flex items-center justify-between">
              <span className="text-[13px] font-medium text-zinc-300">
                Requests
              </span>
              <span className="text-[12px] bg-white/[0.05] border border-white/[0.1] px-2 py-0.5 rounded text-zinc-300">
                {requests.length} total
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <p className="text-[13px] text-red-400 mb-2">{error}</p>
                  <Button variant="secondary" size="sm" onClick={fetchRequests}>
                    Retry
                  </Button>
                </div>
              ) : requests.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <Clock className="w-6 h-6 text-zinc-500 mb-3" />
                  <p className="text-[14px] text-zinc-300">Waiting for requests...</p>
                </div>
              ) : (
                requests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-colors ${
                      selectedRequest?.id === req.id
                        ? "bg-white/[0.06] border-l-2 border-l-white"
                        : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                          methodColors[req.method.toUpperCase()] ||
                          "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
                        }`}
                      >
                        {req.method}
                      </span>
                      <span className="text-[12px] text-zinc-400">
                        {formatTimeAgo(req.receivedAt)}
                      </span>
                    </div>
                    <p className="text-[13px] text-zinc-300 font-mono truncate mb-1">
                      {req.id}
                    </p>
                    <p className="text-[12px] text-zinc-500">
                      {formatDate(req.receivedAt)} {formatTime(req.receivedAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Panel: Request Detail */}
          <div className="flex-1 flex flex-col bg-black overflow-hidden">
            {selectedRequest ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded text-[12px] font-bold uppercase tracking-wider border ${
                        methodColors[selectedRequest.method.toUpperCase()] ||
                        "border-zinc-500/20 bg-zinc-500/10 text-zinc-300"
                      }`}
                    >
                      {selectedRequest.method}
                    </span>
                    <div>
                      <p className="text-[14px] font-mono text-white">
                        {selectedRequest.id}
                      </p>
                      <p className="text-[12px] text-zinc-400 mt-0.5">
                        {formatDate(selectedRequest.receivedAt)}{" "}
                        {formatTime(selectedRequest.receivedAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-6 bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowRightCircle className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-[14px] font-medium text-zinc-200">
                      Replay Request
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      value={targetUrl}
                      onChange={(e) => {
                        setTargetUrl(e.target.value);
                        setReplayResult(null);
                      }}
                      placeholder="https://api.example.com/webhook"
                      className="flex-1 bg-[#111] border-white/[0.08] text-[14px] h-9"
                    />
                    <Button
                      variant="primary"
                      onClick={replayfetch}
                      disabled={replaying || !targetUrl.trim()}
                      className="h-9 shrink-0"
                    >
                      {replaying ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Replay
                    </Button>
                  </div>
                  {replayResult && (
                    <p
                      className={`mt-2 text-[13px] font-medium ${
                        replayResult.includes("success")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {replayResult}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 mb-4 p-1 bg-white/[0.03] border border-white/[0.08] rounded w-fit">
                  <button
                    onClick={() => setActiveTab("body")}
                    className={`px-3.5 py-1.5 text-[13px] font-medium rounded transition-colors ${
                      activeTab === "body"
                        ? "bg-white/[0.1] text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Body
                  </button>
                  <button
                    onClick={() => setActiveTab("headers")}
                    className={`px-3.5 py-1.5 text-[13px] font-medium rounded transition-colors ${
                      activeTab === "headers"
                        ? "bg-white/[0.1] text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Headers
                  </button>
                </div>

                <div className="border border-white/[0.08] rounded-lg bg-[#0A0A0A] overflow-hidden">
                  {activeTab === "body" && (
                    <>
                      <div className="px-4 py-2.5 border-b border-white/[0.08] bg-[#111] flex justify-between items-center">
                        <span className="text-[12px] text-zinc-300 font-medium uppercase tracking-wider">
                          Payload
                        </span>
                        <span className="text-[12px] text-zinc-400 font-mono">
                          application/json
                        </span>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="text-[14px] font-mono text-zinc-200 leading-relaxed">
                          {selectedRequest.body ? (
                            JSON.stringify(selectedRequest.body, null, 2)
                          ) : (
                            <span className="text-zinc-500 italic">
                              No body content
                            </span>
                          )}
                        </pre>
                      </div>
                    </>
                  )}

                  {activeTab === "headers" && (
                    <>
                      <div className="px-4 py-2.5 border-b border-white/[0.08] bg-[#111]">
                        <span className="text-[12px] text-zinc-300 font-medium uppercase tracking-wider">
                          Request Headers
                        </span>
                      </div>
                      <div className="divide-y divide-white/[0.04]">
                        {Object.entries(selectedRequest.headers).map(
                          ([key, value]) => (
                            <div key={key} className="px-4 py-3 flex gap-4">
                              <span className="text-[13px] font-mono text-zinc-300 w-48 shrink-0 truncate">
                                {key}
                              </span>
                              <span className="text-[13px] font-mono text-zinc-100 truncate">
                                {value}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                <AlertCircle className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-[14px]">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}