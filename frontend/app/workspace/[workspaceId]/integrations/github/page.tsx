'use client';
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react';
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

export default function GithubIntegrationsPage() {
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pathname = usePathname()

  useEffect(() => {
    const fetchGithubRepos = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiFetch('/api/github_data', {
          method: 'GET',
        });
        console.log(data)
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
    };

    fetchGithubRepos();
  }, []);
  const autocreatehook = async (fullname: string) => {
    const [owner, name] = fullname.split('/')
    const workspaceId= pathname.split('/')
    console.log(workspaceId[2])
    console.log(owner, name)
    const sendreq =await  apiFetch('/webhook/api/endpoint', {
      method: "POST",
      body: JSON.stringify({ owner, name, workspaceId:workspaceId[2] })
    })
console.log(sendreq, 'sendreq')
  }
  const formatUpdated = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

                  <button onClick={() => {
                    if (repo.full_name) {
                      autocreatehook(repo.full_name)
                    }
                  }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-[13px] font-medium bg-white/[0.05] border border-white/[0.08] text-white hover:bg-white/[0.1] hover:border-white/[0.15] transition-all">
                    <Zap className="w-3.5 h-3.5" />
                    Connect & Create Webhook
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}