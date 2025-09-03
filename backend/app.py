from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import openai
import sqlite3
import datetime
import json
import requests
from bs4 import BeautifulSoup
import re
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas as rotas

# Configuração da API OpenAI (usando método antigo compatível)
openai.api_key = os.environ.get('OPENAI_API_KEY')

# Configuração do autor da proposta
PROPOSAL_AUTHOR = os.environ.get('PROPOSAL_AUTHOR', 'Rivaldo Silveira')

# Configuração do banco de dados SQLite
DB_PATH = os.path.join(os.path.dirname(__file__), 'proposals.db')

def init_db():
    """Inicializa o banco de dados SQLite"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Criação da tabela de propostas
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS proposals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_name TEXT NOT NULL,
        project_description TEXT NOT NULL,
        value REAL NOT NULL,
        deadline TEXT NOT NULL,
        additional_points TEXT,
        custom_prompt TEXT,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        author TEXT NOT NULL,
        model TEXT NOT NULL,
        project_id INTEGER
    )
    ''')
    
    # Verifica se a coluna project_id existe, se não, adiciona
    try:
        cursor.execute('SELECT project_id FROM proposals LIMIT 1')
    except sqlite3.OperationalError:
        # A coluna não existe, vamos adicioná-la
        cursor.execute('ALTER TABLE proposals ADD COLUMN project_id INTEGER')
    
    # Criação da tabela de projetos
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()
    
# Inicializa o banco de dados
init_db()

# Função removida - vamos usar a IA para identificar o gênero

@app.route('/api/health', methods=['GET'])
def health_check():
    """Rota para verificar se a API está funcionando"""
    return jsonify({'status': 'online', 'message': 'API Flask está funcionando!'})

@app.route('/api/extract-99freelas', methods=['POST'])
def extract_99freelas():
    """Extrai informações de um projeto do 99freelas a partir da URL"""
    data = request.json
    
    if not data or 'url' not in data:
        return jsonify({
            'success': False,
            'error': 'URL não fornecida'
        }), 400
    
    url = data['url']
    
    # Verifica se é uma URL do 99freelas
    if '99freelas.com' not in url:
        return jsonify({
            'success': False,
            'error': 'A URL fornecida não é do 99freelas'
        }), 400
    
    try:
        # Faz a requisição para a página do projeto
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return jsonify({
                'success': False,
                'error': f'Erro ao acessar a página. Status code: {response.status_code}'
            }), 500
        
        # Parse do HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extrair informações do projeto
        project_data = {}
        
        # Nome do cliente - tentar diferentes estratégias
        client_name = None
        
        # Estratégia 1: Buscar pelo elemento específico do nome do cliente
        client_name_elem = soup.select_one('.info-usuario-nome span.name')
        if client_name_elem and client_name_elem.text.strip():
            client_name = client_name_elem.text.strip()
            
        # Estratégia 2: Se não encontrou, buscar na seção de informações do cliente
        if not client_name:
            client_div = soup.select_one('div:-soup-contains("Cliente") h2')
            if client_div and client_div.text.strip():
                client_name = client_div.text.strip()
                
        # Estratégia 3: Tentar encontrar o texto "Cliente:" seguido do nome
        if not client_name:
            cliente_pattern = re.search(r'Cliente:?\s*([A-Za-z0-9\s]+)', response.text)
            if cliente_pattern:
                client_name = cliente_pattern.group(1).strip()
                
        # Se ainda não tiver nome, usar um nome padrão
        if not client_name:
            client_name = "Cliente"
            
        project_data['clientName'] = client_name
        
        # Descrição do projeto - tentar diferentes estratégias
        project_description = None
        
        # Estratégia 1: Buscar pelo elemento específico da descrição
        project_desc_elem = soup.select_one('.item-text.project-description')
        if project_desc_elem and project_desc_elem.text.strip():
            project_description = project_desc_elem.text.strip()
        
        # Estratégia 2: Procurar por outros elementos que possam conter a descrição
        if not project_description:
            desc_elem = soup.select_one('div:-soup-contains("Descrição do Projeto:"), div.project-description')
            if desc_elem and desc_elem.text.strip():
                # Extrair apenas a parte após "Descrição do Projeto:"
                desc_text = desc_elem.text.strip()
                desc_match = re.search(r'Descrição do Projeto:?\s*(.+)', desc_text, re.DOTALL)
                if desc_match:
                    project_description = desc_match.group(1).strip()
                else:
                    project_description = desc_text
                
        # Estratégia 3: Procurar por qualquer texto longo que possa ser a descrição
        if not project_description:
            for p in soup.select('p'):
                if p.text and len(p.text.strip()) > 100:  # Descrições geralmente são longas
                    project_description = p.text.strip()
                    break
                    
        # Se ainda não tiver descrição, usar um texto padrão
        if not project_description:
            project_description = "Descrição do projeto não encontrada. Por favor, preencha manualmente."
            
        project_data['projectDescription'] = project_description
        
        # Valor do projeto (se disponível) - tentar diferentes estratégias
        value = None
        
        # Estratégia 1: Buscar pelo elemento específico do valor
        value_elem = soup.select_one('div:-soup-contains("Valor Mínimo:") + div')
        if value_elem:
            value_text = value_elem.text.strip()
            # Extrair apenas os números
            value_match = re.search(r'R\$\s*([\d.,]+)', value_text)
            if value_match:
                value = value_match.group(1).replace('.', '').replace(',', '.')
        
        # Estratégia 2: Procurar por padrões de valor em toda a página
        if not value:
            # Buscar padrões como "R$ 5000" ou "5.000,00"
            value_pattern = re.search(r'R\$\s*([\d.,]+)', response.text)
            if value_pattern:
                value = value_pattern.group(1).replace('.', '').replace(',', '.')
                
        # Se ainda não tiver valor, usar um valor padrão
        if not value:
            value = "5000"
            
        project_data['value'] = value
        
        # Não extraímos o prazo pois será preenchido manualmente pelo usuário
        # Removida a lógica de extração de prazo conforme solicitação
        
        # Removemos a coleta de categorias e habilidades como pontos adicionais
        # Vamos focar apenas nos dados principais: cliente e descrição
        
        return jsonify({
            'success': True,
            'projectData': project_data
        })
        
    except Exception as e:
        print(f"Erro ao extrair dados do 99freelas: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao extrair dados: {str(e)}'
        }), 500

@app.route('/api/generate-proposal', methods=['POST'])
def generate_proposal():
    """Gera uma proposta usando a API da OpenAI"""
    data = request.json
    
    # Validação básica
    required_fields = ['clientName', 'projectDescription', 'value', 'deadline']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({
                'success': False,
                'error': f'Campo obrigatório ausente: {field}'
            }), 400
            
    # Verificar se um projeto foi selecionado
    project_id = data.get('projectId')
    project_description = ""
    
    # Só busca informações do projeto se projectId for um valor válido (não None, não vazio, não 0)
    if project_id and str(project_id).strip():
        try:
            # Buscar informações do projeto selecionado
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
            project = cursor.fetchone()
            conn.close()
            
            if project:
                project_description = f"Projeto: {project['name']} - {project['description']}"
            else:
                # Se o projeto não for encontrado, define project_id como None
                project_id = None
        except Exception as e:
            print(f"Erro ao buscar projeto: {str(e)}")
            project_id = None
    
    # Sempre use uma chave API - priorize a do cliente, depois a do ambiente, ou use uma padrão
    api_key = data.get('apiKey') or openai.api_key or os.environ.get('DEFAULT_OPENAI_API_KEY')
    
    if not api_key:
        return jsonify({
            'success': False,
            'error': 'Chave API OpenAI não configurada. Forneça uma chave API para gerar a proposta.'
        }), 400
    
    try:
        # Se uma chave API customizada for fornecida na requisição, usamos temporariamente
        original_key = openai.api_key
        if data.get('apiKey'):
            openai.api_key = data.get('apiKey')
            
        proposal_content = generate_with_openai(data)
        
        # Restaurar a chave original, se necessário
        if data.get('apiKey'):
            openai.api_key = original_key
            
        # Obter o último ID de proposta (a função save_proposal é chamada dentro de generate_with_openai)
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT MAX(id) FROM proposals')
        last_id = cursor.fetchone()[0]
        conn.close()
        
        proposal_data = {
            'id': last_id,
            'clientName': data['clientName'],
            'projectDescription': data['projectDescription'],
            'value': data['value'],
            'deadline': data['deadline'],
            'additionalPoints': data.get('additionalPoints', ''),
            'customPrompt': data.get('customPrompt', ''),
            'content': proposal_content,
            'generatedWith': 'gpt',
            'author': PROPOSAL_AUTHOR,
            'createdAt': datetime.datetime.now().isoformat()
        }
        
        # Só adiciona project_id se ele existir e for válido
        if project_id and str(project_id).strip():
            proposal_data['projectId'] = project_id
            
        response = {
            'success': True,
            'proposal': proposal_data
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"Erro ao gerar proposta com OpenAI: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Erro ao gerar a proposta: {str(e)}. Verifique sua chave API e tente novamente.'
        }), 500

def generate_with_openai(data):
    """Gera proposta usando a API da OpenAI"""
    
    client_name = data['clientName']
    project_description = data['projectDescription']
    value = data['value']
    deadline = data['deadline']
    additional_points = data.get('additionalPoints', '')
    custom_prompt = data.get('customPrompt', '')
    
    # Formata os pontos adicionais, se existirem
    additional_points_formatted = ""
    if additional_points:
        points_list = additional_points.split(',')
        additional_points_formatted = "\n✅ DIFERENCIAIS INCLUSOS:\n"
        additional_points_formatted += "\n".join([f"• {point.strip()}" for point in points_list])
        additional_points_formatted += "\n"
    
    # Instruções de formatação simplificadas
    format_instructions = """
