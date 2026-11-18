import { useSyncExternalStore } from "react";
import { apiRaw, tokenStore, API_BASE } from "./api/client";
import type { AdminUser } from "./api/types";

export function useAdminToken() {
  return useSyncExternalStore(tokenStore.subscribe, () => tokenStore.get(), () => null);
}

export async function adminLogin(username: string, password: string) {
  const res = await apiRaw<{ user: AdminUser; accessToken: string }>("/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
  tokenStore.set(res.accessToken);
  return res.user;
}

export async function adminLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "same-origin",
      headers: { authorization: `Bearer ${tokenStore.get() ?? ""}` },
    });
  } finally {
    tokenStore.set(null);
  }
}

export async function fetchMe() {
  const res = await apiRaw<{ user: AdminUser }>("/auth/me");
  return res.user;
}
