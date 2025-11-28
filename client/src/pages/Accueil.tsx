import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import styles from '../css/Accueil.module.css';

const Accueil = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, logout, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isLoading, isAuthenticated, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className={styles.container}>
            <div className={styles.blob1}></div>
            <div className={styles.blob2}></div>

            <main className={styles.main}>
                <section className={styles.hero}>
                    <h1 className={styles.heroTitle}>
                        Ravi de vous revoir, <span className={styles.gradientText}>{user.username}</span>.
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Votre portail vers des mondes infinis. Gérez vos récits ou plongez dans une nouvelle aventure dès maintenant.
                    </p>
                </section>

                <div className={styles.grid}>
                    <div className={styles.profileCard}>
                        <h3 className={styles.cardHeader}>Profil</h3>
                        <div className={styles.profileContent}>
                            <div className={styles.profileRow}>
                                <span className={styles.label}>Email</span>
                                <span className={styles.value}>{user.email}</span>
                            </div>
                            <div className={styles.profileRow}>
                                <span className={styles.label}>Rang</span>
                                <span className={`${styles.badge} ${user.role === "admin" ? styles.badgeAdmin : styles.badgeUser}`}>
                                    {user.role.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.actionsGrid}>
                        {user.role === "admin" && (
                            <HoverCard to="/users" title="Administration" icon="🛡️" desc="Gérer les utilisateurs et la sécurité." color="#f472b6" />
                        )}
                        
                        {(user.role === "admin" || user.role === "author") && (
                            <HoverCard to="/story-creator" title="Créer une Histoire" icon="✍️" desc="Tissez votre propre toile narrative." color="#38bdf8" />
                        )}

                        <HoverCard to="/library" title="Bibliothèque" icon="📚" desc="Explorez les récits de la communauté." color="#818cf8" />

                        {(user.role === "admin" || user.role === "author") && (
                            <HoverCard to="/my-stories" title="Mes histoires" icon="📖" desc="Retrouvez toutes vos créations." color="#a78bfa" />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

const HoverCard = ({ to, title, icon, desc, color }: any) => {
    const [hover, setHover] = useState(false);

    const cardStyle = {
        transform: hover ? "translateY(-5px)" : "translateY(0)",
        borderColor: hover ? color : "rgba(255,255,255,0.05)",
        boxShadow: hover ? `0 10px 30px -10px ${color}40` : "none"
    };

    const iconStyle = {
        backgroundColor: `${color}20`,
        color: color
    };

    return (
        <Link to={to} className={styles.actionCardLink} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className={styles.actionCard} style={cardStyle}>
                <div className={styles.iconBox} style={iconStyle}>{icon}</div>
                <div>
                    <h3 className={styles.actionTitle}>{title}</h3>
                    <p className={styles.actionDesc}>{desc}</p>
                </div>
            </div>
        </Link>
    );
};

export default Accueil;