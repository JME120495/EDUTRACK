#!/bin/bash
# ════════════════════════════════════════════════════════════════
#  🎓 EduTrack - Installateur pour Linux/macOS (Réseau Local)
# ════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

clear
echo ""
echo -e "${BLUE}${BOLD}"
echo "  ███████╗██████╗ ██╗   ██╗████████╗██████╗  █████╗  ██████╗██╗  ██╗"
echo "  ██╔════╝██╔══██╗██║   ██║╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝"
echo "  █████╗  ██║  ██║██║   ██║   ██║   ██████╔╝███████║██║     █████╔╝ "
echo "  ██╔══╝  ██║  ██║██║   ██║   ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ "
echo "  ███████╗██████╔╝╚██████╔╝   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗"
echo "  ╚══════╝╚═════╝  ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝"
echo -e "${NC}"
echo -e "  ${BOLD}Système de Gestion Scolaire Bilingue - Installation Serveur Local${NC}"
echo "  ════════════════════════════════════════════════════════════════"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EDUTRACK_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "  📂 Dossier EduTrack : ${BLUE}$EDUTRACK_ROOT${NC}"
echo ""

read -p "  Lancer l'installation ? (o/n) : " CONFIRM
if [[ "$CONFIRM" != "o" && "$CONFIRM" != "O" ]]; then
    echo "  Installation annulée."
    exit 0
fi

# ─── [1/6] Vérification de Node.js ──────────────────────────────────────────
echo ""
echo -e "  ${YELLOW}[1/6]${NC} Vérification de Node.js..."

if ! command -v node &>/dev/null; then
    echo "  ✗ Node.js introuvable. Installation..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &>/dev/null; then
            brew install node@20
        else
            echo -e "  ${RED}Veuillez installer Homebrew d'abord : https://brew.sh${NC}"
            exit 1
        fi
    else
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

NODE_VER=$(node --version)
echo -e "  ${GREEN}✓${NC} Node.js $NODE_VER détecté."

# ─── [2/6] Installation Backend ─────────────────────────────────────────────
echo ""
echo -e "  ${YELLOW}[2/6]${NC} Installation des composants serveur..."
cd "$EDUTRACK_ROOT/backend"
npm install --prefer-offline 2>/dev/null || npm install
echo -e "  ${GREEN}✓${NC} Composants serveur installés."

# ─── [3/6] Configuration Base de Données Locale ─────────────────────────────
echo ""
echo -e "  ${YELLOW}[3/6]${NC} Configuration de la base de données locale..."

JWT_SECRET="edutrack-local-$(openssl rand -hex 16)-secret-2025"
ENV_FILE="$EDUTRACK_ROOT/backend/.env.local"

cat > "$ENV_FILE" <<EOF
# Configuration EduTrack - Serveur Local (Intranet)
# Généré automatiquement par l'installateur - $(date)
DATABASE_URL="file:./prisma/edutrack-local.db"
JWT_SECRET="$JWT_SECRET"
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS="http://localhost:5000,http://localhost:3000"
FRONTEND_URL=http://localhost:5000
EOF

# Crée le schéma SQLite si non existant
if [ ! -f "$EDUTRACK_ROOT/backend/prisma/schema-local.prisma" ]; then
    sed 's/provider  = "postgresql"/provider  = "sqlite"/' \
        "$EDUTRACK_ROOT/backend/prisma/schema.prisma" | \
    grep -v 'directUrl' > "$EDUTRACK_ROOT/backend/prisma/schema-local.prisma"
fi

# Initialise la base de données
if [ ! -f "$EDUTRACK_ROOT/backend/prisma/edutrack-local.db" ]; then
    cp "$ENV_FILE" "$EDUTRACK_ROOT/backend/.env"
    cd "$EDUTRACK_ROOT/backend"
    npx prisma db push --schema=prisma/schema-local.prisma 2>/dev/null || true
    node prisma/seed.js 2>/dev/null || true
fi
echo -e "  ${GREEN}✓${NC} Base de données locale prête."

# ─── [4/6] Build Frontend ────────────────────────────────────────────────────
echo ""
echo -e "  ${YELLOW}[4/6]${NC} Compilation de l'interface graphique..."
if [ ! -d "$EDUTRACK_ROOT/frontend/dist" ]; then
    cd "$EDUTRACK_ROOT/frontend"
    npm install 2>/dev/null
    npm run build
    echo -e "  ${GREEN}✓${NC} Interface compilée."
else
    echo -e "  ${GREEN}✓${NC} Interface déjà compilée (dist existant)."
fi

# ─── [5/6] Détection IP locale ───────────────────────────────────────────────
echo ""
echo -e "  ${YELLOW}[5/6]${NC} Détection de l'adresse IP réseau..."

if [[ "$OSTYPE" == "darwin"* ]]; then
    LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")
else
    LOCAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1")
fi

echo -e "  ${GREEN}✓${NC} Adresse IP : ${BOLD}$LOCAL_IP${NC}"

# ─── [6/6] Script de démarrage ───────────────────────────────────────────────
echo ""
echo -e "  ${YELLOW}[6/6]${NC} Création du script de démarrage..."

cat > "$EDUTRACK_ROOT/demarrer-edutrack.sh" <<EOF
#!/bin/bash
clear
echo ""
echo -e "  \033[0;32m\033[1m🎓 EDUTRACK - SERVEUR LOCAL EN COURS...\033[0m"
echo "  ════════════════════════════════════════════════════════"
echo ""
echo "  ✓ Serveur démarré. Partagez ces adresses avec vos collègues :"
echo ""
echo "    Sur CET ordinateur      → http://localhost:5000"
echo "    Depuis le réseau Wi-Fi  → http://$LOCAL_IP:5000"
echo ""
echo "  ⚠  Ne fermez PAS cette fenêtre !"
echo ""
cd "$EDUTRACK_ROOT/backend"
cp .env.local .env
node src/index.js
EOF
chmod +x "$EDUTRACK_ROOT/demarrer-edutrack.sh"

echo -e "  ${GREEN}✓${NC} Script de démarrage créé : ${BLUE}demarrer-edutrack.sh${NC}"

# ─── Récapitulatif ───────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}${BOLD}════════════════════════════════════════════════════════════"
echo -e "  ✅  INSTALLATION TERMINÉE AVEC SUCCÈS !"
echo -e "  ════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${BOLD}📌 Pour lancer EduTrack :${NC}"
echo ""
echo "     ./demarrer-edutrack.sh"
echo ""
echo -e "  ${BOLD}📌 Accès depuis les appareils de l'école :${NC}"
echo ""
echo -e "     Navigateur → ${BLUE}http://$LOCAL_IP:5000${NC}"
echo ""
echo -e "  ${BOLD}📌 Connexion administrateur par défaut :${NC}"
echo ""
echo "     Email    : admin@edutrack.cm"
echo "     Mot de passe : Admin@2025"
echo ""

read -p "  Démarrer EduTrack maintenant ? (o/n) : " START
if [[ "$START" == "o" || "$START" == "O" ]]; then
    bash "$EDUTRACK_ROOT/demarrer-edutrack.sh"
fi
