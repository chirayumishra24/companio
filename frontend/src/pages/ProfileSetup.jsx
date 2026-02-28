import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetup() {
    const [formData, setFormData] = useState({
        firstName: '',
        gender: '',
        interestedIn: '',
        travelType: '',
        bio: ''
    });
    const [photos, setPhotos] = useState([]);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setPhotos(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const token = localStorage.getItem('token');

        if (!token) return navigate('/login');

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));

        for (let i = 0; i < photos.length; i++) {
            data.append('photos[]', photos[i]);
        }

        try {
            await axios.post('http://localhost:3000/auth/profile-setup', data, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            navigate('/matches');
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

                <form onSubmit={handleSubmit} className="neo-card bg-white mt-8 space-y-6">

                    <div>
                        <label className="block text-xl font-black uppercase mb-2">First Name</label>
                        <input
                            name="firstName"
                            type="text"
                            className="neo-input"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xl font-black uppercase mb-2">Gender</label>
                            <select name="gender" className="neo-input" onChange={handleInputChange} value={formData.gender}>
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-Binary">Non-Binary</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xl font-black uppercase mb-2">Interested In</label>
                            <select name="interestedIn" className="neo-input" onChange={handleInputChange} value={formData.interestedIn}>
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Everyone">Everyone</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xl font-black uppercase mb-2">Travel Style</label>
                        <select name="travelType" className="neo-input" onChange={handleInputChange} value={formData.travelType}>
                            <option value="">Select your vibe...</option>
                            <option value="Backpacker">Backpacker 🎒</option>
                            <option value="Luxury">Luxury 🥂</option>
                            <option value="Adventure">Adventure 🧗</option>
                            <option value="Chill">Chill & Relax 🌴</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xl font-black uppercase mb-2">Bio</label>
                        <textarea
                            name="bio"
                            className="neo-input min-h-[150px]"
                            placeholder="Tell us about your dream trip..."
                            value={formData.bio}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="bg-brutal-yellow p-4 border-4 border-black">
                        <label className="block text-xl font-black uppercase mb-2">Photos (Up to 6)</label>
                        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="font-bold border-2 border-black p-2 bg-white w-full cursor-pointer" />
                    </div>

                    <button type="submit" className="neo-btn bg-brutal-cyan text-2xl w-full mt-8 uppercase tracking-widest">
                        Save Profile
                    </button>
                </form>
            </div>
        </div>
    );
}
