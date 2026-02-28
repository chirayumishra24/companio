import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../lib/config";

export default function ProtectedRoute() {
  const location = useLocation();
  const token = getToken();

  if (!token) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}
