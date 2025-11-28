import React, { createContext, useState, useEffect, useContext } from 'react';

const api = {
    get: (url, config) => fetch(`http://localhost:5000${url}`, config).then(res => res.json()),
    defaults: { headers: { common: {} } }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const userData = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                    setUser(userData);
                } catch (error) {
                    console.error("Session invalide, déconnexion.", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        verifyUser();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    if (loading) {
        return <div>Chargement de la session...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, isAuthenticated: !!user, isLoading: loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
    }
    return context;
};