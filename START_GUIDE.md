# PitchBot - Guia de Inicialização

Este documento explica como iniciar o aplicativo PitchBot (frontend e backend) de forma rápida e simples.

## Requisitos

Antes de iniciar, certifique-se de ter instalado:

- Node.js (para o frontend)
- Python 3.8+ (para o backend)

## Opções de Inicialização

Você pode iniciar os servidores de três maneiras:

### Método 1: Usando o iniciador automático (Recomendado)

1. Execute o arquivo `start_app.bat` na pasta raiz do projeto
2. Selecione uma das opções (ou apenas pressione Enter para iniciar ambos):
   - **Enter** ou **3**: Inicia ambos os servidores (opção padrão)
   - **1**: Inicia apenas o servidor frontend (Vite)
   - **2**: Inicia apenas o servidor backend (Flask)
   - **0**: Sair

### Método 2: Iniciar manualmente o frontend

```bash
# Na pasta raiz do projeto
npm install  # Apenas na primeira vez ou quando houver mudanças em package.json
npm run dev
```

O servidor frontend ficará disponível em http://localhost:5173

### Método 3: Iniciar manualmente o backend

```bash
# Na pasta backend
cd backend
start_server.bat
```

Ou, manualmente:

```bash
# Na pasta backend
python -m venv venv  # Apenas na primeira vez
venv\Scripts\activate
pip install -r requirements.txt  # Apenas na primeira vez ou quando houver mudanças
flask run --port=5000
```

O servidor backend ficará disponível em http://localhost:5000

## Testando a API

Quando o servidor backend estiver em execução, você pode verificar o status da API acessando:
http://localhost:5000/api/health

## Resolução de problemas

Se você encontrar problemas ao iniciar os servidores:

1. **Erro no frontend**: Verifique se Node.js está instalado e se todas as dependências foram instaladas com `npm install`
2. **Erro no backend**: Verifique se Python está instalado e se todas as dependências foram instaladas com `pip install -r requirements.txt`
3. **Conflito de porta**: Verifique se as portas 5000 (backend) e 5173 (frontend) não estão sendo usadas por outros aplicativos
