from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import openai
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
CORS(app)  # Habilitar CORS para todas as rotas

# Configuração da API OpenAI (usando método antigo compatível)
openai.api_key = os.environ.get('OPENAI_API_KEY')

# Configuração do autor da proposta
PROPOSAL_AUTHOR = os.environ.get('PROPOSAL_AUTHOR', 'Rivaldo Silveira')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Rota para verificar se a API está funcionando"""
    return jsonify({'status': 'online', 'message': 'API Flask está funcionando!'})

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
            
        response = {
            'success': True,
            'proposal': {
                'clientName': data['clientName'],
                'projectDescription': data['projectDescription'],
                'value': data['value'],
                'deadline': data['deadline'],
                'additionalPoints': data.get('additionalPoints', ''),
                'customPrompt': data.get('customPrompt', ''),
                'content': proposal_content,
                'generatedWith': 'gpt',
                'author': PROPOSAL_AUTHOR
            }
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
- Um cumprimento inicial ao cliente
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
    
    if custom_prompt:
        prompt += f"\n\n{tag_bold_open}INSTRUÇÕES:{tag_bold_close} {custom_prompt}"
    
    # Adiciona o restante do prompt
    prompt += f"""

Escreva uma proposta comercial para a plataforma 99freelas com os elementos abaixo. O texto deve fluir naturalmente entre os tópicos, sem usar cabeçalhos de seção:

- Esta proposta é como FREELANCER INDIVIDUAL, não como equipe ou empresa
- Use sempre primeira pessoa do singular ("eu farei", "entregarei", "desenvolverei")
- NUNCA use "nós", "nosso time", "nossa equipe" ou qualquer referência a uma equipe
- Comece com um cumprimento personalizado ao cliente
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
        return response.choices[0].message.content
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
        return response.choices[0].message.content

# Função de simulação removida para garantir que todas as propostas são geradas pelo GPT

if __name__ == '__main__':
    # Verifica se há API key configurada
    if not os.environ.get('OPENAI_API_KEY'):
        print("⚠️ AVISO: Chave API OpenAI não configurada. Uma chave deverá ser fornecida em cada requisição.")
        print("🔑 Defina a variável OPENAI_API_KEY no arquivo .env para usar a API OpenAI automaticamente.")
    else:
        print("✅ API OpenAI configurada com sucesso.")
    
    print(f"👤 Autor das propostas configurado: {PROPOSAL_AUTHOR}")
    
    # Inicia o servidor Flask
    app.run(debug=True, port=5000)
