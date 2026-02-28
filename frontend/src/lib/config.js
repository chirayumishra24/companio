export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getToken() {
  return sessionStorage.getItem("token");
}

export function setToken(token) {
  sessionStorage.setItem("token", token);
}

export function clearToken() {
  sessionStorage.removeItem("token");
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
