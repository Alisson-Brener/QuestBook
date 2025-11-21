from fastapi import FastAPI, File, UploadFile, HTTPException
from typing import List, Dict, Any

# Cria a instância principal da sua aplicação
app = FastAPI(
    title="QuestBook API",
    description="API Principal para o TCC QuestBook.",
    version="0.1.0"
)

# --- Endpoints Mockados ---
# "Mockado" significa que ele retorna dados falsos,
# apenas para que o frontend possa testar.

@app.get("/")
def read_root():
    """Endpoint raiz para verificar se a API está no ar."""
    return {"status": "QuestBook API está online!"}


# Tarefa 2.3 - Endpoint 1 (RF-01)
@app.post("/upload_document", tags=["Documentos"])
async def upload_document(file: UploadFile = File(...)):
    """
    Endpoint para o usuário (aluno/curador) fazer o upload de um PDF.
    
    (MOCKADO: Por enquanto, não processa o PDF, apenas simula o sucesso)
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Tipo de arquivo inválido. Por favor, envie um .pdf")

    # No futuro, aqui chamaremos o PyPDF2, salvaremos no BD,
    # e chamaremos a API de IA.
    
    print(f"Recebido arquivo (mock): {file.filename}")
    
    return {
        "filename": file.filename,
        "detail": "Arquivo recebido com sucesso. Processamento (mock) iniciado.",
        "mock_document_id": 1,
        "mock_chapters_found": ["Capítulo 1: Introdução", "Capítulo 2: Métricas"]
    }


# Tarefa 2.3 - Endpoint 2 (RF-05)
@app.get("/chapters/{chapter_id}/questions", tags=["Questões"])
async def get_chapter_questions(chapter_id: int):
    """
    Retorna as questões aprovadas (pela IA ou Curador) para um capítulo.
    
    (MOCKADO: Retorna dados falsos para simular o RF-05)
    """
    print(f"Buscando questões (mock) para o capítulo {chapter_id}")
    
    # Simulação de dados que viriam do nosso banco PostgreSQL
    # (tabela 'suggested_questions' + JOIN com banco do professor)
    
    mock_questions = [
        {
            "id": 1001,
            "enunciado": "O que é 'Complexidade Ciclomática'?",
            "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."],
            "status": "APROVADO_IA",
            "confidence": 0.98
        },
        {
            "id": 1002,
            "enunciado": "Qual métrica é usada para 'Pontos por Função'?",
            "alternativas": ["A) ...", "B) ...", "C) ...", "D) ..."],
            "status": "APROVADO_CURADOR",
            "confidence": 0.85
        }
    ]
    
    return {"chapter_id": chapter_id, "questions": mock_questions}

# --- Fim dos Endpoints ---

print("FastAPI app inicializado.")