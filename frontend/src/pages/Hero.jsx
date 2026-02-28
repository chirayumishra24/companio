import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useRive } from '@rive-app/react-canvas';
import ParallaxCarousel from '../components/ParallaxCarousel';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
    const heroTextRef = useRef(null);

    // Setup GSAP Scroll Animations
    useEffect(() => {
        // Parallax and fade out the hero text on scroll down
        gsap.to(heroTextRef.current, {
            y: 150,
            opacity: 0,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: heroTextRef.current,
                start: 'top 20%',
                end: 'bottom top',
                scrub: 1, // Smooth scrubbing
            }
        });

    }, []);

    // Basic Rive Animation Hook for a generic mascot/element
    const { RiveComponent } = useRive({
        src: 'https://cdn.rive.app/animations/vehicles.riv',
        stateMachines: 'bumpy',
        autoplay: true,
    });

    // Mock Review Data for the 3D Carousel
    const reviews = [
        { id: 1, author: "Aditi S.", review: "Found the perfect travel buddy for my Spiti adventure!", rating: 5, color: "#FFD000" }, // brutal-yellow
        { id: 2, author: "Rahul M.", review: "Companio made my solo trip to Goa less lonely and way more fun.", rating: 4, color: "#00E5FF" }, // brutal-cyan
        { id: 3, author: "Priya K.", review: "Matched with someone going to the same concert in Mumbai!", rating: 5, color: "#FF499E" }, // brutal-pink
        { id: 4, author: "Jay & Nikhil", review: "Great app for finding trekking partners for Ladakh.", rating: 5, color: "#00FF66" }, // brutal-green
        { id: 5, author: "Meera T.", review: "Safe and genuine travelers. Best UI experience ever!", rating: 5, color: "#A64AFF" }, // brutal-purple
        { id: 6, author: "Arjun V.", review: "Vibes matched perfectly. Thanks Companio!", rating: 4, color: "#FFFFFF" }, // white
    ];

    return (
        <div className="bg-brutal-bg">
            {/* Hero Section with Video Background and GSAP */}
            <section className="min-h-[90vh] flex items-center justify-center p-8 border-b-8 border-black relative overflow-hidden">

                {/* Dynamic Video Background */}
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover opacity-90"
                    >
                        {/* Travel placeholder video */}
                        <source src="https://videos.pexels.com/video-files/3015509/3015509-uhd_2560_1440_24fps.mp4" type="video/mp4" />
                    </video>
                    {/* Brutalism overlay mix */}
                    <div className="absolute inset-0 bg-brutal-bg mix-blend-color opacity-40"></div>
                    <div className="absolute inset-0 bg-black opacity-40"></div>
                </div>

                {/* Decorative Animated Elements */}
                {/* We keep the motion div floating around */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-20 left-10 w-32 h-32 bg-brutal-yellow border-4 border-black mix-blend-screen opacity-90 z-10 hidden md:block"
                />

                <div ref={heroTextRef} className="max-w-5xl mx-auto text-center relative z-20">
                    <motion.h1
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", bounce: 0.5, duration: 1 }}
                        className="text-6xl md:text-8xl font-black mb-6 uppercase tracking-tighter leading-tight text-white drop-shadow-md"
                    >
                        Find Your Next <br />
                        <motion.span
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            className="bg-brutal-pink text-black px-4 border-4 border-black inline-block -rotate-2 transform shadow-brutal transition-transform cursor-pointer"
                        >
                            Adventure
                        </motion.span> Buddy.
                    </motion.h1>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl md:text-3xl font-bold mb-10 max-w-3xl mx-auto bg-white text-black p-4 border-4 border-black shadow-brutal inline-block"
                    >
                        Connect with like-minded travelers. Stop waiting for your friends to agree on a date. <span className="underline decoration-brutal-cyan decoration-8 underline-offset-4">Pack your bags.</span>
                    </motion.p>

                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col md:flex-row gap-6 justify-center items-center"
                    >
                        <Link to="/signup" className="neo-btn bg-brutal-green text-2xl px-10 py-5 w-full md:w-auto">
                            START SOMETHING EPIC
                        </Link>

                        {/* Rive Canvas Container */}
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white border-4 border-black rounded-full overflow-hidden shadow-brutal flex-shrink-0 relative group">
                            <RiveComponent className="w-full h-full transform scale-150" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 3D PARALLAX REVIEWS CAROUSEL SECTION */}
            <section className="py-24 px-8 bg-brutal-cyan border-b-8 border-black overflow-hidden relative">
                <div className="max-w-6xl mx-auto flex flex-col items-center">

                    {/* GSAP / Framer Parallax Title */}
                    <motion.h2
                        initial={{ opacity: 0, y: -50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-5xl md:text-7xl font-black mb-10 text-center uppercase tracking-tight bg-white inline-block px-8 py-4 border-4 border-black shadow-brutal rotate-1"
                    >
                        VIBE CHECKS
                    </motion.h2>

                    <p className="text-xl font-bold bg-brutal-yellow border-2 border-black inline-block px-4 py-2 -rotate-2 mb-10 shadow-brutal-sm">
                        Drag to spin the reviews 👈👉
                    </p>

                    <div className="w-full min-h-[500px] flex items-center justify-center -mt-10">
                        <ParallaxCarousel items={reviews} />
                    </div>

                </div>
            </section>

            {/* Footer */}
            <footer className="bg-black text-white py-12 px-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-4xl font-black tracking-tighter text-brutal-yellow">COMPANIO.</div>
                    <div className="flex gap-6 font-bold uppercase">
                        <a href="#" className="hover:text-brutal-pink transition-colors">Privacy</a>
                        <a href="#" className="hover:text-brutal-cyan transition-colors">Terms</a>
                        <a href="#" className="hover:text-brutal-green transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
