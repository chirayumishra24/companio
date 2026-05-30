import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import { API_BASE, authHeaders } from "../lib/config";

export default function HashtagExplore({ currentUser }) {
  const { hashtag } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHashtagPosts = async () => {
    setLoading(true);
    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/posts/explore?search=${encodeURIComponent(hashtag || "")}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        // Just in case, let's filter to make sure the tag actually matches
        const filtered = data.filter(
          (post) =>
            post.tags?.some((t) => t.toLowerCase() === hashtag.toLowerCase()) ||
            post.caption?.toLowerCase().includes(`#${hashtag.toLowerCase()}`)
        );
        setPosts(filtered);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load posts.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHashtagPosts();
  }, [hashtag]);

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
      <div className="min-h-screen bg-brutal-cyan py-12 px-4 flex items-center justify-center">
        <div className="neo-card bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] font-black uppercase text-2xl text-center">
          Loading #{hashtag}... 🏷️
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-cyan py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header Banner */}
        <div className="neo-card bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_#000] flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="font-black text-3xl md:text-4xl text-black uppercase tracking-tight">
              #{hashtag}
            </h1>
            <p className="font-bold text-gray-700 mt-1 uppercase text-xs md:text-sm">
              Posts tagged with #{hashtag}
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
            <span className="text-4xl block mb-4">🏷️</span>
            <h2 className="font-black text-2xl uppercase mb-2">No Posts Found</h2>
            <p className="font-bold text-gray-600 mb-6">
              Be the first to post using the hashtag #{hashtag}!
            </p>
            <Link
              to="/create"
              className="bg-brutal-green hover:bg-black hover:text-white border-4 border-black font-black uppercase px-6 py-3 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all inline-block"
            >
              Create Post 📸
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
