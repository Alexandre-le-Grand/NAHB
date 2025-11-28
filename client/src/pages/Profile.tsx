import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import styles from '../css/Profile.module.css';

interface PlaythroughEntry {
  Story: {
    id: number;
    title: string;
    description: string;
  },
  status: 'en_cours' | 'fini';
}

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [playedStories, setPlayedStories] = useState<PlaythroughEntry[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setStoriesLoading(false);
        return;
      }

      const token = localStorage.getItem('token');

      try {
        const storiesRes = await fetch('http://localhost:5000/users/me/playthroughs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const storiesData = await storiesRes.json();
        if (storiesRes.ok) {
          const uniquePlaythroughs = Object.values(
            (storiesData as PlaythroughEntry[]).reduce((acc: Record<number, PlaythroughEntry>, p) => {
              if (!acc[p.Story.id]) {
                acc[p.Story.id] = p;
              }
              return acc;
            }, {})
          );
          setPlayedStories(uniquePlaythroughs);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données du profil:", error);
      } finally {
        setStoriesLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, location.key]);

  if (isLoading) return <div>Chargement de la session...</div>;
  if (!user) return <div>Veuillez vous connecter pour voir votre profil.</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Profil de {user.username}</h1>
      <div className={styles.userInfo}>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Rôle:</strong> <span className={`${styles.badge} ${styles[user.role]}`}>{user.role}</span></p>
      </div>

      <hr className={styles.divider} />

      <h2 className={styles.subtitle}>Historique de lecture</h2>
      {storiesLoading ? <p>Chargement de l'historique...</p> :
      playedStories.length > 0 ? (
        <div className={styles.storiesGrid}>
          {playedStories.map(playthrough => {
            if (!playthrough.Story) return null;

            return (
              <Link key={playthrough.Story.id} to={`/play/${playthrough.Story.id}`} className={styles.storyCardLink}>
                <div className={styles.storyCard}>
                  <h3 className={styles.storyTitle}>{playthrough.Story.title}</h3>
                  <p className={styles.storyDescription}>{playthrough.Story.description}</p>
                  <span className={`${styles.statusBadge} ${playthrough.status === 'finished' ? styles.finished : styles.inProgress}`}>
                    {playthrough.status === 'finished' ? 'Fini' : 'En cours'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className={styles.emptyState}>Vous n'avez pas encore terminé d'histoire. <Link to="/library" className={styles.link}>Explorez la bibliothèque !</Link></p>
      )}
    </div>
  );
}