import sqlalchemy
import chromadb
from sentence_transformers import SentenceTransformer
from tqdm import tqdm  # Para uma barra de progresso legal!
import time

# ==============================================================================
# CONFIGURAÇÃO - EDITE ESTAS VARIÁVEIS!
# ==============================================================================

# 1. Conexão com seu Banco de Dados SQL de Questões
# Substitua pela "connection string" do seu banco (PostgreSQL, MySQL, etc.)
# Exemplo PostgreSQL: "postgresql://usuario:senha@localhost:5432/meu_banco"
# Exemplo MySQL: "mysql+mysqlclient://usuario:senha@localhost:3306/meu_banco"
DB_CONNECTION_STRING = "postgresql://usuario:senha@localhost:5432/banco_de_questoes"

# 2. Query SQL para buscar as questões
# Edite para que os nomes da tabela e colunas batam com o seu banco
# IMPORTANTE: Pegue o ID (único) e o TEXTO da questão.
SQL_QUERY = "SELECT id, enunciado FROM tabela_de_questoes"

# 3. Configuração do Modelo de IA (PLN)
# Este modelo é ótimo e suporta português muito bem.
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'

# 4. Configuração do Banco de Dados Vetorial (ChromaDB)
# Onde os vetores da IA serão salvos.
CHROMA_PATH = "db_vetorial"
COLLECTION_NAME = "questbook_v1"

# 5. Configuração de Lote (Batch)
# Para não sobrecarregar a memória, processamos em "lotes".
# Ajuste este número se tiver problemas de memória (ex: 500 ou 2000).
BATCH_SIZE = 1000

# ==============================================================================
# O SCRIPT PRINCIPAL - NÃO PRECISA EDITAR DAQUI PARA BAIXO
# ==============================================================================

def connect_to_sql_db(connection_string):
    """Conecta ao banco SQL usando SQLAlchemy."""
    print(f"Conectando ao banco de dados SQL...")
    try:
        engine = sqlalchemy.create_engine(connection_string)
        return engine
    except Exception as e:
        print(f"Erro ao conectar ao SQL DB: {e}")
        exit(1)

def load_model(model_name):
    """Carrega o modelo de IA (sentence-transformer) na memória."""
    print(f"Carregando o modelo de IA: '{model_name}'...")
    print("Isso pode levar alguns minutos na primeira vez para baixar o modelo.")
    try:
        model = SentenceTransformer(model_name)
        return model
    except Exception as e:
        print(f"Erro ao carregar o modelo de IA: {e}")
        exit(1)

def setup_vector_db(path, collection_name):
    """Configura o cliente e a coleção do ChromaDB."""
    print(f"Configurando o banco de dados vetorial em: '{path}'")
    try:
        # Usamos PersistentClient para salvar os dados em disco
        client = chromadb.PersistentClient(path=path)
        
        # Cria a coleção (ou a carrega, se já existir)
        collection = client.get_or_create_collection(name=collection_name)
        return collection
    except Exception as e:
        print(f"Erro ao configurar o ChromaDB: {e}")
        exit(1)

def fetch_questions_in_batches(engine, query, batch_size):
    """Busca questões do SQL DB em lotes usando um cursor."""
    print(f"Iniciando a busca de questões do SQL DB (em lotes de {batch_size})...")
    try:
        with engine.connect() as connection:
            # Usamos um "server-side cursor" para não carregar tudo na memória
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
    
    # 1. Conectar aos sistemas
    sql_engine = connect_to_sql_db(DB_CONNECTION_STRING)
    model = load_model(MODEL_NAME)
    vector_collection = setup_vector_db(CHROMA_PATH, COLLECTION_NAME)

    print("\n--- Início da Indexação ---")
    
    total_processed = 0
    
    # 2. Processar em lotes
    for batch in tqdm(fetch_questions_in_batches(sql_engine, SQL_QUERY, BATCH_SIZE), desc="Processando lotes"):
        
        batch_ids = []
        batch_texts = []
        batch_metadatas = []

        for row in batch:
            # row[0] é o ID, row[1] é o enunciado (conforme SQL_QUERY)
            question_id = str(row[0])
            question_text = str(row[1])

            # Ignora questões sem texto
            if not question_text.strip():
                continue

            batch_ids.append(question_id)
            batch_texts.append(question_text)
            # 'metadatas' é útil para armazenar o texto original ou outras infos
            batch_metadatas.append({"original_text": question_text})

        if not batch_texts:
            continue

        # 3. A Mágica da IA: Gerar Embeddings
        # O modelo processa todos os textos do lote de uma vez (muito rápido!)
        embeddings = model.encode(batch_texts, show_progress_bar=False)

        # 4. Salvar no Banco Vetorial
        # Adiciona os dados ao ChromaDB
        vector_collection.add(
            ids=batch_ids,
            embeddings=embeddings,
            metadatas=batch_metadatas,
            documents=batch_texts # Salva o texto original para referência
        )
        
        total_processed += len(batch_ids)

    end_time = time.time()
    print("\n--- Indexação Concluída ---")
    print(f"Total de questões processadas e salvas: {total_processed}")
    print(f"Tempo total: {end_time - start_time:.2f} segundos")
    print(f"Banco de dados vetorial salvo em: '{CHROMA_PATH}'")

if __name__ == "__main__":
    main()