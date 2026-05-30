import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ImageCarousel from "./ImageCarousel";
import { assetUrl, authHeaders, API_BASE } from "../lib/config";

export default function PostCard({ post, currentUserEmail, onLike, onDelete }) {
  const isOwner = post.authorEmail?.toLowerCase() === currentUserEmail?.toLowerCase();
  const likedByMe = post.likes?.includes(currentUserEmail);
  const [isBookmarked, setIsBookmarked] = useState(!!post.bookmarked);

  useEffect(() => {
    setIsBookmarked(!!post.bookmarked);
  }, [post.bookmarked]);

  const handleBookmarkToggle = async (e) => {
    e.preventDefault();
    const method = isBookmarked ? "DELETE" : "POST";
    try {
      const res = await fetch(`${API_BASE}/api/posts/${post._id}/bookmark`, {
        method,
        headers: authHeaders(),
      });
      if (res.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  const authorAvatar = post.author?.profilePhoto
    ? assetUrl(`uploads/${post.author.profilePhoto}`)
    : "/static/images/default-avatar.png";

  const renderTags = (caption = "", tags = []) => {
    if (!caption) return null;
    const parts = caption.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        const tag = part.slice(1).toLowerCase();
        return (
          <Link
            key={index}
            to={`/tag/${tag}`}
            className="text-brutal-blue font-black hover:underline mr-1"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <div className="neo-card bg-white border-4 border-black p-6 mb-8 shadow-[8px_8px_0px_0px_#000] relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-3">
        <Link
          to={`/u/${post.author?.username || post.authorEmail}`}
          className="flex items-center space-x-3 group"
        >
          <img
            src={authorAvatar}
            alt={post.author?.firstName}
            className="w-10 h-10 rounded-full border-2 border-black object-cover"
          />
          <div>
            <h3 className="font-black text-black group-hover:underline text-sm md:text-base">
              {post.author?.firstName || post.authorEmail}
            </h3>
            <span className="text-xs font-bold text-gray-500 block">
              @{post.author?.username || "traveler"}
            </span>
          </div>
        </Link>
        <div className="flex items-center space-x-2">
          {post.location && (
            <Link
              to={`/location/${encodeURIComponent(post.location)}`}
              className="text-xs font-bold px-2 py-1 bg-brutal-yellow border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-black hover:text-white transition-all block"
            >
              📍 {post.location}
            </Link>
          )}
          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(post._id)}
              className="bg-brutal-pink hover:bg-red-500 text-black border-2 border-black p-1 text-xs font-bold shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              title="Delete Post"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Images Carousel */}
      {post.images && post.images.length > 0 && (
        <div className="mb-4">
          <ImageCarousel images={post.images} />
        </div>
      )}

      {/* Caption */}
      <div className="mb-4 text-black font-semibold text-sm md:text-base whitespace-pre-wrap">
        {renderTags(post.caption, post.tags)}
      </div>

      {/* Footer/Actions */}
      <div className="flex items-center justify-between border-t-2 border-black pt-3 mt-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onLike(post._id)}
            className={`border-2 border-black font-black uppercase text-xs md:text-sm px-4 py-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center space-x-2 ${
              likedByMe ? "bg-brutal-pink" : "bg-white hover:bg-brutal-pink"
            }`}
          >
            <span>{likedByMe ? "❤️" : "🤍"}</span>
            <span>{post.likesCount || 0}</span>
          </button>
          <Link
            to={`/post/${post._id}`}
            className="bg-brutal-cyan hover:bg-black hover:text-white border-2 border-black font-black uppercase text-xs md:text-sm px-4 py-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center space-x-2"
          >
            <span>💬</span>
            <span>{post.commentsCount || 0}</span>
          </Link>
          <button
            onClick={handleBookmarkToggle}
            className={`border-2 border-black font-black uppercase text-xs md:text-sm px-4 py-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center space-x-2 ${
              isBookmarked ? "bg-brutal-yellow" : "bg-white hover:bg-brutal-yellow"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark Post"}
          >
            <span>{isBookmarked ? "🔖" : "📁"}</span>
          </button>
        </div>
        <span className="text-xs text-gray-500 font-bold">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
