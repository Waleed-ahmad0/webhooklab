"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, FolderOpen, User, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function AppHeader({ breadcrumbs = [], actions }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="relative z-20 shrink-0 border-b-2 border-border-subtle bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-3 py-3">
          <Link href="/" aria-label="WebhookLab home" className="flex shrink-0 items-center gap-2 rounded-lg text-base font-semibold tracking-tight text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white">
              <Zap className="h-4 w-4 text-neutral-950" aria-hidden="true" />
            </span>
            WebhookLab
          </Link>
          <nav aria-label="Main navigation" className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link href="/workspace" aria-label="Workspaces" aria-current={pathname === "/workspace" ? "page" : undefined} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-10 px-3", pathname.startsWith("/workspace") && "bg-surface-selected text-foreground ring-1 ring-inset ring-border-default")}>
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Workspaces</span>
            </Link>
            <Link href="/profile" aria-label="Profile" aria-current={pathname === "/profile" ? "page" : undefined} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-10 px-3", pathname === "/profile" && "bg-surface-selected text-foreground ring-1 ring-inset ring-border-default")}>
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </nav>
          {actions && <div className="flex w-full flex-wrap items-center gap-2 border-t border-border-subtle pt-3 sm:w-auto sm:border-0 sm:pt-0">{actions}</div>}
        </div>
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="border-t border-border-subtle py-3">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-muted-foreground">
              {breadcrumbs.map((item, index) => (
                <li key={`${item.href ?? item.label}-${index}`} className="flex min-w-0 items-center gap-2">
                  {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                  {item.href ? <Link href={item.href} className="min-w-0 break-words rounded-sm hover:text-foreground [overflow-wrap:anywhere]">{item.label}</Link> : <span aria-current="page" className="min-w-0 break-words text-secondary-foreground [overflow-wrap:anywhere]">{item.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </header>
  );
}
