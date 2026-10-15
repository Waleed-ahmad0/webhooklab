import Link from "next/link";
import { Activity, ArrowRight, Boxes, Globe, Monitor, Shield, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const features = [
  {
    icon: Activity,
    title: "Live request inspection",
    description: "Watch webhook requests arrive in real time. Inspect methods, headers, and payloads in one place.",
  },
  {
    icon: Boxes,
    title: "Organized workspaces",
    description: "Keep endpoints grouped by project so you can move between integrations without losing context.",
  },
  {
    icon: Monitor,
    title: "Request details",
    description: "Review request methods, headers, and body content with readable formatting.",
  },
  {
    icon: Zap,
    title: "Request replay",
    description: "Send a captured request to a target URL, review the response, and investigate failed deliveries.",
  },
  {
    icon: Shield,
    title: "Controlled access",
    description: "Keep your workspaces behind account authentication and use a unique webhook URL for each endpoint.",
  },
  {
    icon: Globe,
    title: "Integration visibility",
    description: "Follow incoming events from external services without searching through application logs.",
  },
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b-2 border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" aria-label="WebhookLab home" className="inline-flex min-h-10 items-center gap-2 rounded-md font-semibold tracking-tight">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
              <Zap aria-hidden="true" className="h-4 w-4 text-neutral-950" />
            </span>
            WebhookLab
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
            <a href="#features" className={buttonVariants({ variant: "ghost", size: "sm" })}>Features</a>
            <Link href="/workspace" className={buttonVariants({ variant: "ghost", size: "sm" })}>Workspaces</Link>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Sign in</Link>
            <Link href="/register" className={buttonVariants({ variant: "primary", size: "sm" })}>Sign up</Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border-default bg-surface px-3 py-1.5 text-xs font-medium text-secondary-foreground">
              <Activity aria-hidden="true" className="h-3.5 w-3.5 text-secondary-foreground" />
              A clear view of every webhook
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Inspect, debug, and replay<br className="hidden sm:block" /> your webhooks.
            </h1>
            <p className="mx-auto mb-8 mt-6 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              Capture incoming requests, understand their payloads, and test your integrations with a focused workspace built for developers.
            </p>
            <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row">
              <Link href="/register" className={buttonVariants({ variant: "primary", size: "lg" })}>
                Create an account <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link href="/workspace" className={buttonVariants({ variant: "outline", size: "lg" })}>Open workspaces</Link>
            </div>

            <div className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-xl border-2 border-border-default bg-surface shadow-panel text-left sm:mt-16">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle bg-surface-raised px-4 py-3 sm:px-5">
                <span className="flex items-center gap-2 text-sm font-medium text-secondary-foreground"><Activity aria-hidden="true" className="h-4 w-4 text-muted-foreground" /> Request inspector</span>
                <span className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">200 OK</span>
              </div>
              <div className="space-y-5 p-4 sm:p-6">
                <div className="flex min-w-0 flex-wrap items-center gap-2 font-mono text-xs sm:text-sm">
                  <span className="rounded border border-border-default bg-surface-raised px-2 py-1 font-semibold text-foreground">POST</span>
                  <span className="break-all text-secondary-foreground">/webhooks/payment-events</span>
                </div>
                <dl className="space-y-1 font-mono text-xs leading-6 text-secondary-foreground sm:text-sm">
                  <div className="flex flex-wrap gap-x-3"><dt className="text-muted-foreground">Content-Type</dt><dd>application/json</dd></div>
                  <div className="flex flex-wrap gap-x-3"><dt className="text-muted-foreground">Event</dt><dd>payment_intent.succeeded</dd></div>
                </dl>
                <pre className="overflow-x-auto rounded-lg border border-border-default bg-background p-4 font-mono text-xs leading-6 text-secondary-foreground sm:text-sm" aria-label="Example webhook payload">
{`{
  "id": "evt_1Mqw9a8b7c",
  "type": "payment_intent.succeeded",
  "data": {
    "amount": 2000,
    "currency": "usd"
  }
}`}
                </pre>
                <p className="text-xs text-muted-foreground">Example request payload</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 border-t border-border-subtle px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
              <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Everything you need to investigate a request</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Bring your webhook workflow into one organized, readable workspace.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="rounded-xl border-2 border-border-default bg-surface shadow-panel p-5 transition-colors duration-150 hover:border-border-strong sm:p-6">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-border-default bg-surface-raised">
                    <feature.icon aria-hidden="true" className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-subtle px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="font-medium text-secondary-foreground">WebhookLab</span>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-muted-foreground">
            <a href="#features" className="rounded-sm transition-colors hover:text-foreground">Features</a>
            <Link href="/workspace" className="rounded-sm transition-colors hover:text-foreground">Workspaces</Link>
            <Link href="/login" className="rounded-sm transition-colors hover:text-foreground">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
