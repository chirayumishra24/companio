import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRive } from '@rive-app/react-canvas';
import { API_BASE, setToken } from '../lib/config';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Rive Mascot for Signup
    const { RiveComponent } = useRive({
        src: 'https://cdn.rive.app/animations/vehicles.riv',
        stateMachines: 'idle',
        autoplay: true,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            const response = await axios.post(`${API_BASE}/auth/signup`, {
                email, password
            });

            setToken(response.data.token);
            navigate('/profile-setup');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE}/auth/google`;
    };

    return (
        <div className="min-h-screen bg-brutal-yellow flex flex-col md:flex-row items-center justify-center p-4 layout-bg-pattern gap-8 overflow-hidden">

            {/* Signup Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, rotate: 1 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="neo-card w-full max-w-md bg-white relative z-10"
            >
                <h2 className="text-4xl font-black mb-6 uppercase border-b-8 border-black pb-4 text-center">New Passenger <br />Manifest</h2>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-red-500 text-white font-bold p-3 border-4 border-black mb-6 shadow-brutal-sm text-center"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <label className="block text-lg font-black uppercase mb-1">Email Channel</label>
                        <input
                            type="email"
                            className="neo-input bg-brutal-bg"
                            placeholder="you@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <label className="block text-lg font-black uppercase mb-1">Secret Key</label>
                        <input
                            type="password"
                            className="neo-input bg-brutal-bg"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <label className="block text-lg font-black uppercase mb-1">Confirm Secret</label>
                        <input
                            type="password"
                            className="neo-input bg-brutal-bg"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.02, rotate: -1 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="neo-btn bg-brutal-green text-black w-full text-2xl uppercase tracking-tighter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0 active:translate-y-2 transition-all p-4 mt-4"
                    >
                        Initiate Voyage
                    </motion.button>
                </form>

                <div className="my-8 border-b-4 border-black relative">
                    <span className="absolute bg-white px-4 font-black left-1/2 -translate-x-1/2 -top-3 text-sm">GUEST PROTOCOL</span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={handleGoogleLogin}
                    className="neo-btn bg-white w-full text-lg uppercase flex items-center justify-center gap-3 border-4"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                    Passport via Google
                </motion.button>

                <p className="mt-8 text-center font-bold text-lg">
                    Back in the system? <Link to="/login" className="text-brutal-pink hover:underline inline-block border-b-2 border-transparent hover:border-brutal-pink uppercase font-black">Login Protocol</Link>
                </p>
            </motion.div>

            {/* Mascot Container */}
            <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden md:flex flex-col items-center justify-center order-first md:order-last"
            >
                <div className="w-80 h-80 bg-white border-8 border-black shadow-brutal rounded-full overflow-hidden relative">
                    <RiveComponent className="w-full h-full scale-110 transform" />
                </div>
                <div className="mt-6 bg-brutal-pink text-white border-4 border-black px-6 py-2 font-black text-xl -rotate-3 shadow-brutal-sm">
                    START THE ENGINE!
                </div>
            </motion.div>
        </div>
    );
}
