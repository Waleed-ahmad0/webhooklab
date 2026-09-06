"use client";

import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Zap,
  Plus,
  FolderOpen,
  Calendar,
  Link2,
  ChevronRight,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  endpoints?: { id: string }[];
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      delay: i * 0.05,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function WorkspacePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/webhook/api/workspaces`, { method: "GET" });
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
      await apiFetch("/webhook/api/workspace", {
        method: "POST",
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
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
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-white/20">
        <div className="pointer-events-none fixed inset-0 grid-pattern" />

        <header className="relative z-10 border-b border-white/[0.08] bg-black/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-white flex items-center justify-center">
                  <Zap className="w-4 h-4 text-black" />
                </div>
                <span className="text-base font-medium tracking-tight">
                  WebhookLab
                </span>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                New Workspace
              </Button>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Your Workspaces
            </h1>
            <p className="mt-1 text-zinc-400 text-sm">
              Manage your webhook endpoints and monitor incoming requests.
            </p>
          </motion.div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/[0.08] bg-[#0A0A0A] p-5 animate-pulse"
                >
                  <div className="h-4 w-32 bg-white/[0.05] rounded mb-4" />
                  <div className="h-3 w-24 bg-white/[0.03] rounded mb-5" />
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-white/[0.02] rounded" />
                    <div className="h-6 w-16 bg-white/[0.02] rounded" />
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
              <Button variant="secondary" size="sm" onClick={fetchWorkspaces}>
                Try Again
              </Button>
            </motion.div>
          )}

          {!loading && !error && workspaces.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="w-16 h-16 rounded-lg bg-[#0A0A0A] border border-white/[0.08] flex items-center justify-center mb-5">
                <FolderOpen className="w-6 h-6 text-zinc-500" />
              </div>
              <h2 className="text-lg font-medium text-white mb-1.5">
                No workspaces yet
              </h2>
              <p className="text-zinc-400 text-sm mb-6 max-w-[280px] text-center">
                Create your first workspace to start receiving webhook requests.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Workspace
              </Button>
            </motion.div>
          )}

          {!loading && !error && workspaces.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {workspaces.map((ws, index) => (
                <motion.div key={ws.id} variants={fadeUp} custom={index}>
                  <Link
                    href={`/workspace/${ws.id}`}
                    className="group block rounded-lg border border-white/[0.08] bg-[#0A0A0A] hover:bg-[#111] hover:border-white/[0.15] transition-all p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white/[0.05] border border-white/[0.05] flex items-center justify-center shrink-0">
                          <FolderOpen className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-white">
                            {ws.name}
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate max-w-[160px]">
                            {ws.id}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors" />
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(ws.createdAt)}
                      </span>
                      {ws.endpoints && (
                        <span className="flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5" />
                          {ws.endpoints.length} endpoint
                          {ws.endpoints.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}

              <motion.div variants={fadeUp} custom={workspaces.length}>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="group w-full rounded-lg border border-dashed border-white/[0.08] bg-transparent hover:bg-white/[0.02] hover:border-white/[0.15] transition-all p-5 flex flex-col items-center justify-center gap-2.5 min-h-[116px] cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-white/[0.03] flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-[13px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                    New Workspace
                  </span>
                </button>
              </motion.div>
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
                  <h2 className="text-base font-medium">Create Workspace</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-7 h-7 rounded hover:bg-white/[0.08] flex items-center justify-center transition-colors cursor-pointer text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="workspace-name" className="text-xs text-zinc-400">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      type="text"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleCreateWorkspace()
                      }
                      placeholder="e.g. Production Hooks"
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
                      onClick={handleCreateWorkspace}
                      disabled={creating || !newWorkspaceName.trim()}
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