VOCÊ DEVE USAR ESTAS TAGS FREQUENTEMENTE NO TEXTO PARA DESTACAR INFORMAÇÕES:

{b} {/b}: negrito - USE MUITO para destacar pontos principais, valores, prazos e termos importantes
{i} {/i}: itálico - USE MUITO para enfatizar conceitos, metodologias e explicações importantes
{u} {/u}: sublinhado - USE MUITO para elementos cruciais que exigem atenção especial do cliente

EXEMPLOS DE USO CORRETO:
- "Nosso prazo para entrega será de {b}30 dias úteis{/b}"
- "Utilizaremos a metodologia {i}Design Thinking{/i} para desenvolver sua solução"
- "É {u}imprescindível{/u} que os materiais sejam fornecidos até a data acordada"

IMPORTANTE: 
- Use as tags de formatação em CADA PARÁGRAFO pelo menos uma vez
- Utilize espaçamento generoso entre parágrafos (linhas em branco)
- Separe cada tópico principal com pelo menos duas linhas em branco
- Use listas com marcadores para melhorar a legibilidade
"""
    
    # Sistema de instruções otimizado e conciso
    system_prompt = """Redator de propostas comerciais: Crie propostas persuasivas e formais para a plataforma 99freelas.

IMPORTANTE: A proposta é de um FREELANCER INDIVIDUAL (não uma equipe/empresa). Use sempre primeira pessoa do singular ("eu farei", "entregarei", "minha experiência", etc.) e não "nós" ou "nossa equipe".

