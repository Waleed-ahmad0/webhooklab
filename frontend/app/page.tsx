"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Boxes,
  Monitor,
  Zap,
  Shield,
  Globe,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.05 } },
};

const features = [
  {
    icon: Activity,
    title: "Real-Time Streaming",
    description:
      "Watch webhook payloads arrive instantly via SSE. Inspect headers, body, and query parameters without ever refreshing the page.",
  },
  {
    icon: Boxes,
    title: "Team Workspaces",
    description:
      "Organize webhook endpoints into secure workspaces. Share access across your team and debug integrations collaboratively.",
  },
  {
    icon: Monitor,
    title: "Local Forwarding",
    description:
      "Route incoming webhooks directly to your localhost. Test your handlers in development without deploying a single line of code.",
  },
  {
    icon: Zap,
    title: "Instant Replay",
    description:
      "Replay any captured webhook request to a target URL with one click. Debug failures and test edge cases effortlessly.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description:
      "Every endpoint is uniquely tokenized. Authentication is enforced across all workspaces and API interactions.",
  },
  {
    icon: Globe,
    title: "Cloud & Self-Hosted",
    description:
      "Deploy on our managed cloud or run the entire stack on your own infrastructure. Full control, zero lock-in.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative selection:bg-white/20">
      {/* Background grid */}
      <div className="pointer-events-none fixed inset-0 grid-pattern" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-black/80 backdrop-blur-md"
      >
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

            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
              >
                Features
              </Link>
              <Link
                href="#docs"
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
              >
                Documentation
              </Link>
              <Link
                href="#pricing"
                className="text-sm text-zinc-400 hover:text-white transition-colors duration-200"
              >
                Pricing
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.1] bg-white/[0.02] text-xs font-medium text-zinc-300 mb-8 backdrop-blur-sm transition-colors hover:bg-white/[0.04]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              WebhookLab v2.0 is now live
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            </div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6"
          >
            Inspect Webhooks
            <br />
            <span className="text-zinc-400">
              at the Speed of Thought
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The professional developer toolkit to capture, inspect, and route
            webhooks locally and in the cloud. Reliable, fast, and built for production.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/register">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Start for Free
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/workspace">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Enter Workspace
              </Button>
            </Link>
          </motion.div>

          {/* Terminal Mockup */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="mt-20 max-w-3xl mx-auto"
          >
            <div className="rounded-lg border border-white/[0.1] bg-[#0A0A0A] overflow-hidden shadow-2xl">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.08] bg-[#121212]">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="ml-3 text-[11px] text-zinc-500 font-mono">
                  webhook-inspector
                </span>
              </div>
              {/* Terminal body */}
              <div className="p-6 font-mono text-[13px] text-left leading-6">
                <div>
                  <span className="text-white">POST</span>{" "}
                  <span className="text-zinc-500">
                    /api/webhooks/stripe_live_9a8b7c
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500">Host:</span>{" "}
                  <span className="text-zinc-300">hook.webhooklab.com</span>
                </div>
                <div>
                  <span className="text-zinc-500">Content-Type:</span>{" "}
                  <span className="text-zinc-300">application/json</span>
                </div>
                <br />
                <div className="text-zinc-500">{"{"}</div>
                <div>
                  {"  "}
                  <span className="text-zinc-300">&quot;id&quot;</span>
                  <span className="text-zinc-600">: </span>
                  <span className="text-zinc-400">
                    &quot;evt_1Mqw...&quot;
                  </span>
                  <span className="text-zinc-600">,</span>
                </div>
                <div>
                  {"  "}
                  <span className="text-zinc-300">&quot;object&quot;</span>
                  <span className="text-zinc-600">: </span>
                  <span className="text-zinc-400">
                    &quot;event&quot;
                  </span>
                  <span className="text-zinc-600">,</span>
                </div>
                <div>
                  {"  "}
                  <span className="text-zinc-300">&quot;type&quot;</span>
                  <span className="text-zinc-600">: </span>
                  <span className="text-zinc-400">
                    &quot;payment_intent.succeeded&quot;
                  </span>
                  <span className="text-zinc-600">,</span>
                </div>
                <div>
                  {"  "}
                  <span className="text-zinc-300">&quot;data&quot;</span>
                  <span className="text-zinc-600">{": {"}</span>
                </div>
                <div>
                  {"    "}
                  <span className="text-zinc-300">&quot;amount&quot;</span>
                  <span className="text-zinc-600">: </span>
                  <span className="text-zinc-400">2000</span>
                  <span className="text-zinc-600">,</span>
                </div>
                <div>
                  {"    "}
                  <span className="text-zinc-300">&quot;currency&quot;</span>
                  <span className="text-zinc-600">: </span>
                  <span className="text-zinc-400">&quot;usd&quot;</span>
                </div>
                <div className="text-zinc-500">{"  }"}</div>
                <div className="text-zinc-500">{"}"}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 px-6 lg:px-8 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-semibold tracking-tight mb-4 text-white">
              Everything you need to debug webhooks
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto text-sm">
              A complete toolkit designed for professional developers who need
              reliable webhook inspection at scale.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className="rounded-lg border border-white/[0.08] bg-[#0A0A0A] p-6 transition-colors hover:bg-[#111]"
              >
                <div className="w-10 h-10 rounded bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mb-5">
                  <feature.icon className="w-4 h-4 text-zinc-300" />
                </div>
                <h3 className="text-sm font-medium text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] py-8 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-sm font-medium text-zinc-400">
              WebhookLab
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Built for developers, by developers.
          </p>
        </div>
      </footer>
    </div>
  );
}
