import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE, authHeaders, getToken, setToken } from '../lib/config';

function resolveNextPath(nextValue) {
    if (!nextValue || typeof nextValue !== 'string') return '/';
    if (!nextValue.startsWith('/') || nextValue.startsWith('//')) return '/';
    return nextValue;
}

export default function ProfileSetup() {
    const [formData, setFormData] = useState({
        firstName: '',
        username: '',
        gender: '',
        interestedIn: '',
        travelType: '',
        currentCity: '',
        travelCountries: '',
        bio: ''
    });
    const [photos, setPhotos] = useState([]);
    const [previewUrl, setPreviewUrl] = useState('');
    const [usernameStatus, setUsernameStatus] = useState({ loading: false, available: true, message: "" });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const triggerFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tokenFromQuery = params.get("token");
        const rawNext = params.get("next");
        if (rawNext) {
            sessionStorage.setItem("postProfileSetupNext", resolveNextPath(rawNext));
        }
        if (tokenFromQuery) {
            setToken(tokenFromQuery);
        }
        if (tokenFromQuery || rawNext) {
            window.history.replaceState({}, "", "/profile-setup");
        }
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // Username checking effect (debounce 500ms)
    useEffect(() => {
        const username = formData.username.trim();
        if (!username) {
            setUsernameStatus({ loading: false, available: true, message: "" });
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
            setUsernameStatus({
                loading: false,
                available: false,
                message: "Username must be 3-15 alphanumeric chars or underscores."
            });
            return;
        }

        const timer = setTimeout(async () => {
            setUsernameStatus({ loading: true, available: false, message: "" });
            try {
                const res = await axios.get(`${API_BASE}/api/username/check/${username}`, {
                    headers: authHeaders()
                });
                if (res.data.available) {
                    setUsernameStatus({ loading: false, available: true, message: "Username is available! 🎉" });
                } else {
                    setUsernameStatus({ loading: false, available: false, message: res.data.message || "Username is taken." });
                }
            } catch (err) {
                setUsernameStatus({ loading: false, available: false, message: "Error checking username." });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.username]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const files = e.target.files;
        setPhotos(files);
        if (files && files[0]) {
            setPreviewUrl(URL.createObjectURL(files[0]));
        } else {
            setPreviewUrl('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const token = getToken();

        if (!token) return navigate('/login');
        if (!usernameStatus.available && formData.username.trim()) {
            setError("Please choose an available username.");
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));

        for (let i = 0; i < photos.length; i++) {
            data.append('photos[]', photos[i]);
        }

        try {
            await axios.post(`${API_BASE}/auth/profile-setup`, data, {
                headers: {
                    ...authHeaders(),
                    'Content-Type': 'multipart/form-data'
                }
            });
            const nextPath = resolveNextPath(sessionStorage.getItem("postProfileSetupNext") || "");
            sessionStorage.removeItem("postProfileSetupNext");
            navigate(nextPath);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save profile.');
        }
    };

    return (
        <div className="min-h-screen bg-brutal-bg p-8 flex justify-center items-start">
            <div className="w-full max-w-2xl">
                <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">
                    Complete Your Profile
                </h1>
                <p className="text-zinc-500 mb-8">Tell us about yourself to match with other travelers.</p>

                {error && (
                    <div className="bg-red-50 text-red-600 font-semibold p-4 rounded-xl border border-red-100 mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="neo-card bg-white mt-8 space-y-6 p-6 border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                    
                    {/* Centered Instagram-style Profile Picture Upload */}
                    <div className="flex flex-col items-center justify-center py-4 border-b-2 border-black/10">
                        <div 
                            onClick={triggerFileSelect}
                            className="w-28 h-28 rounded-full border-4 border-black overflow-hidden bg-gray-100 shadow-[4px_4px_0px_0px_#000] cursor-pointer hover:opacity-90 active:scale-95 transition-all relative group"
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-black uppercase text-center px-2">Upload</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={triggerFileSelect}
                            className="mt-3 text-sm font-black uppercase text-brutal-pink hover:text-black transition-colors"
                        >
                            Change Profile Photo
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xl font-black uppercase mb-2">First Name</label>
                        <input
                            name="firstName"
                            type="text"
                            className="neo-input w-full px-4 py-2 border-2 border-black font-bold focus:outline-none"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xl font-black uppercase mb-2">Username (@handle)</label>
                        <input
                            name="username"
                            type="text"
                            placeholder="e.g. wanderlust_sam"
                            className="neo-input w-full px-4 py-2 border-2 border-black font-bold focus:outline-none"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                        />
                        {usernameStatus.message && (
                          <p className={`text-xs font-black uppercase mt-1 ${
                            usernameStatus.available ? "text-green-600" : "text-red-500"
                          }`}>
                            {usernameStatus.message}
                          </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xl font-black uppercase mb-2">Gender</label>
                            <select name="gender" className="neo-input w-full px-4 py-2 border-2 border-black font-bold focus:outline-none" onChange={handleInputChange} value={formData.gender}>
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-Binary">Non-Binary</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xl font-black uppercase mb-2">Interested In</label>
                            <select name="interestedIn" className="neo-input w-full px-4 py-2 border-2 border-black font-bold focus:outline-none" onChange={handleInputChange} value={formData.interestedIn}>
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Everyone">Everyone</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xl font-black uppercase mb-2">Current City</label>
                            <input
                                name="currentCity"
                                type="text"
                                placeholder="e.g. Berlin"
                                className="neo-input w-full px-4 py-2 border-2 border-black font-bold focus:outline-none"
                                value={formData.currentCity}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-xl font-black uppercase mb-2">Travel Style</label>
                            <select name="travelType" className="neo-input w-full px-4 py-2 border-2 border-black font-bold focus:outline-none" onChange={handleInputChange} value={formData.travelType}>
                                <option value="">Select your vibe...</option>
                                <option value="Backpacker">Backpacker 🎒</option>
                                <option value="Luxury">Luxury 🥂</option>
                                <option value="Adventure">Adventure 🧗</option>
                                <option value="Chill">Chill & Relax 🌴</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xl font-black uppercase mb-2">Countries Visited (comma-separated)</label>
                        <input
                            name="travelCountries"
                            type="text"
                            placeholder="e.g. Japan, France, Italy"
                            className="neo-input w-full px-4 py-2 border-2 border-black font-bold focus:outline-none"
                            value={formData.travelCountries}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div>
                        <label className="block text-xl font-black uppercase mb-2">Bio</label>
                        <textarea
                            name="bio"
                            className="neo-input w-full px-4 py-2 border-2 border-black min-h-[150px] font-bold focus:outline-none"
                            placeholder="Tell us about your dream trip..."
                            value={formData.bio}
                            onChange={handleInputChange}
                        />
                    </div>


                    

                    <button type="submit" className="neo-btn bg-brutal-cyan text-2xl w-full mt-8 uppercase tracking-widest border-4 border-black py-3 font-black shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all hover:bg-black hover:text-white">
                        Save Profile
                    </button>
                </form>
            </div>
        </div>
    );
}
