import { createFileRoute } from "@tanstack/react-router";

// Same-origin bridge to the Tayyar backend. The backend's CORS list does not include this
// site, so the browser talks to us and we forward the request. The backend itself verifies
// every admin bearer token; this route adds no privileges.
const UPSTREAM = "https://tayyar-production-85650ef5.up.railway.app";
const PREFIX = "/api/public/tayyar";
const FORWARD_REQ = ["authorization", "content-type", "cookie", "accept", "accept-language"];
const DROP_RES = new Set(["content-encoding", "content-length", "transfer-encoding", "set-cookie", "connection"]);

async function proxy({ request, params }: { request: Request; params: { _splat?: string } }) {
  const url = new URL(request.url);
  const path = (params._splat ?? "").replace(/^\/+/, "");
  if (path.includes("..")) return new Response("Bad path", { status: 400 });
  const target = `${UPSTREAM}/${path}${url.search}`;

  const headers = new Headers();
  for (const h of FORWARD_REQ) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
  if (ip) headers.set("x-forwarded-for", ip);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch {
    return Response.json(
      { success: false, status: "error", message: "السيرفر مش متاح دلوقتي، جرّب تاني" },
      { status: 502 },
    );
  }

  const out = new Headers();
  upstream.headers.forEach((v, k) => {
    if (!DROP_RES.has(k.toLowerCase())) out.set(k, v);
  });
  // Re-scope the refresh cookie to this bridge so the browser sends it back to us.
  const cookies =
    typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
  for (const c of cookies) {
    out.append(
      "set-cookie",
      c.replace(/;\s*Domain=[^;]*/gi, "").replace(/Path=\/auth/gi, `Path=${PREFIX}/auth`),
    );
  }
  out.set("cache-control", "no-store");
  return new Response(upstream.status === 204 ? null : await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: out,
  });
}

export const Route = createFileRoute("/api/public/tayyar/$")({
  server: {
    handlers: {
      GET: proxy,
      POST: proxy,
      PATCH: proxy,
      PUT: proxy,
      DELETE: proxy,
    },
  },
});
