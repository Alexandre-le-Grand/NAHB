import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Accueil = () => {
    const navigate = useNavigate();
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) navigate('/login');
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div style={{ backgroundColor: "#f4f4f9", minHeight: "100vh" }}>

            {/* HEADER */}
            <header style={{
                width: "100%",
                padding: "20px 40px",
                backgroundColor: "#1e1e1e",
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 3px 6px rgba(0,0,0,0.3)"
            }}>
                <h2 style={{ margin: 0, fontSize: "26px" }}>🏠 Accueil</h2>

                <div style={{ display: "flex", alignItems: "center", gap: "25px" }}>
                    <span style={{ fontSize: "17px" }}>
                        Connecté : <strong>{user?.username}</strong>
                    </span>

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: "10px 18px",
                            backgroundColor: "#d9534f",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            fontSize: "15px"
                        }}
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            {/* HERO BANNER */}
            <section style={{
                width: "100%",
                padding: "60px 40px",
                background: "linear-gradient(135deg, #6a11cb, #2575fc)",
                color: "white",
                textAlign: "left"
            }}>
                <h1 style={{ fontSize: "42px", marginBottom: "10px", fontWeight: "700" }}>
                    Bienvenue {user?.username} 👋
                </h1>

                <p style={{ fontSize: "20px", opacity: 0.9, maxWidth: "900px" }}>
                    Explorez, créez et gérez vos histoires interactives dans un espace moderne et intuitif.
                </p>
            </section>

            {/* SECTION CONTENUS */}
            <div style={{
                padding: "40px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                gap: "30px"
            }}>

                {/* PROFILE CARD */}
                <div style={{
                    backgroundColor: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
                }}>
                    <h2 style={{ marginBottom: "15px", fontSize: "24px" }}>👤 Votre Profil</h2>

                    <p><strong>Nom :</strong> {user?.username}</p>
                    <p><strong>Email :</strong> {user?.email}</p>

                    <p>
                        <strong>Rôle :</strong>{" "}
                        <span style={{
                            padding: "4px 8px",
                            backgroundColor: user?.role === "admin" ? "#d9534f" : "#5cb85c",
                            color: "white",
                            borderRadius: "6px",
                            fontWeight: "bold"
                        }}>
                            {user?.role.toUpperCase()}
                        </span>
                    </p>
                </div>

                {/* ACTION CARDS */}
                {user?.role === "admin" && (
                    <Link to="/users" style={{ textDecoration: "none" }}>
                        <div style={cardActionStyle}>
                            <h3 style={cardTitleStyle}>🔧 Gestion des utilisateurs</h3>
                            <p>Accédez au panneau d'administration pour modifier les rôles ou supprimer des comptes.</p>
                        </div>
                    </Link>
                )}

                <Link to="/stories" style={{ textDecoration: "none" }}>
                    <div style={cardActionStyle}>
                        <h3 style={cardTitleStyle}>📖 Explorer les histoires</h3>
                        <p>Plongez dans les aventures disponibles ou commencez à lire une nouvelle histoire.</p>
                    </div>
                </Link>

                <Link to="/create-story" style={{ textDecoration: "none" }}>
                    <div style={cardActionStyle}>
                        <h3 style={cardTitleStyle}>✏️ Créer une histoire</h3>
                        <p>Élaborez votre propre récit interactif et partagez-le avec la communauté.</p>
                    </div>
                </Link>

            </div>

        </div>
    );
};

// Styles des cartes actions
const cardActionStyle = {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    cursor: "pointer",
    color: "#333",
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    transition: "transform .2s, box-shadow .2s",
};
const cardTitleStyle = {
    marginBottom: "10px",
    fontSize: "22px",
    fontWeight: "600"
};

export default Accueil;
