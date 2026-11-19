// Server-only settings (read from the host's environment variables, never sent to the browser).
// Set them in Vercel: Project → Settings → Environment Variables, then redeploy.
//   TAYYAR_API_URL  backend base URL, e.g. https://tayyar-production-85650ef5.up.railway.app
//   BRIDGE_SECRET   shared secret, must be identical to BRIDGE_SECRET on the backend

const DEFAULT_UPSTREAM = "https://tayyar-production-85650ef5.up.railway.app";

function readEnv(name: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  const v = process.env?.[name]?.trim();
  return v ? v : undefined;
}

export function getUpstream(): string {
  const raw = readEnv("TAYYAR_API_URL");
  if (!raw) return DEFAULT_UPSTREAM;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad protocol");
    return raw.replace(/\/+$/, "");
  } catch {
    console.warn("TAYYAR_API_URL is not a valid URL, using the default backend");
    return DEFAULT_UPSTREAM;
  }
}

export function getBridgeSecret(): string | undefined {
  return readEnv("BRIDGE_SECRET");
}
