import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const data = { username, email, password };

    try {
      const res = await fetch('http://localhost:5000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      
      if (!res.ok) {
        if (result.errors) {
          setError(Array.isArray(result.errors) ? result.errors.map((e) => e.msg).join(', ') : 'Erreur de validation');
        } else if (result.message) {
          setError(result.message);
        } else {
          setError('Une erreur est survenue');
        }
      } else {
        setSuccess(result.message || 'Inscription réussie !');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de se connecter au serveur');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      <div style={styles.card}>
        <h1 style={styles.title}>Inscription</h1>

        {error && (
          <div style={styles.errorBox}>
            {error}
          </div>
        )}
        
        {success && (
          <div style={styles.successBox}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          
          <div style={styles.inputGroup}>
            <label htmlFor="username" style={styles.label}>Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={styles.input}
              placeholder="votre-pseudo"
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="exemple@email.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" style={styles.button}>
            S'inscrire
          </button>
        </form>

        <p style={styles.footerText}>
          Déjà un compte ?{' '}
          <Link to="/login" style={styles.link}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: any = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px"
    },
    blob1: {
        position: "absolute",
        top: "-10%",
        left: "-10%",
        width: "500px",
        height: "500px",
        background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(40px)",
        zIndex: 0
    },
    blob2: {
        position: "absolute",
        bottom: "10%",
        right: "-5%",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(40px)",
        zIndex: 0
    },
    card: {
        width: "100%",
        maxWidth: "420px",
        backgroundColor: "rgba(30, 41, 59, 0.7)",
        borderRadius: "16px",
        padding: "40px",
        border: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        zIndex: 1
    },
    title: {
        fontSize: "28px",
        fontWeight: "800",
        color: "white",
        textAlign: "center",
        marginBottom: "30px"
    },
    errorBox: {
        padding: '1rem', 
        background: 'rgba(239, 68, 68, 0.2)', 
        border: '1px solid rgba(239, 68, 68, 0.5)', 
        borderRadius: '12px', 
        color: '#fca5a5', 
        marginBottom: '1.5rem',
        textAlign: 'center',
        fontSize: '14px'
    },
    successBox: {
        padding: '1rem', 
        background: 'rgba(34, 197, 94, 0.2)', 
        border: '1px solid rgba(34, 197, 94, 0.5)', 
        borderRadius: '12px', 
        color: '#86efac', 
        marginBottom: '1.5rem',
        textAlign: 'center',
        fontSize: '14px'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#94a3b8"
    },
    input: {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "8px",
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        color: "#e2e8f0",
        fontSize: "15px"
    },
    button: {
        width: "100%",
        padding: "12px",
        borderRadius: "8px",
        border: "none",
        background: "linear-gradient(to right, #38bdf8, #818cf8)",
        color: "white",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "pointer",
        marginTop: "10px"
    },
    footerText: {
        textAlign: "center",
        marginTop: "25px",
        color: "#94a3b8",
        fontSize: "14px"
    },
    link: {
        color: "#818cf8",
        fontWeight: "600",
        textDecoration: "none"
    }
};