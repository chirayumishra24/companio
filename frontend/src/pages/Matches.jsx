import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE, assetUrl, authHeaders, clearToken, getToken } from "../lib/config";

function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age > 0 ? age : null;
}

export default function Matches() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [matchAlert, setMatchAlert] = useState(null);
  const navigate = useNavigate();

  const current = queue[0] || null;
  const next = queue[1] || null;
  const discoveredCount = useMemo(() => queue.length, [queue.length]);

  useEffect(() => {
    let mounted = true;

    const fetchMatches = async () => {
      const token = getToken();
      if (!token) {
        navigate("/login?next=/matches", { replace: true });
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/api/matches`, {
          headers: authHeaders(),
        });
        if (mounted) setQueue(Array.isArray(response.data) ? response.data : []);
      } catch (apiError) {
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          clearToken();
          navigate("/login?next=/matches", { replace: true });
          return;
        }
        setError(apiError.response?.data?.message || "Failed to load discovery cards.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMatches();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const takeAction = async (kind) => {
    if (!current || acting) return;
    const targetEmail = current.email;
    if (!targetEmail) {
      setQueue((prev) => prev.slice(1));
      return;
    }

    try {
      setActing(true);
      if (kind === "like") {
        const { data } = await axios.post(
          `${API_BASE}/api/like`,
          { targetEmail },
          { headers: authHeaders() }
        );
        if (data?.match) setMatchAlert(current);
      } else {
        await axios.post(
          `${API_BASE}/api/dislike`,
          { targetEmail },
          { headers: authHeaders() }
        );
      }
      setQueue((prev) => prev.slice(1));
    } catch (apiError) {
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        clearToken();
        navigate("/login?next=/matches", { replace: true });
        return;
      }
      setError(apiError.response?.data?.message || "Could not save that action.");
    } finally {
      setActing(false);
    }
  };

  const openChat = (email) => {
    if (!email) return;
    navigate(`/messages/${encodeURIComponent(email)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-4">
        <div className="text-3xl md:text-4xl font-black animate-pulse bg-brutal-yellow p-4 border-4 border-black shadow-brutal text-center">
          FETCHING TRAVEL PROFILES...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="border-b-8 border-black pb-6 mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">Discover</h1>
              <p className="font-bold mt-2 bg-white border-2 border-black px-3 py-1 inline-block">
                {discoveredCount} profile{discoveredCount === 1 ? "" : "s"} left in your stack
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={() => navigate("/messages")} className="neo-btn bg-brutal-cyan shadow-[4px_4px_0px_0px_#A64AFF]">Inbox</button>
              <button onClick={() => navigate("/itinerary-assistant")} className="neo-btn bg-brutal-green shadow-[4px_4px_0px_0px_#A64AFF]">AI Trip</button>
              <button onClick={() => navigate("/profile-setup")} className="neo-btn bg-white shadow-[4px_4px_0px_0px_#000000]">Edit Profile</button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="neo-card bg-red-500 text-white mb-6">
            <p className="font-black uppercase">{error}</p>
          </div>
        ) : null}

        {matchAlert ? (
          <div className="neo-card bg-brutal-green mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="font-black text-lg uppercase">
              It's a match with {matchAlert.firstName || "this traveler"}.
            </p>
            <div className="flex gap-2">
              <button className="neo-btn bg-white" onClick={() => openChat(matchAlert.email)}>Open Chat</button>
              <button className="neo-btn bg-black text-white" onClick={() => setMatchAlert(null)}>Dismiss</button>
            </div>
          </div>
        ) : null}

        {!current ? (
          <div className="neo-card bg-brutal-pink text-center py-20">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase">No more cards for now</h2>
            <p className="text-lg font-bold bg-white inline-block p-2 border-2 border-black">
              Check back later or update your profile and itinerary preferences.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <section className="relative min-h-[580px]">
              {next ? (
                <article className="neo-card absolute inset-0 bg-brutal-yellow/80 rotate-2 translate-y-3 scale-[0.98]">
                  <p className="font-black uppercase">Up Next</p>
                  <p className="font-bold text-2xl mt-2">{next.firstName || "Traveler"}</p>
                </article>
              ) : null}

              <article className="neo-card relative bg-white z-10">
                <div className="aspect-[4/5] border-4 border-black bg-brutal-bg mb-4 overflow-hidden">
                  <img
                    src={assetUrl(current.profilePhoto || (current.photos?.[0] ? `/uploads/${current.photos[0]}` : ""))}
                    alt={current.firstName || "Traveler profile"}
                    className="w-full h-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = `${API_BASE}/static/images/default-avatar.png`;
                    }}
                  />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-4xl font-black uppercase">
                    {current.firstName || "Traveler"}{calcAge(current.dob) ? `, ${calcAge(current.dob)}` : ""}
                  </h2>
                  <span className="bg-brutal-cyan border-2 border-black px-2 py-1 font-black text-xs uppercase">
                    {current.travelType || "Flexible"}
                  </span>
                </div>

                <p className="font-bold mt-3 border-l-4 border-black pl-3">
                  {current.bio || "No bio yet. Say hi and start planning the trip together."}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(current.interests || []).slice(0, 6).map((interest, idx) => (
                    <span key={`${interest}-${idx}`} className="border-2 border-black bg-brutal-yellow px-2 py-1 font-black text-xs uppercase">
                      {interest}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => takeAction("dislike")}
                    className="neo-btn bg-[#FF499E] text-white text-sm md:text-base border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                  >
                    PASS
                  </button>
                  <button
                    type="button"
                    disabled={acting}
                    onClick={() => takeAction("like")}
                    className="neo-btn bg-brutal-green text-black text-sm md:text-base border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                  >
                    LIKE
                  </button>
                  <button
                    type="button"
                    onClick={() => openChat(current.email)}
                    className="neo-btn bg-brutal-cyan text-black text-sm md:text-base border-4 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
                  >
                    CHAT
                  </button>
                </div>
              </article>
            </section>

            <section className="neo-card bg-brutal-cyan h-fit">
              <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-3">Trip Snapshot</h3>
              <div className="space-y-3">
                <div className="bg-white border-2 border-black p-3">
                  <p className="font-black uppercase text-sm">Destination</p>
                  <p className="font-bold">{current.itinerary?.destination || current.location || "Open to explore"}</p>
                </div>
                <div className="bg-white border-2 border-black p-3">
                  <p className="font-black uppercase text-sm">Dates</p>
                  <p className="font-bold">
                    {current.itinerary?.startDate ? new Date(current.itinerary.startDate).toLocaleDateString() : "Flexible"} -{" "}
                    {current.itinerary?.endDate ? new Date(current.itinerary.endDate).toLocaleDateString() : "Flexible"}
                  </p>
                </div>
                <div className="bg-white border-2 border-black p-3">
                  <p className="font-black uppercase text-sm">Travel Description</p>
                  <p className="font-bold">
                    {current.itinerary?.description || "Match first and plan details together in chat."}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
