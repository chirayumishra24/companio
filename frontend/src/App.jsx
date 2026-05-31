import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
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
import Feed from "./pages/Feed";
import Explore from "./pages/Explore";
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
import PublicProfile from "./pages/PublicProfile";
import Notifications from "./pages/Notifications";
import NotificationBell from "./components/NotificationBell";
import SavedPosts from "./pages/SavedPosts";
import HashtagExplore from "./pages/HashtagExplore";
import LocationExplore from "./pages/LocationExplore";
import { API_BASE, clearToken, getToken, setToken, authHeaders } from "./lib/config";

const navLinkClass = "px-4 py-1.5 font-semibold text-sm transition-all rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/60 flex items-center justify-center";

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  const isAuthenticated = Boolean(getToken());

  const fetchCurrentUser = async () => {
    if (!isAuthenticated) {
      setCurrentUser(null);
      setUserLoading(false);
      return;
    }
    setUserLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/me`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (err) {
      console.error("Fetch current user error:", err);
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      setToken(token);
      params.delete("token");
      const cleanSearch = params.toString();
      const cleanUrl = `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}`;
      navigate(cleanUrl, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    fetchCurrentUser();
  }, [isAuthenticated]);

  const logout = async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout`);
    } catch {
      // ignore
    }
    clearToken();
    setCurrentUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-brutal-bg">
      <nav className="border-b border-zinc-100 bg-white/80 backdrop-blur-md py-3.5 px-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-xl font-bold tracking-tight text-zinc-900 hover:opacity-85 transition-opacity">
            Companio.
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            aria-label="Toggle navigation"
          >
            Menu
          </button>

          <div className={`${mobileOpen ? "flex" : "hidden"} w-full md:w-auto md:flex items-center gap-2 md:gap-3 flex-col md:flex-row`}>
            <Link to="/" onClick={() => setMobileOpen(false)} className={navLinkClass}>
              {isAuthenticated ? "Feed" : "Home"}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/explore" onClick={() => setMobileOpen(false)} className={navLinkClass}>Explore</Link>
                <Link to="/create" onClick={() => setMobileOpen(false)} className={navLinkClass}>Create (+)</Link>
                <Link to="/saved" onClick={() => setMobileOpen(false)} className={navLinkClass}>Saved</Link>
                <Link to="/messages" onClick={() => setMobileOpen(false)} className={navLinkClass}>Messages</Link>
                <Link to="/itinerary-assistant" onClick={() => setMobileOpen(false)} className="px-4 py-1.5 font-bold text-sm text-rose-600 bg-rose-50 hover:bg-rose-100/80 transition-all rounded-lg flex items-center justify-center">AI Trip</Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className={navLinkClass}>Profile</Link>
                
                {/* Notification Bell */}
                <div onClick={() => setMobileOpen(false)} className="self-stretch flex justify-center items-center">
                  <NotificationBell />
                </div>

                <button type="button" onClick={logout} className="px-4 py-1.5 font-semibold text-sm text-red-600 hover:bg-red-50 transition-all rounded-lg flex items-center justify-center w-full md:w-auto">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="px-4 py-1.5 font-semibold text-sm text-zinc-700 hover:text-zinc-950 transition-all rounded-lg flex items-center justify-center">Login</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} className="px-4 py-1.5 font-bold text-sm text-white bg-zinc-900 hover:bg-zinc-800 transition-all rounded-lg flex items-center justify-center shadow-sm">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="min-h-[calc(100vh-84px)]">
        {userLoading && isAuthenticated ? (
          <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
            <div className="neo-card bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] font-black uppercase text-2xl">
              Authenticating... ✈️
            </div>
          </div>
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated && currentUser ? (
                  <Feed currentUser={currentUser} />
                ) : (
                  <Hero />
                )
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/set-password" element={<SetPassword />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/explore" element={<Explore currentUser={currentUser} />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/post/:id" element={<PostDetail currentUser={currentUser} />} />
              <Route path="/profile" element={<PublicProfile currentUser={currentUser} />} />
              <Route path="/u/:username" element={<PublicProfile currentUser={currentUser} />} />
              <Route path="/saved" element={<SavedPosts currentUser={currentUser} />} />
              <Route path="/tag/:hashtag" element={<HashtagExplore currentUser={currentUser} />} />
              <Route path="/location/:place" element={<LocationExplore currentUser={currentUser} />} />
              <Route path="/notifications" element={<Notifications />} />
              
              <Route path="/matches" element={<Matches />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/itinerary-assistant" element={<ItineraryAssistant />} />
              <Route path="/messages/:matchId?" element={<Messages />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default App;
