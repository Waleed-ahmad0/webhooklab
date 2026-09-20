import { promises as dns } from "dns";
import net from "net";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 10 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 127 ||
      (a === 169 && b === 254) // covers link-local + cloud metadata 169.254.169.254
    );
  }
  // IPv6: loopback, unique local, link-local
  return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
}

export async function assertSafeReplayTarget(rawUrl: string) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https targets are allowed");
  }
  const { address } = await dns.lookup(url.hostname);
  if (isPrivateIp(address)) {
    throw new Error("Replaying to internal/private addresses is not allowed");
  }
}