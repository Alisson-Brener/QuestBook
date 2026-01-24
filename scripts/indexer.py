import os
import sys
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.append(project_root)

import sqlalchemy
import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import time
from dotenv import load_dotenv

# ==============================================================================
# CONFIGURAÇÃO
# ==============================================================================

# 1. Conexão SQL
load_dotenv(os.path.join(project_root, '.env'))

# Pega do ambiente
DB_CONNECTION_STRING = os.getenv("MYSQL_URL")
if not DB_CONNECTION_STRING:
    print("❌ ERRO: Variável MYSQL_URL não encontrada no .env")
    print("   Verifique se o arquivo .env existe na raiz do projeto.")
    exit(1)

# 2. Query SQL
SQL_QUERY = "SELECT questao_id, enunciado, banca, ano FROM questoes_engenharia_software"

# 3. Modelo
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'

# 4. ChromaDB
CHROMA_PATH = os.path.join(project_root, "db_vetorial")
COLLECTION_NAME = "questbook_v1"

# 5. Batch Size
BATCH_SIZE = 1000

# ==============================================================================
# FUNÇÕES
# ==============================================================================

def connect_to_sql_db(connection_string):
    print(f"Conectando ao banco de dados SQL...")
    try:
        engine = sqlalchemy.create_engine(connection_string)
        return engine
    except Exception as e:
        print(f"Erro ao conectar ao SQL DB: {e}")
        exit(1)

def load_model(model_name):
    print(f"Carregando o modelo de IA: '{model_name}'...")
    try:
        model = SentenceTransformer(model_name)
        return model
    except Exception as e:
        print(f"Erro ao carregar o modelo de IA: {e}")
        exit(1)

def setup_vector_db(path, collection_name):
    print(f"Configurando o banco de dados vetorial em: '{path}'")
    try:
        client = chromadb.PersistentClient(path=path)
        collection = client.get_or_create_collection(name=collection_name)
        return collection
    except Exception as e:
        print(f"Erro ao configurar o ChromaDB: {e}")
        exit(1)

def fetch_questions_in_batches(engine, query, batch_size):
    print(f"Iniciando a busca de questões do SQL DB (em lotes de {batch_size})...")
    try:
        with engine.connect() as connection:
            connection = connection.execution_options(stream_results=True)
            cursor = connection.execute(sqlalchemy.text(query))
            while True:
                batch = cursor.fetchmany(batch_size)
                if not batch:
                    break
                yield batch
    except Exception as e:
        print(f"Erro ao buscar questões do SQL DB: {e}")
        exit(1)

def main():
    start_time = time.time()
    
    sql_engine = connect_to_sql_db(DB_CONNECTION_STRING)
    model = load_model(MODEL_NAME)
    vector_collection = setup_vector_db(CHROMA_PATH, COLLECTION_NAME)

    print("\n--- Início da Indexação ---")
    
    total_processed = 0
    
    for batch in tqdm(fetch_questions_in_batches(sql_engine, SQL_QUERY, BATCH_SIZE), desc="Processando lotes"):

        batch_ids = []
        batch_texts = []
        batch_metadatas = []

        seen_ids_in_batch = set() 

        for row in batch:
            # row[0]=id, row[1]=enunciado, row[2]=banca, row[3]=ano
            question_id = str(row[0])
            question_text = str(row[1])

            # --- AQUI ESTAVA O ERRO: AGORA ESTÁ CORRIGIDO ---
            # Normalização: Converte para MAIÚSCULO (.upper()) e remove espaços (.strip())
            # Isso garante que "Fgv" vire "FGV" e o filtro funcione.
            
            # Pega a coluna 2 (banca)
            if row[2]:
                banca_nome = str(row[2]).strip().upper()
            else:
                banca_nome = "DESCONHECIDA"

            # Pega a coluna 3 (ano)
            if row[3]:
                ano_valor = str(row[3])
            else:
                ano_valor = "0"
            # ------------------------------------------------

            if question_id in seen_ids_in_batch:
                continue
            seen_ids_in_batch.add(question_id)

            if not question_text or not question_text.strip():
                continue

            batch_ids.append(question_id)
            batch_texts.append(question_text)
            
            # Agora as variáveis banca_nome e ano_valor existem!
            batch_metadatas.append({
                "original_text": question_text,
                "banca": banca_nome, 
                "ano": ano_valor
            })

        if not batch_texts:
            continue

        embeddings = model.encode(batch_texts, show_progress_bar=False)

        vector_collection.upsert(
            ids=batch_ids,
            embeddings=embeddings,
            metadatas=batch_metadatas,
            documents=batch_texts
        )
        
        total_processed += len(batch_ids)

    end_time = time.time()
    print("\n--- Indexação Concluída ---")
    print(f"Total de questões processadas: {total_processed}")
    print(f"Tempo total: {end_time - start_time:.2f} segundos")

if __name__ == "__main__":
    main()