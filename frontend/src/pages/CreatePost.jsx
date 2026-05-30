import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, authHeaders } from "../lib/config";

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      setError("You can upload a maximum of 10 photos.");
      return;
    }
    setError("");

    const newImages = [...images, ...files];
    setImages(newImages);

    const filePreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews([...previews, ...filePreviews]);
  };

  const handleRemoveImage = (idx) => {
    const newImages = images.filter((_, i) => i !== idx);
    const newPreviews = previews.filter((_, i) => i !== idx);
    setImages(newImages);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (images.length === 0) {
      setError("Please select at least one travel photo.");
      return;
    }
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("location", location);
    formData.append("visibility", visibility);
    images.forEach((file) => {
      formData.append("images[]", file);
    });

    try {
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: authHeaders(), // multer needs boundary to be set automatically by browser, so authHeaders() shouldn't set Content-Type
        body: formData,
      });

      if (res.ok) {
        navigate("/");
      } else {
        const data = await res.json();
        setError(data.message || "Failed to create post.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brutal-green py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="neo-card bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000]">
          <h1 className="font-black text-3xl text-black uppercase mb-6 tracking-tight border-b-4 border-black pb-4">
            Share a New Adventure 📸
          </h1>

          {error && (
            <div className="neo-card bg-brutal-pink text-black border-4 border-black p-4 mb-6 font-bold uppercase shadow-[4px_4px_0px_0px_#000]">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Drag & Drop Photo upload */}
            <div>
              <label className="block font-black uppercase text-sm mb-2 text-black">
                Photos (Max 10) *
              </label>
              <div className="relative border-4 border-dashed border-black bg-yellow-50 p-8 text-center cursor-pointer hover:bg-yellow-100 transition-all">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <span className="text-4xl block mb-2">📸</span>
                <span className="font-black uppercase text-xs md:text-sm block">
                  Click to choose photos from your trip
                </span>
                <span className="text-xs font-bold text-gray-500 block mt-1 uppercase">
                  JPEG, PNG, WebP up to 5MB each
                </span>
              </div>
            </div>

            {/* Photo Previews */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-4 border-black p-4 bg-gray-50 shadow-[4px_4px_0px_0px_#000]">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-square border-2 border-black group overflow-hidden bg-white">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-brutal-pink hover:bg-red-500 border border-black p-1 text-xs font-black shadow-[1px_1px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Location Tag */}
            <div>
              <label className="block font-black uppercase text-sm mb-2 text-black">
                Tag Location
              </label>
              <input
                type="text"
                placeholder="e.g. Kyoto, Japan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] focus:outline-none focus:bg-yellow-50 font-bold uppercase text-sm"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="block font-black uppercase text-sm mb-2 text-black">
                Caption
              </label>
              <textarea
                placeholder="Tell travelers about your journey... use #hashtags!"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_#000] focus:outline-none focus:bg-yellow-50 font-bold text-sm"
              />
            </div>

            {/* Visibility Settings */}
            <div>
              <label className="block font-black uppercase text-sm mb-2 text-black">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-4 py-3 border-4 border-black bg-white shadow-[4px_4px_0px_0px_#000] focus:outline-none font-bold uppercase text-sm"
              >
                <option value="public">Public (Everyone can see)</option>
                <option value="followers">Followers Only</option>
                <option value="private">Private (Only you can see)</option>
              </select>
            </div>

            {/* Submit */}
            <div className="pt-4 flex space-x-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex-1 bg-white hover:bg-gray-100 border-4 border-black font-black uppercase px-6 py-3.5 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-brutal-yellow hover:bg-black hover:text-white border-4 border-black font-black uppercase px-6 py-3.5 shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all text-sm"
              >
                {loading ? "Posting..." : "Share Story 🚀"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