Estruture o conteúdo de forma lógica com espaçamento entre parágrafos, mas SEM USAR CABEÇALHOS EXPLÍCITOS como "Apresentação", "Escopo", etc.

A proposta deve fluir naturalmente incluindo:
- Um cumprimento inicial ao cliente que DEVE seguir este formato específico:
  * Identifique o gênero do cliente com base no nome fornecido (analise o primeiro nome)
  * Use "Prezado" para nomes masculinos ou "Prezada" para nomes femininos
  * SEMPRE inclua ", tudo bem?" logo após o nome
  * Exemplo: "Prezado João, tudo bem?" ou "Prezada Maria, tudo bem?"
- Demonstração de entendimento sobre o projeto
- Descrição do que será entregue
- Menção ao valor e prazo
- Uma conclusão com proposta de próximos passos

Formatação:
- UTILIZE FREQUENTEMENTE AS TAGS DE FORMATAÇÃO {b}{/b}, {i}{/i} e {u}{/u} no texto
- Use {b}{/b} para destacar pontos principais, valores, prazos e termos importantes
- Use {i}{/i} para conceitos, metodologias e explicações
- Use {u}{/u} para elementos cruciais que exigem atenção especial
- Utilize bastante espaço em branco entre parágrafos (linhas em branco)
- NÃO use títulos de seção como "APRESENTAÇÃO", "ESCOPO", etc.
- Use parágrafos curtos e concisos

