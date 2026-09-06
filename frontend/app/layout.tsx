import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WebhookLab — Capture, Inspect & Route Webhooks in Real-Time",
  description:
    "WebhookLab is a professional developer toolkit for capturing, inspecting, debugging, and forwarding webhook payloads. Real-time streaming, team workspaces, and local forwarding — built for production workflows.",
  keywords: [
    "webhook",
    "webhook testing",
    "webhook debugger",
    "webhook inspector",
    "webhook forwarding",
    "API debugging",
    "developer tools",
  ],
  authors: [{ name: "WebhookLab" }],
  openGraph: {
    title: "WebhookLab — Capture, Inspect & Route Webhooks in Real-Time",
    description:
      "The professional developer toolkit for capturing, inspecting, and routing webhooks. Real-time streaming, team workspaces, and local forwarding.",
    type: "website",
    siteName: "WebhookLab",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebhookLab — Capture, Inspect & Route Webhooks in Real-Time",
    description:
      "The professional developer toolkit for capturing, inspecting, and routing webhooks.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#09090B] text-white">
        {children}
      </body>
    </html>
  );
}
