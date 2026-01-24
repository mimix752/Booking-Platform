import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (email === 'admin@uca.ac.ma' && password === '1111111111@') {
      localStorage.setItem('isAdmin', 'true');
      navigate('/admin-dashboard');
    } else {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/uca-logo.png" alt="UCA Logo" className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-amber-800">Connexion Admin</h2>
          <p className="text-amber-700">Université Cadi Ayyad</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-amber-800 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800"
              placeholder="admin@uca.ac.ma"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-amber-800 text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800"
              placeholder="••••••••••"
              required
            />
          </div>

          {error && (
            <div className="mb-4 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-amber-800 text-white py-2 px-4 rounded-lg hover:bg-amber-900 transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;