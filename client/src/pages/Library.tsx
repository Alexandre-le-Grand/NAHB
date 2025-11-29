import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import styles from '../css/Library.module.css';
import { StoryStats } from '../components/StoryStats'; // Importer le nouveau composant

interface Story {
  id: number;
  title: string;
  description: string;
  statut: 'brouillon' | 'publié' | 'suspendu';
  AuthorId?: number;
}

interface PlaythroughData {
  StoryId: number;
  status: 'en_cours' | 'fini';
}

export default function Library() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [playthroughStatuses, setPlaythroughStatuses] = useState<Record<number, 'en_cours' | 'fini'>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        // Puisque l'utilisateur est toujours authentifié ici, on peut faire les deux appels en parallèle.
        const [storiesRes, playthroughsRes] = await Promise.all([
          fetch('http://localhost:5000/stories', {
            headers: headers,
          }),
          fetch('http://localhost:5000/users/me/playthroughs', {
            headers: headers,
          })
        ]);

        if (playthroughsRes.ok) {
          const playthroughsData: PlaythroughData[] = await playthroughsRes.json();
          updatePlaythroughStatuses(playthroughsData);
        }

        if (!storiesRes.ok) {
          console.error("Erreur lors de la récupération des histoires:", storiesRes.status, storiesRes.statusText);
          setStories([]); // Assure que stories est toujours un tableau
        } else {
          const storiesData: Story[] = await storiesRes.json();
          setStories(storiesData);
        }

      } catch (err) {
        console.error(err);
        setStories([]); // Assure que stories est un tableau même en cas d'erreur
      } finally {
        setLoading(false);
      }
    };
    
  const updatePlaythroughStatuses = (playthroughsData: PlaythroughData[]) => {
    const statusesMap = (playthroughsData || []).reduce((acc: Record<number, 'en_cours' | 'fini'>, p) => {
      if (!acc[p.StoryId]) {
        acc[p.StoryId] = p.status;
      }
      return acc;
    }, {});
    setPlaythroughStatuses(statusesMap);
  };

  useEffect(() => {
    fetchData();

    // Ajout d'un écouteur pour rafraîchir les données quand on revient sur la page
    window.addEventListener('focus', fetchData);
    return () => {
      window.removeEventListener('focus', fetchData);
    };
  }, [user]); // On garde `user` comme dépendance pour recharger si l'utilisateur se connecte/déconnecte
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
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Bibliothèque d'histoires</h1>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Rechercher une histoire par titre..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {stories.filter(story => story.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
          <div className={styles.emptyState}>
            {stories.length === 0 ? "Aucune histoire disponible pour le moment." : "Aucune histoire ne correspond à votre recherche."}
          </div>
        )}
        
        <div className={styles.storiesGrid}>
          {stories.filter(story => story.title.toLowerCase().includes(searchTerm.toLowerCase())).map(story => (
            <div key={story.id} className={styles.storyCard}>
              <h3 className={styles.storyTitle}>{story.title}</h3>
              <p className={styles.storyDescription}>{story.description}</p>
              <div className={styles.storyMeta}>
                <div className={styles.badgesContainer}>
                  {playthroughStatuses[story.id] && (
                    <span className={`${styles.badge} ${playthroughStatuses[story.id] === 'fini' ? styles.badgeFinished : styles.badgeInProgress}`}>
                      {playthroughStatuses[story.id] === 'fini' ? 'TERMINÉ' : 'EN COURS'}
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
                <StoryStats storyId={story.id} />
              </div>
              <div className={styles.storyActions}>
                {(user?.role === 'admin') && (
                  <>
                    {story.statut === 'brouillon' && (
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