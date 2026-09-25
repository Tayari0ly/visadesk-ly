const TOKEN_KEY = "visadesk_token";

function readStore(getter: (k: string) => string | null): string {
  try {
    return getter(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return (
    readStore((k) => window.localStorage.getItem(k)) ||
    readStore((k) => window.sessionStorage.getItem(k)) ||
    readStore((k) => {
      const m = document.cookie.match(new RegExp("(?:^|; )" + k + "=([^;]*)"));
      return m ? decodeURIComponent(m[1]) : null;
    })
  );
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  const writers: Array<(k: string, v: string) => void> = [
    (k, v) => window.localStorage.setItem(k, v),
    (k, v) => window.sessionStorage.setItem(k, v),
    (k, v) => {
      document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=${token ? 604800 : 0}; SameSite=Lax`;
    },
  ];
  for (const write of writers) {
    try {
      if (token) write(TOKEN_KEY, token);
      else write(TOKEN_KEY, "");
    } catch {
      /* storage blocked in this frame — try the next one */
    }
  }
}

export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers, credentials: "include" });
}
