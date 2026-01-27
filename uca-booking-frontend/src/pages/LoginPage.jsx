import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { GOOGLE_CLIENT_ID } from '../config/config';
import { userManager } from '../utils/UserManager';
import { ArrowLeft, User, Shield, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailValidation, setEmailValidation] = useState({ isValid: true, error: null });
  const [loginMode, setLoginMode] = useState('user'); // 'user' ou 'admin'
  const [showManualLogin, setShowManualLogin] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Validation en temps réel de l'email
  const validateEmailRealTime = (emailValue) => {
    if (!emailValue) {
      setEmailValidation({ isValid: true, error: null });
      return;
    }

    const validation = userManager.isValidUCAEmail(emailValue);
    setEmailValidation(validation);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmailRealTime(value);
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Configuration Google OAuth2 importée depuis config.js

  const handleGoogleSuccess = (credentialResponse) => {
    try {
      // Décoder le JWT token pour récupérer les informations utilisateur
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const userData = JSON.parse(jsonPayload);

      // Vérifier si l'email est du domaine UCA
      if (!userData.email.endsWith('@uca.ma') && !userData.email.endsWith('@uca.ac.ma')) {
        setError('Seuls les emails académiques UCA sont autorisés (@uca.ma ou @uca.ac.ma)');
        return;
      }

      // Connexion réussie
      const user = {
        name: userData.name,
        email: userData.email,
        picture: userData.picture
      };

      login(user, false);
      navigate('/');

    } catch (error) {
      console.error('Erreur lors du traitement de la connexion Google:', error);
      setError('Erreur lors de la connexion avec Google');
    }
  };

  const handleGoogleFailure = () => {
    setError('Erreur lors de la connexion avec Google. Essayez la connexion manuelle.');
    setShowManualLogin(true);
  };

  const handleManualLogin = (e) => {
    e.preventDefault();
    setError('');

    try {
      // Utiliser le gestionnaire d'utilisateurs sécurisé
      const userData = userManager.login(email, password);

      // Vérifier si c'est un admin
      const isAdminUser = userData.role === 'admin';

      login(userData, isAdminUser);

      // Rediriger selon le rôle
      if (isAdminUser) {
        navigate('/admin-dashboard');
      } else {
        navigate('/');
      }

    } catch (error) {
      setError(error.message);
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setError('');

    try {
      // Utiliser le gestionnaire d'utilisateurs sécurisé
      const userData = userManager.login(email, password);

      // Vérifier si c'est vraiment un admin
      if (userData.role !== 'admin') {
        throw new Error('Accès administrateur refusé. Ce compte n\'a pas les privilèges requis.');
      }

      login(userData, true);
      navigate('/admin-dashboard');

    } catch (error) {
      setError(error.message);
    }
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    setError('');

    try {
      // Utiliser le gestionnaire d'utilisateurs sécurisé
      const userData = userManager.register(email, password);

      login(userData, false);
      navigate('/');

    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          {/* Bouton retour */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-amber-800 hover:text-amber-900 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </button>

          <div className="text-center mb-8">
            <div className="w-28 h-28 sm:w-32 sm:h-32 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <img src="/uca-logo.png" alt="UCA Logo" className="w-20 sm:w-24 h-20 sm:h-24 object-contain" />
            </div>

            <h2 className="text-2xl font-bold text-amber-800 mb-2">
              {loginMode === 'user' ? 'Connexion Personnel' : 'Connexion Admin'}
            </h2>
            <p className="text-amber-700">Université Cadi Ayyad</p>
          </div>

          {/* Switch entre modes */}
          <div className="flex bg-stone-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => {
                setLoginMode('user');
                setError('');
                setShowManualLogin(false);
              }}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
                loginMode === 'user' 
                  ? 'bg-white text-amber-800 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Personnel
            </button>
            <button
              onClick={() => {
                setLoginMode('admin');
                setError('');
                setShowManualLogin(false);
              }}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md transition-colors ${
                loginMode === 'admin' 
                  ? 'bg-white text-amber-800 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </button>
          </div>

          {/* Connexion Personnel */}
          {loginMode === 'user' && (
            <div>
              {!showManualLogin ? (
                <>
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Connectez-vous avec votre compte Google académique UCA
                    </p>
                  </div>

                  <div className="flex justify-center mb-4">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleFailure}
                      text="signin_with"
                      theme="outline"
                      size="large"
                      width="100%"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setShowManualLogin(true)}
                      className="text-sm text-amber-800 hover:text-amber-900 underline"
                    >
                      Problème avec Google ? Connexion manuelle
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Connexion manuelle */}
                  <form onSubmit={handleManualLogin}>
                    <div className="mb-4">
                      <label className="block text-amber-800 text-sm font-medium mb-2">
                        Email académique UCA
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="email"
                          value={email}
                          onChange={handleEmailChange}
                          className={`pl-10 pr-10 py-2 w-full border rounded-lg focus:outline-none focus:border-amber-800 ${
                            email && !emailValidation.isValid 
                              ? 'border-red-300 bg-red-50' 
                              : email && emailValidation.isValid 
                                ? 'border-green-300 bg-green-50' 
                                : 'border-stone-300'
                          }`}
                          placeholder="nom.prenom@uca.ma"
                          required
                        />
                        {email && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {emailValidation.isValid ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        )}
                      </div>
                      {email && !emailValidation.isValid && (
                        <p className="text-xs text-red-600 mt-1 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {emailValidation.error}
                        </p>
                      )}
                      {email && emailValidation.isValid && (
                        <p className="text-xs text-green-600 mt-1 flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Email valide
                        </p>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-amber-800 text-sm font-medium mb-2">
                        Mot de passe
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-4 py-2 w-full border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800"
                          placeholder="••••••••••"
                          required
                          minLength={6}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Minimum 6 caractères</p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="flex-1 bg-amber-800 text-white py-2 px-4 rounded-lg hover:bg-amber-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!emailValidation.isValid || !email || !password}
                      >
                        Se connecter
                      </button>
                      <button
                        type="button"
                        onClick={handleSignUp}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!emailValidation.isValid || !email || !password}
                      >
                        S'inscrire
                      </button>
                    </div>
                  </form>

                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowManualLogin(false)}
                      className="text-sm text-gray-600 hover:text-gray-800 underline"
                    >
                      Retour à la connexion Google
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Connexion Admin */}
          {loginMode === 'admin' && (
            <form onSubmit={handleAdminLogin}>
              <div className="mb-4">
                <label className="block text-amber-800 text-sm font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`pl-10 pr-10 py-2 w-full border rounded-lg focus:outline-none focus:border-amber-800 ${
                      email && !emailValidation.isValid 
                        ? 'border-red-300 bg-red-50' 
                        : email && emailValidation.isValid 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-stone-300'
                    }`}
                    placeholder="admin@uca.ac.ma"
                    required
                  />
                  {email && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {emailValidation.isValid ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  )}
                </div>
                {email && !emailValidation.isValid && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {emailValidation.error}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-amber-800 text-sm font-medium mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800"
                    placeholder="••••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-800 text-white py-2 px-4 rounded-lg hover:bg-amber-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!emailValidation.isValid || !email || !password}
              >
                Se connecter
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;