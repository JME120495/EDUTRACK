import { apiFetch } from '../api';

/**
 * Service pour la synchronisation en arrière-plan des données saisies hors-ligne.
 * Principalement utilisé pour synchroniser les brouillons et validations de notes.
 */
class SyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = new Set();
  }

  // Permet d'abonner des composants (ex: pour afficher un Toast ou un Spinner)
  subscribe(listener) {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  _notify(status) {
    this.syncListeners.forEach(listener => listener(status));
  }

  init() {
    window.addEventListener('online', () => {
      console.log('[SyncService] Connexion rétablie. Lancement de la synchronisation...');
      this.syncAll();
    });

    // Synchronisation au démarrage si on est en ligne
    if (navigator.onLine) {
      setTimeout(() => this.syncAll(), 2000);
    }
  }

  async syncAll() {
    if (this.isSyncing || !navigator.onLine) return;
    
    const offlineKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('offline_grades_')) {
        offlineKeys.push(key);
      }
    }

    if (offlineKeys.length === 0) return;

    this.isSyncing = true;
    this._notify({ type: 'start', count: offlineKeys.length });

    let successCount = 0;
    let failCount = 0;

    for (const key of offlineKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        
        const payload = JSON.parse(raw);
        if (!payload || !payload.grades || payload.grades.length === 0) {
          localStorage.removeItem(key);
          continue;
        }

        // On envoie les données au serveur
        await apiFetch('/notes/bulk', {
          method: 'POST',
          body: {
            classId: payload.classId,
            matiereId: payload.matiereId,
            sequenceId: payload.sequenceId,
            evaluationTypeId: payload.evaluationTypeId === 'null' ? null : payload.evaluationTypeId,
            grades: payload.grades
          }
        });

        // Succès : suppression du cache local
        localStorage.removeItem(key);
        successCount++;
      } catch (err) {
        console.error(`[SyncService] Échec de la synchronisation pour ${key}:`, err);
        failCount++;
      }
    }

    this.isSyncing = false;
    this._notify({ type: 'end', successCount, failCount });
    console.log(`[SyncService] Synchronisation terminée. Succès: ${successCount}, Échecs: ${failCount}`);
  }
}

export const syncService = new SyncService();
