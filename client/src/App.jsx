import { useState, useEffect } from 'react';
import AuthForms from './components/AuthForms';
import KanbanBoard from './components/KanbanBoard';
import { getToken, removeToken, getCurrentUser } from './utils/api';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = getToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
      } else {
        removeToken();
      }
    } catch {
      removeToken();
    } finally {
      setCheckingAuth(false);
    }
  }

  function handleLogin(userData) {
    setUser(userData);
  }

  function handleLogout() {
    removeToken();
    setUser(null);
  }

  if (checkingAuth) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <AuthForms onLogin={handleLogin} />;
  }

  return <KanbanBoard user={user} onLogout={handleLogout} />;
}
