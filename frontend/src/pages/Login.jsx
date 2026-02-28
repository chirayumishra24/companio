import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRive, useStateMachineInput } from '@rive-app/react-canvas';
import { API_BASE, setToken } from '../lib/config';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Rive Mascot Setup
    const { RiveComponent, rive } = useRive({
        src: 'https://cdn.rive.app/animations/vehicles.riv', // Placeholder mascot
        stateMachines: 'bumpy',
        autoplay: true,
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        if (token) {
            setToken(token);
            navigate('/matches', { replace: true });
        }
        const oauthError = params.get('error');
        if (oauthError) {
            setError('Google login is not configured or failed on server.');
        }
    }, [location.search, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${API_BASE}/auth/login`, {
                email, password
            });

            setToken(response.data.token);
            if (response.data.profileSetupComplete) {
                navigate('/matches');
            } else {
                navigate('/profile-setup');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE}/auth/google`;
    };

    return (
        <div className="min-h-screen bg-brutal-cyan flex flex-col md:flex-row items-center justify-center p-4 layout-bg-pattern gap-8 overflow-hidden">

            {/* Mascot Container - Visible on md+ screens */}
            <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="hidden md:flex flex-col items-center justify-center"
            >
                <div className="w-80 h-80 bg-white border-8 border-black shadow-brutal rounded-full overflow-hidden relative">
                    <RiveComponent className="w-full h-full scale-150 transform translate-y-4" />
                </div>
                <div className="mt-6 bg-brutal-yellow border-4 border-black px-6 py-2 font-black text-xl rotate-3 shadow-brutal-sm">
                    TRAVELED RECENTLY?
                </div>
            </motion.div>

            {/* Login Card */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0, rotate: -2 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className="neo-card w-full max-w-md bg-white relative z-10"
            >
                <div className="absolute -top-6 -right-6 bg-brutal-yellow border-4 border-black p-4 font-black text-2xl rotate-12 z-10">
                    WELCOME!
                </div>

                <h2 className="text-4xl font-black mb-6 uppercase border-b-8 border-black pb-4 text-center">Identity Check</h2>

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

                <form onSubmit={handleSubmit} className="space-y-6">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <label className="block text-xl font-black uppercase mb-2">Electronic Mail</label>
                        <input
                            type="email"
                            className="neo-input bg-brutal-bg text-lg"
                            placeholder="you@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </motion.div>

                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <label className="block text-xl font-black uppercase mb-2">Secret Code</label>
                        <div className="relative">
                            <input
                                type={isPasswordVisible ? "text" : "password"}
                                className="neo-input bg-brutal-bg text-lg pr-12"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-sm uppercase underline decoration-2 underline-offset-2"
                            >
                                {isPasswordVisible ? "Hide" : "Show"}
                            </button>
                        </div>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="neo-btn bg-brutal-pink text-white w-full text-2xl uppercase tracking-tighter shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none translate-y-0 active:translate-y-2 transition-all p-4"
                    >
                        Enter Terminal
                    </motion.button>
                </form>

                <div className="my-8 border-b-4 border-black relative">
                    <span className="absolute bg-white px-4 font-black left-1/2 -translate-x-1/2 -top-3 text-sm">SOCIAL OVERRIDE</span>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={handleGoogleLogin}
                    className="neo-btn bg-white w-full text-lg uppercase flex items-center justify-center gap-3 border-4"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                    Auth via Google
                </motion.button>

                <p className="mt-8 text-center font-bold text-lg">
                    New to the squad? <Link to="/signup" className="text-brutal-pink hover:underline inline-block border-b-2 border-transparent hover:border-brutal-pink uppercase">Join Here</Link>
                </p>
            </motion.div>
        </div>
    );
}
