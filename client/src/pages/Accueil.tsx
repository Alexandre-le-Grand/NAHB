import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Accueil = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem("user");
        
        if (!token) {
            navigate('/login');
        } else if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null; // Évite le flash de contenu avant redirection

    return (
        <div style={styles.container}>
            
            {/* BACKGROUND DECORATION (Cercles flous) */}
            <div style={styles.blob1}></div>
            <div style={styles.blob2}></div>

            {/* NAVBAR */}
            <nav style={styles.navbar}>
                <div style={styles.logo}>
                    <span style={{ fontSize: "24px", marginRight: "10px" }}>✨</span> 
                    StoryVerse
                </div>
                <div style={styles.navRight}>
                    <div style={styles.userInfo}>
                        <div style={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
                        <span style={styles.username}>{user.username}</span>
                    </div>
                    <button onClick={handleLogout} style={styles.logoutBtn}>
                        Déconnexion
                    </button>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <main style={styles.main}>
                
                {/* HERO SECTION */}
                <section style={styles.hero}>
                    <h1 style={styles.heroTitle}>
                        Ravi de vous revoir, <span style={styles.gradientText}>{user.username}</span>.
                    </h1>
                    <p style={styles.heroSubtitle}>
                        Votre portail vers des mondes infinis. Gérez vos récits ou plongez dans une nouvelle aventure dès maintenant.
                    </p>
                </section>

                {/* DASHBOARD GRID */}
                <div style={styles.grid}>
                    {/* WIDGET PROFIL */}
                    <div style={styles.profileCard}>
                        <h3 style={styles.cardHeader}>Profile</h3>
                        <div style={styles.profileContent}>
                            <div style={styles.profileRow}>
                                <span style={styles.label}>Email</span>
                                <span style={styles.value}>{user.email}</span>
                            </div>
                            <div style={styles.profileRow}>
                                <span style={styles.label}>Rang</span>
                                <span style={{
                                    ...styles.badge,
                                    backgroundColor: user.role === "admin" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                                    color: user.role === "admin" ? "#fca5a5" : "#6ee7b7",
                                    border: user.role === "admin" ? "1px solid #ef4444" : "1px solid #10b981"
                                }}>
                                    {user.role.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ACTION CARDS (Composants interactifs) */}
                    <div style={styles.actionsGrid}>
                        {user.role === "admin" && (
                            <HoverCard 
                                to="/users" 
                                title="Administration" 
                                icon="🛡️" 
                                desc="Gérer les utilisateurs et la sécurité."
                                color="#f472b6"
                            />
                        )}
                        
                        {(user.role === "admin" || user.role === "author") && (
                            <HoverCard 
                                to="/story-creator" 
                                title="Créer une Histoire" 
                                icon="✍️" 
                                desc="Tissez votre propre toile narrative."
                                color="#38bdf8"
                            />
                        )}

                        <HoverCard 
                            to="/library" 
                            title="Bibliothèque" 
                            icon="📚" 
                            desc="Explorez les récits de la communauté."
                            color="#818cf8"
                        />

                        {(user.role === "admin" || user.role === "author") && (
                        <HoverCard 
                            to="/my-stories" 
                            title="Mes histoires" 
                            icon="📚" 
                            desc="Explorez les récits de la communauté."
                            color="#818cf8"
                        />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- COMPOSANT CARTE INTERACTIVE (HOVER) ---
const HoverCard = ({ to, title, icon, desc, color }: any) => {
    const [hover, setHover] = useState(false);

    const cardStyle = {
        ...styles.actionCard,
        transform: hover ? "translateY(-5px)" : "translateY(0)",
        borderColor: hover ? color : "rgba(255,255,255,0.05)",
        boxShadow: hover ? `0 10px 30px -10px ${color}40` : "none"
    };

    const iconStyle = {
        ...styles.iconBox,
        backgroundColor: `${color}20`,
        color: color
    };

    return (
        <Link 
            to={to} 
            style={{ textDecoration: "none" }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div style={cardStyle}>
                <div style={iconStyle}>{icon}</div>
                <div>
                    <h3 style={styles.actionTitle}>{title}</h3>
                    <p style={styles.actionDesc}>{desc}</p>
                </div>
            </div>
        </Link>
    );
};

// --- STYLES OBJECTS ---
const styles: any = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#0f172a", // Dark slate background
        color: "#e2e8f0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden"
    },
    // Background decorations
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
    // Navbar
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        position: "relative",
        zIndex: 10
    },
    logo: {
        fontSize: "22px",
        fontWeight: "800",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        letterSpacing: "-0.5px"
    },
    navRight: {
        display: "flex",
        alignItems: "center",
        gap: "20px"
    },
    userInfo: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },
    avatar: {
        width: "35px",
        height: "35px",
        borderRadius: "50%",
        backgroundColor: "#3b82f6",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontWeight: "bold",
        fontSize: "14px"
    },
    username: {
        fontWeight: "500",
        fontSize: "15px"
    },
    logoutBtn: {
        padding: "8px 16px",
        backgroundColor: "transparent",
        color: "#94a3b8",
        border: "1px solid #334155",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "13px",
        transition: "all 0.2s"
    },
    // Main Content
    main: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "60px 20px",
        position: "relative",
        zIndex: 1
    },
    hero: {
        textAlign: "center",
        marginBottom: "60px"
    },
    heroTitle: {
        fontSize: "48px",
        fontWeight: "800",
        marginBottom: "15px",
        lineHeight: "1.1",
        color: "white"
    },
    gradientText: {
        background: "linear-gradient(to right, #38bdf8, #818cf8)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
    },
    heroSubtitle: {
        fontSize: "18px",
        color: "#94a3b8",
        maxWidth: "600px",
        margin: "0 auto",
        lineHeight: "1.6"
    },
    // Grid Layout
    grid: {
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "30px",
        alignItems: "start"
    },
    // Profile Widget
    profileCard: {
        backgroundColor: "rgba(30, 41, 59, 0.7)",
        borderRadius: "16px",
        padding: "25px",
        border: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)"
    },
    cardHeader: {
        fontSize: "18px",
        fontWeight: "600",
        marginBottom: "20px",
        color: "white",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        paddingBottom: "15px"
    },
    profileContent: {
        display: "flex",
        flexDirection: "column",
        gap: "15px"
    },
    profileRow: {
        display: "flex",
        flexDirection: "column",
        gap: "5px"
    },
    label: {
        fontSize: "12px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        color: "#64748b",
        fontWeight: "600"
    },
    value: {
        fontSize: "15px",
        color: "#e2e8f0",
        fontWeight: "500"
    },
    badge: {
        alignSelf: "flex-start",
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600"
    },
    // Actions Grid
    actionsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: "20px"
    },
    actionCard: {
        backgroundColor: "rgba(30, 41, 59, 0.4)",
        borderRadius: "16px",
        padding: "25px",
        border: "1px solid rgba(255,255,255,0.05)",
        cursor: "pointer",
        transition: "all 0.3s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "15px"
    },
    iconBox: {
        width: "50px",
        height: "50px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        marginBottom: "5px"
    },
    actionTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "white",
        marginBottom: "8px"
    },
    actionDesc: {
        fontSize: "14px",
        color: "#94a3b8",
        lineHeight: "1.5"
    }
};

export default Accueil;