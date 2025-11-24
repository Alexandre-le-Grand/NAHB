import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Accueil = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // 1. On récupère le token stocké lors du login
        const token = localStorage.getItem('token');

        // 2. Si pas de token, on éjecte l'utilisateur vers le login
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token'); 
        localStorage.removeItem('user');  
        navigate('/login'); 
    };

    return (
        <div className="container">
            <h1>Accueil</h1>
            <p>Bienvenue sur ce site de livre dont vous êtes le héros.</p>
            <p>Vous pouvez créer vos propres histoires ou jouer à celles des autres.</p>

            <div style={{ marginTop: '20px' }}>
                <button onClick={handleLogout} style={{ backgroundColor: 'red', color: 'white' }}>
                    Se déconnecter
                </button>
            </div>
        </div>
    );
};

export default Accueil;