import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext';
import styles from '../css/Header.module.css';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (['/', '/login', '/register'].includes(location.pathname)) {
    return null;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.navLeft}>
        <button onClick={() => navigate(-1)} className={styles.backButton} title="Retour" aria-label="Retour">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <Link to="/acceuil" className={styles.logo}>
          StoryVerse
        </Link>
      </div>
      <div className={styles.navCenter}>
        <Link to="/library" className={styles.navLink}>Bibliothèque</Link>
        {(user?.role === 'author' || user?.role === 'admin') && (
          <>
            <Link to="/my-stories" className={styles.navLink}>Mes Histoires</Link>
            <Link to="/story-creator" className={styles.navLink}>Créer</Link>
          </>
        )}
        {user?.role === 'admin' && (
          <Link to="/users" className={styles.navLink}>Admin</Link>
        )}
      </div>
      <div className={styles.navRight}>
        {user && (
          <>
            <Link to="/profile" className={styles.profileLink}>
              <div className={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
              <span className={styles.username}>{user.username}</span>
            </Link>
            <button onClick={handleLogout} className={styles.logoutBtn}>Déconnexion</button>
          </>
        )}
      </div>
    </nav>
  );
}