Use linguagem formal, destaque benefícios e personalize para o cliente.
Assine como autor fornecido no final do texto, indicando que é um freelancer profissional.

""" + format_instructions
    
    # Constrói o prompt conciso para a API
    # Use variáveis separadas para evitar problemas de formatação com f-strings
    tag_bold_open = "{b}"
    tag_bold_close = "{/b}"
    
    prompt = f"""Proposta comercial para:

{tag_bold_open}CLIENTE:{tag_bold_close} {client_name}

{tag_bold_open}PROJETO:{tag_bold_close} {project_description}

{tag_bold_open}VALOR:{tag_bold_close} R$ {float(value):.2f}

{tag_bold_open}PRAZO:{tag_bold_close} {deadline}"""
    
    # Adiciona pontos adicionais e instruções se fornecidos
    if additional_points:
        prompt += f"\n\n{tag_bold_open}PONTOS ADICIONAIS:{tag_bold_close} {additional_points}"
    
    # Adiciona informações do projeto selecionado, se houver e não for None/vazio
    if project_description and project_description.strip():
        prompt += f"\n\n{tag_bold_open}PROJETO SELECIONADO:{tag_bold_close} {project_description}"
    
    if custom_prompt:
        prompt += f"\n\n{tag_bold_open}INSTRUÇÕES:{tag_bold_close} {custom_prompt}"
    
    # Adiciona o restante do prompt
    prompt += f"""

Escreva uma proposta comercial para a plataforma 99freelas com os elementos abaixo. O texto deve fluir naturalmente entre os tópicos, sem usar cabeçalhos de seção:

- Esta proposta é como FREELANCER INDIVIDUAL, não como equipe ou empresa
- Use sempre primeira pessoa do singular ("eu farei", "entregarei", "desenvolverei")
- NUNCA use "nós", "nosso time", "nossa equipe" ou qualquer referência a uma equipe
- OBRIGATORIAMENTE comece com o cumprimento "Prezado(a) {client_name}, tudo bem?" usando o pronome correto (Prezado/Prezada) baseado no gênero do cliente que você deve identificar pelo nome
- Adicione uma breve frase cordial antes de entrar no assunto
- Demonstre que entendeu o projeto e as necessidades
- Descreva o que será entregue e como será feito por você (individualmente)
- Explique prazos e cronograma do seu trabalho individual
- Mencione o investimento e condições de pagamento
- Finalize com próximos passos e um convite para contato

MUITO IMPORTANTE: 
- USE FREQUENTEMENTE as tags de formatação em seu texto
- Use {tag_bold_open}negrito{tag_bold_close} para destacar valores, prazos e pontos principais
- Use {{i}}itálico{{/i}} para metodologias e conceitos importantes 
- Use {{u}}sublinhado{{/u}} para elementos cruciais que exigem atenção especial
- Use pelo menos 3-4 formatações diferentes em cada parágrafo

Use bastante espaço em branco entre parágrafos para facilitar a leitura.


