import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Matches() {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return navigate('/login');

                const response = await axios.get('http://localhost:3000/api/matches', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMatches(response.data);
            } catch (error) {
                console.error('Error fetching matches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-brutal-bg flex items-center justify-center">
                <div className="text-4xl font-black animate-pulse bg-brutal-yellow p-4 border-4 border-black shadow-brutal">
                    FINDING VIBES...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brutal-bg p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-end border-b-8 border-black pb-6 mb-12">
                    <h1 className="text-6xl font-black tracking-tighter uppercase">Your Matches</h1>
                    <button
                        onClick={() => navigate('/itinerary/create')}
                        className="neo-btn bg-brutal-cyan text-xl"
                    >
                        + New Trip
                    </button>
                </header>

                {matches.length === 0 ? (
                    <div className="neo-card bg-brutal-pink text-center py-20">
                        <h2 className="text-4xl font-black text-white mb-4">No matches found right now.</h2>
                        <p className="text-xl font-bold bg-white inline-block p-2 border-2 border-black">
                            Try updating your travel preferences or adding a new itinerary!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {matches.map((match, idx) => (
                            <div key={match._id} className={`neo-card transform hover:-translate-y-2 transition-transform ${idx % 2 === 0 ? 'bg-brutal-yellow rotate-1' : 'bg-white -rotate-1'}`}>
                                {match.photos && match.photos.length > 0 ? (
                                    <img
                                        src={`http://localhost:3000/${match.photos[0]}`}
                                        alt={match.firstName}
                                        className="w-full h-48 object-cover border-4 border-black mb-4"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-brutal-bg border-4 border-black mb-4 flex items-center justify-center">
                                        <span className="font-black text-xl text-gray-400">NO PHOTO</span>
                                    </div>
                                )}

                                <h3 className="text-2xl font-black uppercase border-b-4 border-black pb-2 mb-2">
                                    {match.firstName}, {match.age || '??'}
                                </h3>

                                <div className="space-y-2 mb-6">
                                    <p className="font-bold flex items-center gap-2">
                                        <span className="bg-white border-2 border-black px-2 py-1 text-sm">DESTINATION</span>
                                        {match.itinerary?.destination || 'Anywhere'}
                                    </p>
                                    <p className="font-bold flex items-center gap-2">
                                        <span className="bg-white border-2 border-black px-2 py-1 text-sm">VIBE</span>
                                        {match.travelType || 'Chill'}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => navigate(`/profile/${match._id}`)}
                                        className="neo-btn bg-white hover:bg-gray-100 flex-1 py-2 text-sm"
                                    >
                                        VIEW
                                    </button>
                                    <button
                                        onClick={() => navigate(`/messages/${match._id}`)}
                                        className="neo-btn bg-brutal-cyan flex-1 py-2 text-sm"
                                    >
                                        CHAT
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
