"use client";

import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertCircle, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Copy, Edit3, Filter, Inbox, Loader2, Menu, Play, Search, Settings, Trash2 } from "lucide-react";

interface WebhookRequest {
  id: string;
  endpointId: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  receivedAt: string;
}

interface ReplayResponse {
  status: number;
  statusText?: string;
  duration: number;
  responseHeaders?: Record<string, unknown>;
  responseBody?: unknown;
}

type BodyViewMode = "pretty" | "raw" | "collapsible";
const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const editorClassName = "w-full min-w-0 rounded-lg border-2 border-border-default bg-surface-raised p-3 font-mono text-base leading-6 text-foreground placeholder:text-muted-foreground sm:text-sm focus-visible:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-60";
const selectClassName = "h-10 min-w-0 rounded-lg border-2 border-border-default bg-surface-raised px-3 text-base text-foreground sm:text-sm focus-visible:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20";

function bodyString(body: unknown, pretty = true) {
  if (body === undefined || body === null) return "";
  return typeof body === "string" ? body : JSON.stringify(body, null, pretty ? 2 : undefined);
}

function MethodBadge({ method }: { method: string }) {
  return <span className="inline-flex shrink-0 rounded-md border border-border-default bg-surface-raised px-2 py-1 font-mono text-xs font-semibold text-secondary-foreground">{method}</span>;
}

