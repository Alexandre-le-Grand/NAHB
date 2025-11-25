import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const data = { username, email, password };

    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      
      if (!res.ok) {
        if (result.errors) {
          // Si le backend renvoie un tableau d'erreurs (ex: express-validator)
          setError(Array.isArray(result.errors) ? result.errors.map((e) => e.msg).join(', ') : 'Erreur de validation');
        } else if (result.message) {
          setError(result.message);
        } else {
          setError('Une erreur est survenue');
        }
      } else {
        setSuccess(result.message || 'Inscription réussie !');
        // Redirection après 2 secondes
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de se connecter au serveur');
    }
  };

  return (
    <div className="fade-in" style={{ width: '100%', maxWidth: '450px', zIndex: 10 }}>
      <div className="card">
        <h2 className="text-glow" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', color: 'var(--text-primary)' }}>
          Inscription
        </h2>

        {/* Messages d'alerte */}
        {error && (
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(239, 68, 68, 0.2)', 
            border: '1px solid rgba(239, 68, 68, 0.5)', 
            borderRadius: '12px', 
            color: '#fca5a5', 
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={{ 
            padding: '1rem', 
            background: 'rgba(34, 197, 94, 0.2)', 
            border: '1px solid rgba(34, 197, 94, 0.5)', 
            borderRadius: '12px', 
            color: '#86efac', 
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="input-group">
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Votre pseudo"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="exemple@email.com"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" style={{ marginTop: '1rem' }}>
            S'inscrire
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>Déjà inscrit ? <Link to="/login">Se connecter</Link></p>
        </div>
      </div>
    </div>
  );
}