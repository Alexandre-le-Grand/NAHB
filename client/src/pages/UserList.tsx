import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  const currentUser = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    if (!token || !currentUser || currentUser.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [navigate, token]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Accès refusé');

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError("Impossible de charger les utilisateurs");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;

    await fetch(`http://localhost:5000/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    setUsers(users.filter(u => u.id !== id));
  };

 const handleRoleChange = async (id: number, currentRole: string) => {
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


  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND DECORATION */}
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>

      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <Link to="/acceuil" style={styles.logo}>
          <span style={{ fontSize: "24px", marginRight: "10px" }}>🛡️</span>
          Admin Panel
        </Link>
        <div style={styles.navRight}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>{currentUser?.username.charAt(0).toUpperCase()}</div>
            <span style={styles.username}>{currentUser?.username}</span>
          </div>
          <button onClick={logout} style={styles.logoutBtn}>
            Déconnexion
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
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
                <tr key={user.id}>
                  <td style={styles.td}>{user.id}</td>
                  <td style={styles.td}>{user.username}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: user.role === "admin" ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                      color: user.role === "admin" ? "#fca5a5" : "#6ee7b7",
                      border: user.role === "admin" ? "1px solid #ef4444" : "1px solid #10b981"
                    }}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleRoleChange(user.id, user.role)}
                        style={{ ...styles.btn, ...styles.btnPromote }}
                      >
                        {user.role === 'user' ? 'Promouvoir' : 'Rétrograder'}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={{ ...styles.btn, ...styles.btnDelete }}
                      >
                        Supprimer
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
};
