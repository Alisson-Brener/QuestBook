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

    def _call_llm(self, messages, temp=0):
        try:
            response = self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=temp,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except:
            return {"topic": "Geral", "error": "failed"}

    # --- TÉCNICA 1: ZERO-SHOT PURO (Baseline) ---
    def parse_technique_1_zeroshot(self, user_text: str):
        prompt = f"Retorne um JSON com topic, limit, banca, dificuldade para esta frase: '{user_text}'"
        return self._call_llm([{"role": "user", "content": prompt}])

    # --- TÉCNICA 2: ROLE-PLAYING (Persona) ---
    def parse_technique_2_persona(self, user_text: str):
        sys = """Você é um Especialista em Concursos Públicos. 
        Sua tarefa é identificar o que o estudante quer estudar.
        Retorne JSON com topic, limit, banca, dificuldade."""
        return self._call_llm([
            {"role": "system", "content": sys},
            {"role": "user", "content": user_text}
        ])

    # --- TÉCNICA 3: FEW-SHOT (Exemplos, sem raciocínio) ---
    def parse_technique_3_fewshot(self, user_text: str):
        sys = """Extraia entidades em JSON. Siga os exemplos:
        Input: "questoes de java" -> {"topic": "Java", "limit": 10}
        Input: "gera ai" -> {"topic": "Geral", "limit": 10}
        Input: "5 da fgv" -> {"topic": "Geral", "banca": "FGV", "limit": 5}"""
        return self._call_llm([
            {"role": "system", "content": sys},
            {"role": "user", "content": user_text}
        ])

    # --- TÉCNICA 4: CoT + FEW-SHOT (Avançada) ---
    def parse_technique_4_cot(self, user_text: str):
        sys = """Você é um orquestrador. Pense passo a passo antes de responder.
        1. Identifique Tópicos explícitos. Se não houver, use 'Geral'.
        2. Identifique Bancas e Números.
        3. Cuidado com ambiguidades (ex: 'gera ai' = Geral).
        
        EXEMPLOS:
        User: "gera ai"
        Thought: Usuário vago. Sem tópico. Fallback para Geral.
        JSON: {"topic": "Geral", "limit": 10}

        User: "banco de dados 5 questoes"
        Thought: Tópico explícito 'banco de dados'. Limite 5.
        JSON: {"topic": "Banco de Dados", "limit": 5}
        
        Retorne APENAS o JSON final."""
        return self._call_llm([
            {"role": "system", "content": sys},
            {"role": "user", "content": user_text}
        ])

    # O sistema oficial usa a melhor (Técnica 4)
    def parse_user_prompt(self, user_text: str):
        return self.parse_technique_3_fewshot(user_text)