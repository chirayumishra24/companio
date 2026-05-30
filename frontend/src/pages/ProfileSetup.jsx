import React, { useState, useEffect } from 'react';
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
    const [usernameStatus, setUsernameStatus] = useState({ loading: false, available: true, message: "" });
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
        setPhotos(e.target.files);
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
                <h1 className="text-5xl font-black uppercase mb-8 border-b-8 border-black pb-4 inline-block bg-brutal-pink px-4 rotate-1 shadow-brutal">
                    Complete Your Vibe
                </h1>

                {error && (
                    <div className="bg-red-500 text-white font-bold p-3 border-4 border-black mb-6 shadow-brutal-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="neo-card bg-white mt-8 space-y-6 p-6 border-4 border-black shadow-[8px_8px_0px_0px_#000]">
                    
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

                    <div className="bg-brutal-yellow p-4 border-4 border-black shadow-[4px_4px_0px_0px_#000]">
                        <label className="block text-xl font-black uppercase mb-2">Photos (Up to 6)</label>
                        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="font-bold border-2 border-black p-2 bg-white w-full cursor-pointer" />
                        <p className="text-xs font-black uppercase mt-1 text-gray-700">First image will also serve as your Profile Banner!</p>
                    </div>

                    <button type="submit" className="neo-btn bg-brutal-cyan text-2xl w-full mt-8 uppercase tracking-widest border-4 border-black py-3 font-black shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all hover:bg-black hover:text-white">
                        Save Profile
                    </button>
                </form>
            </div>
        </div>
    );
}
