import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-4">
      <div className="neo-card bg-white max-w-xl w-full text-center">
        <div className="inline-block bg-brutal-pink text-white border-4 border-black px-4 py-2 font-black text-xl mb-4">
          404
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase mb-3">Page Not Found</h1>
        <p className="font-bold mb-6">
          The page you requested does not exist, or the route moved.
        </p>
        <Link to="/" className="neo-btn bg-brutal-cyan inline-block">
          Back To Home
        </Link>
      </div>
    </div>
  );
}
