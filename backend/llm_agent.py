import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("A chave GROQ_API_KEY não foi encontrada no arquivo .env!")

class IntentParser:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"

    def parse_user_prompt(self, user_text: str):
        """
        Pega a frase do usuário e transforma em parâmetros de busca (JSON).
        """
        system_prompt = """
        Você é um assistente especialista em extrair parâmetros de busca para um sistema de questões de concurso.
        Sua tarefa é ler o pedido do usuário e retornar APENAS um JSON estrito com os seguintes campos:
        - "topic": (string) O assunto principal ou tema que o usuário quer estudar. Se ele citar um capítulo (ex: "Capítulo 5"), use o contexto do capítulo se possível ou o número.
        - "limit": (int) Quantidade de questões pedidas. Se não especificado, padrão é 10.
        - "banca": (string ou null) A banca organizadora (ex: FGV, CESPE), se citada.
        - "dificuldade": (string ou null) A dificuldade (Fácil, Média, Difícil), se citada.
        
        Exemplo de Entrada: "Me vê 5 questões difíceis da FGV sobre testes de caixa preta"
        Exemplo de Saída JSON: {"topic": "testes de caixa preta", "limit": 5, "banca": "FGV", "dificuldade": "Difícil"}
        
        Responda APENAS O JSON. Sem markdown, sem explicações.
        """

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_text}
                ],
                model=self.model,
                temperature=0, # Zero criatividade, queremos precisão robótica
                response_format={"type": "json_object"} # Força saída JSON
            )
            
            # Extrai o texto da resposta
            json_str = response.choices[0].message.content
            return json.loads(json_str)

        except Exception as e:
            print(f"❌ Erro na LLM: {e}")
            # Fallback (Plano B): Se a LLM falhar, assume busca simples
            return {"topic": user_text, "limit": 10, "banca": None, "dificuldade": None}