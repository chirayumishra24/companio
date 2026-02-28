export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getToken() {
  const sessionToken = sessionStorage.getItem("token");
  if (sessionToken) return sessionToken;

  // Backward compatibility for older frontend versions.
  const legacy = localStorage.getItem("token");
  if (legacy) {
    sessionStorage.setItem("token", legacy);
    localStorage.removeItem("token");
    return legacy;
  }
  return "";
}

export function setToken(token) {
  sessionStorage.setItem("token", token);
  // Cleanup legacy storage when token is refreshed.
  localStorage.removeItem("token");
}

export function clearToken() {
  sessionStorage.removeItem("token");
  localStorage.removeItem("token");
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function assetUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${API_BASE}${normalized}`;
}
