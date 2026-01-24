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

    def search_relevant_questions(self, text: str, filters: dict = None, limit: int = 10):
            """
            Busca questões por similaridade E filtros (ex: só banca FGV).
            """
            # 1. Gerar vetor
            query_embedding = self.model.encode([text])

            # 2. ESTRATÉGIA DE SOBRA: Buscar o TRIPLO de candidatos
            # Como vamos jogar fora questões curtas (<60 chars), precisamos pedir mais ao banco
            # para garantir que no final sobrem 'limit' questões.
            candidates_limit = limit * 3 

            # 3. PREPARAR FILTRO (WHERE CLAUSE) - Parte Nova
            where_clause = {}
            if filters:
                if "banca" in filters and filters["banca"]:
                    where_clause["banca"] = filters["banca"]
                
                # if "ano" in filters: where_clause["ano"] = filters["ano"]

            final_where = where_clause if len(where_clause) > 0 else None
            
            # 4. BUSCAR NO BANCO (Com filtro e margem de sobra)
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=candidates_limit,
                where=final_where, # <--- O filtro de banca entra aqui
                include=["documents", "metadatas", "distances"] 
            )

            formatted_results = []
            
            # Proteção contra resultados vazios
            if not results['ids']: 
                return []

            ids = results['ids'][0]
            distances = results['distances'][0]
            documents = results['documents'][0]
            metadatas = results['metadatas'][0]
            
            import math 

            for i in range(len(ids)):
                # Se já preenchemos o limite desejado, para.
                if len(formatted_results) >= limit:
                    break

                enunciado_texto = documents[i]

                # --- O SEU FILTRO DE QUALIDADE ---
                # Ignora questões muito curtas (provavelmente lixo de extração de PDF)
                if len(enunciado_texto) < 60:
                    continue 
                # ---------------------------------

                dist = distances[i]
                score = math.exp(-dist / 30)
                
                formatted_results.append({
                    "external_id": ids[i],
                    "confidence": round(score, 4),
                    "enunciado": enunciado_texto, 
                    "metadata": metadatas[i]
                })
                
            return formatted_results

# Variável global para ser importada pelo main.py
# (Ela será instanciada quando o servidor subir)
search_engine = None