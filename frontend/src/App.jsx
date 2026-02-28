import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Hero from "./pages/Hero";
import ItineraryAssistant from "./pages/ItineraryAssistant";
import Login from "./pages/Login";
import Matches from "./pages/Matches";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import ProfileSetup from "./pages/ProfileSetup";
import SetPassword from "./pages/SetPassword";
import Signup from "./pages/Signup";
import { clearToken, getToken, setToken } from "./lib/config";

const navLinkClass = "neo-btn py-2 px-4 shadow-brutal-sm text-sm border-2";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (!token) return;

    setToken(token);
    params.delete("token");
    const cleanSearch = params.toString();
    const cleanUrl = `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}`;
    navigate(cleanUrl, { replace: true });
  }, [location.pathname, location.search, navigate]);

  const isAuthenticated = Boolean(getToken());

  const logout = () => {
    clearToken();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-brutal-bg">
      <nav className="border-b-4 border-black bg-brutal-yellow p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-3xl font-black tracking-tighter hover:-translate-y-1 transition-transform inline-block">
            COMPANIO.
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden neo-btn bg-white px-3 py-2 text-xs"
            aria-label="Toggle navigation"
          >
            MENU
          </button>

          <div className={`${mobileOpen ? "flex" : "hidden"} w-full md:w-auto md:flex gap-2 md:gap-3 flex-col md:flex-row`}>
            <Link to="/" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-white text-center`}>HOME</Link>
            {isAuthenticated ? (
              <>
                <Link to="/matches" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-brutal-cyan text-center`}>DISCOVER</Link>
                <Link to="/messages" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-brutal-green text-center`}>MESSAGES</Link>
                <Link to="/itinerary-assistant" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-brutal-pink text-white text-center`}>AI TRIP</Link>
                <Link to="/profile-setup" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-white text-center`}>PROFILE</Link>
                <button type="button" onClick={logout} className={`${navLinkClass} bg-black text-white text-center`}>
                  LOGOUT
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-white text-center`}>LOGIN</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-brutal-pink text-white text-center`}>SIGNUP</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="min-h-[calc(100vh-84px)]">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/set-password" element={<SetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/matches" element={<Matches />} />
            <Route path="/profile-setup" element={<ProfileSetup />} />
            <Route path="/itinerary-assistant" element={<ItineraryAssistant />} />
            <Route path="/messages/:matchId?" element={<Messages />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
