import React from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../lib/config';

const MARQUEE_ITEMS = [
    'MATCH BY VIBE',
    'PLAN WITH AI',
    'EXPLORE TOGETHER',
    'MUTUAL CHAT ONLY',
    'SMART ITINERARIES',
    'GOOGLE MAPS LINKS',
    'SAFE & PRIVATE',
    'TRAVEL SMARTER',
];

export default function Hero() {
    const isAuthenticated = Boolean(getToken());
    const marqueeText = MARQUEE_ITEMS.map((t) => `${t}  ✦  `).join('');

    return (
        <div className="bg-brutal-bg noise-overlay relative">
            {/* Animated background grid */}
            <div className="animated-grid" />

            {/* ===== HERO SECTION ===== */}
            <section className="min-h-[82vh] border-b-8 border-black relative overflow-hidden px-4 py-12 md:py-16 diagonal-stripes">

                {/* Floating geometric accents */}
                <div className="absolute top-6 left-6 w-20 h-20 md:w-36 md:h-36 bg-brutal-pink border-4 border-black rounded-full opacity-70 float-up" />
                <div className="absolute top-1/3 right-12 w-12 h-12 md:w-20 md:h-20 bg-brutal-yellow border-4 border-black rotate-45 opacity-60 float-side" />
                <div className="absolute bottom-10 right-8 w-32 h-32 md:w-48 md:h-48 bg-brutal-cyan border-4 border-black -rotate-12 opacity-60 float-up" style={{ animationDelay: '1.5s' }} />
                <div className="absolute bottom-24 left-1/4 w-10 h-10 md:w-16 md:h-16 bg-brutal-green border-4 border-black rounded-full opacity-50 float-side" style={{ animationDelay: '2s' }} />
                <div className="absolute top-16 right-1/3 w-8 h-8 md:w-14 md:h-14 bg-brutal-purple border-4 border-black opacity-50 float-up" style={{ animationDelay: '3s' }} />

                <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <p className="inline-block bg-white border-4 border-black px-3 py-1 font-black uppercase text-sm mb-4 shadow-brutal-sm anim-enter">
                            Travel Companions, Not Just Swipes
                        </p>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95] anim-enter anim-delay-1">
                            Meet Your Next
                            <span className="block bg-brutal-yellow border-4 border-black px-3 py-2 mt-2 -rotate-1 w-fit shadow-brutal pulse-shadow">
                                Trip Partner
                            </span>
                        </h1>
                        <p className="mt-6 text-lg md:text-xl font-bold max-w-xl bg-white border-4 border-black p-4 shadow-brutal-sm anim-enter anim-delay-2">
                            Companio helps solo travelers match by vibe, destination, and travel style, then plan trips together with AI-generated itineraries and map links.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3 anim-enter anim-delay-3">
                            {isAuthenticated ? (
                                <Link to="/matches" className="neo-btn bg-brutal-green text-lg shadow-brutal-lg">Start Discovering</Link>
                            ) : (
                                <Link to="/signup" className="neo-btn bg-brutal-green text-lg shadow-brutal-lg">Create Free Account</Link>
                            )}
                            <Link to="/itinerary-assistant" className="neo-btn bg-white text-lg">Try AI Planner</Link>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="neo-card bg-white rotate-1 anim-enter anim-delay-1">
                            <p className="text-sm font-black uppercase bg-brutal-cyan border-2 border-black px-2 py-1 inline-block">Smart Matching</p>
                            <h3 className="text-2xl font-black mt-3 uppercase">Swipe by travel vibe</h3>
                            <p className="font-semibold mt-2">Like or pass profiles and unlock chat on mutual match only.</p>
                        </div>
                        <div className="neo-card bg-brutal-yellow -rotate-1 anim-enter anim-delay-2">
                            <p className="text-sm font-black uppercase bg-white border-2 border-black px-2 py-1 inline-block">Private Chat</p>
                            <h3 className="text-2xl font-black mt-3 uppercase">Plan together safely</h3>
                            <p className="font-semibold mt-2">Messaging is restricted to mutual matches to reduce spam and abuse.</p>
                        </div>
                        <div className="neo-card bg-brutal-cyan -rotate-1 sm:col-span-2 anim-enter anim-delay-3 glow-card">
                            <p className="text-sm font-black uppercase bg-white border-2 border-black px-2 py-1 inline-block">AI Itinerary</p>
                            <h3 className="text-2xl font-black mt-3 uppercase">Instant trip blueprint</h3>
                            <p className="font-semibold mt-2">Generate day-wise itinerary with direct Google Maps links for each stop.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SCROLLING MARQUEE TICKER ===== */}
            <div className="marquee-strip">
                <div className="marquee-content">
                    <span>{marqueeText}</span>
                    <span>{marqueeText}</span>
                </div>
            </div>

            {/* ===== FEATURES SECTION ===== */}
            <section className="py-14 md:py-20 px-4 border-b-8 border-black relative diagonal-stripes">
                <div className="max-w-6xl mx-auto relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black uppercase mb-10 inline-block bg-brutal-pink text-white border-4 border-black px-4 py-2 shadow-brutal-lg anim-enter">
                        Built For Public Launch
                    </h2>

                    <div className="grid md:grid-cols-3 gap-6">
                        <article className="neo-card bg-white anim-enter anim-delay-1">
                            <div className="text-4xl mb-3">🔐</div>
                            <h3 className="font-black text-2xl uppercase mb-2">1. Account Security</h3>
                            <p className="font-semibold">JWT auth, protected API routes, and restricted profile mutation paths.</p>
                        </article>
                        <article className="neo-card bg-brutal-yellow anim-enter anim-delay-2">
                            <div className="text-4xl mb-3">🚀</div>
                            <h3 className="font-black text-2xl uppercase mb-2">2. Real User Flow</h3>
                            <p className="font-semibold">Signup, profile setup, discovery, mutual matches, and messaging in one flow.</p>
                        </article>
                        <article className="neo-card bg-brutal-cyan anim-enter anim-delay-3">
                            <div className="text-4xl mb-3">🤖</div>
                            <h3 className="font-black text-2xl uppercase mb-2">3. AI Planning Layer</h3>
                            <p className="font-semibold">Groq/OpenAI fallback support with actionable map links to plan faster.</p>
                        </article>
                    </div>
                </div>
            </section>

            {/* ===== STATS STRIP ===== */}
            <section className="bg-brutal-purple text-white border-b-8 border-black py-8 px-4">
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
                    <div className="anim-enter anim-delay-1">
                        <p className="text-4xl md:text-5xl font-black">∞</p>
                        <p className="font-bold text-sm uppercase mt-1">Possibilities</p>
                    </div>
                    <div className="anim-enter anim-delay-2">
                        <p className="text-4xl md:text-5xl font-black">AI</p>
                        <p className="font-bold text-sm uppercase mt-1">Powered Plans</p>
                    </div>
                    <div className="anim-enter anim-delay-3">
                        <p className="text-4xl md:text-5xl font-black">🔒</p>
                        <p className="font-bold text-sm uppercase mt-1">Privacy First</p>
                    </div>
                    <div className="anim-enter anim-delay-4">
                        <p className="text-4xl md:text-5xl font-black">🗺️</p>
                        <p className="font-bold text-sm uppercase mt-1">Map Links</p>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
            <footer className="bg-black text-white py-10 px-4 relative overflow-hidden">
                {/* Subtle accent in footer */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-3 bg-brutal-yellow" />
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-5 items-center justify-between relative z-10">
                    <div>
                        <p className="text-3xl font-black tracking-tighter text-brutal-yellow">COMPANIO.</p>
                        <p className="font-semibold text-sm mt-1 text-gray-400">Match. Plan. Travel.</p>
                    </div>
                    <div className="flex gap-5 font-black uppercase text-sm">
                        <span className="text-brutal-pink hover:underline cursor-default">Privacy-first</span>
                        <span className="text-brutal-cyan hover:underline cursor-default">Mutual-chat</span>
                        <span className="text-brutal-green hover:underline cursor-default">AI-ready</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
