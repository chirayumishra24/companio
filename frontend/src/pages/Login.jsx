import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post('http://localhost:3000/auth/login', {
                email, password
            });

            localStorage.setItem('token', response.data.token);
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
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <div className="min-h-screen bg-brutal-cyan flex items-center justify-center p-4 layout-bg-pattern">
            <div className="neo-card w-full max-w-md bg-white -rotate-1 relative">
                <div className="absolute -top-6 -right-6 bg-brutal-yellow border-4 border-black p-4 font-black text-2xl rotate-12 z-10 hidden md:block">
                    WELCOME BACK!
                </div>

                <h2 className="text-4xl font-black mb-6 uppercase border-b-8 border-black pb-4 text-center">Login</h2>

                {error && (
                    <div className="bg-red-500 text-white font-bold p-3 border-4 border-black mb-6 shadow-brutal-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xl font-black uppercase mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:shadow-brutal focus:-translate-y-1 transition-all rounded-none bg-brutal-bg font-bold text-lg"
                            placeholder="you@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xl font-black uppercase mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:shadow-brutal focus:-translate-y-1 transition-all rounded-none bg-brutal-bg font-bold text-lg"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="neo-btn bg-brutal-pink text-white w-full text-xl uppercase tracking-wider block">
                        Let's Go
                    </button>
                </form>

                <div className="my-6 border-b-4 border-black relative">
                    <span className="absolute bg-white px-4 font-black left-1/2 -translate-x-1/2 -top-3">OR</span>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="neo-btn bg-white w-full text-lg uppercase flex items-center justify-center gap-3"
                >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
                    Continue with Google
                </button>

                <p className="mt-6 text-center font-bold text-lg">
                    Don't have an account? <Link to="/signup" className="text-brutal-pink hover:underline inline-block border-b-2 border-transparent hover:border-brutal-pink uppercase">Sign up here</Link>
                </p>
            </div>
        </div>
    );
}
