import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import styles from '../css/MyStory.module.css';

interface User {
  id: number;
  username: string;
  role: string;
}

interface Story {
  id: number;
  title: string;
  description: string;
  statut: 'brouillon' | 'publié';
  AuthorId: number;
}

export default function MyStory() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
        navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  useEffect(() => {
    if (!user) {
      setPageLoading(false);
      return;
    }
    async function fetchStories() {
      if (!user) return;

      try {
        const res = await fetch(`http://localhost:5000/stories/mine`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Erreur lors de la récupération de vos histoires : ${res.status}`);
        }

        const data: Story[] = await res.json();
        setStories(data);

      } catch (err) {
        console.error(err);
      } finally {
        setPageLoading(false);
      }
    } 

    fetchStories();
  }, [user]);

  const handlePublish = async (storyId: number) => {
    if (!user) return;

    try {
      const res = await fetch(`http://localhost:5000/stories/${storyId}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error('Impossible de publier');

      setStories(prev =>
        prev.map(story =>
          story.id === storyId ? { ...story, statut: 'publié' } : story
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (storyId: number) => {
    if (!user || (user.role !== 'admin' && user.role !== 'author')) return;
    if (!window.confirm("Voulez-vous vraiment supprimer cette histoire ? Cette action est irréversible.")) return;

    try {
      const res = await fetch(`http://localhost:5000/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!res.ok) throw new Error('Impossible de supprimer l\'histoire');

      setStories(prev => prev.filter(story => story.id !== storyId));
    } catch (err) {
      console.error(err);
    }
  };


  if (!user) return <div className={styles.container}></div>;
  if (pageLoading || isLoading) return <div className={styles.loadingContainer}><p className={styles.loadingText}>Chargement des histoires...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Mes Histoires</h1>
        
        {stories.length === 0 && <div className={styles.emptyState}>Vous n'avez pas encore créé d'histoire.</div>}
        
        <div className={styles.storiesGrid}>
          {stories.map(story => (
            <div key={story.id} className={styles.storyCard}>
              <h3 className={styles.storyTitle}>{story.title}</h3>
              <p className={styles.storyDescription}>{story.description}</p>
              <div className={styles.storyMeta}>
                <span className={`${styles.badge} ${story.statut === 'publié' ? styles.badgePublished : styles.badgeDraft}`}>
                  {story.statut.toUpperCase()}
                </span>
              </div>
              <div className={styles.storyActions}>
                {(user?.role === 'admin' || user?.role === 'author') && (
                  <>
                    {user?.role === 'admin' && story.statut === 'brouillon' && (
                      <button onClick={() => handlePublish(story.id)} className={`${styles.button} ${styles.buttonPrimary}`}>Publier</button>
                    )}
                    <Link to={`/story-creator/${story.id}`} className={`${styles.button} ${styles.buttonSecondary}`}>Modifier</Link>
                    <button onClick={() => handleDelete(story.id)} className={`${styles.button} ${styles.buttonDelete}`}>Supprimer</button>
                  </>
                )}
                <Link to={`/play/${story.id}`} className={`${styles.button} ${styles.buttonPrimary}`}>
                  Lire l'histoire
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}