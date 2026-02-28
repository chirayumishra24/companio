import React from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../lib/config';

export default function Hero() {
    const isAuthenticated = Boolean(getToken());

    return (
        <div className="bg-brutal-bg">
            <section className="min-h-[78vh] border-b-8 border-black relative overflow-hidden px-4 py-10 md:py-14">
                <div className="absolute top-6 left-6 w-24 h-24 md:w-40 md:h-40 bg-brutal-pink border-4 border-black rounded-full opacity-80"></div>
                <div className="absolute bottom-8 right-8 w-36 h-36 md:w-52 md:h-52 bg-brutal-cyan border-4 border-black -rotate-12 opacity-80"></div>

                <div className="max-w-6xl mx-auto relative z-10 grid lg:grid-cols-2 gap-8 items-center">
                    <div>
                        <p className="inline-block bg-white border-4 border-black px-3 py-1 font-black uppercase text-sm mb-4">
                            Travel Companions, Not Just Swipes
                        </p>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.95]">
                            Meet Your Next
                            <span className="block bg-brutal-yellow border-4 border-black px-3 py-2 mt-2 -rotate-1 w-fit">
                                Trip Partner
                            </span>
                        </h1>
                        <p className="mt-5 text-lg md:text-xl font-bold max-w-xl bg-white border-4 border-black p-4">
                            Companio helps solo travelers match by vibe, destination, and travel style, then plan trips together with AI-generated itineraries and map links.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            {isAuthenticated ? (
                                <Link to="/matches" className="neo-btn bg-brutal-green text-lg">Start Discovering</Link>
                            ) : (
                                <Link to="/signup" className="neo-btn bg-brutal-green text-lg">Create Free Account</Link>
                            )}
                            <Link to="/itinerary-assistant" className="neo-btn bg-white text-lg">Try AI Planner</Link>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="neo-card bg-white rotate-1">
                            <p className="text-sm font-black uppercase bg-brutal-cyan border-2 border-black px-2 py-1 inline-block">Smart Matching</p>
                            <h3 className="text-2xl font-black mt-3 uppercase">Swipe by travel vibe</h3>
                            <p className="font-semibold mt-2">Like or pass profiles and unlock chat on mutual match only.</p>
                        </div>
                        <div className="neo-card bg-brutal-yellow -rotate-1">
                            <p className="text-sm font-black uppercase bg-white border-2 border-black px-2 py-1 inline-block">Private Chat</p>
                            <h3 className="text-2xl font-black mt-3 uppercase">Plan together safely</h3>
                            <p className="font-semibold mt-2">Messaging is restricted to mutual matches to reduce spam and abuse.</p>
                        </div>
                        <div className="neo-card bg-brutal-cyan -rotate-1 sm:col-span-2">
                            <p className="text-sm font-black uppercase bg-white border-2 border-black px-2 py-1 inline-block">AI Itinerary</p>
                            <h3 className="text-2xl font-black mt-3 uppercase">Instant trip blueprint</h3>
                            <p className="font-semibold mt-2">Generate day-wise itinerary with direct Google Maps links for each stop.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 md:py-16 px-4 border-b-8 border-black">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black uppercase mb-8 inline-block bg-brutal-pink text-white border-4 border-black px-4 py-2">
                        Built For Public Launch
                    </h2>

                    <div className="grid md:grid-cols-3 gap-5">
                        <article className="neo-card bg-white">
                            <h3 className="font-black text-2xl uppercase mb-2">1. Account Security</h3>
                            <p className="font-semibold">JWT auth, protected API routes, and restricted profile mutation paths.</p>
                        </article>
                        <article className="neo-card bg-brutal-yellow">
                            <h3 className="font-black text-2xl uppercase mb-2">2. Real User Flow</h3>
                            <p className="font-semibold">Signup, profile setup, discovery, mutual matches, and messaging in one flow.</p>
                        </article>
                        <article className="neo-card bg-brutal-cyan">
                            <h3 className="font-black text-2xl uppercase mb-2">3. AI Planning Layer</h3>
                            <p className="font-semibold">Groq/OpenAI fallback support with actionable map links to plan faster.</p>
                        </article>
                    </div>
                </div>
            </section>

            <footer className="bg-black text-white py-10 px-4">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-5 items-center justify-between">
                    <div>
                        <p className="text-3xl font-black tracking-tighter text-brutal-yellow">COMPANIO.</p>
                        <p className="font-semibold text-sm mt-1">Match. Plan. Travel.</p>
                    </div>
                    <div className="flex gap-4 font-black uppercase text-sm">
                        <span className="text-brutal-pink">Privacy-first</span>
                        <span className="text-brutal-cyan">Mutual-chat</span>
                        <span className="text-brutal-green">AI-ready</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
