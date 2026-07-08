// ════════════════════════════════════════════════════════════════
//  🎓 EduTrack - Serveur Local (Mode Intranet)
//  Ce fichier est utilisé quand EduTrack fonctionne en réseau local
// ════════════════════════════════════════════════════════════════

const path = require('path');
const fs = require('fs');
const os = require('os');

// ─── Détection du mode local ─────────────────────────────────────────────────
const isLocalMode = process.env.NODE_ENV === 'production' &&
                    (process.env.DATABASE_URL || '').startsWith('file:');

// ─── Chargement dynamique du bon fichier .env ─────────────────────────────────
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envLocalPath) && !process.env.DATABASE_URL) {
  require('dotenv').config({ path: envLocalPath });
  console.log('📂 Mode Local (Intranet) : fichier .env.local chargé');
} else {
  require('dotenv').config({ path: envPath });
}

// ─── Affichage du réseau local ────────────────────────────────────────────────
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

// ─── Banner de démarrage ──────────────────────────────────────────────────────
function printBanner(port) {
  const localIPs = getLocalIPs();
  const line = '═'.repeat(60);
  
  console.log('\n\x1b[32m' + line + '\x1b[0m');
  console.log('\x1b[32m\x1b[1m  🎓 EDUTRACK - SERVEUR LOCAL ACTIF\x1b[0m');
  console.log('\x1b[32m' + line + '\x1b[0m');
  console.log('');
  console.log('  \x1b[1mAccès depuis CET ordinateur :\x1b[0m');
  console.log(`  \x1b[34m→ http://localhost:${port}\x1b[0m`);
  console.log('');
  
  if (localIPs.length > 0) {
    console.log('  \x1b[1mAccès depuis le réseau Wi-Fi de l\'école :\x1b[0m');
    for (const { name, address } of localIPs) {
      console.log(`  \x1b[34m→ http://${address}:${port}\x1b[0m  \x1b[90m(${name})\x1b[0m`);
    }
  } else {
    console.log('  \x1b[33m⚠ Aucune interface réseau externe détectée.\x1b[0m');
    console.log('  \x1b[33m  Vérifiez que le Wi-Fi est activé.\x1b[0m');
  }
  
  console.log('');
  console.log('  \x1b[1mBase de données :\x1b[0m Locale (SQLite - aucun Internet requis)');
  console.log('');
  console.log('  \x1b[33m⚠  NE FERMEZ PAS cette fenêtre !\x1b[0m');
  console.log('  \x1b[33m   Elle fait tourner le serveur pour toute l\'école.\x1b[0m');
  console.log('\x1b[32m' + line + '\x1b[0m\n');
}

module.exports = { isLocalMode, getLocalIPs, printBanner };
