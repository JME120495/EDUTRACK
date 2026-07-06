/**
 * EduTrack Cache Buster — Nettoyage automatique en arrière-plan
 * 
 * Ce module s'exécute silencieusement et gère :
 * 1. Le nettoyage périodique du localStorage (clés obsolètes, offline_grades périmés)
 * 2. Le nettoyage du cache du Service Worker (PWA) quand les fichiers changent
 * 3. La libération de la mémoire (Blob URLs, détachement DOM)
 * 4. Le nettoyage du cache CacheStorage du navigateur
 */

const CACHE_CLEAN_INTERVAL = 5 * 60 * 1000; // Toutes les 5 minutes
const MAX_LOCALSTORAGE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours
const MAX_OFFLINE_GRADES_AGE = 24 * 60 * 60 * 1000; // 24h pour les brouillons offline

// Clés protégées qu'on ne supprime JAMAIS
const PROTECTED_KEYS = [
  'edutrack_token',
  'edutrack_selected_year_id',
  'platform_token',
  'platform_user',
  'i18nextLng',
  'edutrack_theme',
];

/**
 * Nettoie les entrées périmées du localStorage
 */
function cleanLocalStorage() {
  try {
    const now = Date.now();
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Ne jamais toucher aux clés protégées
      if (PROTECTED_KEYS.includes(key)) continue;

      // Supprimer les vieux brouillons offline (offline_grades_*)
      if (key.startsWith('offline_grades_')) {
        try {
          const raw = localStorage.getItem(key);
          const data = JSON.parse(raw);
          if (data && data._savedAt) {
            if (now - data._savedAt > MAX_OFFLINE_GRADES_AGE) {
              keysToRemove.push(key);
            }
          } else if (raw && raw.length > 50000) {
            // Si c'est gros et pas de timestamp, on supprime
            keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
        continue;
      }

      // Supprimer les clés temporaires connues
      if (
        key.startsWith('vite-') ||
        key.startsWith('__vite') ||
        key.startsWith('workbox-') ||
        key.startsWith('sw-') ||
        key.startsWith('debug_')
      ) {
        keysToRemove.push(key);
        continue;
      }
    }

    keysToRemove.forEach(k => {
      localStorage.removeItem(k);
    });

    if (keysToRemove.length > 0) {
      console.log(`[CacheBuster] Nettoyé ${keysToRemove.length} clé(s) localStorage obsolètes.`);
    }
  } catch (err) {
    // Silently ignore
  }
}

/**
 * Nettoie tous les caches du CacheStorage (Service Worker / PWA)
 */
async function cleanCacheStorage() {
  try {
    if (!('caches' in window)) return;

    const cacheNames = await caches.keys();
    let cleaned = 0;

    for (const name of cacheNames) {
      // Garder uniquement le cache workbox le plus récent
      // Les anciens caches workbox sont préfixés par workbox-precache-
      if (name.includes('workbox-precache')) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        
        // Si le cache est trop gros (plus de 100 entrées), on le purge
        if (requests.length > 100) {
          // Supprimer les entrées les plus anciennes (garder les 50 dernières)
          const toDelete = requests.slice(0, requests.length - 50);
          for (const req of toDelete) {
            await cache.delete(req);
            cleaned++;
          }
        }
      }

      // Supprimer complètement les vieux caches runtime
      if (name.includes('runtime') || name.includes('temp') || name.includes('v1')) {
        await caches.delete(name);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[CacheBuster] Nettoyé ${cleaned} entrée(s) du CacheStorage.`);
    }
  } catch (err) {
    // Silently ignore  
  }
}

/**
 * Force le Service Worker à se mettre à jour s'il y en a un en attente
 */
async function refreshServiceWorker() {
  try {
    if (!('serviceWorker' in navigator)) return;

    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      // Forcer la vérification de mise à jour
      await registration.update();

      // Si un nouveau SW attend, l'activer immédiatement
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        console.log('[CacheBuster] Service Worker mis à jour.');
      }
    }
  } catch (err) {
    // Silently ignore
  }
}

/**
 * Nettoie la mémoire en révoquant les Blob URLs orphelines
 * et en forçant un GC hint
 */
function cleanMemory() {
  try {
    // Trouver et révoquer les blob URLs dans les images et iframes
    const elements = document.querySelectorAll('img[src^="blob:"], iframe[src^="blob:"]');
    let revoked = 0;
    elements.forEach(el => {
      // Ne révoquer que si l'élément n'est plus visible
      if (!el.offsetParent && !el.closest('[style*="display: none"]')) {
        URL.revokeObjectURL(el.src);
        revoked++;
      }
    });

    if (revoked > 0) {
      console.log(`[CacheBuster] Révoqué ${revoked} Blob URL(s) orphelines.`);
    }
  } catch (err) {
    // Silently ignore
  }
}

/**
 * Exécute un cycle complet de nettoyage
 */
async function runCleanupCycle() {
  cleanLocalStorage();
  cleanMemory();
  await cleanCacheStorage();
  await refreshServiceWorker();
}

/**
 * Démarre le système de nettoyage automatique en arrière-plan
 */
export function startCacheBuster() {
  // Nettoyage initial après 10 secondes (laisser l'app se charger d'abord)
  setTimeout(() => {
    runCleanupCycle();
  }, 10000);

  // Nettoyage périodique toutes les 5 minutes
  setInterval(() => {
    runCleanupCycle();
  }, CACHE_CLEAN_INTERVAL);

  // Nettoyage quand l'onglet redevient visible (après avoir été en arrière-plan)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Petit délai pour ne pas bloquer l'affichage
      setTimeout(runCleanupCycle, 2000);
    }
  });

  // Nettoyage quand la mémoire est sous pression (navigateurs modernes)
  if ('memory' in performance) {
    setInterval(() => {
      const mem = performance.memory;
      // Si plus de 80% du heap est utilisé, nettoyage agressif
      if (mem.usedJSHeapSize / mem.jsHeapSizeLimit > 0.8) {
        console.warn('[CacheBuster] Pression mémoire détectée, nettoyage agressif...');
        runCleanupCycle();
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }

  console.log('[CacheBuster] Système de nettoyage automatique activé ✓');
}

/**
 * Nettoyage complet et immédiat (appelable manuellement depuis les Settings)
 */
export async function forceFullCleanup() {
  // 1. localStorage (sauf clés protégées)
  const protectedData = {};
  PROTECTED_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) protectedData[key] = val;
  });
  localStorage.clear();
  Object.entries(protectedData).forEach(([key, val]) => {
    localStorage.setItem(key, val);
  });

  // 2. Tous les caches
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
  }

  // 3. Forcer mise à jour du SW
  await refreshServiceWorker();

  // 4. sessionStorage
  sessionStorage.clear();

  console.log('[CacheBuster] Nettoyage complet terminé ✓');
  return true;
}
