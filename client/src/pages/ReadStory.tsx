import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

interface Choice {
  id: number;
  text: string;
  next_PageId: number | null;
}

interface Page {
  id: number;
  content: string;
  isEnding: boolean;
  choices: Choice[];
}

interface Story {
  id: number;
  title: string;
  description: string;
  startPageId: number;
  AuthorId: number; // Ajout de l'ID de l'auteur
  pages: Page[];
}

interface User {
  id: number;
  username: string;
}

export default function ReadStory() {
  // route can provide either `storyId` (from App routes) or `id` depending on usage
  const params = useParams<{ storyId?: string; id?: string }>();
  const navigate = useNavigate();
  const id = params.storyId || params.id;
  const [story, setStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStory() {
      if (!id) {
        console.error('No story id provided in route params');
        setLoading(false);
        return;
      }

      const userData = localStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }

      try {
        const res = await fetch(`http://localhost:5000/stories/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!res.ok) throw new Error('Erreur lors de la récupération de l\'histoire');

        const data: Story = await res.json();

        // On inclut l'AuthorId pour vérifier les permissions côté client
        if (!data.pages || data.pages.length === 0) {
          setStory(null);
          setLoading(false);
          return;
        }

        setStory(data);

        // Met la page de départ
        const start = data.pages.find(p => p.id === data.startPageId);
        setCurrentPage(start || data.pages[0]);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStory();
  }, [id]);

  // Effet pour marquer l'histoire comme "en cours"
  useEffect(() => {
    if (id) {
      const startPlaythrough = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          await fetch(`http://localhost:5000/stories/playthroughs/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ storyId: id }),
          });
        } catch (err) {
          console.error("Erreur lors du marquage 'en cours':", err);
        }
      };
      startPlaythrough();
    }
  }, [id]);

  // Effet pour enregistrer la fin de la partie
  useEffect(() => {
    if (currentPage && currentPage.isEnding && story) {
      const recordEnding = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;

          await fetch(`http://localhost:5000/stories/playthroughs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ storyId: story.id, endingPageId: currentPage.id }),
          });
          // Pas besoin de gérer la réponse ici, c'est une action en arrière-plan.
        } catch (err) {
          console.error("Erreur lors de l'enregistrement de la fin de partie:", err);
        }
      };
      recordEnding();
    }
  }, [currentPage, story]);

  const handleChoice = (nextPageId: number | null) => {
    if (!story || !story.pages) return;

    const nextPage = story.pages.find(p => p.id === nextPageId) || null;
    setCurrentPage(nextPage);
  };

  const handleDeleteStory = async () => {
    if (!story) return;

    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette histoire ? Cette action est irréversible.")) {
      try {
        const res = await fetch(`http://localhost:5000/stories/${story.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'La suppression a échoué.');
        }

        alert('Histoire supprimée avec succès.');
        navigate('/library'); // Redirige vers la bibliothèque après suppression
      } catch (err) {
        console.error(err);
        alert((err as Error).message || 'Une erreur est survenue.');
      }
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!story) return <div>Cette histoire ne contient aucune page.</div>;
  if (!currentPage) return <div>Page introuvable.</div>;

  return (
    <div style={{ padding: '40px 20px', color: '#fff', fontFamily: "Inter, system-ui, -apple-system, sans-serif", backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <main style={{ width: '100%', maxWidth: 900 }}>
        <header style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 34, letterSpacing: '-0.5px' }}>{story.title}</h1>
            <p style={{ margin: '6px 0 0 0', color: '#94a3b8' }}>{story.description}</p>
          </div>
          <div style={{ textAlign: 'right', color: '#94a3b8', fontSize: 13 }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0' }}>Lecture</div>
            <div style={{ marginTop: 6, fontSize: 12 }}>{currentPage.isEnding ? 'Fin' : 'Choix interactifs'}</div>
          </div>
        </header>

        <article style={{ marginTop: '10px', padding: '28px', backgroundColor: '#0b1220', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 10px 30px rgba(2,6,23,0.6)' }}>
          <div style={{ fontSize: 18, lineHeight: 1.6, color: '#e6edf3' }}>{currentPage.content}</div>

          {!currentPage.isEnding && currentPage.choices && currentPage.choices.length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {currentPage.choices.map((choice, idx) => {
                const nextId = choice.next_PageId ?? (choice as any).nextPageId ?? null;
                return (
                  <button
                    key={choice.id ?? idx}
                    onClick={() => handleChoice(nextId)}
                    style={{ padding: '12px 22px', borderRadius: 12, cursor: 'pointer', background: 'linear-gradient(180deg, rgba(52,65,85,0.9), rgba(30,41,59,0.9))', color: '#cfe9ff', border: '1px solid rgba(255,255,255,0.04)', fontWeight: 600 }}
                  >
                    {choice.text}
                  </button>
                );
              })}
            </div>
          )}
        {currentPage.isEnding && (
          <div style={{ marginTop: '20px', fontWeight: 'bold', color: '#facc15' }}>
            FIN DE L'HISTOIRE
          </div>
        )}
        </article>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, alignItems: 'center' }}>
          <Link to="/library" style={{ color: '#38bdf8', textDecoration: 'none', background: 'transparent', padding: '8px 12px' }}>⟵ Retour à la bibliothèque</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Partage | Ajouter aux favoris</div>
            {currentUser && story && currentUser.id === story.AuthorId && (
              <button onClick={handleDeleteStory} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid #ef4444', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Supprimer l'histoire
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
