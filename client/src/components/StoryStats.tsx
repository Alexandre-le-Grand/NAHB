import React, { useEffect, useState } from 'react';
import styles from '../css/Library.module.css'; // On peut utiliser les styles de Library

interface StoryStatsProps {
  storyId: number;
}

export const StoryStats = ({ storyId }: StoryStatsProps) => {
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
    </div>
  );
};