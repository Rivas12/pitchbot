# Backend Flask para PitchBot

Este é o backend em Flask para a aplicação PitchBot, responsável por gerar propostas comerciais usando a API da OpenAI.

## Configuração

1. Certifique-se de ter o Python 3.8+ instalado.
2. Execute o script `start_server.bat` para configurar o ambiente virtual e iniciar o servidor.

Alternativivamente, você pode configurar manualmente:

```bash
# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# No Windows:
venv\Scripts\activate
# No Linux/Mac:
# source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar a chave API da OpenAI
# Edite o arquivo .env e adicione sua chave API:
# OPENAI_API_KEY=sua_chave_aqui

# Iniciar o servidor
flask run --port=5000
```

## Arquivo .env

Configure o arquivo `.env` com sua chave API da OpenAI:

```
OPENAI_API_KEY=sua_chave_api_aqui
```

Se não houver chave API configurada, o servidor funcionará em modo de simulação.

## Banco de Dados SQLite

O backend utiliza SQLite para armazenar todas as propostas geradas. O arquivo do banco de dados (`proposals.db`) é criado automaticamente na pasta `backend/` na primeira execução.

### Utilidades de Banco de Dados

O arquivo `db_utils.py` fornece ferramentas para gerenciamento do banco de dados:

```bash
# Inicializar ou reiniciar o banco de dados
python db_utils.py init

# Exportar propostas para JSON
python db_utils.py export [arquivo_saida.json]

# Importar propostas de JSON
python db_utils.py import arquivo.json

# Ver estatísticas do banco
python db_utils.py stats
```

## Endpoints da API

### 1. Verificação de saúde

```
GET /api/health
```

Verifica se o servidor está online.

**Resposta:**
```json
{
  "status": "online", 
  "message": "API Flask está funcionando!"
}
```

### 2. Geração de propostas

```
POST /api/generate-proposal
```

Gera uma proposta comercial personalizada e a armazena no banco de dados.

**Corpo da requisição:**
```json
{
  "clientName": "Nome do Cliente",
  "projectDescription": "Descrição do projeto",
  "value": "5000",
  "deadline": "30 dias",
  "additionalPoints": "Otimização SEO, Design responsivo, Suporte técnico"
}
```

**Resposta:**
```json
{
  "success": true,
  "proposal": {
    "id": 1,
    "clientName": "Nome do Cliente",
    "projectDescription": "Descrição do projeto",
    "value": "5000",
    "deadline": "30 dias",
    "additionalPoints": "Otimização SEO, Design responsivo, Suporte técnico",
    "content": "Texto da proposta formatada...",
    "generatedWith": "gpt",
    "createdAt": "2023-07-25T14:30:45.123456"
  }
}
```

### 3. Listar propostas

```
GET /api/proposals
```

Lista todas as propostas salvas no banco de dados.

**Parâmetros de consulta opcionais:**
- `search`: Termo de busca para filtrar propostas por cliente, descrição ou conteúdo

**Resposta:**
```json
{
  "success": true,
  "proposals": [
    {
      "id": 2,
      "client_name": "Cliente Exemplo",
      "project_description": "Descrição do Projeto",
      "value": 5000.0,
      "deadline": "30 dias",
      "content": "Conteúdo da proposta...",
      "created_at": "2023-07-25T15:30:45.123456",
      "author": "Nome do Autor",
      "model": "gpt-3.5-turbo"
    },
    {
      "id": 1,
      "client_name": "Outro Cliente",
      "project_description": "Outro Projeto",
      "value": 2500.0,
      "deadline": "15 dias",
      "content": "Conteúdo da proposta...",
      "created_at": "2023-07-24T10:15:30.123456",
      "author": "Nome do Autor",
      "model": "gpt-4"
    }
  ]
}
```

### 4. Obter proposta específica

```
GET /api/proposals/{id}
```

Obtém os detalhes de uma proposta específica pelo ID.

**Resposta:**
```json
{
  "success": true,
  "proposal": {
    "id": 1,
    "client_name": "Nome do Cliente",
    "project_description": "Descrição do Projeto",
    "value": 5000.0,
    "deadline": "30 dias",
    "content": "Conteúdo da proposta...",
    "created_at": "2023-07-25T15:30:45.123456",
    "author": "Nome do Autor",
    "model": "gpt-3.5-turbo"
  }
}
```

### 5. Deletar proposta

```
DELETE /api/proposals/{id}
```

Remove uma proposta específica do banco de dados.

**Resposta:**
```json
{
  "success": true,
  "message": "Proposta 1 deletada com sucesso"
}
```

## Modo de Simulação

Se não houver uma chave API da OpenAI configurada, o servidor funcionará em modo de simulação, gerando propostas mais simples sem consumir tokens da API.

## Requisitos

As dependências do projeto estão listadas no arquivo `requirements.txt`.
