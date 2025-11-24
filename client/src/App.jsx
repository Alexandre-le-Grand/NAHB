import { useState } from 'react';
import './App.css';
import { Link } from 'react-router-dom';

function App() {
  // États pour stocker l'email et le mot de passe
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Gérer la soumission du formulaire
  const handleSubmit = (event) => {
    event.preventDefault(); // Empêche le rechargement de la page
    console.log('Tentative de connexion avec :', { email, password });
    // Ici, vous enverriez normalement les données à votre backend pour vérification
    alert(`Connexion demandée pour : ${email}`);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Connexion</h1>
        <div className="input-group">
          <label htmlFor="email">Adresse e-mail</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
          />
        </div>
        <button type="submit" className="login-button">Se connecter</button>
      </form>
    </div>
  )
}
<Link to="/pages/Home.jsx">Aller à Home</Link>

export default App