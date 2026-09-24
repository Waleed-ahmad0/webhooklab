"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  ChevronRight,
  Play,
  Edit3,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRightCircle,
  Search,
  Filter,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

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
  const [workspaceName, setWorkspaceName] = useState<string>('')
  const [endpointName, setendpointName] = useState<string>('')
  const [requests, setRequests] = useState<WebhookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<"headers" | "body">("body");
  // const [headerSearch, setHeaderSearch] = useState<string>("");
  // const [bodySearch, setBodySearch] = useState<string>("");
  const [bodyViewMode, setBodyViewMode] = useState<"pretty" | "raw" | "form" | "collapsible">("pretty");
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});
  const [targetUrl, setTargetUrl] = useState("");
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("POST");
  const [headersText, setHeadersText] = useState<string>("");
  const [bodyText, setBodyText] = useState<string>("");
  const [showReplayCard, setShowReplayCard] = useState<boolean>(false);
  const [replayResponseData, setReplayResponseData] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [showMethodFilter, setShowMethodFilter] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

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
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);



  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(
        `/webhook/api/endpoint/request/${endpointId}?page=${currentPage}&limit=25`,
        { method: "GET" }
      );
      setWorkspaceName(data.workspaceName)
      setendpointName(data.endpointName)
      setRequests(data.requests);
      setTotalPages(data.pagination?.totalPages || 1)
      if (data.requests.length > 0 && !selectedRequest) {
        setSelectedRequest(data.requests[0]);
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
    // keep renameValue in sync when endpointName updates
  }, [endpointId, currentPage]);

  useEffect(() => {
    setRenameValue(endpointName || "");
  }, [endpointName]);

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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const prettyBodyString = (body: any) => {
    try {
      return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    } catch (e) {
      return String(body || '');
    }
  }

  // const toggleExpandAll = (expand: boolean) => {
  //   // simple approach: clear or set a marker
  //   if (!selectedRequest) return;
  //   if (expand) {
  //     setExpandedPaths({"/": true});
  //   } else {
  //     setExpandedPaths({});
  //   }
  // }

  // Collapsible JSON viewer (simple)
  const CollapsibleJSON = ({ data, path = '/' }: { data: any; path?: string }) => {
    const isObject = data && typeof data === 'object' && !Array.isArray(data);
    const isArray = Array.isArray(data);
    const expanded = !!expandedPaths[path];
    return (
      <div className="text-[13px] font-mono text-zinc-200">
        {(isObject || isArray) ? (
          <div>
            <button
              onClick={() => setExpandedPaths(prev => ({ ...prev, [path]: !expanded }))}
              className="text-[12px] text-zinc-400 mr-2"
            >
              {expanded ? '−' : '+'}
            </button>
            <span className="text-zinc-300">{isArray ? '[ ]' : '{ }'}</span>
            {expanded && (
              <div className="pl-5 mt-2">
                {isArray ? (
                  (data as any[]).map((item, i) => (
                    <div key={i} className="mb-1">
                      <div className="inline-block text-zinc-400">[{i}]</div>
                      <CollapsibleJSON data={item} path={`${path}${i}/`} />
                    </div>
                  ))
                ) : (
                  Object.entries(data).map(([k, v]) => (
                    <div key={k} className="mb-1">
                      <div className="inline-block w-36 text-zinc-300">{k}:</div>
                      <CollapsibleJSON data={v} path={`${path}${k}/`} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <span className="text-zinc-200">{String(data)}</span>
        )}
      </div>
    )
  }

  const replayfetch = async () => {
    if (!selectedRequest || !targetUrl.trim()) return;
    try {
      setReplaying(true);
      setReplayResult(null);

      // parse headersText (lines like "Key: value") into object
      const headers: Record<string, string> = {};
      headersText.split("\n").map((l) => l.trim()).filter(Boolean).forEach((line) => {
        const idx = line.indexOf(":");
        if (idx > -1) {
          const k = line.slice(0, idx).trim();
          const v = line.slice(idx + 1).trim();
          if (k) headers[k] = v;
        }
      });

      // try parse bodyText as JSON
      let body: any = null;
      try {
        body = bodyText ? JSON.parse(bodyText) : null;
      } catch (e) {
        // if not JSON, send as raw string
        body = bodyText;
      }

      const res = await apiFetch(`/webhook/api/request/${selectedRequest.id}/replay`, {
        method: "POST",
        body: JSON.stringify({ targetUrl: targetUrl.trim(), method, headers, body }),
      });

      if (res?.networkError || res?.replayed === false) {
        setReplayResponseData(null);
        setReplayResult("Replay Failed\n\nCould not connect to the target server.");
        return;
      }

      // store detailed response for UI
      setReplayResponseData(res);
      setReplayResult(null);
    } catch (err) {
      setReplayResponseData(null);
      setReplayResult("Replay Failed\n\nCould not connect to the target server.");
      console.error(err);
    } finally {
      setReplaying(false);
    }
  };

  const renameEndpoint = async () => {
    if (!renameValue || !endpointId) return;
    try {
      setRenaming(true);
      setRenameError(null);
      const res = await apiFetch(`/webhook/api/endpoint`, {
        method: "PATCH",
        body: JSON.stringify({ endpointName: renameValue, endpointId }),
      });

      if (res?.error) {
        setRenameError(res.error || "Failed to rename");
        return;
      }

      setShowRenameModal(false);
      // refresh page to pick up new name
      router.refresh();
    } catch (err) {
      console.error(err);
      setRenameError("Failed to rename endpoint");
    } finally {
      setRenaming(false);
    }
  };

  const deleteEndpoint = async () => {
    if (!endpointId) return;
    try {
      setDeleting(true);
      console.log('deleting started')
      setDeleteError(null);
      const res = await apiFetch(`/webhook/api/endpoint`, {
        method: "DELETE",
        body: JSON.stringify({ endpointId, message:'delete', endpointName   }),
      });
      if (res?.error) {
        setDeleteError(res.error || "Failed to delete");
        return;
      }
      // navigate back to workspace page
      router.replace(`/workspace/${workspaceId}`);
    } catch (err) {
      console.error(err);
      setDeleteError("Failed to delete endpoint");
    } finally {
      setDeleting(false);
    }
  };

  // when selectedRequest changes, populate method/headers/body editors
  useEffect(() => {
    if (!selectedRequest) return;
    setMethod(selectedRequest.method || "POST");
    setHeadersText(
      Object.entries(selectedRequest.headers || {}).map(([k, v]) => `${k}: ${v}`).join("\n")
    );
    try {
      setBodyText(selectedRequest.body ? JSON.stringify(selectedRequest.body, null, 2) : "");
    } catch (e) {
      setBodyText("");
    }
    setReplayResult(null);
    setShowReplayCard(false);
    setReplayResponseData(null);
  }, [selectedRequest]);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = !debouncedSearch || req.id.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesMethod = selectedMethods.length === 0 || selectedMethods.includes(req.method.toUpperCase());
    return matchesSearch && matchesMethod;
  });

  return (
    <ProtectedRoute>
      <div className="h-screen bg-black text-white relative overflow-hidden flex flex-col selection:bg-white/20">
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
                {workspaceName}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <div className="flex items-center gap-2">
                <span className="text-zinc-200 font-mono px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.03]">
                  {endpointName}
                </span>
                <button
                  onClick={() => { setRenameValue(endpointName || ""); setShowRenameModal(true); }}
                  className="text-zinc-400 hover:text-zinc-200 p-1"
                  aria-label="Rename endpoint"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {/* delete moved into rename modal's danger zone */}
              </div>
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
                {filteredRequests.length} total
              </span>
            </div>

            <div className="px-4 py-3 border-b border-white/[0.08] bg-[#0A0A0A] flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Search requests by ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 h-8 bg-[#111] border-white/[0.08] text-[13px] text-zinc-200 placeholder:text-zinc-600 rounded"
                />
              </div>
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full h-8 flex items-center justify-between bg-[#111] border border-white/[0.08] hover:bg-white/[0.05] text-zinc-300 text-[13px]"
                  onClick={() => setShowMethodFilter(!showMethodFilter)}
                >
                  <span className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    {selectedMethods.length === 0 ? "All Methods" : `${selectedMethods.length} Selected`}
                  </span>
                </Button>

                {showMethodFilter && (
                  <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-[#111] border border-white/[0.08] rounded-md shadow-lg z-20 flex flex-col gap-1">
                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
                      <label key={method} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/[0.05] rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedMethods.includes(method)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMethods([...selectedMethods, method]);
                            } else {
                              setSelectedMethods(selectedMethods.filter(m => m !== method));
                            }
                          }}
                          className="rounded border-white/[0.2] bg-transparent text-white"
                        />
                        <span className={`text-[12px] font-mono font-bold ${methodColors[method].split(' ')[2]}`}>{method}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
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
              ) : filteredRequests.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                  <Clock className="w-6 h-6 text-zinc-500 mb-3" />
                  <p className="text-[14px] text-zinc-300">Waiting for requests...</p>
                </div>
              ) : (
                filteredRequests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-colors ${selectedRequest?.id === req.id
                      ? "bg-white/[0.06] border-l-2 border-l-white"
                      : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${methodColors[req.method.toUpperCase()] ||
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

            {/* Pagination */}
            {!loading && (
              <div className="px-3 py-3 border-t border-white/[0.08] bg-[#111] shrink-0">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))

                        }
                        disabled={currentPage === 1}
                        className={currentPage === 1 ? "opacity-40 pointer-events-none" : ""}
                      />
                    </PaginationItem>

                    {/* First page */}
                    <PaginationItem>
                      <PaginationLink
                        isActive={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>

                    {/* Ellipsis after first */}
                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Pages around current */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page !== 1 &&
                          page !== totalPages &&
                          Math.abs(page - currentPage) <= 1
                      )
                      .map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                    {/* Ellipsis before last */}
                    {currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Last page */}
                    {totalPages > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          isActive={currentPage === totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? "opacity-40 pointer-events-none" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>

          {/* Right Panel: Request Detail */}
          <div className="flex-1 flex flex-col bg-black overflow-hidden">
            {selectedRequest ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded text-[12px] font-bold uppercase tracking-wider border ${methodColors[selectedRequest.method.toUpperCase()] ||
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

                {!showReplayCard ? (
                  <div className="mb-4">
                    <Button
                      variant="secondary"
                      onClick={() => setShowReplayCard(true)}
                      className="h-9 px-3"
                    >
                      <Play className="w-3.5 h-3.5 mr-2" />
                      Replay
                    </Button>
                  </div>
                ) : (
                  <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      onClick={() => setShowReplayCard(false)}
                    />
                    <div
                      className="relative w-[1100px] max-w-[95%] mx-4 bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <ArrowRightCircle className="w-4 h-4 text-zinc-400" />
                          <h3 className="text-[14px] font-medium text-zinc-200">Replay Request</h3>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setShowReplayCard(false)}>
                          Close
                        </Button>
                      </div>

                      <div className="flex gap-2 items-center mb-3">
                        <select
                          value={method}
                          onChange={(e) => setMethod(e.target.value)}
                          className="bg-[#111] border border-white/[0.08] text-[13px] text-zinc-200 h-9 px-2 rounded w-28"
                        >
                          {[
                            "GET",
                            "POST",
                            "PUT",
                            "PATCH",
                            "DELETE",
                            "HEAD",
                            "OPTIONS",
                          ].map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>

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
                          Send Replay
                        </Button>
                      </div>

                      <div className="mb-3 grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[13px] text-zinc-300 font-medium mb-2">Headers</div>
                          <textarea
                            value={headersText}
                            onChange={(e) => { setHeadersText(e.target.value); setReplayResult(null); }}
                            rows={14}
                            className="w-full bg-[#0B0B0B] border border-white/[0.06] rounded p-3 text-[13px] font-mono text-zinc-200 resize-none"
                            placeholder="Content-Type: application/json\nX-Custom-Header: abc"
                          />
                        </div>

                        <div>
                          <div className="text-[13px] text-zinc-300 font-medium mb-2">Body</div>
                          <textarea
                            value={bodyText}
                            onChange={(e) => { setBodyText(e.target.value); setReplayResult(null); }}
                            rows={14}
                            className="w-full bg-[#0B0B0B] border border-white/[0.06] rounded p-3 text-[13px] font-mono text-zinc-200 resize-none"
                          />
                        </div>
                      </div>

                      {replayResponseData ? (
                        <div className="mt-4 border-t border-white/[0.06] pt-4">
                          <h4 className="text-[14px] font-medium text-zinc-200 mb-2">Replay Result</h4>
                          <div className="text-[13px] text-zinc-300 mb-2 grid grid-cols-2 gap-4">
                            <div><span className="text-zinc-400">Status</span><div className="font-mono">{replayResponseData.status} {replayResponseData.statusText}</div></div>
                            <div><span className="text-zinc-400">Duration</span><div className="font-mono">{replayResponseData.duration}ms</div></div>
                          </div>

                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-[13px] text-zinc-300 font-medium">Response Headers</div>
                              <button onClick={() => copyToClipboard(JSON.stringify(replayResponseData.responseHeaders || {}, null, 2))} className="text-[12px] text-zinc-300 bg-white/[0.03] px-2 py-1 rounded">Copy</button>
                            </div>
                            <div className="bg-[#070707] border border-white/[0.03] rounded p-2 text-[13px] font-mono text-zinc-200">
                              {Object.entries(replayResponseData.responseHeaders || {}).map(([k, v]) => (
                                <div key={k} className="flex items-center justify-between gap-4 py-0.5">
                                  <div className="text-zinc-400 w-56 truncate">{k as string}</div>
                                  <div className="flex-1 text-zinc-200 truncate">{v as string}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-[13px] text-zinc-300 font-medium">Response Body</div>
                              <div className="flex items-center gap-2">
                                <select value={bodyViewMode} onChange={(e) => setBodyViewMode(e.target.value as any)} className="bg-[#111] border border-white/[0.06] text-[13px] rounded px-2 py-1">
                                  <option value="pretty">Pretty</option>
                                  <option value="raw">Raw</option>
                                  <option value="collapsible">Collapsible</option>
                                </select>
                                <button onClick={() => copyToClipboard(JSON.stringify(replayResponseData.responseBody, null, 2))} className="text-[12px] text-zinc-300 bg-white/[0.03] px-2 py-1 rounded">Copy</button>
                              </div>
                            </div>

                            <div className="bg-[#070707] border border-white/[0.03] rounded p-3 text-[13px] font-mono text-zinc-200 max-h-[40vh] overflow-auto">
                              {bodyViewMode === 'collapsible' ? (
                                <CollapsibleJSON data={replayResponseData.responseBody} />
                              ) : bodyViewMode === 'raw' ? (
                                <pre className="whitespace-pre-wrap">{typeof replayResponseData.responseBody === 'string' ? replayResponseData.responseBody : JSON.stringify(replayResponseData.responseBody)}</pre>
                              ) : (
                                <pre className="whitespace-pre-wrap">{prettyBodyString(replayResponseData.responseBody)}</pre>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : replayResult ? (
                        <p
                          className={`mt-2 text-[13px] font-medium whitespace-pre-line ${replayResult.includes("success")
                            ? "text-green-400"
                            : "text-red-400"
                            }`}
                        >
                          {replayResult}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-1 mb-4 p-1 bg-white/[0.03] border border-white/[0.08] rounded w-fit">
                  <button
                    onClick={() => setActiveTab("body")}
                    className={`px-3.5 py-1.5 text-[13px] font-medium rounded transition-colors ${activeTab === "body"
                      ? "bg-white/[0.1] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                      }`}
                  >
                    Body
                  </button>
                  <button
                    onClick={() => setActiveTab("headers")}
                    className={`px-3.5 py-1.5 text-[13px] font-medium rounded transition-colors ${activeTab === "headers"
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
        {/* Rename Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowRenameModal(false)}
            />
            <div className="relative w-[420px] bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-medium text-zinc-200">Rename Endpoint</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowRenameModal(false)}>Close</Button>
              </div>

              <div className="mb-3">
                <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="Endpoint name" />
                {renameError && <p className="text-red-400 text-[13px] mt-2">{renameError}</p>}
              </div>

              <div className="mb-4 border border-red-600/30 bg-red-600/5 p-3 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-red-400">Danger Zone</div>
                    <p className="text-[13px] text-zinc-300">Deleting this endpoint is permanent and cannot be undone.</p>
                  </div>
                  <div>
                    <Button variant="destructive" onClick={() => { setShowRenameModal(false); setShowDeleteModal(true); }} disabled={deleting}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowRenameModal(false)}>Cancel</Button>
                <Button variant="primary" onClick={renameEndpoint} disabled={renaming || !renameValue}>
                  {renaming ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Delete confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowDeleteModal(false)}
            />
            <div className="relative w-[420px] bg-[#0A0A0A] border border-white/[0.08] rounded-lg p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-medium text-zinc-200">Delete Endpoint</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>Close</Button>
              </div>

              <p className="text-zinc-300 mb-4">Are you sure you want to delete this endpoint? This action cannot be undone.</p>
              {deleteError && <p className="text-red-400 text-[13px] mb-2">{deleteError}</p>}

              <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                <Button variant="destructive" onClick={deleteEndpoint} disabled={deleting}>
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}