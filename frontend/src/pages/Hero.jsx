import React from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
    return (
        <div className="bg-brutal-bg">
            {/* Hero Section */}
            <section className="min-h-[80vh] flex items-center justify-center p-8 border-b-8 border-black relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute top-10 left-10 w-32 h-32 bg-brutal-pink border-4 border-black rounded-full mix-blend-multiply opacity-80 animate-pulse"></div>
                <div className="absolute bottom-10 right-20 w-48 h-48 bg-brutal-cyan border-4 border-black mix-blend-multiply opacity-80 rotate-12"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-6xl md:text-8xl font-black mb-6 uppercase tracking-tighter drop-shadow-md leading-tight">
                        Find Your Next <br />
                        <span className="bg-brutal-yellow px-4 border-4 border-black inline-block -rotate-2 transform">Adventure</span> Buddy.
                    </h1>
                    <p className="text-xl md:text-2xl font-bold mb-10 max-w-2xl mx-auto bg-white p-4 border-4 border-black shadow-brutal inline-block">
                        Connect with like-minded travelers. Stop waiting for your friends to agree on a date. Pack your bags.
                    </p>
                    <div className="flex gap-6 justify-center">
                        <Link to="/signup" className="neo-btn bg-brutal-green text-2xl px-10 py-5">
                            START SOMETHING EPIC
                        </Link>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 px-8 bg-brutal-pink border-b-8 border-black">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-5xl font-black mb-12 text-center uppercase tracking-tight bg-white inline-block px-6 py-2 border-4 border-black shadow-brutal relative left-1/2 -translate-x-1/2">
                        What Our Travelers Say
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Testimonial 1 */}
                        <div className="neo-card bg-brutal-yellow transform rotate-1 hover:rotate-0 transition-transform">
                            <h3 className="text-2xl font-black mb-2 uppercase border-b-4 border-black pb-2">Aditi & Rohan</h3>
                            <p className="font-medium text-lg mb-4">"Thanks to Companio, I found a like-minded solo traveler heading to Spiti Valley. It turned into a journey of a lifetime."</p>
                            <div className="bg-white p-2 border-2 border-black font-bold text-sm">SPITI VALLEY</div>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="neo-card bg-brutal-cyan transform -rotate-2 hover:rotate-0 transition-transform">
                            <h3 className="text-2xl font-black mb-2 uppercase border-b-4 border-black pb-2">Meera & Tanvi</h3>
                            <p className="font-medium text-lg mb-4">"I was nervous about going solo to the Northeast. Companio matched me with another girl traveling to Meghalaya—now we're best friends!"</p>
                            <div className="bg-white p-2 border-2 border-black font-bold text-sm">MEGHALAYA</div>
                        </div>

                        {/* Testimonial 3 */}
                        <div className="neo-card bg-white transform rotate-2 hover:rotate-0 transition-transform">
                            <h3 className="text-2xl font-black mb-2 uppercase border-b-4 border-black pb-2">Jay & Nikhil</h3>
                            <p className="font-medium text-lg mb-4">"From being strangers to sharing campsites in Ladakh—Companio made it easy to connect with safe, genuine travelers."</p>
                            <div className="bg-brutal-green p-2 border-2 border-black font-bold text-sm">LADAKH</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-white py-12 px-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-4xl font-black tracking-tighter text-brutal-yellow">COMPANIO.</div>
                    <div className="flex gap-6 font-bold uppercase">
                        <a href="#" className="hover:text-brutal-pink hover:-translate-y-1 transition-transform">Privacy</a>
                        <a href="#" className="hover:text-brutal-cyan hover:-translate-y-1 transition-transform">Terms</a>
                        <a href="#" className="hover:text-brutal-green hover:-translate-y-1 transition-transform">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
