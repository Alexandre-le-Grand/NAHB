import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import styles from '../css/ReadStory.module.css';

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
  AuthorId: number;
  pages: Page[];
}

export default function ReadStory() {
  const params = useParams<{ storyId?: string; id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const id = params.storyId || params.id;
  const [story, setStory] = useState<Story | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStory() {
      if (!id) {
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
        navigate('/library');
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
    <div className={styles.container}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>{story.title}</h1>
          {story.description && <p className={styles.description}>{story.description}</p>}
        </header>

        <article>
          <p className={styles.article}>{currentPage.content}</p>

          {!currentPage.isEnding && currentPage.choices && currentPage.choices.length > 0 && (
            <div className={styles.choicesContainer}>
              {currentPage.choices.map((choice, idx) => {
                const nextId = choice.next_PageId ?? (choice as any).nextPageId ?? null;
                return (
                  <button
                    key={choice.id ?? idx}
                    onClick={() => handleChoice(nextId)}
                    className={styles.choiceButton}
                  >
                    {choice.text}
                  </button>
                );
              })}
            </div>
          )}
        {currentPage.isEnding && (
          <div className={styles.endingText}>
            FIN DE L'HISTOIRE
          </div>
        )}
        </article>
      </main>

      <footer className={styles.footer}>
        <Link to="/library" className={styles.backLink}>⟵ Retour à la bibliothèque</Link>
        {user && story && user.id === story.AuthorId && (
          <button onClick={handleDeleteStory} className={styles.deleteButton}>
            Supprimer l'histoire
          </button>
        )}
      </footer>
    </div>
  );
}
