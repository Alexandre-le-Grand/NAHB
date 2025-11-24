import React from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="container">
      <h1>Connexion</h1>
      <form>
        <label>
          Identifiant :
          <input type="text" name="username" />
        </label>
        <label>
          Mot de passe :
          <input type="password" name="password" />
        </label>
        <button type="submit">Se connecter</button>
      </form>
      <p>
        Pas encore de compte ? <Link to="/register">Inscrivez-vous</Link>
      </p>
    </div>
  );
}