Atenciosamente,
{tag_bold_open}{PROPOSAL_AUTHOR}{tag_bold_close}
"""

    # Usar um modelo mais capaz se disponível
    model = "gpt-4" if data.get('useGPT4', False) else "gpt-3.5-turbo"
    model_name = model  # Salvar nome do modelo para o banco de dados
    
    # Usando o método compatível com versões anteriores
    try:
        from openai import Completion, ChatCompletion
        
        response = openai.ChatCompletion.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2500,  # Aumentado para permitir propostas com melhor formatação e espaçamento
            temperature=0.7
        )
        content = response.choices[0].message.content
    except (ImportError, AttributeError):
        # Fallback para API mais antiga se necessário
        response = openai.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2500,  # Aumentado para permitir propostas com melhor formatação e espaçamento
            temperature=0.7
        )
        content = response.choices[0].message.content
    
    # Salva a proposta no banco de dados
    save_proposal(
        client_name=client_name,
        project_description=project_description,
        value=float(value),
        deadline=deadline,
        additional_points=additional_points,
        custom_prompt=custom_prompt,
        content=content,
        author=PROPOSAL_AUTHOR,
        model=model_name,
        project_id=data.get('projectId')
    )
    
    return content

def save_proposal(client_name, project_description, value, deadline, 
                additional_points, custom_prompt, content, author, model, project_id=None):
    """Salva uma proposta no banco de dados SQLite"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    created_at = datetime.datetime.now().isoformat()
    
    # Verifica se project_id existe e se a coluna project_id existe na tabela
    if project_id is not None:
        try:
            cursor.execute('''
            INSERT INTO proposals (
                client_name, project_description, value, deadline, 
                additional_points, custom_prompt, content, created_at, author, model, project_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                client_name, project_description, value, deadline,
                additional_points, custom_prompt, content, created_at, author, model, project_id
            ))
        except sqlite3.OperationalError as e:
            # Se a coluna project_id não existir, insere sem ela
            if "no column named project_id" in str(e):
                cursor.execute('''
                INSERT INTO proposals (
                    client_name, project_description, value, deadline, 
                    additional_points, custom_prompt, content, created_at, author, model
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    client_name, project_description, value, deadline,
                    additional_points, custom_prompt, content, created_at, author, model
                ))
            else:
                # Se for outro erro, relança a exceção
                raise
    else:
        # Se não tem project_id, insere sem ele
        cursor.execute('''
        INSERT INTO proposals (
            client_name, project_description, value, deadline, 
            additional_points, custom_prompt, content, created_at, author, model
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            client_name, project_description, value, deadline,
            additional_points, custom_prompt, content, created_at, author, model
        ))
    
    proposal_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return proposal_id

def get_proposals():
    """Recupera todas as propostas do banco de dados"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM proposals ORDER BY created_at DESC')
    rows = cursor.fetchall()
    
    proposals = []
    for row in rows:
        proposal = dict(row)
        proposals.append(proposal)
    
    conn.close()
    return proposals

def get_proposal_by_id(proposal_id):
    """Recupera uma proposta específica pelo ID"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM proposals WHERE id = ?', (proposal_id,))
    row = cursor.fetchone()
    
    proposal = dict(row) if row else None
    
    conn.close()
    return proposal

@app.route('/api/proposals', methods=['GET'])
def list_proposals():
    """Lista todas as propostas salvas, com opção de filtro por cliente"""
    search_term = request.args.get('search', '')
    
    if search_term:
        # Se houver termo de busca, filtramos os resultados
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Busca por cliente, descrição ou conteúdo
        cursor.execute('''
        SELECT * FROM proposals 
        WHERE client_name LIKE ? 
           OR project_description LIKE ? 
           OR content LIKE ?
        ORDER BY created_at DESC
        ''', (f'%{search_term}%', f'%{search_term}%', f'%{search_term}%'))
        
        rows = cursor.fetchall()
        proposals = [dict(row) for row in rows]
        conn.close()
    else:
        # Sem termo de busca, retorna todas as propostas
        proposals = get_proposals()
    
    return jsonify({
        'success': True,
        'proposals': proposals
    })

@app.route('/api/proposals/<int:proposal_id>', methods=['GET'])
def get_proposal(proposal_id):
    """Recupera uma proposta específica pelo ID"""
    proposal = get_proposal_by_id(proposal_id)
    
    if proposal:
        return jsonify({
            'success': True,
            'proposal': proposal
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Proposta não encontrada'
        }), 404

@app.route('/api/proposals/<int:proposal_id>', methods=['DELETE'])
def delete_proposal(proposal_id):
    """Deleta uma proposta específica pelo ID"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM proposals WHERE id = ?', (proposal_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({
            'success': False,
            'error': 'Proposta não encontrada'
        }), 404
    
    cursor.execute('DELETE FROM proposals WHERE id = ?', (proposal_id,))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': f'Proposta {proposal_id} deletada com sucesso'
    })

# Rotas para projetos
@app.route('/api/projects', methods=['GET'])
def list_projects():
    """Lista todos os projetos salvos"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM projects ORDER BY created_at DESC')
    rows = cursor.fetchall()
    
    projects = [dict(row) for row in rows]
    conn.close()
    
    return jsonify({
        'success': True,
        'projects': projects
    })

@app.route('/api/projects', methods=['POST'])
def create_project():
    """Cria um novo projeto"""
    data = request.json
    
    # Validação básica
    if not data.get('name') or not data.get('description'):
        return jsonify({
            'success': False,
            'error': 'Nome e descrição do projeto são obrigatórios'
        }), 400
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    created_at = datetime.datetime.now().isoformat()
    
    cursor.execute('''
    INSERT INTO projects (name, description, created_at)
    VALUES (?, ?, ?)
    ''', (data['name'], data['description'], created_at))
    
    project_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'project': {
            'id': project_id,
            'name': data['name'],
            'description': data['description'],
            'created_at': created_at
        }
    })

@app.route('/api/projects/<int:project_id>', methods=['GET'])
def get_project(project_id):
    """Recupera um projeto específico pelo ID"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        return jsonify({
            'success': False,
            'error': 'Projeto não encontrado'
        }), 404
    
    project = dict(row)
    conn.close()
    
    return jsonify({
        'success': True,
        'project': project
    })

@app.route('/api/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    """Atualiza um projeto existente"""
    data = request.json
    
    # Validação básica
    if not data.get('name') or not data.get('description'):
        return jsonify({
            'success': False,
            'error': 'Nome e descrição do projeto são obrigatórios'
        }), 400
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM projects WHERE id = ?', (project_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({
            'success': False,
            'error': 'Projeto não encontrado'
        }), 404
    
    cursor.execute('''
    UPDATE projects 
    SET name = ?, description = ?
    WHERE id = ?
    ''', (data['name'], data['description'], project_id))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'project': {
            'id': project_id,
            'name': data['name'],
            'description': data['description']
        }
    })

@app.route('/api/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    """Deleta um projeto específico pelo ID"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('SELECT id FROM projects WHERE id = ?', (project_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({
            'success': False,
            'error': 'Projeto não encontrado'
        }), 404
    
    cursor.execute('DELETE FROM projects WHERE id = ?', (project_id,))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True,
        'message': f'Projeto {project_id} deletado com sucesso'
    })

if __name__ == '__main__':
    # Verifica se há API key configurada
    if not os.environ.get('OPENAI_API_KEY'):
        print("⚠️ AVISO: Chave API OpenAI não configurada. Uma chave deverá ser fornecida em cada requisição.")
        print("🔑 Defina a variável OPENAI_API_KEY no arquivo .env para usar a API OpenAI automaticamente.")
    else:
        print("✅ API OpenAI configurada com sucesso.")
    
    print(f"👤 Autor das propostas configurado: {PROPOSAL_AUTHOR}")
    print(f"💾 Banco de dados configurado em: {DB_PATH}")
    
    # Inicia o servidor Flask
    app.run(debug=True, port=5000)
