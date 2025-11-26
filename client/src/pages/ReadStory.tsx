import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

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
  pages: Page[];
}

export default function ReadStory() {
  // route can provide either `storyId` (from App routes) or `id` depending on usage
  const params = useParams<{ storyId?: string; id?: string }>();
  const id = params.storyId || params.id;
  const [story, setStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStory() {
      if (!id) {
        console.error('No story id provided in route params');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/stories/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!res.ok) throw new Error('Erreur lors de la récupération de l\'histoire');

        const data: Story = await res.json();

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

  const handleChoice = (nextPageId: number | null) => {
    if (!story || !story.pages) return;

    const nextPage = story.pages.find(p => p.id === nextPageId) || null;
    setCurrentPage(nextPage);
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
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Partage | Ajouter aux favoris</div>
        </div>
      </main>
    </div>
  );
}
