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
  Tags?: { // Le nom est capitalisé par Sequelize
    id: number;
    name: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
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

  // State pour la popup de modération des tags
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [storyForTagModal, setStoryForTagModal] = useState<Story | null>(null);

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
      console.log("%c[Library] Démarrage de fetchData...", "color: blue; font-weight: bold;");
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log("[Library] Token récupéré:", token ? `Bearer ${token.substring(0, 15)}...` : "Absent");
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      console.log("[Library] Headers préparés pour la requête:", headers);

      try {
        console.log("[Library] Envoi des requêtes en parallèle vers /stories et /users/me/playthroughs...");
        const [storiesRes, playthroughsRes] = await Promise.all([
          fetch('http://localhost:5000/stories', {
            headers: headers,
          }),
          fetch('http://localhost:5000/users/me/playthroughs', {
            headers: headers,
          }),
        ]);
        console.log(`[Library] Réponses reçues: /stories [${storiesRes.status}], /users/me/playthroughs [${playthroughsRes.status}]`);

        if (playthroughsRes.ok) {
          console.log("Playthroughs récupérés avec succès.");
          const playthroughsData: PlaythroughData[] = await playthroughsRes.json();
          console.log("[Library] Données des playthroughs:", playthroughsData);
          updatePlaythroughStatuses(playthroughsData);
        }
        if (!storiesRes.ok) {
          console.error(`[Library] La requête /stories a échoué avec le statut ${storiesRes.status}. Tentative de lecture du corps de l'erreur...`);
          // Essayons de lire le message d'erreur du backend
          const errorData = await storiesRes.json().catch(() => null); // .json() peut échouer si la réponse est vide
          console.error(
            "Erreur lors de la récupération des histoires:", 
            storiesRes.status, 
            storiesRes.statusText,
            errorData || "(pas de message d'erreur détaillé dans le corps de la réponse)"
          );
          setStories([]); // Assure que stories est toujours un tableau
        } else {
          console.log("Histoires récupérées avec succès.");
          const storiesData: Story[] = await storiesRes.json();
          console.log("[Library] Données des histoires:", storiesData);
          setStories(storiesData);
        }

      } catch (err) {
        console.error("%c[Library] Une erreur CATCH globale est survenue dans fetchData:", "color: red; font-weight: bold;", err);
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

  const openTagModerationModal = (story: Story) => {
    setStoryForTagModal(story);
    setTagModalOpen(true);
  };

  const handlePublishClick = (story: Story) => {
    const pendingTags = story.Tags?.filter(t => t.status === 'pending') || [];
    // Si l'utilisateur est admin et qu'il y a des tags en attente, on ouvre la popup
    if (user?.role === 'admin' && pendingTags.length > 0) {
      openTagModerationModal(story);
    } else {
      // Sinon, on publie directement
      publishStory(story.id);
    }
  };

  const publishStory = async (storyId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/stories/${storyId}/publish`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Impossible de publier');
      setStories(prev =>
        prev.map(story =>
          story.id === storyId ? { ...story, statut: 'publié' } : story
        )
      );
      // Fermer la popup si elle était ouverte
      setTagModalOpen(false);
      setStoryForTagModal(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la publication de l'histoire.");
    }
  };

  const handleTagDecision = async (tagId: number, decision: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/tags/${tagId}/${decision}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Impossible de ${decision} le tag.`);
      
      // Mettre à jour l'état local pour que le changement soit visible immédiatement
      if (storyForTagModal) {
        // On met à jour le statut du tag au lieu de le supprimer de la vue
        const updatedTags = storyForTagModal.Tags?.map(tag => 
          tag.id === tagId ? { ...tag, status: decision === 'approve' ? 'approved' : 'rejected' } : tag
        );
        const updatedStory = { ...storyForTagModal, Tags: updatedTags };
        setStoryForTagModal(updatedStory);
        // Mettre aussi à jour la liste principale des histoires
        setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));

        // S'il n'y a plus de tags en attente dans la popup, on publie automatiquement.
        const remainingPendingTags = updatedTags?.filter(t => t.status === 'pending');
        if (remainingPendingTags && remainingPendingTags.length === 0) {
          // On attend un court instant pour que l'utilisateur voie le changement, puis on publie.
          setTimeout(() => publishStory(storyForTagModal.id), 300);
        }
      }
    } catch (err) {
      console.error(err);
      alert(`Erreur lors de la modération du tag.`);
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
              {Array.isArray(story.Tags) && story.Tags.length > 0 && (
                <div className={styles.tagsContainer}>
                  {story.Tags.map(tag => (
                    <span key={tag.id} className={`${styles.tag} ${tag.status === 'pending' ? styles.tagPending : ''}`}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
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
                        <button onClick={() => handlePublishClick(story)} className={`${styles.button} ${styles.buttonPrimary}`}>Publier</button>
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
        {tagModalOpen && storyForTagModal && (
          <div className={styles.modalBackdrop}>
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>Modération des tags</h2>
              <p className={styles.modalDescription}>Les tags suivants sont en attente pour l'histoire "{storyForTagModal.title}". Approuvez-les pour qu'ils deviennent publics.</p>
              <div className={styles.tagModerationList}>
                {storyForTagModal.Tags?.filter(t => t.status === 'pending').map(tag => (
                  <div key={tag.id} className={styles.tagModerationItem}>
                    <span className={styles.tagPendingName}>{tag.name}</span>
                    <div className={styles.tagModerationActions}>
                      <button onClick={() => handleTagDecision(tag.id, 'approve')} className={`${styles.button} ${styles.buttonApprove}`}>Approuver</button>
                      <button onClick={() => handleTagDecision(tag.id, 'reject')} className={`${styles.button} ${styles.buttonReject}`}>Rejeter</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => setTagModalOpen(false)} className={`${styles.button} ${styles.buttonSecondary}`}>Annuler</button>
                <button 
                  onClick={() => publishStory(storyForTagModal.id)} 
                  className={`${styles.button} ${styles.buttonPrimary}`}>
                  Publier l'histoire
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}