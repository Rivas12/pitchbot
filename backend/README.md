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

Gera uma proposta comercial personalizada.

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
    "clientName": "Nome do Cliente",
    "projectDescription": "Descrição do projeto",
    "value": "5000",
    "deadline": "30 dias",
    "additionalPoints": "Otimização SEO, Design responsivo, Suporte técnico",
    "content": "Texto da proposta formatada...",
    "generatedWith": "gpt"
  }
}
```

## Modo de Simulação

Se não houver uma chave API da OpenAI configurada, o servidor funcionará em modo de simulação, gerando propostas mais simples sem consumir tokens da API.

## Requisitos

As dependências do projeto estão listadas no arquivo `requirements.txt`.
