import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import styles from '../css/Library.module.css'; // Utiliser le même style que la bibliothèque

interface Story {
  id: number;
  title: string;
  description: string;
  statut: 'brouillon' | 'publié' | 'suspendu'; // Ajout du statut 'suspendu'
  AuthorId?: number;
  Tags?: { // Le nom est capitalisé par Sequelize et c'est un objet
    id: number;
    name: string;
    status: 'pending' | 'approved';
  }[];
}

// Petit composant pour gérer l'affichage des stats
const StoryStats = ({ storyId }: { storyId: number }) => {
  const [stats, setStats] = useState<{ lectures: number; finsAtteintes: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:5000/stories/${storyId}/stats`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error(`Erreur stats pour l'histoire ${storyId}:`, error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [storyId]);

  if (isLoading) {
    return <div className={styles.statsContainer}>Chargement stats...</div>;
  }

  return (
    <div className={styles.statsContainer}>
      <span>📊 Lectures: {stats?.lectures ?? 0}</span>
      <span>🏁 Fins atteintes: {stats?.finsAtteintes ?? 0}</span>
    </div>
  );
};

export default function MyStories() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  // On déplace les hooks en haut, avant toute condition ou return.
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
        navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

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

  const filteredStories = stories.filter(story => story.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={styles.container}>
      <div className={styles.blob1}></div>
      <div className={styles.blob2}></div>

      <main className={styles.main}>
        <h1 className={styles.pageTitle}>Mes Histoires</h1>

        <div className={styles.searchContainer} style={{ maxWidth: '100%', marginBottom: '30px' }}>
            <input
              type="text"
              placeholder="Rechercher dans mes histoires..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        
        {filteredStories.length === 0 && (
          <div className={styles.emptyState}>
            {stories.length === 0 ? "Vous n'avez pas encore créé d'histoire." : "Aucune de vos histoires ne correspond à votre recherche."}
          </div>
        )}
        
        <div className={styles.storiesGrid}>
          {filteredStories.map(story => (
            <div key={story.id} className={styles.storyCard}>
              <div className={styles.storyContent}> {/* On ajoute ce conteneur */}
                <h3 className={styles.storyTitle}>{story.title}</h3>
                <p className={styles.storyDescription}>{story.description}</p>
                {Array.isArray(story.Tags) && story.Tags.length > 0 && (
                  <div className={styles.tagsContainer}>
                    {story.Tags.map((tag) => (
                      <span key={tag.id} className={styles.tag}>{tag.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.storyMeta}>
                <span className={`${styles.badge} 
                  ${story.statut === 'publié' ? styles.badgePublished : ''} 
                  ${story.statut === 'suspendu' ? styles.badgeSuspended : ''} 
                  ${story.statut === 'brouillon' ? styles.badgeDraft : ''}`}>
                  {story.statut.toUpperCase()}
                </span>
              </div>
              <StoryStats storyId={story.id} />
              <div className={styles.storyActions}>
                {user?.role === 'admin' && story.statut === 'brouillon' && (
                  <button onClick={() => handlePublish(story.id)} className={`${styles.button} ${styles.buttonPrimary}`}>Publier</button>
                )}
                <Link to={`/story-creator/${story.id}`} className={`${styles.button} ${styles.buttonSecondary}`}>Modifier</Link>
                <button onClick={() => handleDelete(story.id)} className={`${styles.button} ${styles.buttonDelete}`}>Supprimer</button>
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
