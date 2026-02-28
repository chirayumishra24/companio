import React, { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE, authHeaders, clearToken, getToken } from "../lib/config";

export default function ItineraryAssistant() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    destination: "",
    days: 4,
    interests: "food,nature,history",
    budget: "Medium",
    travelType: "Balanced",
    companionStyle: "Friendly",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [index, setIndex] = useState(0);
  const [swipe, setSwipe] = useState("");
  const [likedDays, setLikedDays] = useState([]);

  const cards = result?.days || [];
  const current = cards[index];
  const done = index >= cards.length && cards.length > 0;

  const progress = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round((index / cards.length) * 100);
  }, [index, cards.length]);

  const updateField = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generatePlan = async (e) => {
    e.preventDefault();
    setError("");
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setIndex(0);
      setLikedDays([]);

      const payload = {
        destination: form.destination,
        days: Number(form.days),
        interests: form.interests,
        budget: form.budget,
        travelType: form.travelType,
        companionStyle: form.companionStyle,
      };

      const { data } = await axios.post(`${API_BASE}/api/ai/itinerary`, payload, {
        headers: authHeaders(),
      });
      setResult(data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        clearToken();
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Could not generate itinerary.");
    } finally {
      setLoading(false);
    }
  };

  const swipeCard = (direction) => {
    if (!current) return;
    setSwipe(direction);
    setTimeout(() => {
      if (direction === "right") {
        setLikedDays((prev) => [...prev, current.day]);
      }
      setIndex((prev) => prev + 1);
      setSwipe("");
    }, 220);
  };

  return (
    <div className="min-h-screen bg-brutal-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
        <section className="neo-card bg-white lg:col-span-2 h-fit">
          <h2 className="text-3xl font-black uppercase mb-4 border-b-8 border-black pb-2">
            AI Trip Matchmaker
          </h2>
          <p className="font-bold mb-4">
            Generate a swipeable itinerary with direct Google Maps links.
          </p>

          {error && (
            <div className="bg-red-500 text-white font-bold p-3 border-4 border-black mb-4">
              {error}
            </div>
          )}

          <form onSubmit={generatePlan} className="space-y-4">
            <div>
              <label className="block font-black uppercase mb-1">Destination</label>
              <input
                className="neo-input"
                name="destination"
                value={form.destination}
                onChange={updateField}
                placeholder="Bali, Jaipur, Tokyo..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-black uppercase mb-1">Days</label>
                <input
                  className="neo-input"
                  name="days"
                  type="number"
                  min={1}
                  max={14}
                  value={form.days}
                  onChange={updateField}
                />
              </div>
              <div>
                <label className="block font-black uppercase mb-1">Budget</label>
                <select className="neo-input" name="budget" value={form.budget} onChange={updateField}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-black uppercase mb-1">Travel Type</label>
              <input
                className="neo-input"
                name="travelType"
                value={form.travelType}
                onChange={updateField}
                placeholder="Adventure, Chill, Cultural..."
              />
            </div>

            <div>
              <label className="block font-black uppercase mb-1">Interests (comma separated)</label>
              <input
                className="neo-input"
                name="interests"
                value={form.interests}
                onChange={updateField}
                placeholder="food,nature,art,history"
              />
            </div>

            <div>
              <label className="block font-black uppercase mb-1">Companion Style</label>
              <input
                className="neo-input"
                name="companionStyle"
                value={form.companionStyle}
                onChange={updateField}
                placeholder="Easygoing, social, early-riser"
              />
            </div>

            <button type="submit" className="neo-btn bg-brutal-pink text-white w-full text-lg" disabled={loading}>
              {loading ? "Generating..." : "Generate Itinerary"}
            </button>
          </form>

          {result && (
            <div className="mt-4 p-3 border-4 border-black bg-brutal-yellow font-bold">
              Source: {result.generatedBy === "fallback" ? "Smart fallback planner" : `AI (${result.generatedBy})`}
            </div>
          )}
        </section>

        <section className="lg:col-span-3">
          <div className="neo-card bg-brutal-cyan mb-4">
            <div className="flex justify-between items-center gap-3 flex-wrap">
              <h3 className="text-2xl font-black uppercase">
                {result ? `${result.destination} Swipe Plan` : "Your Swipe Plan"}
              </h3>
              <div className="font-black bg-white border-4 border-black px-3 py-1">
                Progress: {progress}%
              </div>
            </div>
            <div className="w-full h-3 bg-white border-2 border-black mt-3">
              <div className="h-full bg-brutal-green transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {!result && (
            <div className="neo-card bg-white min-h-[420px] flex items-center justify-center text-center">
              <p className="font-black text-2xl uppercase">Generate a plan to start swiping days.</p>
            </div>
          )}

          {result && current && (
            <div
              className={`neo-card bg-white min-h-[520px] transition-transform duration-200 ${
                swipe === "left" ? "-translate-x-16 rotate-[-8deg] opacity-60" : ""
              } ${swipe === "right" ? "translate-x-16 rotate-[8deg] opacity-60" : ""}`}
            >
              <div className="flex justify-between gap-2 mb-3 items-center">
                <div className="text-sm font-black uppercase bg-brutal-yellow border-2 border-black px-2 py-1">
                  Day {current.day}
                </div>
                <div className="text-sm font-bold">Liked: {likedDays.length}</div>
              </div>

              <h4 className="text-3xl font-black uppercase mb-2">{current.title}</h4>
              <p className="font-semibold mb-3">{current.summary}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="p-3 border-4 border-black bg-brutal-bg">
                  <div className="font-black uppercase text-sm">Vibe</div>
                  <div className="font-bold">{current.vibe}</div>
                </div>
                <div className="p-3 border-4 border-black bg-brutal-bg">
                  <div className="font-black uppercase text-sm">Budget</div>
                  <div className="font-bold">{current.estimatedBudget}</div>
                </div>
              </div>

              <div className="space-y-3">
                {(current.places || []).map((p, i) => (
                  <article key={`${p.name}-${i}`} className="p-3 border-4 border-black bg-brutal-bg">
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <div>
                        <h5 className="font-black uppercase">{p.timeSlot || "Anytime"}: {p.name}</h5>
                        <p className="font-medium">{p.why}</p>
                      </div>
                      <a
                        href={p.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neo-btn bg-white text-sm px-3 py-2"
                      >
                        Open Map
                      </a>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => swipeCard("left")}
                  className="neo-btn bg-red-500 text-white text-lg"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => swipeCard("right")}
                  className="neo-btn bg-brutal-green text-black text-lg"
                >
                  Love This Day
                </button>
              </div>
            </div>
          )}

          {done && (
            <div className="neo-card bg-brutal-green text-black text-center">
              <h4 className="text-3xl font-black uppercase mb-2">Plan Completed</h4>
              <p className="font-bold mb-4">
                You liked {likedDays.length} out of {cards.length} days.
              </p>
              <button className="neo-btn bg-white" onClick={() => setIndex(0)}>
                Swipe Again
              </button>
            </div>
          )}

          {result?.overallTips?.length ? (
            <div className="neo-card bg-white mt-4">
              <h4 className="text-xl font-black uppercase mb-2">Overall Tips</h4>
              <ul className="space-y-2">
                {result.overallTips.map((tip, i) => (
                  <li key={`tip-${i}`} className="font-semibold border-l-4 border-black pl-2">{tip}</li>
                ))}
              </ul>
              {result.budgetAdvice && (
                <p className="mt-3 font-bold p-3 border-2 border-black bg-brutal-yellow">{result.budgetAdvice}</p>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
