import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Délai pour l'animation de sortie
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          bgColor: 'bg-green-500',
          textColor: 'text-white'
        };
      case 'error':
        return {
          icon: <XCircle className="w-5 h-5" />,
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          bgColor: 'bg-yellow-500',
          textColor: 'text-white'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          bgColor: 'bg-blue-500',
          textColor: 'text-white'
        };
    }
  };

  const config = getToastConfig(type);

  return (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`${config.bgColor} ${config.textColor} px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm`}>
        {config.icon}
        <span className="flex-1 text-sm font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 hover:bg-black hover:bg-opacity-20 rounded p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Hook pour gérer les toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return {
    addToast,
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
    ToastContainer
  };
};

export default Toast;