function HeaderList({ headers }: { headers: Record<string, unknown> }) {
  const entries = Object.entries(headers);
  if (!entries.length) return <p className="p-4 text-sm text-muted-foreground">No headers returned.</p>;
  return (
    <dl className="divide-y divide-border-subtle">
      {entries.map(([key, value]) => (
        <div key={key} className="grid min-w-0 gap-1 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] sm:gap-4">
          <dt className="min-w-0 break-words font-mono text-xs leading-6 text-muted-foreground [overflow-wrap:anywhere]">{key}</dt>
          <dd className="min-w-0 break-words font-mono text-sm leading-6 text-foreground [overflow-wrap:anywhere]">{typeof value === "string" ? value : JSON.stringify(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function CollapsibleJSON({ data, depth = 0 }: { data: unknown; depth?: number }) {
  if (data === null || typeof data !== "object") return <span className="break-words text-foreground [overflow-wrap:anywhere]">{JSON.stringify(data) ?? "null"}</span>;
  const entries = Object.entries(data);
  return (
    <details open={depth === 0} className="min-w-0">
      <summary className="w-fit cursor-pointer rounded py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
        {Array.isArray(data) ? "Array" : "Object"} <span className="text-muted-foreground">({entries.length} {entries.length === 1 ? "item" : "items"})</span>
      </summary>
      <div className="ml-1 space-y-2 border-l border-border-subtle pl-3 sm:ml-2 sm:pl-4">
        {entries.map(([key, value]) => <div key={key} className="min-w-0"><span className="break-words text-secondary-foreground [overflow-wrap:anywhere]">{Array.isArray(data) ? `[${key}]` : `${key}:`} </span><CollapsibleJSON data={value} depth={depth + 1} /></div>)}
      </div>
    </details>
  );
}

export default function EndpointDetailPage() {
  const { workspaceId, endpointId } = useParams<{ workspaceId: string; endpointId: string }>();
  const router = useRouter();
  const receivedRequestIds = useRef(new Set<string>());
  const [workspaceName, setWorkspaceName] = useState("");
  const [endpointName, setEndpointName] = useState("");
  const [requests, setRequests] = useState<WebhookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<WebhookRequest | null>(null);
  const [activeTab, setActiveTab] = useState<"headers" | "body">("body");
  const [bodyViewMode, setBodyViewMode] = useState<BodyViewMode>("pretty");
  const [targetUrl, setTargetUrl] = useState("");
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<string | null>(null);
  const [method, setMethod] = useState("POST");
  const [headersText, setHeadersText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [showReplayCard, setShowReplayCard] = useState(false);
  const [replayResponseData, setReplayResponseData] = useState<ReplayResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalRequests / 25));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [showMethodFilter, setShowMethodFilter] = useState(false);
  const [showRequestDrawer, setShowRequestDrawer] = useState(false);
  const [settingsView, setSettingsView] = useState<"menu" | "rename" | "delete" | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await apiFetch(`/webhook/api/endpoint/request/${endpointId}?page=${currentPage}&limit=25`, { method: "GET" });
      setWorkspaceName(data.workspaceName);
      setEndpointName(data.endpointName);
      setRequests(data.requests);
      setTotalRequests(data.pagination?.total ?? data.requests.length);
      receivedRequestIds.current = new Set(data.requests.map((request: WebhookRequest) => request.id));
      setSelectedRequest((previous) => data.requests.find((request: WebhookRequest) => request.id === previous?.id) || data.requests[0] || null);
      setError(null);
    } catch (err) {
      setError("We couldn’t load the requests. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [endpointId, currentPage]);

  useEffect(() => {
    const loadRequests = async () => {
      if (endpointId) await fetchRequests();
    };
    loadRequests();
  }, [endpointId, fetchRequests]);

  useEffect(() => {
    const eventSource = new EventSource(`/webhook/api/endpoint/${endpointId}/stream`, { withCredentials: true });
    eventSource.onmessage = (event) => {
      try {
        const newRequest: WebhookRequest = JSON.parse(event.data);
        if (receivedRequestIds.current.has(newRequest.id)) return;
        receivedRequestIds.current.add(newRequest.id);
        setTotalRequests((previous) => previous + 1);
        if (currentPage === 1) {
          setRequests((previous) => [newRequest, ...previous.filter((request) => request.id !== newRequest.id)].slice(0, 25));
          setSelectedRequest((previous) => previous || newRequest);
        }
      } catch (err) { console.error("Could not read the incoming request", err); }
    };
    return () => eventSource.close();
  }, [endpointId, currentPage]);

  useEffect(() => {
    if (!copyStatus) return;
    const timeout = setTimeout(() => setCopyStatus(null), 3000);
    return () => clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    if (!showRequestDrawer) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeDrawerOnDesktop = () => { if (desktop.matches) setShowRequestDrawer(false); };
    desktop.addEventListener("change", closeDrawerOnDesktop);
    return () => desktop.removeEventListener("change", closeDrawerOnDesktop);
  }, [showRequestDrawer]);

  const formatTime = (date: string) => new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const copyToClipboard = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); setCopyStatus(`${label} copied.`); }
    catch { setCopyStatus("Copy failed. Select the text and copy it manually."); }
  };
  const openReplay = () => {
    if (!selectedRequest) return;
    setMethod(selectedRequest.method || "POST");
    setHeadersText(Object.entries(selectedRequest.headers || {}).map(([key, value]) => `${key}: ${value}`).join("\n"));
    setBodyText(bodyString(selectedRequest.body));
    setReplayResult(null);
    setReplayResponseData(null);
    setBodyViewMode("pretty");
    setShowReplayCard(true);
  };
  const replayRequest = async () => {
    if (!selectedRequest || !targetUrl.trim() || replaying) return;
    try {
      const target = new URL(targetUrl.trim());
      if (!["http:", "https:"].includes(target.protocol)) throw new Error("Invalid protocol");
    } catch { setReplayResult("Enter a valid HTTP or HTTPS target URL."); return; }
    try {
      setReplaying(true);
      setReplayResult(null);
      setReplayResponseData(null);
      const headers: Record<string, string> = {};
      for (const line of headersText.split("\n").map((line) => line.trim()).filter(Boolean)) {
        const separator = line.indexOf(":");
        if (separator < 1) { setReplayResult("Use one header per line in the format Name: value."); return; }
        headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
      }
      let body: unknown = null;
      try { body = bodyText ? JSON.parse(bodyText) : null; } catch { body = bodyText; }
      const response = await apiFetch(`/webhook/api/request/${selectedRequest.id}/replay`, { method: "POST", body: JSON.stringify({ targetUrl: targetUrl.trim(), method, headers, body }) });
      if (response?.networkError || response?.replayed === false) { setReplayResult("Replay failed. We couldn’t connect to the target server. Check the URL and try again."); return; }
      setReplayResponseData(response);
    } catch (err) { setReplayResult(err instanceof Error ? err.message.replace(/^API error:\s*/, "") : "Replay failed. Check the target URL and try again."); }
    finally { setReplaying(false); }
  };
  const renameEndpoint = async () => {
    const name = renameValue.trim();
    if (!name || !endpointId || renaming) return;
    try {
      setRenaming(true);
      setRenameError(null);
      const response = await apiFetch("/webhook/api/endpoint", { method: "PATCH", body: JSON.stringify({ endpointName: name, endpointId }) });
      if (response?.error) { setRenameError(response.error); return; }
      setEndpointName(name);
      setSettingsView(null);
    } catch { setRenameError("We couldn’t rename the endpoint. Please try again."); }
    finally { setRenaming(false); }
  };
  const deleteEndpoint = async () => {
    if (!endpointId || deleting) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      const response = await apiFetch("/webhook/api/endpoint", { method: "DELETE", body: JSON.stringify({ endpointId, message: "delete", endpointName }) });
      if (response?.error) { setDeleteError(response.error); return; }
      router.replace(`/workspace/${workspaceId}`);
    } catch { setDeleteError("We couldn’t delete the endpoint. Please try again."); }
    finally { setDeleting(false); }
  };
  const filteredRequests = requests.filter((request) => {
    const matchesSearch = !searchQuery.trim() || request.id.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesSearch && (!selectedMethods.length || selectedMethods.includes(request.method.toUpperCase()));
  });
  const hasFilters = Boolean(searchQuery.trim() || selectedMethods.length);
  const requestContentType = Object.entries(selectedRequest?.headers || {}).find(([key]) => key.toLowerCase() === "content-type")?.[1];

  const renderRequestList = (placement: "sidebar" | "drawer") => (
    <>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">{placement === "sidebar" && <h2 className="text-sm font-semibold text-foreground">Requests</h2>}<span className="text-xs text-muted-foreground">{filteredRequests.length} {placement === "drawer" ? "requests " : ""}on this page</span></div>
      <div className="shrink-0 space-y-3 border-b border-border-subtle p-4">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input aria-label="Search request IDs on this page" type="search" placeholder="Search request IDs…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="pl-9" /></div>
        <Button variant="outline" className="w-full justify-between" aria-expanded={showMethodFilter} aria-controls={`${placement}-method-filters`} onClick={() => setShowMethodFilter(!showMethodFilter)}><span className="flex items-center gap-2"><Filter className="size-4" aria-hidden="true" />{selectedMethods.length ? `${selectedMethods.length} ${selectedMethods.length === 1 ? "method" : "methods"} selected` : "All methods"}</span><ChevronDown className={`size-4 transition-transform ${showMethodFilter ? "rotate-180" : ""}`} aria-hidden="true" /></Button>
        {showMethodFilter && <fieldset id={`${placement}-method-filters`} className="grid grid-cols-2 gap-1 rounded-lg border border-border-default bg-surface-raised p-2"><legend className="sr-only">Filter by HTTP method</legend>{methods.map((item) => <label key={item} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-xs text-secondary-foreground hover:bg-surface-raised"><input type="checkbox" checked={selectedMethods.includes(item)} onChange={(event) => setSelectedMethods((previous) => event.target.checked ? [...previous, item] : previous.filter((value) => value !== item))} className="size-4 accent-white" /><span className="font-mono">{item}</span></label>)}</fieldset>}
        {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(""); setSelectedMethods([]); }}>Clear filters</Button>}
      </div>
      <div className={placement === "drawer" ? "min-h-32 flex-1 overflow-y-auto overscroll-contain" : "max-h-[calc(100dvh-25rem)] min-h-64 overflow-y-auto overscroll-contain"} aria-busy={loading}>
        {loading ? <div role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden="true" />Loading requests…</div> : error ? <div className="space-y-3 p-5 text-center"><p role="alert" className="text-sm leading-6 text-red-300">{error}</p><Button variant="secondary" size="sm" onClick={async () => { setLoading(true); await fetchRequests(); }}>Try again</Button></div> : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center p-6 text-center"><Inbox className="mb-3 size-7 text-muted-foreground" aria-hidden="true" /><p className="text-sm font-medium text-secondary-foreground">{hasFilters ? "No matching requests" : "Waiting for requests"}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{hasFilters ? "Try another request ID or clear your filters." : "Requests sent to this endpoint will appear here automatically."}</p></div>
        ) : filteredRequests.map((request) => (
          <button key={request.id} type="button" aria-pressed={selectedRequest?.id === request.id} onClick={() => { setSelectedRequest(request); setShowRequestDrawer(false); }} className={`block w-full min-w-0 border-b border-l-2 border-b-border-subtle px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 ${selectedRequest?.id === request.id ? "border-l-accent bg-surface-selected" : "border-l-transparent hover:bg-surface-raised"}`}>
            <span className="mb-2 flex items-center justify-between gap-2"><MethodBadge method={request.method} /><span className="text-xs text-muted-foreground">{formatTime(request.receivedAt)}</span></span>
            <span className="block truncate font-mono text-sm text-secondary-foreground" title={request.id}>{request.id}</span>
            <span className="mt-1 block text-xs text-muted-foreground">{formatDate(request.receivedAt)}</span>
          </button>
        ))}
      </div>
      <nav aria-label="Request pagination" className="flex shrink-0 items-center justify-between gap-2 border-t border-border-subtle p-3">
        <Button variant="outline" size="icon" aria-label="Previous page" disabled={loading || currentPage === 1} onClick={() => { setLoading(true); setCurrentPage((page) => Math.max(1, page - 1)); }}><ChevronLeft className="size-4" aria-hidden="true" /></Button>
        <span className="text-center text-xs text-muted-foreground" aria-live="polite">Page <span className="font-medium text-secondary-foreground">{currentPage}</span> of {totalPages}</span>
        <Button variant="outline" size="icon" aria-label="Next page" disabled={loading || currentPage >= totalPages} onClick={() => { setLoading(true); setCurrentPage((page) => Math.min(totalPages, page + 1)); }}><ChevronRight className="size-4" aria-hidden="true" /></Button>
      </nav>
    </>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-dvh bg-background text-foreground">
        <AppHeader breadcrumbs={[{ label: "Workspaces", href: "/workspace" }, { label: workspaceName || "Workspace", href: `/workspace/${workspaceId}` }, { label: endpointName || "Endpoint" }]} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-6 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Endpoint inspector</p>
              <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground sm:text-3xl [overflow-wrap:anywhere]">{endpointName || "Endpoint"}</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Inspect incoming requests and replay them to test your integrations.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="secondary" className="lg:hidden" aria-haspopup="dialog" aria-expanded={showRequestDrawer} onClick={() => setShowRequestDrawer(true)}><Menu className="size-4" aria-hidden="true" />Requests<span className="rounded bg-surface-elevated px-1.5 py-0.5 text-xs tabular-nums">{totalRequests}</span></Button>
              <Button variant="outline" size="icon" aria-label="Endpoint settings" title="Endpoint settings" aria-haspopup="dialog" aria-expanded={settingsView !== null} onClick={() => setSettingsView("menu")}><Settings className="size-4" aria-hidden="true" /></Button>
            </div>
          </div>
          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside aria-label="Incoming requests" className="hidden min-w-0 overflow-hidden rounded-xl border-2 border-border-default bg-surface shadow-panel lg:block">
              {renderRequestList("sidebar")}
            </aside>
            <section aria-label="Request details" className="min-w-0 scroll-mt-6">
              {selectedRequest ? (
                <div className="min-w-0 overflow-hidden rounded-xl border-2 border-border-default bg-surface shadow-panel">
                  <div className="flex min-w-0 flex-col gap-4 border-b border-border-subtle p-4 sm:p-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0"><div className="mb-3 flex items-center gap-2"><MethodBadge method={selectedRequest.method} /><h2 className="text-sm font-semibold">Request details</h2></div><p className="break-all font-mono text-sm leading-6 text-secondary-foreground">{selectedRequest.id}</p><p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs leading-5 text-muted-foreground"><Clock className="size-3.5" aria-hidden="true" />{formatDate(selectedRequest.receivedAt)} at {formatTime(selectedRequest.receivedAt)}</p></div>
                    <Button variant="primary" onClick={openReplay} className="shrink-0 self-start"><Play className="size-4" aria-hidden="true" />Replay request</Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-3 sm:px-5">
                    <div className="flex rounded-lg bg-background p-1" role="group" aria-label="Request content">{(["body", "headers"] as const).map((tab) => <button key={tab} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} className={`min-h-10 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${activeTab === tab ? "bg-surface-selected text-foreground ring-1 ring-inset ring-border-strong" : "text-muted-foreground hover:text-foreground"}`}>{tab === "body" ? "Body" : "Headers"}</button>)}</div>
                    <Button variant="ghost" size="sm" onClick={async () => await copyToClipboard(activeTab === "body" ? bodyString(selectedRequest.body) : JSON.stringify(selectedRequest.headers, null, 2), activeTab === "body" ? "Request body" : "Request headers")}><Copy className="size-4" aria-hidden="true" />Copy</Button>
                  </div>
                  {activeTab === "body" ? <div>{requestContentType && <div className="break-words border-b border-border-subtle px-4 py-3 font-mono text-xs text-muted-foreground sm:px-5 [overflow-wrap:anywhere]">{requestContentType}</div>}<div className="max-h-[65dvh] overflow-auto p-4 sm:p-5">{selectedRequest.body === null || selectedRequest.body === undefined || selectedRequest.body === "" ? <p className="text-sm text-muted-foreground">This request has no body.</p> : <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-foreground [overflow-wrap:anywhere]">{bodyString(selectedRequest.body)}</pre>}</div></div> : <HeaderList headers={selectedRequest.headers || {}} />}
                </div>
              ) : <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-default bg-surface p-6 text-center"><AlertCircle className="mb-4 size-8 text-muted-foreground" aria-hidden="true" /><h2 className="text-base font-medium text-secondary-foreground">Your request details appear here</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Select an incoming request to inspect its headers, body, and replay options.</p></div>}
            </section>
          </div>
        </main>
        <Dialog open={showRequestDrawer} onClose={() => setShowRequestDrawer(false)} title="Incoming requests" variant="drawer">
          {renderRequestList("drawer")}
        </Dialog>
        <Dialog open={showReplayCard} onClose={() => { if (!replaying) setShowReplayCard(false); }} title="Replay request" description="Edit the request and send it to your target URL. The original request stays unchanged." className="max-w-6xl">
          <form onSubmit={async (event) => { event.preventDefault(); await replayRequest(); }} className="min-w-0 space-y-5">
            <fieldset disabled={replaying} className="grid min-w-0 gap-4 sm:grid-cols-[120px_minmax(0,1fr)] lg:grid-cols-[120px_minmax(0,1fr)_auto] lg:items-end">
              <div className="min-w-0 space-y-2"><label htmlFor="replay-method" className="block text-sm font-medium text-secondary-foreground">Method</label><select id="replay-method" value={method} onChange={(event) => setMethod(event.target.value)} className={`${selectClassName} w-full`}>{methods.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
              <div className="min-w-0 space-y-2"><label htmlFor="replay-url" className="block text-sm font-medium text-secondary-foreground">Target URL</label><Input id="replay-url" type="url" required value={targetUrl} onChange={(event) => { setTargetUrl(event.target.value); setReplayResult(null); }} placeholder="https://api.example.com/webhook" className="h-10" /></div>
              <Button variant="primary" type="submit" disabled={replaying || !targetUrl.trim()} className="w-fit justify-self-start sm:col-span-2 lg:col-span-1">{replaying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}{replaying ? "Sending…" : "Send replay"}</Button>
            </fieldset>
            <fieldset disabled={replaying} className="grid min-w-0 gap-4 md:grid-cols-2">
              <div className="min-w-0"><label htmlFor="replay-headers" className="mb-2 block text-sm font-medium text-secondary-foreground">Headers</label><textarea id="replay-headers" value={headersText} onChange={(event) => { setHeadersText(event.target.value); setReplayResult(null); }} rows={9} spellCheck={false} className={`${editorClassName} resize-y`} placeholder={"Content-Type: application/json\nX-Custom-Header: value"} /><p className="mt-1 text-xs leading-5 text-muted-foreground">One header per line, using Name: value.</p></div>
              <div className="min-w-0"><label htmlFor="replay-body" className="mb-2 block text-sm font-medium text-secondary-foreground">Body</label><textarea id="replay-body" value={bodyText} onChange={(event) => { setBodyText(event.target.value); setReplayResult(null); }} rows={9} spellCheck={false} className={`${editorClassName} resize-y`} placeholder="Enter a JSON or text payload" /><p className="mt-1 text-xs leading-5 text-muted-foreground">JSON and plain text are supported.</p></div>
            </fieldset>
            {replayResult && <div role="alert" className="flex gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200"><AlertCircle className="mt-1 size-4 shrink-0" aria-hidden="true" /><p className="min-w-0 break-words [overflow-wrap:anywhere]">{replayResult}</p></div>}
            {replaying && <p role="status" className="text-sm text-muted-foreground">Waiting for the target server to respond…</p>}
            {replayResponseData && (
              <section aria-label="Replay response" className="min-w-0 space-y-5 border-t border-border-subtle pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-base font-semibold text-foreground">Replay response</h3><div className="flex flex-wrap gap-3 text-sm"><span className={`rounded-md border px-2.5 py-1 font-mono ${replayResponseData.status >= 400 ? "border-red-500/25 bg-red-500/10 text-red-200" : "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"}`}>{replayResponseData.status} {replayResponseData.statusText}</span><span className="flex items-center gap-1.5 text-secondary-foreground"><Clock className="size-4 text-muted-foreground" aria-hidden="true" />{replayResponseData.duration} ms</span></div></div>
                <div className="min-w-0 overflow-hidden rounded-lg border border-border-default bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-surface-raised px-4 py-2.5"><h4 className="text-sm font-medium text-secondary-foreground">Response headers</h4><Button type="button" variant="ghost" size="sm" aria-label="Copy response headers" onClick={async () => await copyToClipboard(JSON.stringify(replayResponseData.responseHeaders || {}, null, 2), "Response headers")}><Copy className="size-4" aria-hidden="true" />Copy</Button></div>
                  <div className="max-h-64 overflow-auto"><HeaderList headers={replayResponseData.responseHeaders || {}} /></div>
                </div>
                <div className="min-w-0 overflow-hidden rounded-lg border border-border-default bg-background">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-surface-raised px-4 py-2.5"><h4 className="text-sm font-medium text-secondary-foreground">Response body</h4><div className="flex flex-wrap items-center gap-1"><select aria-label="Response body format" value={bodyViewMode} onChange={(event) => setBodyViewMode(event.target.value as BodyViewMode)} className={selectClassName}><option value="pretty">Pretty</option><option value="raw">Raw</option><option value="collapsible">Tree</option></select><Button type="button" variant="ghost" size="sm" aria-label="Copy response body" onClick={async () => await copyToClipboard(bodyString(replayResponseData.responseBody), "Response body")}><Copy className="size-4" aria-hidden="true" />Copy</Button></div></div>
                  <div className="max-h-[50dvh] overflow-auto p-4 font-mono text-sm leading-7 text-foreground">{replayResponseData.responseBody === undefined || replayResponseData.responseBody === null || replayResponseData.responseBody === "" ? <p className="font-sans text-muted-foreground">The server returned an empty body.</p> : bodyViewMode === "collapsible" ? <CollapsibleJSON data={replayResponseData.responseBody} /> : <pre className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{bodyString(replayResponseData.responseBody, bodyViewMode === "pretty")}</pre>}</div>
                </div>
              </section>
            )}
            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-surface pt-4">
              <p role="status" className="text-sm text-secondary-foreground">{copyStatus}</p>
              <Button type="button" variant="secondary" onClick={() => setShowReplayCard(false)} disabled={replaying} className="ml-auto">Close replay</Button>
            </div>
          </form>
        </Dialog>
        <Dialog open={settingsView !== null} onClose={() => { if (!renaming && !deleting) setSettingsView(null); }} title={settingsView === "rename" ? "Rename endpoint" : settingsView === "delete" ? "Delete endpoint?" : "Endpoint settings"}>
          {settingsView === "menu" && <div className="space-y-2">
            <Button variant="ghost" autoFocus className="w-full justify-start text-foreground" onClick={() => { setRenameValue(endpointName); setRenameError(null); setSettingsView("rename"); }}><Edit3 className="size-4" aria-hidden="true" />Rename endpoint<ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden="true" /></Button>
            <Button variant="ghost" className="w-full justify-start text-red-300 hover:bg-red-500/10 hover:text-red-200" onClick={() => { setDeleteError(null); setSettingsView("delete"); }}><Trash2 className="size-4" aria-hidden="true" />Delete endpoint<ChevronRight className="ml-auto size-4" aria-hidden="true" /></Button>
          </div>}
          {settingsView === "rename" && <form onSubmit={async (event) => { event.preventDefault(); await renameEndpoint(); }} className="space-y-5">
            <div className="space-y-2"><label htmlFor="rename-endpoint" className="block text-sm font-medium">Endpoint name</label><Input id="rename-endpoint" value={renameValue} onChange={(event) => setRenameValue(event.target.value)} disabled={renaming} required autoFocus /></div>
            {renameError && <p role="alert" className="text-sm text-red-300">{renameError}</p>}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle pt-4"><Button type="button" variant="secondary" onClick={() => setSettingsView("menu")} disabled={renaming}>Cancel</Button><Button type="submit" variant="primary" disabled={renaming || !renameValue.trim() || renameValue.trim() === endpointName}>{renaming && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{renaming ? "Saving…" : "Save changes"}</Button></div>
          </form>}
          {settingsView === "delete" && <div className="space-y-5">
            <p className="text-sm leading-6 text-secondary-foreground">Permanently delete <strong className="break-words text-foreground [overflow-wrap:anywhere]">{endpointName || "this endpoint"}</strong> and its requests? This endpoint will no longer receive webhooks. This action cannot be undone.</p>
            {deleteError && <p role="alert" className="text-sm text-red-300">{deleteError}</p>}
            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-subtle pt-4"><Button variant="secondary" autoFocus onClick={() => setSettingsView("menu")} disabled={deleting}>Cancel</Button><Button variant="destructive" onClick={deleteEndpoint} disabled={deleting}>{deleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}{deleting ? "Deleting…" : "Delete endpoint"}</Button></div>
          </div>}
        </Dialog>
        {copyStatus && !showReplayCard && <div role="status" className="fixed bottom-4 left-4 right-4 z-[70] mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-2 rounded-lg border border-border-default bg-surface-raised px-4 py-3 text-sm text-foreground shadow-xl">{copyStatus.includes("failed") ? <AlertCircle className="size-4 shrink-0 text-red-300" aria-hidden="true" /> : <Check className="size-4 shrink-0 text-emerald-300" aria-hidden="true" />}{copyStatus}</div>}
      </div>
    </ProtectedRoute>
  );
}
