from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
from pypdf import PdfReader
from io import BytesIO
from backend.llm_agent import IntentParser
from pydantic import BaseModel

# Importar módulos internos do projeto
from backend.database import engine, SessionLocal, Base, get_db
from backend import models
from backend.ai_search import QuestSearchEngine

# --- Inicialização ---

# 1. Cria as tabelas no banco de dados automaticamente (se não existirem)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="QuestBook API")

# 2. Variável global da IA
ai_engine: QuestSearchEngine = None
intent_parser: IntentParser = None

@app.on_event("startup")
async def startup_event():
    global ai_engine, intent_parser
    try:
        ai_engine = QuestSearchEngine()
        intent_parser = IntentParser() # <--- Inicializa o agente
        print("✅ Sistemas de IA (Busca + LLM) carregados!")
    except Exception as e:
        print(f"⚠️ Erro ao carregar IA: {e}")

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"status": "QuestBook API Online", "ai_ready": ai_engine is not None}

# RF-01: Upload e Processamento REAL
@app.post("/upload_document")
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db) # Injeta a conexão com o banco
):
    """
    1. Recebe o PDF.
    2. Extrai o texto.
    3. Salva no PostgreSQL (Documento e Capítulo).
    4. Chama a IA para buscar questões.
    5. Salva as sugestões no PostgreSQL.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos .pdf são permitidos.")

    print(f"📄 Recebendo arquivo: {file.filename}...")

    # 1. Ler o PDF e extrair texto
    try:
        # Lê o arquivo da memória
        pdf_bytes = await file.read()
        reader = PdfReader(BytesIO(pdf_bytes))
        
        # Extrai texto de todas as páginas (simplificado: considera tudo um capítulo só por enquanto)
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"
            
        if len(full_text) < 50:
            raise HTTPException(status_code=400, detail="O PDF parece estar vazio ou é uma imagem escaneada.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler PDF: {str(e)}")

    # 2. Salvar Documento no Banco (Tabela 'documents')
    # (Como não temos login ainda, usamos user_id=1 fixo ou NULL se permitir)
    db_document = models.Document(filename=file.filename, user_id=None) 
    db.add(db_document)
    db.commit()
    db.refresh(db_document) # Recarrega para pegar o ID gerado

    # 3. Salvar Capítulo no Banco (Tabela 'chapters')
    # (Por enquanto, tratamos o PDF inteiro como 'Capítulo Único')
    db_chapter = models.Chapter(
        document_id=db_document.id,
        title=f"Conteúdo Completo de {file.filename}",
        text_content=full_text
    )
    db.add(db_chapter)
    db.commit()
    db.refresh(db_chapter)

    # 4. Chamar a IA (Busca Semântica)
    questions_found = 0
    if ai_engine:
        print("🧠 Chamando IA para buscar questões relevantes...")
        # Busca as 10 melhores questões
        results = ai_engine.search_relevant_questions(full_text, limit=10)
        
        for res in results:
            # Regra de Negócio: Auto-aprovar se confiança > 0.7 (exemplo)
            status = "APROVADO_IA" if res['confidence'] > 0.7 else "PENDENTE"
            
            # 5. Salvar Sugestão no Banco (Tabela 'suggested_questions')
            db_suggestion = models.SuggestedQuestion(
                chapter_id=db_chapter.id,
                external_question_id=res['external_id'],
                confidence_score=res['confidence'],
                status=status
            )
            db.add(db_suggestion)
            questions_found += 1
        
        db.commit()

    return {
        "filename": file.filename,
        "document_id": db_document.id,
        "chapter_id": db_chapter.id,
        "ai_processed": ai_engine is not None,
        "questions_found": questions_found,
        "detail": "Upload e processamento concluídos com sucesso!"
    }

# RF-05: Listagem REAL (Lendo do Banco)
@app.get("/chapters/{chapter_id}/questions")
async def get_chapter_questions(chapter_id: int, db: Session = Depends(get_db)):
    """
    Busca no PostgreSQL as questões sugeridas para este capítulo.
    """
    # Busca no banco
    suggestions = db.query(models.SuggestedQuestion)\
        .filter(models.SuggestedQuestion.chapter_id == chapter_id)\
        .order_by(models.SuggestedQuestion.confidence_score.desc())\
        .all()

    return {
        "chapter_id": chapter_id,
        "total": len(suggestions),
        "questions": suggestions
    }

# Modelo para receber o pedido do chat
class ChatRequest(BaseModel):
    user_message: str      # Ex: "Quero 10 questões da FGV sobre o cap 1"
    document_id: int = None # Opcional: se quiser filtrar por um livro específico

@app.post("/chat_questions")
async def chat_with_questbook(request: ChatRequest, db: Session = Depends(get_db)):
    """
    O endpoint MÁGICO.
    1. Recebe frase natural.
    2. LLM entende a intenção.
    3. Busca Semântica encontra as questões.
    4. Retorna tudo estruturado.
    """
    if not intent_parser or not ai_engine:
        raise HTTPException(status_code=503, detail="Sistemas de IA indisponíveis.")

    print(f"💬 Usuário disse: '{request.user_message}'")

    # 1. ENTENDER (LLM)
    parsed_intent = intent_parser.parse_user_prompt(request.user_message)
    print(f"🤖 Intenção extraída: {parsed_intent}")

    topic = parsed_intent.get("topic", "Geral")
    limit = parsed_intent.get("limit", 10)
    
    # Nota: Filtros de 'banca' e 'dificuldade' exigem que a gente tenha salvo 
    # esses metadados no ChromaDB durante a indexação. 
    # Por enquanto, vamos usar o 'topic' para a busca semântica principal.

    # 2. BUSCAR (ChromaDB)
    # Aqui a gente usa o 'topic' que a LLM extraiu (ex: "testes de caixa preta")
    results = ai_engine.search_relevant_questions(topic, limit=limit)

    # 3. SALVAR SUGESTÕES (Opcional, se quiser manter histórico)
    # ... (código de salvar no banco igual ao upload) ...

    return {
        "user_message": request.user_message,
        "ai_understanding": parsed_intent, # Mostra pro usuário o que a IA entendeu
        "results": results
    }