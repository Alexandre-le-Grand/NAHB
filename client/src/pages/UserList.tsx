import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      const res = await fetch('http://localhost:5000/api/users', {
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

    await fetch(`http://localhost:5000/api/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    setUsers(users.filter(u => u.id !== id));
  };

  const handleRoleChange = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'user' ? 'admin' : 'user';

    await fetch(`http://localhost:5000/api/users/${id}/role`, {
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
    <>
      {/* HEADER */}
      <header style={headerStyles.container}>
        <h2 style={headerStyles.title}>⚙️ Admin Panel</h2>

        <div style={headerStyles.userSection}>
          <span style={headerStyles.username}>
            Connecté : <strong>{currentUser?.username}</strong>
          </span>

          <button onClick={logout} style={headerStyles.logoutBtn}>
            Déconnexion
          </button>
        </div>
      </header>

      {/* CONTENU */}
      <div className="container" style={{ padding: "40px" }}>
        <h1 style={{ marginBottom: "20px" }}>👤 Administration des Utilisateurs</h1>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{
          overflowX: "auto",
          borderRadius: "8px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: "white"
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f7f7f7", borderBottom: "2px solid #ddd" }}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Nom</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Rôle</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map(user => (
                <tr key={user.id} style={styles.tr}>
                  <td style={styles.td}>{user.id}</td>
                  <td style={styles.td}>{user.username}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      fontWeight: "bold",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      color: "white",
                      backgroundColor: user.role === "admin" ? "#d9534f" : "#5cb85c"
                    }}>
                      {user.role.toUpperCase()}
                    </span>
                  </td>

                  <td style={styles.td}>
                    <button
                      onClick={() => handleRoleChange(user.id, user.role)}
                      style={{ ...styles.btn, backgroundColor: "#0275d8" }}
                    >
                      {user.role === 'user' ? 'Passer Admin' : 'Passer User'}
                    </button>

                    <button
                      onClick={() => handleDelete(user.id)}
                      style={{ ...styles.btn, backgroundColor: "#d9534f" }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </div>
    </>
  );
}

const headerStyles = {
  container: {
    width: "100%",
    padding: "15px 30px",
    backgroundColor: "#1e1e1e",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 3px 6px rgba(0,0,0,0.3)"
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: 600
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },
  username: {
    fontSize: "15px"
  },
  logoutBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer",
    backgroundColor: "#d9534f",
    transition: "opacity .2s"
  }
};

const styles = {
  th: {
    padding: "12px",
    textAlign: "left",
    fontWeight: "600",
    borderBottom: "1px solid #ddd"
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #eee"
  },
  tr: {
    transition: "background 0.2s"
  },
  btn: {
    marginRight: "10px",
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  }
};
