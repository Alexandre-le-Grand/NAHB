import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-pink-600 p-8">
      
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
        className="mb-12"
      >
        <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center shadow-2xl">
          <span className="text-4xl font-extrabold text-purple-700">NAHB</span>
        </div>
      </motion.div>

      {/* Titre */}
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="text-5xl sm:text-6xl font-extrabold text-white mb-16 text-center drop-shadow-lg"
      >
        Bienvenue sur NAHB
      </motion.h1>

      {/* Boutons */}
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <Link to="/login">
          <button className="btn-glow w-full py-4 rounded-3xl text-lg font-bold shadow-2xl bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105">
            Connexion
          </button>
        </Link>

        <Link to="/register">
          <button className="btn-glow w-full py-4 rounded-3xl text-lg font-bold shadow-2xl bg-white text-purple-700 hover:bg-purple-100 hover:text-purple-800 transform hover:scale-105">
            Inscription
          </button>
        </Link>
      </div>
    </div>
  );
}
