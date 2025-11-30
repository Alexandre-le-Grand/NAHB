import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  isBanned: boolean;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || currentUser?.role !== 'admin') {
      navigate('/acceuil');
      return;
    }

    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Token manquant, impossible de charger les utilisateurs.");
        return;
      }
      try {
        const res = await fetch('http://localhost:5000/users', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Accès refusé ou erreur serveur');

        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError("Impossible de charger les utilisateurs");
      }
    };

    fetchUsers();
  }, [isLoading, isAuthenticated, currentUser, navigate]);

  const handleToggleBan = async (id: number) => {
    const token = localStorage.getItem('token');
    const userToToggle = users.find(u => u.id === id);
    if (!userToToggle) return;

    const action = userToToggle.isBanned ? 'débannir' : 'bannir';
    if (!window.confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) return;
    
    const res = await fetch(`http://localhost:5000/users/${id}/ban`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    if (res.ok) {
      const updatedUser = await res.json();
      setUsers(users.map(u => u.id === id ? updatedUser : u));
    } else {
      const errorData = await res.json();
      setError(`L'opération de ${action} a échoué: ${errorData.message}`);
    }
  };

 const handleRoleChange = async (id: number, currentRole: string) => {
  const token = localStorage.getItem('token');
  const roles = ["user", "author", "admin"];
  const currentIndex = roles.indexOf(currentRole);
  const newRole = roles[(currentIndex + 1) % roles.length];

  await fetch(`http://localhost:5000/users/${id}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ role: newRole })
  });

  setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
};

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <h1 style={styles.pageTitle}>Administration des Utilisateurs</h1>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Utilisateur</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={user.isBanned ? { opacity: 0.5, textDecoration: 'line-through' } : {}}>
                  <td style={styles.td}>{user.id}</td>
                  <td style={styles.td}>{user.username}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: user.isBanned ? '#4b5563' : (user.role === "admin" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)"),
                      color: user.isBanned ? '#d1d5db' : (user.role === "admin" ? "#fca5a5" : "#6ee7b7"),
                      border: user.isBanned ? '1px solid #6b7280' : (user.role === "admin" ? "1px solid #ef4444" : "1px solid #10b981")
                    }}>
                      {user.isBanned ? 'BANNI' : user.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        disabled={user.isBanned}
                        onClick={() => handleRoleChange(user.id, user.role)}
                        style={{ ...styles.btn, ...styles.btnPromote }}
                      >
                        {user.role === 'user' ? 'Promouvoir' : 'Rétrograder'}
                      </button>
                      <button
                        onClick={() => handleToggleBan(user.id)}
                        style={{ ...styles.btn, ...(user.isBanned ? styles.btnUnban : styles.btnDelete) }}
                      >
                        {user.isBanned ? 'Débannir' : 'Bannir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}





const styles: any = {
  container: {
      minHeight: "100vh",
      backgroundColor: "#0f172a", // Assurez-vous que cela correspond à votre thème
      color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  },
  navbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 40px",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      backdropFilter: "blur(10px)",
      backgroundColor: "rgba(15, 23, 42, 0.8)",
      position: "relative",
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
      padding: "60px 20px",
      position: "relative",
      zIndex: 1
  },
  pageTitle: {
      fontSize: "36px",
      fontWeight: "800",
      marginBottom: "40px",
      color: "white",
      textAlign: 'center'
  },
  errorBox: {
      padding: '1rem',
      background: 'rgba(239, 68, 68, 0.2)',
      border: '1px solid rgba(239, 68, 68, 0.5)',
      borderRadius: '12px',
      color: '#fca5a5',
      marginBottom: '1.5rem',
      textAlign: 'center',
      fontSize: '14px'
  },
  tableCard: {
      backgroundColor: "rgba(30, 41, 59, 0.7)",
      borderRadius: "16px",
      padding: "10px 30px 30px 30px",
      border: "1px solid rgba(255,255,255,0.05)",
      backdropFilter: "blur(10px)",
      overflowX: 'auto'
  },
  table: {
      width: "100%",
      borderCollapse: "collapse",
      color: "#e2e8f0",
      fontSize: '14px'
  },
  th: {
      padding: "16px",
      textAlign: "left",
      fontWeight: "600",
      color: "#94a3b8",
      borderBottom: "1px solid #334155",
      textTransform: 'uppercase',
      fontSize: '12px'
  },
  td: {
      padding: "16px",
      borderBottom: "1px solid #1e293b",
      verticalAlign: 'middle'
  },
  badge: {
      alignSelf: "flex-start",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600"
  },
  btn: {
      padding: "6px 12px",
      border: "none",
      borderRadius: "6px",
      color: "white",
      cursor: "pointer",
      fontSize: '13px',
      fontWeight: '600',
      transition: 'opacity 0.2s'
  },
  btnPromote: {
      backgroundColor: '#3b82f6'
  },
  btnDelete: {
      backgroundColor: '#ef4444'
  },
  btnUnban: {
      backgroundColor: '#22c55e'
  }
};
