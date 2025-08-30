"""
Utilitários para gerenciamento do banco de dados SQLite
"""
import sqlite3
import os
import sys

# Caminho do banco de dados
DB_PATH = os.path.join(os.path.dirname(__file__), 'proposals.db')

def init_db():
    """Inicializa o banco de dados do zero"""
    print("Inicializando banco de dados...")
    
    # Verifica se o banco já existe e o remove
    if os.path.exists(DB_PATH):
        print(f"Banco de dados encontrado em {DB_PATH}")
        confirm = input("Deseja resetar o banco de dados? Todos os dados serão perdidos! (s/N): ")
        if confirm.lower() != 's':
            print("Operação cancelada.")
            return
        
        os.remove(DB_PATH)
        print("Banco de dados anterior removido.")
    
    # Cria novo banco
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
        model TEXT NOT NULL
    )
    ''')
    
    conn.commit()
    conn.close()
    
    print(f"Banco de dados inicializado com sucesso em: {DB_PATH}")

def export_proposals(output_file):
    """Exporta propostas para um arquivo JSON"""
    import json
    
    if not os.path.exists(DB_PATH):
        print(f"Banco de dados não encontrado em {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM proposals ORDER BY created_at DESC')
    rows = cursor.fetchall()
    
    proposals = [dict(row) for row in rows]
    
    conn.close()
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(proposals, f, indent=2, ensure_ascii=False)
    
    print(f"{len(proposals)} propostas exportadas para {output_file}")

def import_proposals(input_file):
    """Importa propostas de um arquivo JSON"""
    import json
    
    if not os.path.exists(input_file):
        print(f"Arquivo de importação não encontrado: {input_file}")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        proposals = json.load(f)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    for proposal in proposals:
        cursor.execute('''
        INSERT INTO proposals (
            client_name, project_description, value, deadline, 
            additional_points, custom_prompt, content, created_at, author, model
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            proposal['client_name'], 
            proposal['project_description'], 
            proposal['value'], 
            proposal['deadline'],
            proposal.get('additional_points', ''),
            proposal.get('custom_prompt', ''),
            proposal['content'],
            proposal['created_at'],
            proposal['author'],
            proposal.get('model', 'unknown')
        ))
    
    conn.commit()
    conn.close()
    
    print(f"{len(proposals)} propostas importadas com sucesso.")

def display_stats():
    """Exibe estatísticas do banco de dados"""
    if not os.path.exists(DB_PATH):
        print(f"Banco de dados não encontrado em {DB_PATH}")
        return
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total de propostas
    cursor.execute('SELECT COUNT(*) FROM proposals')
    total = cursor.fetchone()[0]
    
    # Valor total
    cursor.execute('SELECT SUM(value) FROM proposals')
    total_value = cursor.fetchone()[0] or 0
    
    # Propostas por modelo
    cursor.execute('SELECT model, COUNT(*) FROM proposals GROUP BY model')
    models = cursor.fetchall()
    
    # Propostas por mês
    cursor.execute('''
    SELECT substr(created_at, 1, 7) as month, COUNT(*) 
    FROM proposals 
    GROUP BY month 
    ORDER BY month DESC
    ''')
    months = cursor.fetchall()
    
    conn.close()
    
    print("\n===== Estatísticas do Banco de Dados =====")
    print(f"Total de propostas: {total}")
    print(f"Valor total: R$ {total_value:.2f}")
    
    print("\nPropostas por modelo:")
    for model, count in models:
        print(f"  {model}: {count}")
    
    print("\nPropostas por mês:")
    for month, count in months:
        print(f"  {month}: {count}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python db_utils.py <comando>")
        print("Comandos disponíveis:")
        print("  init    - Inicializa o banco de dados")
        print("  export  - Exporta propostas para arquivo JSON")
        print("  import  - Importa propostas de arquivo JSON")
        print("  stats   - Exibe estatísticas do banco de dados")
        sys.exit(1)
    
    comando = sys.argv[1].lower()
    
    if comando == 'init':
        init_db()
    elif comando == 'export':
        if len(sys.argv) < 3:
            output_file = 'propostas_export.json'
        else:
            output_file = sys.argv[2]
        export_proposals(output_file)
    elif comando == 'import':
        if len(sys.argv) < 3:
            print("Especifique o arquivo de importação: python db_utils.py import arquivo.json")
            sys.exit(1)
        import_proposals(sys.argv[2])
    elif comando == 'stats':
        display_stats()
    else:
        print(f"Comando desconhecido: {comando}")
