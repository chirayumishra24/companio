import React from "react";
import { Link } from "react-router-dom";
import { assetUrl } from "../lib/config";

export default function UserCard({ user, isFollowing, onFollowToggle, showFollow = true }) {
  const avatar = user.profilePhoto
    ? assetUrl(user.profilePhoto.startsWith("/uploads/") ? user.profilePhoto.substring(1) : `uploads/${user.profilePhoto}`)
    : "/static/images/default-avatar.png";

  return (
    <div className="neo-card p-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-between transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000]">
      <Link to={`/u/${user.username || user.email}`} className="flex items-center space-x-3 group">
        <img
          src={avatar}
          alt={user.firstName}
          className="w-12 h-12 rounded-full border-2 border-black object-cover"
        />
        <div>
          <h4 className="font-black text-black group-hover:underline text-base">
            {user.firstName}
          </h4>
          <span className="text-sm font-bold text-gray-500 block">
            @{user.username || user.firstName.toLowerCase()}
          </span>
          {user.currentCity && (
            <span className="text-xs text-gray-600 block mt-0.5">
              📍 {user.currentCity}
            </span>
          )}
        </div>
      </Link>
      {showFollow && onFollowToggle && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onFollowToggle(user.email);
          }}
          className={`border-2 border-black font-black uppercase text-xs px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all ${
            isFollowing ? "bg-brutal-pink hover:bg-red-400" : "bg-brutal-green hover:bg-green-400"
          }`}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      )}
    </div>
  );
}
