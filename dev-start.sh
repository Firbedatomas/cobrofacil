#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                           🏪 CORDOBASHOT POS                                 ║"
echo "║                        Iniciando Entorno de Desarrollo                      ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Función para mostrar URLs
show_urls() {
    echo -e "\n${WHITE}════════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🚀 ENTORNO DE DESARROLLO INICIADO${NC}\n"
    echo -e "${CYAN}📱 Frontend (React + Vite):${NC}     ${YELLOW}http://localhost:3002${NC}"
    echo -e "${BLUE}🖥️  Backend (Express + Node):${NC}    ${YELLOW}http://localhost:3000${NC}"
    echo -e "${CYAN}🗄️  Base de Datos (Prisma):${NC}     ${YELLOW}http://localhost:5555${NC}"
    echo -e "${GREEN}📊 Health Check:${NC}               ${YELLOW}http://localhost:3000/health${NC}"
    echo -e "${WHITE}════════════════════════════════════════════════════════════════════════════════${NC}\n"
    echo -e "${YELLOW}💡 Usa Ctrl+C para detener todos los servicios${NC}\n"
}

# Función para cleanup al salir
cleanup() {
    echo -e "\n${RED}🛑 Deteniendo servicios...${NC}"
    pkill -f "node src/index.js" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    pkill -f "prisma studio" 2>/dev/null
    echo -e "${GREEN}✅ Todos los servicios detenidos${NC}"
    exit 0
}

# Trap para cleanup
trap cleanup SIGINT SIGTERM

# Verificar que Node.js esté instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    exit 1
fi

# Verificar que npm esté instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Este script debe ejecutarse desde el directorio raíz del proyecto${NC}"
    exit 1
fi

# Verificar dependencias del frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias del frontend...${NC}"
    npm install
fi

# Verificar dependencias del backend
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias del backend...${NC}"
    cd backend && npm install && cd ..
fi

# Verificar PostgreSQL
echo -e "${BLUE}🔍 Verificando PostgreSQL...${NC}"
if ! sudo systemctl is-active --quiet postgresql; then
    echo -e "${YELLOW}🔄 Iniciando PostgreSQL...${NC}"
    sudo systemctl start postgresql
fi

# Verificar archivo .env del backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚙️ Creando archivo .env del backend...${NC}"
    cp backend/env.example backend/.env
fi

# Sincronizar base de datos
echo -e "${BLUE}🗄️ Sincronizando base de datos...${NC}"
cd backend && npx prisma db push --accept-data-loss > /dev/null 2>&1 && cd ..

echo -e "${GREEN}✅ Preparación completada${NC}"

# Mostrar URLs antes de iniciar
show_urls

# Iniciar servicios usando concurrently
echo -e "${CYAN}🚀 Iniciando servicios...${NC}\n"

# Ejecutar con concurrently
npm run dev:full

# Si llega aquí es porque concurrently terminó
cleanup 