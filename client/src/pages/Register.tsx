import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = {
            username,
            email,
            password,
        };
        fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then(res => res.json())
            .then(data => console.log(data))
            .catch(err => console.error(err));
    };

    return (
        <div className="register">
            <h1>Inscription</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Nom d'utilisateur
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
                </label>
                <label>
                    Email
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </label>
                <label>
                    Mot de passe
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </label>
                <button type="submit">S'inscrire</button>
                <p>
                    Déjà inscrit ? <Link to="/login">Se connecter</Link>
                </p>
            </form>
        </div>
    );
}
