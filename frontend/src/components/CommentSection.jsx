import React, { useState } from "react";
import { Link } from "react-router-dom";
import { assetUrl } from "../lib/config";

export default function CommentSection({ comments = [], currentUserEmail, onAddComment, onDeleteComment }) {
  const [content, setContent] = useState("");
  const [replyToId, setReplyToId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddComment(content, replyToId);
    setContent("");
    setReplyToId(null);
  };

  // Group top-level comments and replies
  const topLevel = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId) => comments.filter((c) => c.parentCommentId === parentId);

  const renderComment = (comment, isReply = false) => {
    const isOwner = comment.authorEmail?.toLowerCase() === currentUserEmail?.toLowerCase();
    const avatar = comment.author?.profilePhoto
      ? assetUrl(`uploads/${comment.author.profilePhoto}`)
      : "/static/images/default-avatar.png";

    return (
      <div
        key={comment._id}
        className={`neo-card p-4 bg-white border-2 border-black mb-3 shadow-[2px_2px_0px_0px_#000] ${
          isReply ? "ml-8 bg-gray-50 border-dashed" : ""
        }`}
      >
        <div className="flex items-start justify-between">
          <Link
            to={`/u/${comment.author?.username || comment.authorEmail}`}
            className="flex items-center space-x-2 group"
          >
            <img
              src={avatar}
              alt={comment.author?.firstName}
              className="w-8 h-8 rounded-full border border-black object-cover"
            />
            <div>
              <span className="font-bold text-sm block group-hover:underline">
                @{comment.author?.username || comment.author?.firstName || "Traveler"}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
          </Link>
          <div className="flex items-center space-x-2">
            {!isReply && (
              <button
                onClick={() => setReplyToId(comment._id)}
                className="text-xs font-bold px-2 py-1 bg-brutal-cyan hover:bg-black hover:text-white border border-black transition-all"
              >
                Reply
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => onDeleteComment(comment._id)}
                className="text-xs font-bold px-2 py-1 bg-brutal-pink hover:bg-red-500 hover:text-white border border-black transition-all"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-sm text-black font-semibold">{comment.content}</p>
      </div>
    );
  };

  return (
    <div className="mt-4">
      <h3 className="font-black text-xl mb-4 uppercase border-b-4 border-black pb-2">
        Comments ({comments.length})
      </h3>

      {replyToId && (
        <div className="mb-2 p-2 bg-brutal-yellow border border-black flex justify-between items-center text-xs font-bold">
          <span>Replying to a comment...</span>
          <button onClick={() => setReplyToId(null)} className="underline">
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-6 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Add a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-black shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:bg-yellow-50 font-bold"
        />
        <button
          type="submit"
          className="bg-brutal-green hover:bg-black hover:text-white border-2 border-black font-black uppercase px-4 py-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          Post
        </button>
      </form>

      <div className="space-y-4">
        {topLevel.length === 0 ? (
          <p className="text-gray-500 font-bold text-center py-4 uppercase">
            No comments yet. Start the conversation!
          </p>
        ) : (
          topLevel.map((comment) => (
            <div key={comment._id}>
              {renderComment(comment)}
              {getReplies(comment._id).map((reply) => renderComment(reply, true))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
