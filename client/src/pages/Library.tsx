import React, { useEffect, useState } from 'react';

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

export default function Library() {
  const [stories, setStories] = useState<Story[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.id, username: payload.username, role: payload.role });
    } catch (err) {
      console.error('Erreur décodage token', err);
    }
  }, []);

  useEffect(() => {
    async function fetchStories() {
      if (!user) return;

      try {
        const res = await fetch('http://localhost:5000/stories');
        const data: Story[] = await res.json();

        if (user.role === 'admin') {
          setStories(data);
        } else {
          setStories(data.filter(story => story.statut === 'publié'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h1>Bibliothèque d'histoires</h1>
      {stories.length === 0 && <p>Aucune histoire disponible.</p>}
      <ul>
        {stories.map(story => (
          <li key={story.id} style={{ marginBottom: '1rem' }}>
            <h3>{story.title}</h3>
            <p>{story.description}</p>
            <p>Statut : {story.statut}</p>
            {user?.role === 'admin' && story.statut === 'brouillon' && (
              <button onClick={() => handlePublish(story.id)}>Publier</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
