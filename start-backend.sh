#!/bin/bash

# Colores para mensajes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando CobroFácil Backend${NC}"
echo -e "${BLUE}======================================${NC}"

# Función para matar procesos en puerto 3000
kill_backend_processes() {
    echo -e "${YELLOW}🔍 Buscando procesos en puerto 3000...${NC}"
    
    # Buscar procesos usando el puerto 3000
    PIDS=$(lsof -ti:3000 2>/dev/null)
    
    if [ ! -z "$PIDS" ]; then
        echo -e "${YELLOW}⚠️  Encontrados procesos usando puerto 3000:${NC}"
        echo "$PIDS"
        echo -e "${YELLOW}🔄 Terminando procesos...${NC}"
        
        # Matar procesos encontrados
        echo "$PIDS" | xargs kill -9 2>/dev/null
        
        # Esperar un momento para que los procesos se cierren
        sleep 2
        
        # Verificar si aún hay procesos
        REMAINING=$(lsof -ti:3000 2>/dev/null)
        if [ -z "$REMAINING" ]; then
            echo -e "${GREEN}✅ Puerto 3000 liberado correctamente${NC}"
        else
            echo -e "${RED}❌ No se pudieron terminar todos los procesos${NC}"
            echo -e "${RED}   Procesos restantes: $REMAINING${NC}"
            echo -e "${YELLOW}💡 Intente ejecutar: sudo kill -9 $REMAINING${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Puerto 3000 disponible${NC}"
    fi
}

# Función para verificar directorio
check_directory() {
    if [ ! -f "backend/src/index.js" ]; then
        echo -e "${RED}❌ Error: No se encontró backend/src/index.js${NC}"
        echo -e "${YELLOW}💡 Asegúrese de ejecutar este script desde la raíz del proyecto CobroFácil${NC}"
        echo -e "${YELLOW}   Directorio actual: $(pwd)${NC}"
        echo -e "${YELLOW}   Directorio esperado: ~/cordobashot${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Directorio correcto detectado${NC}"
}

# Función para verificar dependencias
check_dependencies() {
    echo -e "${YELLOW}🔍 Verificando dependencias...${NC}"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no está instalado${NC}"
        exit 1
    fi
    
    # Verificar que exista package.json en backend
    if [ ! -f "backend/package.json" ]; then
        echo -e "${RED}❌ No se encontró backend/package.json${NC}"
        exit 1
    fi
    
    # Verificar node_modules
    if [ ! -d "backend/node_modules" ]; then
        echo -e "${YELLOW}⚠️  Dependencias no instaladas. Instalando...${NC}"
        cd backend
        npm install
        cd ..
    fi
    
    echo -e "${GREEN}✅ Dependencias verificadas${NC}"
}

# Función para iniciar el backend
start_backend() {
    echo -e "${BLUE}🎯 Iniciando backend...${NC}"
    echo -e "${BLUE}======================================${NC}"
    
    # Exportar variable de entorno
    export NODE_ENV=development
    
    # Ejecutar el backend
    exec node backend/src/index.js
}

# Función para manejo de errores
handle_error() {
    echo -e "${RED}❌ Error al iniciar el backend${NC}"
    echo -e "${YELLOW}💡 Comandos útiles para diagnosticar:${NC}"
    echo -e "${YELLOW}   • Verificar puerto: lsof -i:3000${NC}"
    echo -e "${YELLOW}   • Ver procesos Node: ps aux | grep node${NC}"
    echo -e "${YELLOW}   • Logs de PostgreSQL: sudo journalctl -u postgresql${NC}"
    echo -e "${YELLOW}   • Verificar backend: cd backend && npm run dev${NC}"
    exit 1
}

# Función principal
main() {
    echo -e "${BLUE}📋 Verificaciones previas...${NC}"
    check_directory
    check_dependencies
    kill_backend_processes
    
    echo -e "${GREEN}🚀 Todo listo. Iniciando servidor...${NC}"
    echo -e "${BLUE}======================================${NC}"
    echo -e "${YELLOW}💡 Para detener el servidor: Ctrl+C${NC}"
    echo -e "${YELLOW}💡 Puerto: 3000${NC}"
    echo -e "${YELLOW}💡 Ambiente: development${NC}"
    echo -e "${BLUE}======================================${NC}"
    
    # Configurar trap para manejo de errores
    trap handle_error ERR
    
    start_backend
}

# Ejecutar función principal
main 