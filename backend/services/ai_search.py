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
            # 1. Gerar vetor NORMALIZADO
            query_embedding = self.model.encode([text], normalize_embeddings=True)

            # 2. ESTRATÉGIA DE SOBRA: Pedimos mais resultados ao banco
            # para ter margem caso precisemos descartar questões duplicadas.
            candidates_limit = limit * 3

            # 3. PREPARAR FILTRO (WHERE CLAUSE)
            conditions = [{"tamanho": {"$gte": 60}}]
            if filters:
                if "banca" in filters and filters["banca"]:
                    conditions.append({"banca": filters["banca"]})
                
                # if "ano" in filters: conditions.append({"ano": filters["ano"]})

            if len(conditions) == 1:
                final_where = conditions[0]
            else:
                final_where = {"$and": conditions}
            
            # 4. BUSCAR NO BANCO
            results = self.collection.query(
                query_embeddings=query_embedding,
                n_results=candidates_limit,
                where=final_where,
                include=["documents", "metadatas", "distances", "embeddings"] 
            )

            formatted_results = []
            
            # Proteção contra resultados vazios
            if not results['ids']: 
                return []

            ids = results['ids'][0]
            distances = results['distances'][0]
            documents = results['documents'][0]
            metadatas = results['metadatas'][0]
            embeddings = results['embeddings'][0]
            
            import math 
            import re

            seen_texts = set()
            accepted_embeddings = []

            for i in range(len(ids)):
                if len(formatted_results) >= limit:
                    break

                enunciado_texto = documents[i]
                current_emb = embeddings[i]

                # Filtro 1: Anti-Duplicação Exata (texto normalizado)
                normalized_text = re.sub(r'\W+', '', enunciado_texto).lower()
                if normalized_text in seen_texts:
                    continue 

                # Filtro 2: Anti-Duplicação Semântica (vetorial)
                # Verifica se essa questão é semanticamente quase idêntica a outra já aceita
                is_semantic_duplicate = False
                for acc_emb in accepted_embeddings:
                    # Distância L2 Quadrada entre os embeddings
                    dist_sq = sum((a - b) ** 2 for a, b in zip(current_emb, acc_emb))
                    # Threshold de 0.15 representa uma similaridade semântica extrema (>95%)
                    if dist_sq < 0.15:
                        is_semantic_duplicate = True
                        break
                
                if is_semantic_duplicate:
                    continue

                # Passou em todos os filtros, é uma questão válida e nova
                seen_texts.add(normalized_text)
                accepted_embeddings.append(current_emb)

                # O tamanho já foi filtrado pelo banco vetorial!
                # Calculando o score matematicamente correto baseado na distância L2 normalizada
                # L2 normalizado vai de 0 a 4 (onde 0 é identico e 4 é oposto).
                # Portanto: 1.0 - (dist / 2.0) gera um score entre -1.0 e 1.0
                dist = distances[i]
                score = max(0.0, 1.0 - (dist / 2.0))
                
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