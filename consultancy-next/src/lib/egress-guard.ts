import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * SSRF egress guard for routes that fetch user-supplied URLs
 * (webhook-proxy, push-to-cms, verify-schema).
 *
 * Blocks loopback, private-range, link-local, and cloud-metadata addresses
 * by resolving the hostname BEFORE fetching. Returns an error string if the
 * URL must not be fetched, or null if it's safe.
 *
 * Note: this checks the initial target only; fetch redirects could still
 * bounce internally, so callers should pass `redirect: 'manual'` or 'error'.
 */

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  const [a, b] = parts;
  return (
    a === 0 ||              // "this network"
    a === 10 ||             // 10.0.0.0/8
    a === 127 ||            // loopback
    (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64.0.0/10
    (a === 169 && b === 254) ||           // link-local + AWS/GCP metadata
    (a === 172 && b >= 16 && b <= 31) ||  // 172.16.0.0/12
    (a === 192 && b === 168)              // 192.168.0.0/16
  );
}

function isPrivateIPv6(ip: string): boolean {
  const low = ip.toLowerCase();
  return (
    low === '::1' || low === '::' ||
    low.startsWith('fe80') ||  // link-local
    low.startsWith('fc') || low.startsWith('fd') || // unique-local
    low.startsWith('::ffff:')  // IPv4-mapped — re-check embedded v4
      && isPrivateIPv4(low.slice('::ffff:'.length))
  );
}

function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true; // not an IP — treat as unsafe
}

export async function assertSafeEgressUrl(rawUrl: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return 'Invalid URL';
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return 'Only http/https URLs are allowed';
  }

  const host = url.hostname;

  // Literal IP in the URL.
  if (isIP(host)) {
    return isPrivateAddress(host) ? 'URL resolves to a private or internal address' : null;
  }

  // Obvious internal hostnames.
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.')) {
    return 'URL resolves to a private or internal address';
  }

  // Resolve DNS and check every returned address.
  try {
    const addresses = await lookup(host, { all: true });
    for (const { address } of addresses) {
      if (isPrivateAddress(address)) {
        return 'URL resolves to a private or internal address';
      }
    }
  } catch {
    return 'Could not resolve URL hostname';
  }

  return null;
}
