#!/bin/bash

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m'

echo -e "${WHITE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🚀 CORDOBASHOT POS - ENTORNO DE DESARROLLO${NC}"
echo -e "${WHITE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}📱 Frontend (React + Vite):${NC}     ${YELLOW}http://localhost:3002${NC}"
echo -e "${BLUE}🖥️  Backend (Express + Node):${NC}    ${YELLOW}http://localhost:3000${NC}"
echo -e "${CYAN}🗄️  Base de Datos (Prisma):${NC}     ${YELLOW}http://localhost:5555${NC}"
echo -e "${GREEN}📊 Health Check:${NC}               ${YELLOW}http://localhost:3000/health${NC}"
echo ""
echo -e "${WHITE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}💡 Para iniciar todo: ${NC}${GREEN}npm run dev:full${NC} ${YELLOW}o${NC} ${GREEN}./dev-start.sh${NC}"
echo -e "${WHITE}════════════════════════════════════════════════════════════════════════════════${NC}" 