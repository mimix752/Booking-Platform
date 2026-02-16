import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { GOOGLE_CLIENT_ID } from '../config/config';
import { userManager } from '../utils/UserManager';
import { googleLogin as googleLoginApi } from '../services/authService';
import { loginApi } from '../services/passwordAuthService';
import { api } from '../utils/apiClient';
import { ArrowLeft, Mail, Lock, AlertCircle, Eye, EyeOff, Phone } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailValidation, setEmailValidation] = useState({ isValid: true, error: null });
  const [showManualLogin, setShowManualLogin] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Phone modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);

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
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const completeLogin = (apiUser) => {
    login(apiUser, apiUser?.role === 'admin');
    navigate(apiUser?.role === 'admin' ? '/admin-dashboard' : '/');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setError('');
      const googleIdToken = credentialResponse?.credential;
      if (!googleIdToken) {
        setError('Token Google manquant. Réessayez.');
        return;
      }

      const { user: apiUser } = await googleLoginApi(googleIdToken);

      if (!apiUser?.telephone) {
        setPendingUser(apiUser);
        setShowPhoneModal(true);
      } else {
        completeLogin(apiUser);
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Erreur lors de la connexion avec Google');
    }
  };

  const handleGoogleFailure = () => {
    setError('Erreur lors de la connexion avec Google. Essayez la connexion manuelle.');
    setShowManualLogin(true);
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { user: apiUser } = await loginApi({ email, password });

      if (!apiUser?.telephone) {
        setPendingUser(apiUser);
        setShowPhoneModal(true);
      } else {
        completeLogin(apiUser);
      }
    } catch (err) {
      setError(err?.message || 'Connexion échouée');
    }
  };

  const handlePhoneSubmit = async () => {
    const trimmed = phoneNumber.trim();
    if (trimmed.length < 6) {
      setPhoneError('Veuillez entrer un numéro de téléphone valide.');
      return;
    }

    setPhoneSaving(true);
    setPhoneError('');
    try {
      await api.put('/profile/update', { telephone: trimmed });
      const updatedUser = { ...pendingUser, telephone: trimmed };
      completeLogin(updatedUser);
    } catch (err) {
      setPhoneError(err?.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setPhoneSaving(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }

        .animate-fadeIn { animation: fadeIn 0.8s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-slideInLeft { animation: slideInLeft 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-float { animation: float 3s ease-in-out infinite; }

        .input-focus:focus {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .btn-hover:active {
          transform: translateY(0);
        }

        .shimmer-btn {
          background-size: 200% 100%;
          background-position: -100% 0;
          transition: background-position 0.5s ease;
        }

        .shimmer-btn:hover {
          background-position: 100% 0;
        }
      `}</style>

      <div className="min-h-screen flex relative overflow-hidden">

        {/* Left Side - Decorative */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
          {/* Pattern background */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "url('/pattern.png')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 animate-slideInLeft">
            {/* Logo */}
            <div className="mb-12">
              <img
                src="/logo-nobck.png"
                alt="UCA Logo"
                className="w-32 h-32 object-contain drop-shadow-2xl"
              />
            </div>

            {/* Title */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 mb-4">
                <div className="w-12 h-1 bg-gradient-to-r from-amber-500 to-transparent rounded-full" />
              </div>
              <h1 className="text-5xl xl:text-6xl font-bold text-stone-800 mb-6 leading-tight">
                Accédez à votre
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500">
                  Espace UCA
                </span>
              </h1>
              <p className="text-lg text-stone-600 leading-relaxed max-w-md">
                Connectez-vous pour gérer facilement et en toute sécurité les salles et espaces institutionnels de l'Université Cadi Ayyad.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white relative">

          {/* Mobile logo */}
          <div className="lg:hidden absolute top-8 left-8">
            <img
              src="/logo-nobck.png"
              alt="UCA Logo"
              className="w-16 h-16 object-contain drop-shadow-lg"
            />
          </div>

          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-8 right-8 flex items-center gap-2 text-stone-600 hover:text-amber-600 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline font-medium">Retour</span>
          </button>

          {/* Form Container */}
          <div className="w-full max-w-md animate-slideInRight">

            {/* Header */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-stone-900 mb-2">
                Bienvenue
              </h2>
              <p className="text-stone-600">
                Connectez-vous pour continuer
              </p>
            </div>

            {/* Login Forms */}
            {!showManualLogin ? (
              <div className="space-y-6">
                <p className="text-center text-sm text-stone-600 font-medium">
                  Utilisez votre compte Google académique UCA
                </p>

                <div className="flex justify-center">
                  <div className="transform transition-all duration-300 hover:scale-105">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleFailure}
                      text="signin_with"
                      theme="outline"
                      size="large"
                    />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-stone-500">ou</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowManualLogin(true)}
                  className="w-full py-3 text-sm text-stone-600 hover:text-amber-600 font-medium transition-colors border-2 border-stone-200 hover:border-amber-300 rounded-xl">
                  Connexion avec email et mot de passe
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleManualLogin}
                className="space-y-5">

                {/* Email */}
                <div>
                  <label className="block text-stone-800 text-sm font-semibold mb-2">
                    Email académique UCA
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="nom.prenom@uca.ma"
                      required
                      className={`input-focus w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:outline-none font-medium text-stone-900 placeholder-stone-400 transition-all duration-300 ${
                        email && !emailValidation.isValid
                          ? 'border-red-300 focus:border-red-400 bg-red-50/30'
                          : email && emailValidation.isValid
                            ? 'border-green-300 focus:border-green-400 bg-green-50/30'
                            : 'border-stone-200 focus:border-amber-400 bg-stone-50'
                      }`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-stone-800 text-sm font-semibold mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••"
                      required
                      minLength={6}
                      className="input-focus w-full pl-12 pr-12 py-3.5 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-400 font-medium text-stone-900 placeholder-stone-400 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!emailValidation.isValid || !email || !password}
                    className="btn-hover w-full bg-gradient-to-r from-amber-500 to-yellow-500 shimmer-btn text-white py-3.5 px-6 rounded-xl font-bold shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none">
                    Se connecter
                  </button>
                </div>

                {/* Back to Google */}
                <button
                  type="button"
                  onClick={() => setShowManualLogin(false)}
                  className="w-full text-sm text-stone-500 hover:text-amber-600 font-medium transition-colors mt-2">
                  ← Retour à Google Sign-In
                </button>
              </form>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-10 text-center">
              <p className="text-xs text-stone-500">
                © 2026 Université Cadi Ayyad. Tous droits réservés.
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">
                Numéro de téléphone requis
              </h3>
              <p className="text-sm text-stone-500">
                Veuillez renseigner votre numéro de téléphone pour finaliser votre connexion.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-stone-800 text-sm font-semibold mb-2">
                Téléphone
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                  placeholder="06XXXXXXXX"
                  autoFocus
                  className="input-focus w-full pl-12 pr-4 py-3.5 bg-stone-50 border-2 border-stone-200 rounded-xl focus:outline-none focus:border-amber-400 font-medium text-stone-900 placeholder-stone-400 transition-all duration-300"
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePhoneSubmit(); }}
                />
              </div>
              {phoneError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {phoneError}
                </p>
              )}
            </div>

            <button
              onClick={handlePhoneSubmit}
              disabled={phoneSaving || phoneNumber.trim().length < 6}
              className="btn-hover w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white py-3.5 px-6 rounded-xl font-bold shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {phoneSaving ? 'Enregistrement...' : 'Continuer'}
            </button>
          </div>
        </div>
      )}

    </GoogleOAuthProvider>
  );
};

export default LoginPage;
