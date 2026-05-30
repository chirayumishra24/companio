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

const navLinkClass = "neo-btn py-2 px-4 shadow-brutal-sm text-sm border-2 font-bold uppercase transition-all hover:bg-black hover:text-white";

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
      <nav className="border-b-4 border-black bg-brutal-yellow/95 backdrop-blur-sm p-4 sticky top-0 z-50 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
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

          <div className={`${mobileOpen ? "flex" : "hidden"} w-full md:w-auto md:flex items-center gap-2 md:gap-3 flex-col md:flex-row`}>
            <Link to="/" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-white text-center`}>
              {isAuthenticated ? "Feed" : "Home"}
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/explore" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-brutal-cyan text-center`}>Explore</Link>
                <Link to="/create" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-brutal-green text-center`}>Create (+)</Link>
                <Link to="/saved" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-brutal-yellow text-center`}>Saved</Link>
                <Link to="/messages" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-white text-center`}>Messages</Link>
                <Link to="/itinerary-assistant" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-brutal-pink text-white text-center`}>AI Trip</Link>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className={`${navLinkClass} bg-brutal-purple text-white text-center`}>Profile</Link>
                
                {/* Notification Bell */}
                <div onClick={() => setMobileOpen(false)} className="self-stretch flex justify-center items-center">
                  <NotificationBell />
                </div>

                <button type="button" onClick={logout} className={`${navLinkClass} bg-black text-white text-center w-full md:w-auto`}>
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
