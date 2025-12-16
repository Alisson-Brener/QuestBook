import time
import pandas as pd
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.llm_agent import IntentParser

parser = IntentParser()

# Dataset Desafiador (Ground Truth)
dataset = [
    {"input": "gera ai", "expected": "Geral"},
    {"input": "quero treinar", "expected": "Geral"},
    {"input": "questoes sobre o que eu li", "expected": "Geral"}, # Contextual
    {"input": "quero questoes de java", "expected": "Java"},
    {"input": "banco de dados 5 questoes", "expected": "Banco de Dados"},
    {"input": "me ve 10 dificeis da fgv", "expected": "Geral"}, # Omissão de tópico
    {"input": "assunto de hoje", "expected": "Geral"},
    {"input": "perguntas de sql injection", "expected": "SQL Injection"},
]

results = []

print(f"🚀 INICIANDO BENCHMARK MULTI-TÉCNICA ({len(dataset)} casos)...\n")

for case in dataset:
    phrase = case["input"]
    expected = case["expected"]
    
    # Função auxiliar para rodar teste
    def run_test(tech_name, func):
        start = time.time()
        res = func(phrase)
        duration = time.time() - start
        topic = str(res.get("topic", "None")).strip()
        hit = 1 if topic.lower() == expected.lower() else 0
        return hit, duration

    # 1. Zero-Shot
    h1, t1 = run_test("Zero-Shot", parser.parse_technique_1_zeroshot)
    # 2. Persona
    h2, t2 = run_test("Persona", parser.parse_technique_2_persona)
    # 3. Few-Shot
    h3, t3 = run_test("Few-Shot", parser.parse_technique_3_fewshot)
    # 4. CoT
    h4, t4 = run_test("CoT", parser.parse_technique_4_cot)

    results.append({
        "Input": phrase,
        "T1 (Zero)": h1, "T1_Time": t1,
        "T2 (Pers)": h2, "T2_Time": t2,
        "T3 (Few)": h3, "T3_Time": t3,
        "T4 (CoT)": h4, "T4_Time": t4
    })

# Consolidação
df = pd.DataFrame(results)
summary = {
    "Técnica": ["1. Zero-Shot", "2. Persona", "3. Few-Shot", "4. CoT + Few-Shot"],
    "Acurácia (%)": [
        df["T1 (Zero)"].mean() * 100,
        df["T2 (Pers)"].mean() * 100,
        df["T3 (Few)"].mean() * 100,
        df["T4 (CoT)"].mean() * 100
    ],
    "Latência (s)": [
        df["T1_Time"].mean(),
        df["T2_Time"].mean(),
        df["T3_Time"].mean(),
        df["T4_Time"].mean()
    ]
}

df_summary = pd.DataFrame(summary)
print("\nRESUMO FINAL:")
print(df_summary.to_string(index=False))

# Salva CSV para o gerador de gráficos ler
df_summary.to_csv("dados_benchmark.csv", index=False)
print("\nDados salvos em 'dados_benchmark.csv'")