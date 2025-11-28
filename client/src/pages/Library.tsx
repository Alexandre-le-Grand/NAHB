import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import styles from '../css/Library.module.css';

interface Story {
  id: number;
  title: string;
  description: string;
  statut: 'brouillon' | 'publié' | 'suspendu';
  AuthorId?: number;
}

interface PlaythroughData {
  StoryId: number;
  status: 'in_progress' | 'finished';
}

export default function Library() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [playthroughStatuses, setPlaythroughStatuses] = useState<Record<number, 'in_progress' | 'finished'>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        navigate('/login');
        return;
      }
      try {
        const [storiesRes, playthroughsRes] = await Promise.all([
          fetch('http://localhost:5000/stories', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:5000/users/me/playthroughs', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const storiesData: Story[] = await storiesRes.json();
        const playthroughsData: PlaythroughData[] = await playthroughsRes.json();

        const statusesMap: Record<number, 'in_progress' | 'finished'> = {};
        if (Array.isArray(playthroughsData)) {
          playthroughsData.forEach(p => statusesMap[p.StoryId] = p.status);
        }
        setPlaythroughStatuses(statusesMap);
        setStories(storiesData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

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
    if (!user) return;

    const storyToDelete = stories.find(s => s.id === storyId);
    if (!storyToDelete) return;

    if (user.role !== 'admin' && user.id !== storyToDelete.AuthorId) {
      return;
    }
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

  const handleToggleSuspend = async (storyId: number) => {
    const story = stories.find(s => s.id === storyId);
    if (!story) return;

    const action = story.statut === 'suspendu' ? 'réactiver' : 'suspendre';
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action} cette histoire ?`)) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const res = await fetch(`http://localhost:5000/stories/${storyId}/suspend`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("L'opération a échoué");

      const updatedStory = await res.json();

      setStories(prev => prev.map(s => s.id === storyId ? updatedStory.story : s));
    } catch (err) {
      console.error(`Erreur lors de la tentative de ${action}`, err);
    }
  };

  if (!user) return <div className={styles.container}></div>;
  if (loading) return <div className={styles.loadingContainer}><p className={styles.loadingText}>Chargement des histoires...</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Bibliothèque d'histoires</h1>
        
        {stories.length === 0 && <div className={styles.emptyState}>Aucune histoire disponible pour le moment.</div>}
        
        <div className={styles.storiesGrid}>
          {stories.map(story => (
            <div key={story.id} className={styles.storyCard}>
              <h3 className={styles.storyTitle}>{story.title}</h3>
              <p className={styles.storyDescription}>{story.description}</p>
              <div className={styles.storyMeta}>
                <div className={styles.badgesContainer}>
                  {playthroughStatuses[story.id] && (
                    <span className={`${styles.badge} ${playthroughStatuses[story.id] === 'finished' ? styles.badgeFinished : styles.badgeInProgress}`}>
                      {playthroughStatuses[story.id] === 'finished' ? 'TERMINÉ' : 'EN COURS'}
                    </span>
                  )}
                </div>
                <div>
                  <span className={`${styles.badge} 
                    ${story.statut === 'publié' ? styles.badgePublished : ''} 
                    ${story.statut === 'suspendu' ? styles.badgeSuspended : ''} 
                    ${story.statut === 'brouillon' ? styles.badgeDraft : ''}`}>
                    {story.statut.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className={styles.storyActions}>
                {(user?.role === 'admin' || user?.id === story.AuthorId) && (
                  <>
                    {story.statut === 'brouillon' && user?.id === story.AuthorId && (
                      <button onClick={() => handlePublish(story.id)} className={`${styles.button} ${styles.buttonPrimary}`}>Publier</button>
                    )}
                    <Link to={`/story-creator/${story.id}`} className={`${styles.button} ${styles.buttonSecondary}`}>Modifier</Link>
                    <button onClick={() => handleDelete(story.id)} className={`${styles.button} ${styles.buttonDelete}`}>Supprimer</button>
                  </>
                )}
                {user?.role === 'admin' && (
                    <button onClick={() => handleToggleSuspend(story.id)} className={`${styles.button} ${story.statut === 'suspendu' ? styles.buttonActivate : styles.buttonSuspend}`}>
                      {story.statut === 'suspendu' ? 'Réactiver' : 'Suspendre'}
                    </button>
                )}
                <Link to={`/play/${story.id}`} className={`${styles.button} ${styles.buttonSecondary}`}>
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