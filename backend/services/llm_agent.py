import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class IntentParser:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile" 
        # Memória Volátil: { "session_id": ["msg1", "msg2"] }
        self.memory = {} 

    def _get_context(self, session_id):
        """Recupera as últimas 3 mensagens para dar contexto"""
        if not session_id or session_id not in self.memory:
            return "Nenhum histórico anterior."
        
        # Pega as últimas 3 interações
        history = self.memory[session_id][-3:]
        return "Histórico da conversa:\n" + "\n".join([f"- {msg}" for msg in history])

    def _save_context(self, session_id, user_text):
        """Salva a mensagem atual"""
        if not session_id: return
        if session_id not in self.memory:
            self.memory[session_id] = []
        self.memory[session_id].append(user_text)

    # Mantendo sua técnica vencedora (Few-Shot) mas com Contexto Injetado
    def parse_user_prompt(self, user_text: str, session_id: str = None, document_context: str = None):
        
        # 1. Recupera Contexto
        context_str = self._get_context(session_id)
        
        # 2. Salva a mensagem atual (para a próxima vez)
        self._save_context(session_id, user_text)

        doc_info = f"\nO USUÁRIO FEZ UPLOAD DE UM DOCUMENTO COM O SEGUINTE CONTEXTO (USE-O SE ELE MENCIONAR 'DOCUMENTO' OU 'CAPÍTULO'):\n{document_context}\n" if document_context else ""

        sys_prompt = f"""
        Você é um Especialista em Extração de Intenções para Concursos.
        
        CONTEXTO ATUAL DA CONVERSA:
        {context_str}
        {doc_info}
        Sua tarefa: Identificar Tópico, Banca, Quantidade e gerar uma Query de Busca.
        Saída obrigatória: JSON estrito.
        
        REGRAS PARA O CAMPO 'topic' (IMPORTANTE):
        1. Este campo será usado como TÍTULO no histórico do usuário.
        2. Seja conciso e direto. Não use frases completas.
        3. Exemplos de bons tópicos: "Linguagem Java", "Engenharia de Software", "Capítulo 6", "Direito Constitucional".
        4. Se o usuário pedir questões de um capítulo específico do documento, use "Capítulo X" como tópico.

        REGRAS PARA USO DO DOCUMENTO:
        1. Se o usuário pedir questões de um "capítulo", "seção" ou "página", VOCÊ DEVE OBRIGATORIAMENTE LER O CONTEXTO DO DOCUMENTO ACIMA para descobrir do que se trata.
        2. EXTRAIA OS ASSUNTOS REAIS. Por exemplo, se o contexto diz que o Capítulo 2 é sobre "Processos de Software e Scrum", o campo `topic` deve ser "Capítulo 2: Scrum".
        3. NUNCA coloque "capítulo 2" ou "seção 3" na sua `search_query`! O banco de dados vetorial NÃO SABE o que é capítulo 2. Coloque os ASSUNTOS (ex: "questões de concurso sobre processos de software, scrum, kanban").

        REGRAS PARA A QUERY DE BUSCA (search_query):
        1. Crie uma frase semanticamente rica para usar em um banco de dados vetorial. 
        2. Use palavras completas que descrevam o tema técnico ou da matéria.

        REGRAS DE SEGURANÇA (IMPORTANTE):
        1. O sistema é APENAS para questões de concursos/estudos.
        2. Se o usuário perguntar sobre culinária, piadas, futebol, ou falar abobrinha, retorne "topic": "INVALIDO".

        EXEMPLOS (FEW-SHOT):
        Input: "gere 4 questões sobre o capitulo 6" -> Output: {{"topic": "Questões do Capítulo 6", "limit": 4, "search_query": "questões de concurso sobre os temas do capítulo 6"}}
        Input: "questoes de java" -> Output: {{"topic": "Linguagem Java", "limit": 5, "search_query": "questões de concurso sobre a linguagem de programação Java"}}
        Input: "mais 5 da FGV" -> Output: {{"topic": "Histórico", "banca": "FGV", "limit": 5, "search_query": "questões de concurso da banca FGV"}}
        """

        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_text}
        ]

        try:
            response = self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=0, # Zero para manter a precisão do Few-Shot
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Erro LLM: {e}")
            return {"topic": "Geral", "limit": 5}