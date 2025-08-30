#!/bin/bash

# Cores para melhor visualização
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}PitchBot - Iniciador de Aplicação${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

echo -e "${BLUE}Verificando ambiente...${NC}"

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js não encontrado! Por favor, instale o Node.js para continuar.${NC}"
    exit 1
fi

# Verificar se o Python está instalado
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python3 não encontrado! Por favor, instale o Python para continuar.${NC}"
    exit 1
fi

echo -e "${GREEN}Ambiente verificado com sucesso!${NC}"
echo ""

# Menu de opções
menu() {
    echo -e "${BLUE}Escolha uma opção:${NC}"
    echo -e "${YELLOW}1. Iniciar apenas o servidor Front-end (Vite)"
    echo -e "2. Iniciar apenas o servidor Back-end (Flask)"
    echo -e "3. Iniciar ambos os servidores (Padrão - Pressione Enter)"
    echo -e "0. Sair${NC}"
    echo ""

    # Definir opção padrão como 3 (ambos)
    read -p "Digite o número da opção desejada [3]: " opcao
    opcao=${opcao:-3}
    
    case $opcao in
        1) frontend ;;
        2) backend ;;
        3) ambos ;;
        0) exit 0 ;;
        *) 
            echo -e "${RED}Opção inválida. Tente novamente.${NC}"
            menu
            ;;
    esac
}

frontend() {
    echo ""
    echo -e "${BLUE}Iniciando servidor Front-end (Vite)...${NC}"
    echo ""
    # Usa um terminal separado para o front-end
    if [ "$(uname)" == "Darwin" ]; then
        # macOS
        osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && npm run dev"'
    elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        # Linux - tenta diferentes terminais
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd $(pwd) && npm run dev; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd $(pwd) && npm run dev; bash" &
        else
            # Fallback - executar em background
            cd $(pwd) && npm run dev &
        fi
    else
        # Fallback genérico
        npm run dev &
    fi
    
    echo -e "${GREEN}Servidor Front-end iniciado!${NC}"
    echo -e "${YELLOW}O servidor estará disponível em http://localhost:5173${NC}"
}

backend() {
    echo ""
    echo -e "${BLUE}Iniciando servidor Back-end (Flask)...${NC}"
    echo ""
    
    cd backend || exit
    
    # Verificar se o ambiente virtual existe
    if [ ! -d "venv" ]; then
        echo "Criando ambiente virtual..."
        python3 -m venv venv
    fi
    
    # Ativar o ambiente virtual e executar em um terminal separado
    if [ "$(uname)" == "Darwin" ]; then
        # macOS
        osascript -e 'tell app "Terminal" to do script "cd '"$(pwd)"' && source venv/bin/activate && pip install -r requirements.txt && flask run --port=5000"'
    elif [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then
        # Linux - tenta diferentes terminais
        if command -v gnome-terminal &> /dev/null; then
            gnome-terminal -- bash -c "cd $(pwd) && source venv/bin/activate && pip install -r requirements.txt && flask run --port=5000; exec bash"
        elif command -v xterm &> /dev/null; then
            xterm -e "cd $(pwd) && source venv/bin/activate && pip install -r requirements.txt && flask run --port=5000; bash" &
        else
            # Fallback - executar em background
            source venv/bin/activate && pip install -r requirements.txt && flask run --port=5000 &
        fi
    else
        # Fallback genérico
        source venv/bin/activate && pip install -r requirements.txt && flask run --port=5000 &
    fi
    
    cd ..
    
    echo -e "${GREEN}Servidor Back-end iniciado!${NC}"
    echo -e "${YELLOW}O servidor estará disponível em http://localhost:5000${NC}"
}

ambos() {
    echo ""
    echo -e "${BLUE}Iniciando ambos os servidores...${NC}"
    echo ""
    frontend
    echo ""
    backend
}

# Tornar o script executável
chmod +x "$0"

# Iniciar o menu
menu
