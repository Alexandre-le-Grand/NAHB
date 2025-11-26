import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Une erreur est survenue');
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/acceuil'); 
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de contacter le serveur');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-pink-600 p-4">
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl"
      >
        <h1 className="text-3xl font-extrabold text-center text-purple-700 mb-8">Connexion</h1>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 text-red-600 p-3 rounded-lg mb-6 text-center text-sm font-bold"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-bold mb-2 ml-1">Email</label>
            <input 
              type="email" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-4 rounded-xl bg-gray-100 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition duration-200 outline-none"
              placeholder="votre@email.com"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-bold mb-2 ml-1">Mot de passe</label>
            <input 
              type="password" 
              name="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-4 rounded-xl bg-gray-100 border border-transparent focus:bg-white focus:border-purple-500 focus:ring-0 transition duration-200 outline-none"
              placeholder="••••••••"
            />
          </div>
        
          <button 
            type="submit"
            className="btn-glow w-full py-4 rounded-3xl text-lg font-bold shadow-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition-all duration-300 mt-4"
          >
            Se connecter
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-purple-700 font-bold hover:underline">
            Inscrivez-vous
          </Link>
        </p>
      </motion.div>
    </div>
  );
}