#!/bin/bash

################################################################################
#                   🚀 DEPLOYMENT AUTOMATIZADO VERCEL                          #
#                                                                              #
# Este script automatiza:                                                      #
#   1. Crear repositorio en GitHub (requiere cuenta + token)                  #
#   2. Subir código a GitHub                                                   #
#   3. Abrir Vercel para deploy final (manual, 1 click)                       #
################################################################################

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  🚀 DASHBOARD FILL RATE                       ║"
echo "║              DEPLOYMENT AUTOMATIZADO A VERCEL                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# PASO 1: VERIFICAR REQUISITOS
# ============================================================================
echo -e "${BLUE}PASO 1: Verificando requisitos...${NC}"
echo ""

# Verificar Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git no está instalado${NC}"
    echo "   Descargar de: https://git-scm.com/download"
    exit 1
fi
echo -e "${GREEN}✅ Git instalado: $(git --version)${NC}"

# Verificar que estamos en la carpeta correcta
if [ ! -f "index.html" ]; then
    echo -e "${RED}❌ No se encuentra index.html${NC}"
    echo "   Ejecuta este script desde: /home/claude/dashboard-deployment/"
    exit 1
fi
echo -e "${GREEN}✅ Archivos encontrados en carpeta actual${NC}"

# Verificar que .git existe
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ No hay repositorio Git inicializado${NC}"
    echo "   Ejecuta: git init"
    exit 1
fi
echo -e "${GREEN}✅ Repositorio Git detectado${NC}"
echo ""

# ============================================================================
# PASO 2: CONFIGURAR GIT
# ============================================================================
echo -e "${BLUE}PASO 2: Configurar información de Git${NC}"
echo ""

# Solicitar URL de GitHub
read -p "Ingresa URL del repositorio GitHub (ej: https://github.com/tuuser/fill-rate-dashboard.git): " GITHUB_URL

if [ -z "$GITHUB_URL" ]; then
    echo -e "${RED}❌ URL no puede estar vacía${NC}"
    exit 1
fi

echo -e "${YELLOW}→ URL del repo: $GITHUB_URL${NC}"
echo ""

# ============================================================================
# PASO 3: AGREGAR REMOTO Y CONFIGURAR
# ============================================================================
echo -e "${BLUE}PASO 3: Configurar repositorio remoto${NC}"
echo ""

# Agregar remoto origin
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_URL"
echo -e "${GREEN}✅ Remoto 'origin' agregado${NC}"

# Cambiar a rama 'main' (Vercel lo prefiere)
git branch -M main
echo -e "${GREEN}✅ Rama cambiada a 'main'${NC}"

# Verificar que hay cambios
git add .
git status
echo ""

# ============================================================================
# PASO 4: HACER COMMIT (SI HAY CAMBIOS)
# ============================================================================
echo -e "${BLUE}PASO 4: Verificar cambios${NC}"
echo ""

if git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}ℹ️  Sin cambios nuevos, usando commit anterior${NC}"
else
    echo -e "${YELLOW}→ Hay cambios, haciendo nuevo commit...${NC}"
    git commit -m "📊 Deploy automático $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${GREEN}✅ Commit realizado${NC}"
fi
echo ""

# ============================================================================
# PASO 5: PUSH A GITHUB
# ============================================================================
echo -e "${BLUE}PASO 5: Subiendo código a GitHub${NC}"
echo ""
echo -e "${YELLOW}→ Esto puede solicitar tu contraseña/token de GitHub...${NC}"
echo ""

if git push -u origin main; then
    echo ""
    echo -e "${GREEN}✅ Código subido exitosamente a GitHub!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Error al subir código${NC}"
    echo ""
    echo "Soluciones posibles:"
    echo "  1. Verifica que la URL es correcta"
    echo "  2. Si usas HTTPS: genera un token en https://github.com/settings/tokens"
    echo "  3. Si usas SSH: asegúrate que tu llave SSH está configurada"
    exit 1
fi

# ============================================================================
# PASO 6: ABRIR VERCEL
# ============================================================================
echo ""
echo -e "${BLUE}PASO 6: Abrir Vercel para Deploy Final${NC}"
echo ""
echo -e "${YELLOW}Tu navegador se abrirá automáticamente...${NC}"
echo ""

# Detectar el sistema operativo
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "https://vercel.com/new" 2>/dev/null || echo "Abre: https://vercel.com/new"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open "https://vercel.com/new"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    start "https://vercel.com/new"
else
    echo "Abre manualmente: https://vercel.com/new"
fi

# ============================================================================
# PASO 7: INSTRUCCIONES FINALES
# ============================================================================
echo ""
echo -e "${GREEN}✅ CÓDIGO SUBIDO A GITHUB${NC}"
echo ""
echo "AHORA EN VERCEL:"
echo "  1. Sign in with GitHub"
echo "  2. Busca y selecciona 'fill-rate-dashboard'"
echo "  3. Framework: Static Site"
echo "  4. Click 'Deploy'"
echo "  5. Espera 30-60 segundos"
echo "  6. Tu URL estará en vivo!"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ ¡DASHBOARD SERÁ PUBLICADO EN VERCEL!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "URL final será: https://fill-rate-dashboard.vercel.app"
echo ""
echo "O si configuras dominio: https://tu-dominio.com"
echo ""
