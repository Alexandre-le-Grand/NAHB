import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../css/Library.module.css'; // On réutilise les styles de la bibliothèque

interface Playthrough {
  id: number;
  status: 'en_cours' | 'fini';
  Story: {
    id: number;
    title: string;
    description: string;
  };
}

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [playthroughs, setPlaythroughs] = useState<Playthrough[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchPlaythroughs = async () => {
        setPageLoading(true);
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:5000/users/me/playthroughs', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            throw new Error('Impossible de récupérer les parties jouées.');
          }

          const data: Playthrough[] = await res.json();
          setPlaythroughs(data);
        } catch (err) {
          console.error(err);
        } finally {
          setPageLoading(false);
        }
      };

      fetchPlaythroughs();
    }
  }, [isAuthenticated]);

  if (pageLoading || isLoading) {
    return <div className={styles.loadingContainer}><p className={styles.loadingText}>Chargement du profil...</p></div>;
  }

  const finishedStories = playthroughs.filter(p => p.status === 'fini');

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Mon Profil</h1>
          {user && <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: '-10px', marginBottom: '20px' }}>Bienvenue, {user.username} !</p>}
        </div>

        <h2 style={{ color: 'white', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '20px' }}>Histoires Terminées</h2>

        {finishedStories.length === 0 && (
          <div className={styles.emptyState}>
            Vous n'avez encore terminé aucune histoire. Lancez-vous dans l'aventure !
          </div>
        )}

        <div className={styles.storiesGrid}>
          {finishedStories.map(playthrough => (
            <div key={playthrough.id} className={styles.storyCard}>
              <h3 className={styles.storyTitle}>{playthrough.Story.title}</h3>
              <p className={styles.storyDescription}>{playthrough.Story.description}</p>
              <div className={styles.storyMeta}>
                <div className={styles.badgesContainer}>
                  <span className={`${styles.badge} ${styles.badgeFinished}`}>
                    TERMINÉ
                  </span>
                </div>
              </div>
              <div className={styles.storyActions}>
                <Link to={`/play/${playthrough.Story.id}`} className={`${styles.button} ${styles.buttonSecondary}`}>
                  Rejouer
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}