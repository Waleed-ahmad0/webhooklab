"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  Plus,
  Link2,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";

interface Endpoint {
  id: string;
  name: string;
  token: string;
  workspaceId: string;
  createdAt: string;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: i * 0.05,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

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
      const data = await apiFetch(`/webhook/api/workspaces/endpoints/${workspaceId}`, { method: "GET" });
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
      await apiFetch("/webhook/api/endpoint", {
        method: "POST",
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
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getWebhookUrl = (token: string) => {
    return `${process.env.NEXT_PUBLIC_API_URL}/webhook/api/h/${token}`;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-white/20">
        <div className="pointer-events-none fixed inset-0 grid-pattern" />

        <header className="relative z-10 border-b border-white/[0.08] bg-black/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link href="/workspace" className="flex items-center gap-2 group">
                <div className="w-7 h-7 rounded bg-white flex items-center justify-center">
                  <Zap className="w-4 h-4 text-black" />
                </div>
                <span className="text-base font-medium tracking-tight group-hover:text-zinc-300 transition-colors">
                  WebhookLab
                </span>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Endpoint
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <div className="flex items-center gap-2 text-[13px] text-zinc-500 mb-6">
            <Link href="/workspace" className="hover:text-white transition-colors">
              Workspaces
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.03]">
              {workspaceId}
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Endpoints
            </h1>
            <p className="mt-1 text-zinc-400 text-sm">
              Create webhook endpoints and monitor incoming requests.
            </p>
          </motion.div>

          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.08] bg-[#0A0A0A] p-4 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white/[0.05] rounded" />
                    <div className="flex-1">
                      <div className="h-3 w-32 bg-white/[0.05] rounded mb-2" />
                      <div className="h-2 w-48 bg-white/[0.03] rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-12 h-12 rounded border border-red-500/20 bg-red-500/10 flex items-center justify-center mb-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-zinc-400 text-sm mb-4">{error}</p>
              <Button variant="secondary" size="sm" onClick={fetchEndpoints}>
                Try Again
              </Button>
            </motion.div>
          )}

          {!loading && !error && endpoints.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="w-16 h-16 rounded-lg bg-[#0A0A0A] border border-white/[0.08] flex items-center justify-center mb-5">
                <Link2 className="w-6 h-6 text-zinc-500" />
              </div>
              <h2 className="text-lg font-medium text-white mb-1.5">
                No endpoints yet
              </h2>
              <p className="text-zinc-400 text-sm mb-6 max-w-[280px] text-center">
                Create your first endpoint to get a unique URL for receiving webhook requests.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Endpoint
              </Button>
            </motion.div>
          )}

          {!loading && !error && endpoints.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="space-y-3"
            >
              {endpoints.map((ep, index) => (
                <motion.div
                  key={ep.id}
                  variants={fadeUp}
                  custom={index}
                  className="group rounded-lg border border-white/[0.08] bg-[#0A0A0A] hover:bg-[#111] hover:border-white/[0.15] transition-all"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white/[0.05] border border-white/[0.05] flex items-center justify-center shrink-0">
                          <Link2 className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">
                            {ep.name}
                          </h3>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Created {formatDate(ep.createdAt)}
                          </p>
                        </div>
                      </div>

                      <Link href={`/workspace/${workspaceId}/endpoint/${ep.id}`}>
                        <Button variant="outline" size="sm">
                          View Requests
                        </Button>
                      </Link>
                    </div>

                    <div className="mt-4 flex items-center gap-2 bg-[#111] rounded border border-white/[0.05] px-2.5 py-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        URL
                      </span>
                      <code className="text-[11px] text-zinc-300 font-mono flex-1 truncate ml-2 border-l border-white/[0.05] pl-3">
                        {getWebhookUrl(ep.token)}
                      </code>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          copyToClipboard(getWebhookUrl(ep.token), ep.id);
                        }}
                        className="shrink-0 w-6 h-6 rounded flex items-center justify-center hover:bg-white/[0.08] transition-colors text-zinc-400 hover:text-white"
                        title="Copy URL"
                      >
                        {copiedId === ep.id ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>

        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowCreateModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-[400px] mx-4 rounded-xl border border-white/[0.1] bg-[#0A0A0A] shadow-2xl p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-medium">Create Endpoint</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-7 h-7 rounded hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="endpoint-name" className="text-xs text-zinc-400">Endpoint Name</Label>
                    <Input
                      id="endpoint-name"
                      type="text"
                      value={newEndpointName}
                      onChange={(e) => setNewEndpointName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateEndpoint()
                      }
                      placeholder="e.g. Stripe Payments"
                      className="bg-[#111] border-white/[0.08]"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleCreateEndpoint}
                      disabled={creating || !newEndpointName.trim()}
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                          Creating...
                        </>
                      ) : (
                        "Create"
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
