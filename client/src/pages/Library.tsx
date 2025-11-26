import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
}

interface PlaythroughData {
  StoryId: number;
  status: 'in_progress' | 'finished';
}

export default function Library() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [playthroughStatuses, setPlaythroughStatuses] = useState<Record<number, 'in_progress' | 'finished'>>({});

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

  useEffect(() => {
    // If user is not loaded yet, don't fetch stories.
    // This also handles the case where user is null due to redirection.
    if (!user) {
      setLoading(false); // Stop loading if no user to prevent infinite loading state
      return;
    } // Ensure fetchStories is called only when user is available
    async function fetchData() {
      if (!user) return;

      try {
        const token = localStorage.getItem('token');
        // On lance les deux requêtes en parallèle pour gagner du temps
        const [storiesRes, playthroughsRes] = await Promise.all([
          fetch('http://localhost:5000/stories', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:5000/users/me/playthroughs', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const res = await fetch('http://localhost:5000/stories', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const storiesData: Story[] = await storiesRes.json();
        const playthroughsData: PlaythroughData[] = await playthroughsRes.json();

        // On crée un objet pour un accès rapide aux statuts de lecture
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
    }

    fetchData();
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
    if (!user || user.role !== 'admin') return; // Only admin can delete from Library
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


  if (!user) return <div style={styles.container}></div>; // Render empty container while redirecting or user is null
  if (loading) return <div style={styles.loadingContainer}><p style={styles.loadingText}>Chargement des histoires...</p></div>;

  return (
    <div style={styles.container}>
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      <nav style={styles.navbar}>
        <Link to="/acceuil" style={styles.logo}>
            <span style={{ fontSize: "24px", marginRight: "10px" }}>📚</span> 
            Bibliothèque
        </Link>
        <div style={styles.navRight}>
            <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={styles.userInfo}>
                    <div style={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
                    <span style={styles.username}>{user.username}</span>
                </div>
            </Link>
            <button onClick={handleLogout} style={styles.logoutBtn}>
                Déconnexion
            </button>
        </div>
      </nav>

      <main style={styles.main}>
        <h1 style={styles.pageTitle}>Toutes les histoires</h1>
        
        {stories.length === 0 && <div style={styles.emptyState}>Aucune histoire disponible pour le moment.</div>}
        
        <div style={styles.storiesGrid}>
          {stories.map(story => (
            <div key={story.id} style={styles.storyCard}>
              <h3 style={styles.storyTitle}>{story.title}</h3>
              <p style={styles.storyDescription}>{story.description}</p>
              <div style={{...styles.storyMeta, justifyContent: 'space-between'}}>
                <div></div>
                <div>
                  {playthroughStatuses[story.id] && (
                    <span style={{
                      ...styles.badge,
                      backgroundColor: playthroughStatuses[story.id] === 'finished' ? "rgba(16, 185, 129, 0.2)" : "rgba(56, 189, 248, 0.2)",
                      color: playthroughStatuses[story.id] === 'finished' ? "#6ee7b7" : "#7dd3fc",
                      border: playthroughStatuses[story.id] === 'finished' ? "1px solid #10b981" : "1px solid #38bdf8"
                    }}>
                      {playthroughStatuses[story.id] === 'finished' ? 'FINI' : 'EN COURS'}
                    </span>
                  )}
                </div>
                <div>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: story.statut === 'publié' ? "rgba(139, 92, 246, 0.2)" : "rgba(251, 191, 36, 0.2)",
                    color: story.statut === 'publié' ? "#c4b5fd" : "#fcd34d",
                    border: story.statut === 'publié' ? "1px solid #8b5cf6" : "1px solid #facc15"
                  }}>
                    {story.statut.toUpperCase()}
                  </span>
                </div>
              </div>
              <div style={styles.storyActions}>
                {user?.role === 'admin' && (
                  <>
                    {story.statut === 'brouillon' && (
                      <button onClick={() => handlePublish(story.id)} style={{...styles.button, ...styles.buttonPrimary}}>Publier</button>
                    )}
                    <Link to={`/story-creator/${story.id}`} style={{...styles.button, ...styles.buttonSecondary, textDecoration: 'none', textAlign: 'center'}}>Modifier</Link>
                    <button onClick={() => handleDelete(story.id)} style={{...styles.button, ...styles.buttonDelete}}>Supprimer</button>
                  </>
                )}
                {/* Add a link to play the story later */}
                <Link to={`/play/${story.id}`} style={{...styles.button, ...styles.buttonSecondary, textDecoration: 'none', textAlign: 'center'}}>
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

const styles: any = {
    container: {
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden"
    },
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
    navbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        position: "sticky",
        top: 0,
        zIndex: 10
    },
    logo: {
        fontSize: "22px",
        fontWeight: "800",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        letterSpacing: "-0.5px",
        textDecoration: 'none'
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
    main: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 20px",
        position: "relative",
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
    },
    pageTitle: {
        fontSize: "32px",
        fontWeight: "800",
        color: "white",
        textAlign: 'center',
        marginBottom: '16px'
    },
    loadingContainer: {
      minHeight: "100vh",
      backgroundColor: "#0f172a",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: "#e2e8f0",
      fontSize: "20px",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    emptyState: {
      textAlign: 'center',
      padding: '40px',
      color: "#64748b",
      backgroundColor: "rgba(30, 41, 59, 0.4)",
      borderRadius: '12px',
      border: '1px dashed #334155'
    },
    storiesGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
      gap: "20px"
    },
    storyCard: {
        backgroundColor: "rgba(30, 41, 59, 0.7)",
        borderRadius: "16px",
        padding: "25px",
        border: "1px solid rgba(255,255,255,0.05)",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        gap: "15px"
    },
    storyTitle: {
      fontSize: "20px",
      fontWeight: "700",
      color: "white",
      borderBottom: "1px solid #334155",
      paddingBottom: "10px",
      marginBottom: "5px"
    },
    storyDescription: {
      fontSize: "14px",
      color: "#cbd5e1",
      flexGrow: 1 // Allows description to take available space
    },
    storyMeta: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "10px"
    },
    badge: {
        alignSelf: "flex-start",
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600"
    },
    storyActions: {
      display: "flex",
      gap: "10px",
      marginTop: "15px",
      justifyContent: "flex-end"
    },
    button: {
      padding: "10px 15px",
      borderRadius: "8px",
      border: "none",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: 'all 0.2s'
    },
    buttonPrimary: {
      background: "linear-gradient(to right, #38bdf8, #818cf8)",
      color: "white",
    },
    buttonSecondary: {
      backgroundColor: "#334155",
      color: "#cbd5e1",
      border: "1px solid #475569"
    },
    buttonDelete: {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
      color: '#fca5a5',
      border: '1px solid #ef4444'
    },
};