import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { API_BASE, authHeaders, assetUrl } from "../lib/config";

export default function PublicProfile({ currentUser }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("posts"); // "posts" | "info"

  const isOwnProfile =
    !username ||
    username.toLowerCase() === currentUser.email.toLowerCase() ||
    (profile && profile.username && profile.username.toLowerCase() === username.toLowerCase());

  const fetchProfileData = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "";
      if (username) {
        url = `${API_BASE}/api/profile/public/${encodeURIComponent(username)}`;
      } else {
        // Fallback to own profile first to get username, then load public details
        const ownRes = await fetch(`${API_BASE}/api/profile`, {
          headers: authHeaders(),
        });
        if (ownRes.ok) {
          const ownProfile = await ownRes.json();
          const uname = ownProfile.username || ownProfile.firstName.toLowerCase();
          url = `${API_BASE}/api/profile/public/${encodeURIComponent(uname)}`;
        } else if (ownRes.status === 404) {
          navigate("/profile-setup");
          return;
        } else {
          setError("Failed to fetch profile info");
          setLoading(false);
          return;
        }
      }

      const res = await fetch(url, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setPosts(data.posts);
      } else {
        setError("User profile not found.");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    const isFollowing = !!profile.isFollowing;
    const method = isFollowing ? "DELETE" : "POST";
    try {
      const res = await fetch(`${API_BASE}/api/follow/${profile.email}`, {
        method,
        headers: authHeaders(),
      });
      if (res.ok) {
        setProfile((prev) => ({
          ...prev,
          isFollowing: !isFollowing,
          followersCount: isFollowing
            ? Math.max(0, (prev.followersCount || 0) - 1)
            : (prev.followersCount || 0) + 1,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brutal-purple flex items-center justify-center">
        <div className="neo-card bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] font-black uppercase text-2xl text-center">
          Loading Profile... ✈️
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-brutal-purple py-12 px-4">
        <div className="max-w-2xl mx-auto neo-card bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000] text-center">
          <span className="text-4xl block mb-4">⚠️</span>
          <h2 className="font-black text-2xl uppercase mb-2">Error</h2>
          <p className="font-bold text-gray-600 mb-6">{error || "Profile not found."}</p>
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

  const avatarUrl = profile.profilePhoto
    ? assetUrl(profile.profilePhoto.startsWith("/uploads/") ? profile.profilePhoto.substring(1) : `uploads/${profile.profilePhoto}`)
    : "/static/images/default-avatar.png";

  const coverUrl = profile.coverPhoto
    ? assetUrl(`uploads/${profile.coverPhoto}`)
    : null;

  return (
    <div className="min-h-screen bg-brutal-purple py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Profile Card */}
        <div className="neo-card bg-white border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_#000] mb-8">
          
          {/* Cover Photo / Banner */}
          <div className="h-48 w-full bg-brutal-cyan border-b-4 border-black relative overflow-hidden">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black uppercase text-xl text-black">
                Companio Traveler 🗺️
              </div>
            )}
          </div>

          {/* User Info Block */}
          <div className="p-6 relative pt-16">
            
            {/* Avatar (overlapping the banner) */}
            <div className="absolute -top-16 left-6 w-28 h-28 border-4 border-black bg-white overflow-hidden shadow-[4px_4px_0px_0px_#000]">
              <img src={avatarUrl} alt={profile.firstName} className="w-full h-full object-cover" />
            </div>

            {/* Title & Actions */}
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h1 className="font-black text-3xl text-black uppercase">{profile.firstName}</h1>
                <span className="font-bold text-gray-500 block">
                  @{profile.username || profile.firstName.toLowerCase()}
                </span>
                {profile.currentCity && (
                  <span className="text-sm font-bold text-gray-700 block mt-1">
                    📍 Based in {profile.currentCity}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {isOwnProfile ? (
                  <Link
                    to="/profile-setup"
                    className="bg-brutal-yellow hover:bg-black hover:text-white border-4 border-black font-black uppercase px-4 py-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-xs md:text-sm"
                  >
                    Edit Profile ✏️
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={handleFollowToggle}
                      className={`border-4 border-black font-black uppercase px-4 py-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-xs md:text-sm ${
                        profile.isFollowing
                          ? "bg-brutal-pink hover:bg-red-400"
                          : "bg-brutal-green hover:bg-green-400"
                      }`}
                    >
                      {profile.isFollowing ? "Unfollow" : "Follow"}
                    </button>
                    <Link
                      to={`/messages?user2=${profile.email}`}
                      className="bg-white hover:bg-brutal-cyan border-4 border-black font-black uppercase px-4 py-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-xs md:text-sm"
                    >
                      Chat 💬
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex space-x-6 border-y-2 border-black py-3 my-4">
              <div>
                <span className="font-black text-xl block text-black">{posts.length}</span>
                <span className="text-xs font-bold text-gray-500 uppercase">Posts</span>
              </div>
              <div>
                <span className="font-black text-xl block text-black">
                  {profile.followersCount || 0}
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase">Followers</span>
              </div>
              <div>
                <span className="font-black text-xl block text-black">
                  {profile.followingCount || 0}
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase">Following</span>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="font-bold text-black text-sm md:text-base mb-4 bg-yellow-50 p-4 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                "{profile.bio}"
              </p>
            )}

            {/* Countries & Travel details */}
            <div className="space-y-4 pt-4 border-t-2 border-black mt-4">
              {profile.travelCountries && profile.travelCountries.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black uppercase text-xs text-black tracking-wider flex items-center gap-1.5">
                      🗺️ Travel Footprint
                    </span>
                    <span className="bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-none border border-black">
                      {profile.travelCountries.length} {profile.travelCountries.length === 1 ? "Country" : "Countries"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.travelCountries.map((c) => (
                      <span
                        key={c}
                        className="bg-brutal-yellow text-xs font-black uppercase border-2 border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] transition-all cursor-default"
                      >
                        ✈️ {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {profile.travelType && (
                <div className="flex items-center gap-2 pt-2">
                  <span className="font-black uppercase text-xs text-black">Style:</span>
                  <span className="bg-brutal-cyan text-xs font-black uppercase border-2 border-black px-3 py-1 shadow-[2px_2px_0px_0px_#000]">
                    🎒 {profile.travelType}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-4 border-black bg-white shadow-[4px_4px_0px_0px_#000] overflow-hidden mb-8">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-3 text-center font-black uppercase text-sm transition-all ${
              activeTab === "posts"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-brutal-yellow"
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 py-3 text-center font-black uppercase text-sm transition-all ${
              activeTab === "info"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-brutal-yellow"
            }`}
          >
            About & Interests
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "posts" ? (
          posts.length === 0 ? (
            <div className="neo-card bg-white border-4 border-black p-8 text-center shadow-[8px_8px_0px_0px_#000]">
              <h3 className="font-black text-xl uppercase mb-2">No posts yet</h3>
              <p className="font-bold text-gray-500 uppercase text-xs">
                Stories shared will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="neo-card bg-white border-4 border-black overflow-hidden shadow-[4px_4px_0px_0px_#000] flex flex-col group cursor-pointer"
                  onClick={() => navigate(`/post/${post._id}`)}
                >
                  <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative border-b-2 border-black">
                    {post.images && post.images.length > 0 ? (
                      <img
                        src={assetUrl(`uploads/${post.images[0]}`)}
                        alt="Post Cover"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-black uppercase text-lg text-gray-500 bg-brutal-green">
                        Travel Story 📜
                      </div>
                    )}
                    {post.location && (
                      <span className="absolute bottom-2 left-2 text-xs font-black px-2 py-1 bg-white border border-black shadow-[1px_1px_0px_0px_#000]">
                        📍 {post.location}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <p className="font-bold text-sm text-black line-clamp-2 mb-3">
                      {post.caption}
                    </p>
                    <div className="flex justify-between items-center text-xs font-black text-gray-500 uppercase border-t border-gray-200 pt-2">
                      <span>❤️ {post.likesCount || 0} Likes</span>
                      <span>💬 {post.commentsCount || 0} Comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="neo-card bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] space-y-6">
            <div>
              <h3 className="font-black text-lg uppercase text-black border-b-2 border-black pb-2 mb-3">
                Interests & Hobbies
              </h3>
              {profile.interests && profile.interests.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="bg-brutal-pink text-xs font-black uppercase border border-black px-3 py-1.5 shadow-[2px_2px_0px_0px_#000]"
                    >
                      ⭐ {interest}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 font-bold uppercase text-xs">No interests added</p>
              )}
            </div>

            <div>
              <h3 className="font-black text-lg uppercase text-black border-b-2 border-black pb-2 mb-3">
                Preferred Companion Style
              </h3>
              <p className="font-bold text-gray-700 bg-gray-50 p-4 border border-black">
                {profile.interestedIn ? (
                  `Looking for travel buddy matching style: ${profile.interestedIn}`
                ) : (
                  "No companion preferences configured"
                )}
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
