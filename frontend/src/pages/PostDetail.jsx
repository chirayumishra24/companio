import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import PostCard from "../components/PostCard";
import CommentSection from "../components/CommentSection";
import { API_BASE, authHeaders } from "../lib/config";

export default function PostDetail({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPostDetail = async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/api/posts/${id}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPost(data);
      } else {
        const errData = await res.json();
        setError(errData.message || "Failed to load post details.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetail();
  }, [id]);

  const handleLike = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/like`, {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) => ({
          ...prev,
          likes: data.liked
            ? [...prev.likes, currentUser.email]
            : prev.likes.filter((e) => e !== currentUser.email),
          likesCount: data.likesCount,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (content, parentCommentId = "") => {
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/comment`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, parentCommentId }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setPost((prev) => ({
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1,
          comments: [...(prev.comments || []), newComment],
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setPost((prev) => ({
          ...prev,
          commentsCount: Math.max(0, (prev.commentsCount || 0) - 1),
          comments: prev.comments.filter((c) => c._id !== commentId),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-yellow flex items-center justify-center">
        <div className="neo-card bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] font-black uppercase text-2xl text-center">
          Loading Post... ✈️
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-brutal-yellow py-12 px-4">
        <div className="max-w-2xl mx-auto neo-card bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] text-center">
          <span className="text-4xl block mb-4">⚠️</span>
          <h2 className="font-black text-2xl uppercase mb-2">Error</h2>
          <p className="font-bold text-gray-600 mb-6">{error || "Post not found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-brutal-green hover:bg-black hover:text-white border-4 border-black font-black uppercase px-6 py-3 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all inline-block"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-yellow py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="bg-white hover:bg-brutal-cyan border-4 border-black font-black uppercase px-4 py-2 mb-6 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm inline-block"
        >
          ← Back
        </button>

        <PostCard
          post={post}
          currentUserEmail={currentUser.email}
          onLike={handleLike}
          onDelete={handleDeletePost}
        />

        <div className="neo-card bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
          <CommentSection
            comments={post.comments || []}
            currentUserEmail={currentUser.email}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
          />
        </div>
      </div>
    </div>
  );
}
