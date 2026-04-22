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
    def parse_user_prompt(self, user_text: str, session_id: str = None):
        
        # 1. Recupera Contexto
        context_str = self._get_context(session_id)
        
        # 2. Salva a mensagem atual (para a próxima vez)
        self._save_context(session_id, user_text)

        sys_prompt = f"""
        Você é um Especialista em Extração de Intenções para Concursos.
        
        CONTEXTO ATUAL (USE ISTO PARA RESOLVER AMBIGUIDADES):
        {context_str}

        Sua tarefa: Identificar Tópico, Banca, Quantidade e gerar uma Query de Busca.
        Saída obrigatória: JSON estrito.
        
        REGRAS DE MEMÓRIA:
        1. Se o usuário disser "mais 5" ou "agora da FGV", use o Tópico do histórico.
        2. Se o usuário mudar de assunto (ex: "agora fale de Java"), ignore o tópico do histórico.

        REGRAS PARA A QUERY DE BUSCA (search_query):
        1. Crie uma frase semanticamente rica para usar em um banco de dados vetorial. 
        2. Use palavras completas que descrevam o tema técnico ou da matéria. Por exemplo, se o usuário pedir "questões de java difíceis", a search_query ideal é "questões difíceis sobre a linguagem de programação Java, abrangendo tópicos avançados".

        REGRAS DE SEGURANÇA (IMPORTANTE):
        1. O sistema é APENAS para questões de concursos/estudos.
        2. Se o usuário perguntar sobre culinária, piadas, futebol, ou falar abobrinha, retorne "topic": "INVALIDO".

        EXEMPLOS:
        Input: "questoes de java" -> Output: {{"topic": "Java", "limit": 5, "search_query": "questões de concurso sobre a linguagem de programação Java"}}
        Input: "receita de miojo" -> Output: {{"topic": "INVALIDO"}}
        Input: "quem ganhou o jogo ontem" -> Output: {{"topic": "INVALIDO"}}

        EXEMPLOS (FEW-SHOT LEARNING):
        Input: "questoes de engenharia de software"
        Output: {{"topic": "Engenharia de Software", "limit": 5, "search_query": "questões de prova sobre processos, metodologias e conceitos de engenharia de software"}}

        Input: "quero 10 da banca cespe"
        Output: {{"topic": "Geral", "banca": "CESPE", "limit": 10, "search_query": "questões de múltipla escolha para concursos públicos da banca CESPE"}}

        Input: "mais 5 difíceis" (Considerando que o histórico era sobre Java)
        Output: {{"topic": "Java", "difficulty": "Difícil", "limit": 5, "search_query": "questões de nível de dificuldade alto sobre programação Java avançada"}}
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