import { Routes, Route, Link } from 'react-router-dom'
import Hero from './pages/Hero'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Matches from './pages/Matches'
import ProfileSetup from './pages/ProfileSetup'
import Messages from './pages/Messages'

function App() {
  return (
    <div className="min-h-screen">
      <nav className="border-b-4 border-black bg-brutal-yellow p-4 flex justify-between items-center backdrop-blur-sm z-50 sticky top-0">
        <Link to="/" className="text-3xl font-black tracking-tighter hover:-translate-y-1 transition-transform inline-block">COMPANIO.</Link>
        <div className="flex gap-4">
          <Link to="/matches" className="neo-btn bg-brutal-cyan py-2 px-4 shadow-brutal-sm text-sm border-2">MATCHES</Link>
          <Link to="/login" className="neo-btn bg-white py-2 px-4 shadow-brutal-sm text-sm border-2">LOGIN</Link>
          <Link to="/signup" className="neo-btn bg-brutal-pink py-2 px-4 shadow-brutal-sm text-sm text-white border-2">SIGNUP</Link>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/messages/:matchId?" element={<Messages />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
