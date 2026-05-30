import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import { API_BASE, authHeaders } from "../lib/config";

export default function SavedPosts({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSavedPosts = async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/posts/saved`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load saved posts.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedPosts();
  }, []);

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
      console.error("Like error:", err);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${postId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((post) => post._id !== postId));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-purple/20 flex items-center justify-center">
        <div className="neo-card bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] font-black uppercase text-2xl text-center">
          Loading Saved Posts... 🔖
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-purple/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Banner */}
        <div className="neo-card bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_#000] flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="font-black text-3xl md:text-4xl text-black uppercase tracking-tight">
              Saved Posts
            </h1>
            <p className="font-bold text-gray-700 mt-1 uppercase text-xs md:text-sm">
              Your bookmarked travel stories and inspiration
            </p>
          </div>
          <Link
            to="/explore"
            className="bg-brutal-yellow hover:bg-black hover:text-white border-4 border-black font-black uppercase px-6 py-3 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm"
          >
            Explore More 🔍
          </Link>
        </div>

        {error && (
          <div className="neo-card bg-brutal-pink text-black border-4 border-black p-4 mb-8 font-bold uppercase shadow-[4px_4px_0px_0px_#000]">
            ⚠️ {error}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="neo-card bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0px_0px_#000] my-12">
            <span className="text-4xl block mb-4">🔖</span>
            <h2 className="font-black text-2xl uppercase mb-2">No Saved Posts</h2>
            <p className="font-bold text-gray-600 mb-6">
              You haven't bookmarked any posts yet. Explore the feed and bookmark posts to see them here!
            </p>
            <Link
              to="/"
              className="bg-brutal-cyan hover:bg-black hover:text-white border-4 border-black font-black uppercase px-6 py-3 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all inline-block"
            >
              Go to Feed 🌍
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUserEmail={currentUser.email}
                onLike={handleLike}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
