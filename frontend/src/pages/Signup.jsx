import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            const response = await axios.post('http://localhost:3000/auth/signup', {
                email, password
            });

            localStorage.setItem('token', response.data.token);
            navigate('/profile-setup');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <div className="min-h-screen bg-brutal-yellow flex items-center justify-center p-4">
            <div className="neo-card w-full max-w-md bg-white rotate-1 relative">
                <h2 className="text-4xl font-black mb-6 uppercase border-b-8 border-black pb-4 text-center">Create <br />Account</h2>

                {error && (
                    <div className="bg-red-500 text-white font-bold p-3 border-4 border-black mb-6 shadow-brutal-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-lg font-black uppercase mb-2">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:shadow-brutal focus:-translate-y-1 transition-all rounded-none bg-brutal-bg font-bold"
                            placeholder="you@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-lg font-black uppercase mb-2">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:shadow-brutal focus:-translate-y-1 transition-all rounded-none bg-brutal-bg font-bold"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-lg font-black uppercase mb-2">Confirm Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 border-4 border-black focus:outline-none focus:shadow-brutal focus:-translate-y-1 transition-all rounded-none bg-brutal-bg font-bold"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="neo-btn bg-brutal-green text-black w-full text-xl uppercase tracking-wider block mt-6">
                        Sign Up
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
                    Sign up with Google
                </button>

                <p className="mt-6 text-center font-bold text-lg">
                    Already have an account? <Link to="/login" className="text-blue-600 hover:underline inline-block uppercase font-black">LOGIN</Link>
                </p>
            </div>
        </div>
    );
}
