import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

export default function Messages() {
    const { matchId } = useParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [profiles, setProfiles] = useState([]);
    const navigate = useNavigate();

    // Basic mock fetch simulating conversations list
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return navigate('/login');

        // Currently we just show a static placeholder as true realtime needs Socket.io React Context integration
        setProfiles([
            { id: '123', name: 'Aditi', lastMessage: 'See you in Spiti!' },
            { id: '456', name: 'Rohan', lastMessage: 'Did you book the tickets?' }
        ])
    }, [navigate]);

    return (
        <div className="min-h-screen bg-brutal-bg p-4 md:p-8 flex items-center justify-center">
            <div className="w-full max-w-5xl h-[80vh] flex border-8 border-black bg-white shadow-brutal-lg">

                {/* Sidebar */}
                <div className="w-1/3 border-r-8 border-black bg-brutal-yellow flex flex-col">
                    <div className="p-6 border-b-8 border-black bg-white">
                        <h2 className="text-3xl font-black uppercase tracking-tighter">Chats</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {profiles.map((p, i) => (
                            <div key={p.id} className="p-6 border-b-4 border-black hover:bg-brutal-pink hover:text-white cursor-pointer transition-colors">
                                <h3 className="text-xl font-bold uppercase">{p.name}</h3>
                                <p className="font-medium text-sm mt-1">{p.lastMessage}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="w-2/3 flex flex-col bg-slate-50 relative">
                    {matchId ? (
                        <>
                            <div className="p-6 border-b-8 border-black bg-brutal-cyan">
                                <h2 className="text-2xl font-black uppercase tracking-tighter">Chatting with Aditi</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                <div className="bg-white border-4 border-black p-4 inline-block shadow-brutal-sm max-w-[80%] rounded-tr-3xl">
                                    Hey! 👋 Are we still on for the 5th?
                                </div>

                                <div className="bg-brutal-green border-4 border-black p-4 inline-block shadow-brutal-sm max-w-[80%] self-end ml-auto text-right rounded-tl-3xl block">
                                    Yes absolutely! I got the permits sorted.
                                </div>
                            </div>

                            <div className="p-6 border-t-8 border-black bg-white">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        className="neo-input flex-1"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <button className="neo-btn bg-brutal-pink text-white px-8">SEND</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8 text-center bg-brutal-pink">
                            <h2 className="text-4xl font-black uppercase text-white bg-black p-4 inline-block rotate-2 shadow-brutal border-4 border-white">
                                Select a conversation <br />to start planning.
                            </h2>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
