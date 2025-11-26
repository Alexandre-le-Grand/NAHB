import React, { useEffect, useState } from 'react';

interface Story {
  id: number;
  title: string;
  description: string;
  statut: string;
}

interface User {
  id: number;
  role: 'user' | 'admin';
  username: string;
}

interface Props {
  user: User | null;
}

export default function Library({ user }: Props) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    if (!user) return;
    try {
      const res = await fetch('http://localhost:5000/stories', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data: Story[] = await res.json();
      if (user.role === 'admin') {
        setStories(data);
      } else {
        setStories(data.filter(story => story.statut === 'publié'));
      }
    } catch (err) {
      console.error('Erreur fetch stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (story: Story) => {
    if (!user || user.role !== 'admin') return;
    try {
      const newStatut = story.statut === 'publié' ? 'brouillon' : 'publié';
      const res = await fetch(`http://localhost:5000/stories/${story.id}/publish`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        setStories(prev =>
          prev.map(s => (s.id === story.id ? { ...s, statut: newStatut } : s))
        );
      }
    } catch (err) {
      console.error('Erreur toggle publish:', err);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [user]);

  if (!user) return <div>Connectez-vous pour voir les histoires</div>;
  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Bibliothèque</h2>
      {stories.length === 0 && <p>Aucune histoire disponible.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {stories.map(story => (
          <div key={story.id} style={{ border: '1px solid #ccc', borderRadius: '12px', padding: '1rem' }}>
            <h3>{story.title}</h3>
            <p>{story.description}</p>
            <p>
              Statut: <strong>{story.statut}</strong>
            </p>
            {user.role === 'admin' && (
              <button
                onClick={() => togglePublish(story)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  background: story.statut === 'publié' ? '#f59e0b' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {story.statut === 'publié' ? 'Mettre en brouillon' : 'Publier'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
