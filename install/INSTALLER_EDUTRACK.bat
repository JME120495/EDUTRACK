@echo off
chcp 65001 >nul
title 🎓 EduTrack - Installation Serveur Local
color 0A

echo.
echo  ████████╗██████╗ ██╗   ██╗████████╗██████╗  █████╗  ██████╗██╗  ██╗
echo  ██╔════╝██╔══██╗██║   ██║╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
echo  █████╗  ██║  ██║██║   ██║   ██║   ██████╔╝███████║██║     █████╔╝ 
echo  ██╔══╝  ██║  ██║██║   ██║   ██║   ██╔══██╗██╔══██║██║     ██╔═██╗ 
echo  ███████╗██████╔╝╚██████╔╝   ██║   ██║  ██║██║  ██║╚██████╗██║  ██╗
echo  ╚══════╝╚═════╝  ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
echo.
echo                  Système de Gestion Scolaire Bilingue
echo               Installation Serveur Local (Intranet École)
echo  ════════════════════════════════════════════════════════════════════
echo.
echo  Ce programme va installer EduTrack sur cet ordinateur.
echo  Il sera accessible par TOUS les appareils du réseau Wi-Fi de l'école.
echo.
pause

:: ─── VÉRIFICATION DE NODE.JS ───────────────────────────────────────────────────
echo.
echo  [1/7] Vérification de Node.js...
node --version >nul 2>&1
if %errorlevel% NEQ 0 (
    echo.
    echo  ✗ Node.js n'est pas installé sur cet ordinateur.
    echo  → Téléchargement automatique de Node.js v20 LTS...
    echo.
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.17.0/node-v20.17.0-x64.msi' -OutFile '%TEMP%\node-installer.msi' -UseBasicParsing}"
    echo  → Installation de Node.js (veuillez accepter les invites)...
    msiexec /i "%TEMP%\node-installer.msi" /passive /qn
    echo  → Rechargement du PATH système...
    call :refreshenv
    node --version >nul 2>&1
    if %errorlevel% NEQ 0 (
        echo  ✗ ERREUR : L'installation de Node.js a échoué.
        echo    Veuillez télécharger manuellement : https://nodejs.org/en/download
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  ✓ Node.js %NODE_VER% détecté.

:: ─── VÉRIFICATION DU DOSSIER EDUTRACK ─────────────────────────────────────────
echo.
echo  [2/7] Vérification des fichiers EduTrack...
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.."
set EDUTRACK_ROOT=%CD%

if not exist "%EDUTRACK_ROOT%\backend\package.json" (
    echo  ✗ ERREUR : Les fichiers EduTrack sont introuvables.
    echo    Assurez-vous que ce script est dans le dossier "install" d'EduTrack.
    pause
    exit /b 1
)
echo  ✓ Dossier EduTrack trouvé : %EDUTRACK_ROOT%

:: ─── INSTALLATION DES DÉPENDANCES BACKEND ──────────────────────────────────────
echo.
echo  [3/7] Installation des composants du serveur (Backend)...
echo    Cela peut prendre 2-5 minutes selon la connexion Internet...
cd /d "%EDUTRACK_ROOT%\backend"
call npm install --prefer-offline 2>nul
if %errorlevel% NEQ 0 (
    echo    Tentative en mode online...
    call npm install
)
echo  ✓ Composants serveur installés.

:: ─── CONFIGURATION DE LA BASE DE DONNÉES LOCALE ────────────────────────────────
echo.
echo  [4/7] Configuration de la base de données locale...
call :setup_local_db
echo  ✓ Base de données locale configurée.

:: ─── BUILD DU FRONTEND ─────────────────────────────────────────────────────────
echo.
echo  [5/7] Préparation de l'interface (Frontend)...
if exist "%EDUTRACK_ROOT%\frontend\dist" (
    echo  ✓ Interface déjà compilée. (dist existant)
) else (
    echo    Compilation de l'interface graphique...
    cd /d "%EDUTRACK_ROOT%\frontend"
    call npm install 2>nul
    call npm run build
    echo  ✓ Interface compilée avec succès.
)

:: ─── CRÉATION DU FICHIER DE CONFIGURATION RÉSEAU ───────────────────────────────
echo.
echo  [6/7] Détection de l'adresse IP du réseau local...
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"Adresse IPv4"') do (
    set LOCAL_IP=%%i
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%
echo  ✓ Adresse IP locale : %LOCAL_IP%

:: ─── CRÉATION DU RACCOURCI DE DÉMARRAGE ────────────────────────────────────────
echo.
echo  [7/7] Création des raccourcis de démarrage...

:: Crée le script de démarrage permanent
echo @echo off > "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo chcp 65001 ^>nul >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo title EduTrack - Serveur Local >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo color 0A >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo. >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo  🎓 EDUTRACK - SERVEUR LOCAL EN COURS... >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo  ════════════════════════════════════════ >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo. >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo  ✓ Serveur démarré. Partagez cette adresse avec vos collègues : >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo. >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"Adresse IPv4"') do (
    set DISPLAY_IP=%%i
    goto :write_ip
)
:write_ip
set DISPLAY_IP=%DISPLAY_IP: =%
echo echo     ➜  http://%DISPLAY_IP%:5000 (depuis n'importe quel appareil du réseau) >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo     ➜  http://localhost:5000 (sur cet ordinateur) >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo. >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo  IMPORTANT : Ne fermez PAS cette fenêtre ! Elle fait tourner le serveur. >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo echo. >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo cd /d "%EDUTRACK_ROOT%\backend" >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo node src/index.js >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
echo pause >> "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"

:: Raccourci sur le bureau
set DESKTOP=%USERPROFILE%\Desktop
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_shortcut.vbs"
echo sLinkFile = "%DESKTOP%\🎓 Démarrer EduTrack.lnk" >> "%TEMP%\create_shortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\create_shortcut.vbs"
echo oLink.TargetPath = "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat" >> "%TEMP%\create_shortcut.vbs"
echo oLink.WorkingDirectory = "%EDUTRACK_ROOT%" >> "%TEMP%\create_shortcut.vbs"
echo oLink.Description = "Démarrer le serveur EduTrack" >> "%TEMP%\create_shortcut.vbs"
echo oLink.Save >> "%TEMP%\create_shortcut.vbs"
cscript //nologo "%TEMP%\create_shortcut.vbs"

echo  ✓ Raccourci créé sur le bureau.

:: ─── RÉCAPITULATIF FINAL ────────────────────────────────────────────────────────
echo.
echo  ════════════════════════════════════════════════════════════════════
echo  ✅  INSTALLATION TERMINÉE AVEC SUCCÈS !
echo  ════════════════════════════════════════════════════════════════════
echo.
echo  📌 Comment utiliser EduTrack sur votre réseau :
echo.
echo  1. Double-cliquez sur "🎓 Démarrer EduTrack" sur le bureau
echo     pour lancer le serveur.
echo.
echo  2. Sur CET ordinateur (serveur), ouvrez le navigateur et allez sur :
echo       ➜  http://localhost:5000
echo.
echo  3. Sur les AUTRES appareils (téléphones, tablettes, PC) du même
echo     réseau Wi-Fi, ouvrez le navigateur et allez sur :
echo       ➜  http://%LOCAL_IP%:5000
echo.
echo  4. Connexion par défaut (administrateur) :
echo       Email    : admin@edutrack.cm
echo       Mot de passe : Admin@2025
echo.
echo  ⚠  IMPORTANT : Gardez toujours cet ordinateur allumé et le serveur
echo     actif pour que vos collègues puissent travailler.
echo.
echo  ════════════════════════════════════════════════════════════════════

:: Démarrer le serveur maintenant ?
echo.
set /p START_NOW=  Voulez-vous démarrer EduTrack maintenant ? (O/N) : 
if /i "%START_NOW%"=="O" (
    echo.
    echo  → Démarrage du serveur EduTrack...
    start "" "%EDUTRACK_ROOT%\DEMARRER_EDUTRACK.bat"
    timeout /t 3 /nobreak >nul
    start "" "http://localhost:5000"
)

echo.
pause
exit /b 0

:: ─── SOUS-ROUTINE : Configuration base de données locale ───────────────────────
:setup_local_db
set ENV_FILE=%EDUTRACK_ROOT%\backend\.env.local

:: Génère un JWT secret aléatoire
set JWT_SECRET=edutrack-local-%RANDOM%%RANDOM%%RANDOM%-secret-2025

:: Crée le fichier .env pour usage local (SQLite)
echo # Configuration EduTrack - Serveur Local > "%ENV_FILE%"
echo # Généré automatiquement par l'installateur >> "%ENV_FILE%"
echo # ─────────────────────────────────── >> "%ENV_FILE%"
echo DATABASE_URL="file:./prisma/edutrack-local.db" >> "%ENV_FILE%"
echo JWT_SECRET="%JWT_SECRET%" >> "%ENV_FILE%"
echo PORT=5000 >> "%ENV_FILE%"
echo NODE_ENV=production >> "%ENV_FILE%"
echo ALLOWED_ORIGINS="http://localhost:5000,http://localhost:3000" >> "%ENV_FILE%"
echo FRONTEND_URL=http://localhost:5000 >> "%ENV_FILE%"

:: Vérifie si schema SQLite local existe, sinon créé depuis le template
if not exist "%EDUTRACK_ROOT%\backend\prisma\schema-local.prisma" (
    copy "%EDUTRACK_ROOT%\backend\prisma\schema.prisma" "%EDUTRACK_ROOT%\backend\prisma\schema-local.prisma" >nul
    :: Remplace le provider postgresql par sqlite dans la copie
    powershell -Command "(Get-Content '%EDUTRACK_ROOT%\backend\prisma\schema-local.prisma') -replace 'provider  = \"postgresql\"', 'provider  = \"sqlite\"' -replace 'directUrl = env\(\"DIRECT_URL\"\)', '' | Set-Content '%EDUTRACK_ROOT%\backend\prisma\schema-local.prisma'"
)

:: Copie le .env.local en .env si c'est la première installation
if not exist "%EDUTRACK_ROOT%\backend\prisma\edutrack-local.db" (
    echo    Initialisation de la base de données locale...
    copy "%ENV_FILE%" "%EDUTRACK_ROOT%\backend\.env" >nul
    cd /d "%EDUTRACK_ROOT%\backend"
    set DATABASE_URL=file:./prisma/edutrack-local.db
    call npx prisma db push --schema=prisma/schema-local.prisma 2>nul
    call node prisma/seed.js 2>nul
)
goto :eof

:refreshenv
for /f "tokens=*" %%i in ('powershell -Command "[System.Environment]::GetEnvironmentVariable(\"PATH\",\"Machine\")"') do set PATH=%PATH%;%%i
goto :eof
