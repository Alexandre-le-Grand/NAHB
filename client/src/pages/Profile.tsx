import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface PlaythroughEntry {
  Story: {
    id: number;
    title: string;
    description: string;
  },
  status: 'in_progress' | 'finished';
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [playedStories, setPlayedStories] = useState<PlaythroughEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Récupérer les infos de l'utilisateur
        const userRes = await fetch('http://localhost:5000/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        if (userRes.ok) setUser(userData);

        // Récupérer les histoires jouées
        const storiesRes = await fetch('http://localhost:5000/users/me/playthroughs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const storiesData = await storiesRes.json();
        // On ne filtre plus, on prend toutes les histoires jouées
        if (storiesRes.ok) setPlayedStories(storiesData);

      } catch (error) {
        console.error("Erreur lors de la récupération des données du profil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Chargement du profil...</div>;
  if (!user) return <div>Veuillez vous connecter pour voir votre profil.</div>;

  return (
    <div style={{ padding: '40px 20px', color: '#fff' }}>
      <h1>Profil de {user.username}</h1>
      <p>Email: {user.email}</p>
      <p>Rôle: {user.role}</p>

      <hr style={{ margin: '30px 0', borderColor: 'rgba(255,255,255,0.1)' }} />

      <h2>Histoires Jouées</h2>
      {playedStories.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {playedStories.map(playthrough => {
            // Si l'histoire liée n'existe plus, on n'affiche rien pour cette entrée.
            if (!playthrough.Story) return null;

            return (
              <Link key={playthrough.Story.id} to={`/read/${playthrough.Story.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ padding: '15px', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{playthrough.Story.title}</h3>
                    <span style={{
                      backgroundColor: playthrough.status === 'finished' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: playthrough.status === 'finished' ? '#6ee7b7' : '#7dd3fc',
                      border: playthrough.status === 'finished' ? '1px solid #10b981' : '1px solid #38bdf8',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {playthrough.status === 'finished' ? 'Fini' : 'En cours'}
                    </span>
                  </div>
                  <p style={{ margin: '5px 0 0', color: '#94a3b8' }}>{playthrough.Story.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p>Vous n'avez pas encore terminé d'histoire. <Link to="/library" style={{ color: '#38bdf8' }}>Explorez la bibliothèque !</Link></p>
      )}
    </div>
  );
}