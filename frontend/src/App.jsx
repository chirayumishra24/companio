import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Hero from './pages/Hero';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Matches from './pages/Matches';
import ProfileSetup from './pages/ProfileSetup';
import Messages from './pages/Messages';
import SetPassword from './pages/SetPassword'; // Newly pulled from user commits

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b-8 border-black bg-brutal-yellow py-4 px-6 flex justify-between items-center z-50 sticky top-0 overflow-hidden shadow-brutal-sm">
        <Link to="/" className="inline-block relative">
          <motion.div
            className="text-4xl md:text-5xl font-black tracking-tighter flex origin-left"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, x: -50 },
              visible: {
                opacity: 1,
                x: 0,
                transition: { staggerChildren: 0.1, duration: 0.5, ease: "backOut" }
              }
            }}
          >
            {['C', 'O', 'M', 'P', 'A', 'N', 'I', 'O', '.'].map((letter, idx) => (
              <motion.span
                key={idx}
                className="inline-block hover:text-brutal-pink hover:-translate-y-2 transition-transform duration-100"
                variants={{
                  hidden: { y: -20, opacity: 0 },
                  visible: { y: 0, opacity: 1 }
                }}
                whileHover={{ scale: 1.2, rotate: (idx % 2 === 0 ? 15 : -15) }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </Link>

        <div className="flex gap-4">
          <Link to="/matches" className="neo-btn bg-brutal-cyan py-3 px-6 shadow-brutal text-sm uppercase md:text-base hidden sm:block">Matches</Link>
          <Link to="/login" className="neo-btn bg-white py-3 px-6 shadow-brutal text-sm uppercase md:text-base">Login</Link>
          <Link to="/signup" className="neo-btn bg-brutal-pink py-3 px-6 shadow-brutal text-sm uppercase text-white md:text-base">Signup</Link>
        </div>
      </nav>

      {/* Main Content Area w/ AnimatePresence Smooth Page Transitions */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* We wrap each page component in an animated PageWrapper */}
            <Route path="/" element={<PageWrapper><Hero /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
            <Route path="/signup" element={<PageWrapper><Signup /></PageWrapper>} />
            <Route path="/set-password" element={<PageWrapper><SetPassword /></PageWrapper>} />
            <Route path="/matches" element={<PageWrapper><Matches /></PageWrapper>} />
            <Route path="/profile-setup" element={<PageWrapper><ProfileSetup /></PageWrapper>} />
            <Route path="/messages/:matchId?" element={<PageWrapper><Messages /></PageWrapper>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  )
}

function PageWrapper({ children }) {
  // A brutalism-styled "wipe" transition
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.98 }}
      transition={{ duration: 0.4, ease: "anticipate" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
}

export default App;
