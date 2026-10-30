
import { lookup as dnsLookup } from "node:dns";
import { isIP } from "node:net";
import { Agent } from "undici";
import ipaddr from "ipaddr.js";

// Reject every address not classified as public unicast.
// ipaddr.process() converts IPv4-mapped IPv6 into IPv4.
function isPublicIp(ip: string): boolean {
  try {
    return ipaddr.process(ip).range() === "unicast";
  } catch {
    return false;
  }
}

export function createSafeReplayAgent(rawUrl: string): Agent {
  const url = new URL(rawUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }

  if (url.username || url.password) {
    throw new Error("URL credentials are not allowed");
  }

  // URL.hostname includes brackets for IPv6 literals.
  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  ) {
    throw new Error("Local hostnames are not allowed");
  }

  // IP literals bypass DNS lookup, so validate them here.
  if (isIP(hostname) && !isPublicIp(hostname)) {
    throw new Error("Private or reserved IP addresses are not allowed");
  }

  return new Agent({
    connect: {
      autoSelectFamily: false,

      lookup(host, _options, callback) {
        dnsLookup(host, { all: true, verbatim: true }, (err, addresses) => {
          if (err) return callback(err, "", 0);

          // Reject the hostname if ANY resolved address is unsafe.
          if (
            addresses.length === 0 ||
            addresses.some((item) => !isPublicIp(item.address))
          ) {
            return callback(
              new Error("Unsafe DNS destination"),
              "",
              0
            );
          }

          // This exact validated IP is used for the connection.
          const chosen =
            addresses.find((item) => item.family === 4) ??
            addresses[0];

          callback(null, chosen.address, chosen.family);
        });
      },
    },
  });
}
