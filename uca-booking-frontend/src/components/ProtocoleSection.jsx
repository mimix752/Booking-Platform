import React from 'react';

const ProtocoleSection = () => {
  const protocols = [
    {
      title: "Réservation",
      description: "Processus de demande et validation des réservations",
      steps: ["Connexion", "Sélection", "Validation", "Confirmation"]
    },
    {
      title: "Utilisation",
      description: "Règles d'usage des locaux réservés",
      steps: ["Accès", "Configuration", "Nettoyage", "Fermeture"]
    },
    {
      title: "Annulation",
      description: "Procédure d'annulation des réservations",
      steps: ["Demande", "Justification", "Validation", "Remboursement"]
    }
  ];

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
          }
        }

        .protocol-float {
          animation: float 3s ease-in-out infinite;
        }

        .protocol-float:hover {
          animation-play-state: paused;
          transform: translateY(0px) scale(1.05);
        }
      `}</style>

      <section className="py-2 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-5">
              Protocoles de Réservation
            </h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Suivez ces étapes pour une réservation réussie
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {protocols.map((protocol, index) => (
              <div
                key={index}
                className="protocol-float bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent 
                           hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-400/50 
                           transition-all duration-500"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {protocol.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {protocol.description}
                </p>
                <ol className="space-y-2">
                  {protocol.steps.map((step, stepIndex) => (
                    <li
                      key={stepIndex}
                      className="flex items-center text-sm text-gray-700"
                    >
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                        {stepIndex + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default ProtocoleSection;