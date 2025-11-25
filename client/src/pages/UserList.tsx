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
        headers: { 'Authorization': `Bearer ${token}` }
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
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setUsers(users.filter(u => u.id !== id));
  };

  const handleRoleChange = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'user' ? 'admin' : 'user';
    
    await fetch(`http://localhost:5000/api/users/${id}/role`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ role: newRole })
    });
    
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <h1>Administration des Utilisateurs</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table border={1} cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th>ID</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <span style={{ 
                    fontWeight: 'bold', 
                    color: user.role === 'admin' ? 'red' : 'green' 
                }}>
                    {user.role.toUpperCase()}
                </span>
              </td>
              <td>
                <button 
                    onClick={() => handleRoleChange(user.id, user.role)}
                    style={{ marginRight: '10px' }}
                >
                    {user.role === 'user' ? 'Passer Admin' : 'Passer User'}
                </button>
                
                <button 
                    onClick={() => handleDelete(user.id)}
                    style={{ backgroundColor: 'red', color: 'white' }}
                >
                    Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}