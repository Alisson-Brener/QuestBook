import chromadb
from sentence_transformers import SentenceTransformer
import math
import os

class QuestSearchEngine:
    def __init__(self, vector_db_path: str = "db_vetorial"):
        """
        Inicializa o motor de busca. Carrega a IA e conecta ao ChromaDB.
        Isso deve rodar apenas UMA vez quando o servidor ligar.
        """
        print("🔄 Inicializando Motor de Busca IA...")
        
        # 1. Configurações
        self.collection_name = "questbook_v1"
        self.model_name = 'paraphrase-multilingual-MiniLM-L12-v2'
        
        # 2. Carregar Modelo (pode demorar uns segundos na inicialização)
        print(f"   Processando modelo de linguagem: {self.model_name}")
        self.model = SentenceTransformer(self.model_name)
        
        # 3. Conectar ao Banco Vetorial
        # Nota: Precisamos garantir que o caminho esteja certo independente de onde rodamos
        base_path = os.getcwd() # Pega a pasta onde o terminal está (questbook_tcc)
        full_path = os.path.join(base_path, vector_db_path)
        
        print(f"   Conectando ao ChromaDB em: {full_path}")
        self.client = chromadb.PersistentClient(path=full_path)
        self.collection = self.client.get_collection(name=self.collection_name)
        print("✅ Motor de Busca PRONTO!")

    def search_relevant_questions(self, text: str, limit: int = 10):
        """
        Versão com FILTRO DE QUALIDADE para a Demo.
        Ignora questões com enunciados muito curtos ou quebrados.
        """
        # 1. Gerar vetor
        query_embedding = self.model.encode([text])

        # 2. Buscar o DOBRO de candidatos (para ter margem de descarte)
        # Se o usuário pediu 5, buscamos 10. Se pediu 10, buscamos 20.
        candidates_limit = limit * 3 
        
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=candidates_limit,
            include=["documents", "metadatas", "distances"] 
        )

        formatted_results = []
        
        ids = results['ids'][0]
        distances = results['distances'][0]
        documents = results['documents'][0]
        metadatas = results['metadatas'][0]
        
        import math # Certifique-se de que importou math lá em cima

        for i in range(len(ids)):
            # Se já preenchemos o limite desejado, para.
            if len(formatted_results) >= limit:
                break

            enunciado_texto = documents[i]

            # --- O FILTRO MÁGICO ---
            # Se o texto for menor que 60 caracteres, provavelmente é lixo ou só cabeçalho.
            # Ignora e vai para o próximo.
            if len(enunciado_texto) < 60:
                continue 
            # -----------------------

            dist = distances[i]
            score = math.exp(-dist / 30) # Sua fórmula de confiança ajustada
            
            formatted_results.append({
                "external_id": ids[i],
                "confidence": round(score, 4),
                "enunciado": enunciado_texto, 
                "metadata": metadatas[i]
            })
            
        return formatted_results
        """
        Recebe um texto (capítulo) e retorna a lista de questões mais próximas
        COM o texto do enunciado.
        """
        # 1. Gerar vetor do texto recebido
        query_embedding = self.model.encode([text])

        # 2. Buscar no banco
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=limit,
            # AGORA PEDIMOS TAMBÉM OS "documents" (texto) E "metadatas"
            include=["documents", "metadatas", "distances"] 
        )

        # 3. Formatar a saída para algo limpo
        formatted_results = []
        
        ids = results['ids'][0]
        distances = results['distances'][0]
        documents = results['documents'][0] # O texto da questão
        metadatas = results['metadatas'][0] # Metadados extras
        
        for i in range(len(ids)):
            dist = distances[i]
            score = math.exp(-dist / 30)
            
            formatted_results.append({
                "external_id": ids[i],
                "confidence": round(score, 4), # Vai dar algo como 0.85
                "enunciado": documents[i], 
                "metadata": metadatas[i]
            })
            
        return formatted_results

# Variável global para ser importada pelo main.py
# (Ela será instanciada quando o servidor subir)
search_engine = None