import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE, setToken } from "../lib/config";

function resolveNextPath(nextValue) {
  if (!nextValue || typeof nextValue !== "string") return "/matches";
  if (!nextValue.startsWith("/") || nextValue.startsWith("//")) return "/matches";
  return nextValue;
}

function decodeEmail(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.email || "";
  } catch {
    return "";
  }
}

export default function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [token, setLocalToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromQuery = params.get("token");
    const rawNext = params.get("next");
    const nextFromQuery = rawNext ? resolveNextPath(rawNext) : "";
    const stored = sessionStorage.getItem("pendingSetPasswordToken");
    const storedNext = resolveNextPath(sessionStorage.getItem("pendingSetPasswordNext") || "");
    const resolved = tokenFromQuery || stored || "";

    if (tokenFromQuery) {
      sessionStorage.setItem("pendingSetPasswordToken", tokenFromQuery);
    }

    if (nextFromQuery) {
      sessionStorage.setItem("pendingSetPasswordNext", nextFromQuery);
    } else if (storedNext) {
      sessionStorage.setItem("pendingSetPasswordNext", storedNext);
    }

    if (tokenFromQuery || params.get("next")) {
      window.history.replaceState({}, "", "/set-password");
    }

    setLocalToken(resolved);
  }, []);

  const email = useMemo(() => decodeEmail(token), [token]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Missing token. Please login with Google again.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setSaving(true);
      await axios.post(
        `${API_BASE}/auth/set-password`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      sessionStorage.removeItem("pendingSetPasswordToken");
      setToken(token);

      try {
        await axios.get(`${API_BASE}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const nextPath = resolveNextPath(sessionStorage.getItem("pendingSetPasswordNext") || "");
        sessionStorage.removeItem("pendingSetPasswordNext");
        navigate(nextPath, { replace: true });
      } catch {
        navigate("/profile-setup", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brutal-yellow flex items-center justify-center p-4">
      <div className="neo-card w-full max-w-md bg-white">
        <h2 className="text-4xl font-black mb-4 uppercase border-b-8 border-black pb-3 text-center">
          Set Password
        </h2>
        <p className="font-bold mb-4 text-center">
          {email ? `Account: ${email}` : "Set a password to continue"}
        </p>
        {error && (
          <div className="bg-red-500 text-white font-bold p-3 border-4 border-black mb-4 shadow-brutal-sm">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            className="neo-input"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="neo-btn bg-brutal-cyan w-full text-lg"
          >
            {saving ? "Saving..." : "Save Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
