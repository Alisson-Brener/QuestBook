import chromadb
from sentence_transformers import SentenceTransformer

# ==============================================================================
# CONFIGURAÇÃO
# ==============================================================================
CHROMA_PATH = "db_vetorial"
COLLECTION_NAME = "questbook_v1"
MODEL_NAME = 'paraphrase-multilingual-MiniLM-L12-v2'

# Este é o "Capítulo Falso". 
# Escrevi um texto sobre "Testes de Software" para ver se a IA traz questões disso.
TEXTO_DO_CAPITULO = """
O teste de software é uma investigação conduzida para fornecer informações objetivas 
sobre a qualidade do produto ou serviço em teste (software under test - SUT) para 
a parte interessada. As técnicas de teste incluem o processo de execução de um 
programa ou aplicação com o objetivo de encontrar falhas de software (erros ou outros defeitos), 
e verificar se o produto de software está apto para o uso.
Existem diversos níveis de teste: teste de unidade, teste de integração, 
teste de sistema e teste de aceitação.
"""

def main():
    print("--- Iniciando Teste de Matching ---")
    
    # 1. Carregar o Modelo de IA (o mesmo usado na indexação)
    print(f"Carregando modelo: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)

    # 2. Conectar ao Banco Vetorial (que acabamos de criar)
    print(f"Conectando ao ChromaDB em: {CHROMA_PATH}...")
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    collection = client.get_collection(name=COLLECTION_NAME)

    # 3. Gerar o Vetor (Embedding) do Capítulo
    print("Gerando vetor semântico para o texto do capítulo...")
    query_embedding = model.encode([TEXTO_DO_CAPITULO])

    # 4. A Mágica: Perguntar ao ChromaDB quem são os vizinhos mais próximos
    print("Buscando as 5 questões mais relevantes...")
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=5, # Traz o top 5
        include=["documents", "metadatas", "distances"] # O que queremos de volta
    )

    # 5. Exibir os Resultados
    print("\n" + "="*60)
    print(f"RESULTADOS PARA O TEMA: 'TESTE DE SOFTWARE'")
    print("="*60 + "\n")

    # O Chroma retorna listas de listas (pois podemos buscar vários textos de uma vez)
    ids = results['ids'][0]
    documents = results['documents'][0]
    distances = results['distances'][0]

    for i in range(len(ids)):
        q_id = ids[i]
        q_texto = documents[i]
        q_distancia = distances[i]
        
        # Nota: No ChromaDB padrão, "Distância" menor = Maior similaridade
        print(f"RANK #{i+1} | ID: {q_id} | Distância: {q_distancia:.4f}")
        print(f"Enunciado (trecho): {q_texto[:200]}...") # Mostra só os primeiros 200 caracteres
        print("-" * 60)

if __name__ == "__main__":
    main()