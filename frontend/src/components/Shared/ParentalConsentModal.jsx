import React, { useState, useEffect } from 'react';
import { Shield, Check, X, AlertTriangle, Info } from 'lucide-react';
import { apiFetch } from '../../api';
import { useTranslation } from 'react-i18next';

const CONSENT_TYPES = [
  { id: 'PEDAGOGICAL', label: 'Traitement pédagogique de base', required: true, description: 'Nécessaire pour la scolarité, les notes et les bulletins.' },
  { id: 'MARKETING', label: 'Communication Marketing', required: false, description: 'Recevoir des offres et informations commerciales.' },
  { id: 'PARTNERS', label: 'Partage Partenaires Tiers', required: false, description: 'Partage avec des partenaires éducatifs ou de transport.' },
  { id: 'HEALTH', label: 'Données de Santé (Sensible)', required: true, description: 'Nécessaire pour les interventions d\'urgence à l\'infirmerie.' }
];

export default function ParentalConsentModal({ isOpen, onClose, childrenList }) {
  const { t } = useTranslation();
  const [consents, setConsents] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeChildId, setActiveChildId] = useState('');
  const [forceMode, setForceMode] = useState(false);

  useEffect(() => {
    if (isOpen && childrenList?.length > 0) {
      loadConsents();
      if (!activeChildId) {
        setActiveChildId(childrenList[0].id);
      }
    }
  }, [isOpen, childrenList]);

  async function loadConsents() {
    setLoading(true);
    try {
      const data = await apiFetch('/consents/parent');
      
      // Structure: { [eleveId]: { [consentType]: 'GRANTED' | 'WITHDRAWN' } }
      const map = {};
      childrenList.forEach(child => {
        map[child.id] = {};
        CONSENT_TYPES.forEach(type => {
          const match = data.find(c => c.eleveId === child.id && c.consentType === type.id);
          map[child.id][type.id] = match ? match.status : null;
        });
      });
      setConsents(map);

      // Check if required consents are missing
      let missingRequired = false;
      childrenList.forEach(child => {
        CONSENT_TYPES.filter(t => t.required).forEach(type => {
          if (map[child.id][type.id] !== 'GRANTED') {
            missingRequired = true;
          }
        });
      });
      setForceMode(missingRequired);

    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function toggleConsent(eleveId, typeId, currentStatus) {
    const newStatus = currentStatus === 'GRANTED' ? 'WITHDRAWN' : 'GRANTED';
    
    // Update optimistically
    const newConsents = { ...consents };
    newConsents[eleveId][typeId] = newStatus;
    setConsents(newConsents);

    try {
      await apiFetch('/consents', {
        method: 'POST',
        body: JSON.stringify({
          eleveId,
          consentType: typeId,
          status: newStatus
        })
      });
    } catch (e) {
      console.error(e);
      // Revert on error
      newConsents[eleveId][typeId] = currentStatus;
      setConsents({ ...newConsents });
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-indigo-200" />
            <div>
              <h2 className="text-xl font-bold">Consentements Parentaux</h2>
              <p className="text-indigo-200 text-xs">Conformité Loi 2024/017 - Protection des données</p>
            </div>
          </div>
          {!forceMode && (
            <button onClick={onClose} className="p-2 hover:bg-indigo-500 rounded-xl transition-colors">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {forceMode && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-800 text-sm">Action Requise</h4>
                <p className="text-amber-700 text-xs mt-1">Vous devez définir vos préférences de consentement pour vos enfants avant d'accéder au portail. Les consentements obligatoires sont nécessaires au fonctionnement de l'école.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Child selector tabs */}
              <div className="flex border-b border-slate-200 gap-4">
                {childrenList.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setActiveChildId(child.id)}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                      activeChildId === child.id 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {child.name}
                  </button>
                ))}
              </div>

              {/* Toggles for active child */}
              {activeChildId && consents[activeChildId] && (
                <div className="space-y-4">
                  {CONSENT_TYPES.map(type => {
                    const status = consents[activeChildId][type.id];
                    const isGranted = status === 'GRANTED';
                    
                    return (
                      <div key={type.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-4">
                        <div className="mt-1">
                          <button
                            onClick={() => toggleConsent(activeChildId, type.id, status)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${
                              isGranted ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              isGranted ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800">{type.label}</h4>
                            {type.required && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-600 uppercase">Requis</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                          
                          {status === null && (
                            <p className="text-xs text-amber-500 font-bold mt-2 flex items-center gap-1">
                              <Info className="h-3 w-3" /> En attente de votre décision (Non consenti)
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={() => {
              // Only allow close if all required are checked
              let missingRequired = false;
              childrenList.forEach(child => {
                CONSENT_TYPES.filter(t => t.required).forEach(type => {
                  if (consents[child.id][type.id] !== 'GRANTED') {
                    missingRequired = true;
                  }
                });
              });
              if (missingRequired) {
                alert("Veuillez accepter tous les consentements requis pour continuer.");
                return;
              }
              setForceMode(false);
              onClose();
            }}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md"
          >
            {forceMode ? 'Enregistrer et Continuer' : 'Fermer'}
          </button>
        </div>

      </div>
    </div>
  );
}
