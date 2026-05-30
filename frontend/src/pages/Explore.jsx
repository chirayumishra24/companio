import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PostCard from "../components/PostCard";
import UserCard from "../components/UserCard";
import { API_BASE, authHeaders } from "../lib/config";

export default function Explore({ currentUser }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("search") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "travelers"
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync search input if URL parameters change
  useEffect(() => {
    const q = searchParams.get("search") || "";
    setQuery(q);
    handleSearch(q);
  }, [searchParams, activeTab]);

  useEffect(() => {
    fetchSuggestions();
    fetchFollowingStatus();
  }, []);

  const fetchFollowingStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/following/${currentUser.email}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const map = {};
        data.forEach((u) => {
          map[u.email.toLowerCase()] = true;
        });
        setFollowingMap(map);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users/search?q=`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out self
        const filtered = data.filter((u) => u.email.toLowerCase() !== currentUser.email.toLowerCase());
        setSuggestedUsers(filtered.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (searchVal = query) => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "posts") {
        const res = await fetch(`${API_BASE}/api/posts/explore?search=${encodeURIComponent(searchVal)}`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        } else {
          setError("Failed to fetch explore feed.");
        }
      } else {
        const res = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(searchVal)}`, {
          headers: authHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          // Filter out self
          setUsers(data.filter((u) => u.email.toLowerCase() !== currentUser.email.toLowerCase()));
        } else {
          setError("Failed to search travelers.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({ search: query });
  };

  const handleFollowToggle = async (targetEmail) => {
    const isFollowing = !!followingMap[targetEmail.toLowerCase()];
    const method = isFollowing ? "DELETE" : "POST";
    try {
      const res = await fetch(`${API_BASE}/api/follow/${targetEmail}`, {
        method,
        headers: authHeaders(),
      });
      if (res.ok) {
        setFollowingMap((prev) => ({
          ...prev,
          [targetEmail.toLowerCase()]: !isFollowing,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/like`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likes: data.liked
                    ? [...post.likes, currentUser.email]
                    : post.likes.filter((e) => e !== currentUser.email),
                  likesCount: data.likesCount,
                }
              : post
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-brutal-cyan py-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          
          {/* Search Box */}
          <div className="neo-card bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_#000]">
            <h1 className="font-black text-3xl text-black uppercase mb-4 tracking-tight">
              Explore
            </h1>
            <form onSubmit={handleSearchSubmit} className="flex space-x-2">
              <input
                type="text"
                placeholder="Search travelers, tags, locations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] focus:outline-none focus:bg-yellow-50 font-bold uppercase text-sm"
              />
              <button
                type="submit"
                className="bg-brutal-green hover:bg-black hover:text-white border-4 border-black font-black uppercase px-6 py-3 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm"
              >
                Search
              </button>
            </form>
          </div>

          {/* Tabs */}
          <div className="flex border-4 border-black mb-8 bg-white shadow-[4px_4px_0px_0px_#000] overflow-hidden">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-3 text-center font-black uppercase text-sm transition-all ${
                activeTab === "posts"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-brutal-yellow"
              }`}
            >
              Trending Posts
            </button>
            <button
              onClick={() => setActiveTab("travelers")}
              className={`flex-1 py-3 text-center font-black uppercase text-sm transition-all ${
                activeTab === "travelers"
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-brutal-yellow"
              }`}
            >
              Travelers
            </button>
          </div>

          {error && (
            <div className="neo-card bg-brutal-pink text-black border-4 border-black p-4 mb-8 font-bold uppercase shadow-[4px_4px_0px_0px_#000]">
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="neo-card bg-white border-4 border-black p-8 text-center shadow-[4px_4px_0px_0px_#000] font-black uppercase">
              Searching... 🌐
            </div>
          ) : activeTab === "posts" ? (
            <div className="space-y-8">
              {posts.length === 0 ? (
                <p className="neo-card bg-white border-4 border-black p-8 text-center shadow-[4px_4px_0px_0px_#000] font-black uppercase">
                  No public posts found.
                </p>
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUserEmail={currentUser.email}
                    onLike={handleLike}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {users.length === 0 ? (
                <p className="neo-card bg-white border-4 border-black p-8 text-center shadow-[4px_4px_0px_0px_#000] font-black uppercase">
                  No travelers found matching your search.
                </p>
              ) : (
                users.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    isFollowing={!!followingMap[user.email.toLowerCase()]}
                    onFollowToggle={handleFollowToggle}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Sidebar (Follow Suggestions) */}
        <div className="lg:col-span-1">
          <div className="neo-card bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] sticky top-6">
            <h3 className="font-black text-xl text-black uppercase mb-4 border-b-2 border-black pb-2">
              Who to Follow
            </h3>
            {suggestedUsers.length === 0 ? (
              <p className="text-gray-500 font-bold uppercase text-xs">No suggestions</p>
            ) : (
              <div className="space-y-4">
                {suggestedUsers.map((user) => (
                  <UserCard
                    key={user._id}
                    user={user}
                    isFollowing={!!followingMap[user.email.toLowerCase()]}
                    onFollowToggle={handleFollowToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
