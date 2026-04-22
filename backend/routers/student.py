from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from io import BytesIO
from pypdf import PdfReader # Usando o pypdf moderno que você já usava

# --- Imports da Nova Estrutura ---
from backend.core.database import get_db, get_questions_db
from backend.models.all_models import QuestaoLegada, Document, Chapter, SuggestedQuestion, UserAnswer
from backend.services.ai_search import QuestSearchEngine
# Importa a classe IntentParser de onde ela estiver (llm_agent ou intent_parser)
from backend.services.llm_agent import IntentParser 

router = APIRouter()

# --- Inicialização dos Serviços ---
# Instanciamos aqui para ficarem disponíveis para as rotas
print("🔄 Inicializando serviços de IA no Router...")
try:
    ai_engine = QuestSearchEngine()
    intent_parser = IntentParser()
    print("✅ Serviços Carregados!")
except Exception as e:
    print(f"⚠️ Erro ao carregar IA: {e}")
    ai_engine = None
    intent_parser = None

# --- Schemas ---
class ChatRequest(BaseModel):
    user_message: str
    document_id: int = None
    session_id: str = "anonimo"

class AnswerRequest(BaseModel):
    question_id: int
    selected_option: str
    is_correct: bool
    topic: str = "Geral"

# --- ROTA 1: UPLOAD (Lógica Restaurada) ---
# Mantive o nome original "/upload_document" para não quebrar o front
@router.post("/upload_document")
async def upload_document(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """
    Restauração da lógica original:
    1. Lê PDF. 2. Salva no Postgres. 3. Gera Sugestões.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos .pdf são permitidos.")

    print(f"📄 Recebendo arquivo: {file.filename}...")

    # 1. Ler o PDF
    try:
        pdf_bytes = await file.read()
        reader = PdfReader(BytesIO(pdf_bytes))
        
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n"
            
        if len(full_text) < 50:
            raise HTTPException(status_code=400, detail="PDF vazio ou ilegível.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler PDF: {str(e)}")

    # 2. Salvar Documento (PostgreSQL)
    db_document = Document(filename=file.filename, user_id=None) 
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    # 3. Salvar Capítulo (PostgreSQL)
    db_chapter = Chapter(
        document_id=db_document.id,
        title=f"Conteúdo Completo de {file.filename}",
        text_content=full_text
    )
    db.add(db_chapter)
    db.commit()
    db.refresh(db_chapter)

    # 4. A IA para sugestões automáticas foi removida daqui a pedido do usuário
    # para que o upload seja rápido e o usuário possa escolher o que quer via chat.

    return {
        "filename": file.filename,
        "document_id": db_document.id,
        "chapter_id": db_chapter.id,
        "questions_found": 0,
        "results": [{
            "id": -1,
            "enunciado": f"O documento '{file.filename}' foi lido e salvo com sucesso! Agora você pode me pedir questões sobre os assuntos abordados nele (ex: 'Me dê questões sobre o tópico X').",
            "alternativas": {},
            "gabarito": "N/A",
            "confidence": 1.0,
            "metadados": {"tipo": "AVISO_SISTEMA"}
        }], 
        "detail": "Upload concluído com sucesso!"
    }

# --- ROTA 2: CHAT (Lógica Restaurada) ---
@router.post("/chat_questions")
async def chat_with_questbook(
    request: ChatRequest, 
    db_app: Session = Depends(get_db),           
    db_questoes: Session = Depends(get_questions_db) # MySQL
):
    print(f"💬 Usuário: '{request.user_message}'")

    if not ai_engine or not intent_parser:
        raise HTTPException(status_code=503, detail="IA ainda está carregando...")

    # Recupera contexto do documento se fornecido
    doc_context = None
    if request.document_id:
        chapter = db_app.query(Chapter).filter(Chapter.document_id == request.document_id).first()
        if chapter and chapter.text_content:
            # Pegamos os primeiros 4000 caracteres (geralmente contém sumário, introdução) para o LLM entender do que se trata o documento
            doc_context = chapter.text_content[:4000]

    # 1. IA define a intenção, agora podendo ler um trecho do PDF
    parsed_intent = intent_parser.parse_user_prompt(
        request.user_message, 
        session_id=request.session_id, 
        document_context=doc_context
    )
    topic = parsed_intent.get("topic", "Geral")

    if topic == "INVALIDO":
        return [{
            "id": -1,
            "enunciado": "Eu sou um assistente de estudos. Por favor, faça perguntas relacionadas a matérias ou concursos.",
            "alternativas": {},
            "gabarito": "N/A",
            "confidence": 1.0, # Confiança total que é inválido
            "metadados": {"tipo": "AVISO_SISTEMA"}
        }]
    banca_detectada = parsed_intent.get("banca")
    search_query = parsed_intent.get("search_query", topic) # Usa o topic puro como fallback

    try:
        qtd_questoes = int(parsed_intent.get("limit", 5))
    except:
        qtd_questoes = 5
        
    if qtd_questoes > 30: qtd_questoes = 30

    limite_busca_vertorial = qtd_questoes * 3

    print(f"🤖 Tópico: {topic} | Banca: {banca_detectada} | Busca Otimizada: {search_query}")

    # 2. Filtros e Busca Vetorial
    filtros = {}
    if banca_detectada and banca_detectada.lower() not in ["geral", "todas", "indiferente", "qualquer"]:
        filtros["banca"] = banca_detectada.upper()

    print(f"🔍 Filtros aplicados no Chroma: {filtros}")
    
    vetor_results = ai_engine.search_relevant_questions(
        search_query, # <-- Agora busca usando o texto rico, não apenas o Tópico 
        filters=filtros, 
        limit=limite_busca_vertorial
    )

    seen_ids = set()
    unique_results = []
    for r in vetor_results:
        q_id = r['external_id']
        if q_id not in seen_ids:
            seen_ids.add(q_id)
            unique_results.append(r)
    
    if not unique_results:
        print("⚠️ Busca vetorial retornou vazia.")
        # Retornamos uma "questão falsa" que na verdade é um aviso
        return [{
            "id": -1,
            "enunciado": f"Desculpe, não encontrei questões sobre '{topic}' com os filtros aplicados (Banca: {banca_detectada or 'Todas'}). Tente outro termo.",
            "alternativas": {},
            "gabarito": "N/A",
            "confidence": 0.0,
            "metadados": {"tipo": "AVISO_SISTEMA"}
        }]

    melhor_score = unique_results[0]['confidence']
    # Threshold de 0.4 representa 40% de match absoluto matemático, que é um bom corte para L2 normalizado
    if melhor_score < 0.4:
        print(f"⚠️ Resultados encontrados, mas confiança baixa ({melhor_score}). Descartando.")
        return [{
            "id": -1,
            "enunciado": f"Encontrei alguns resultados, mas eles parecem pouco relevantes para a busca. Tente ser mais específico.",
            "alternativas": {},
            "gabarito": "N/A",
            "confidence": melhor_score,
            "metadados": {"tipo": "AVISO_SISTEMA"}
        }]

    # 3. Hidratação via ORM (Recuperando de todos os candidatos sem limitar prematuramente)
    ids_encontrados = []
    for r in unique_results:
        try:
            ids_encontrados.append(int(r['external_id']))
        except:
            continue
    
    # Busca GERAL no MySQL usando a classe QuestaoLegada
    questoes_mysql = db_questoes.query(QuestaoLegada).filter(
        QuestaoLegada.id.in_(ids_encontrados)
    ).all()

    # Mapeamento para acesso O(1) rápido
    mapa_mysql = {q.id: q for q in questoes_mysql}

    # 4. Montagem da Resposta na exata ordem devolvida pela IA (por relevância)
    response_data = []
    
    for vetor_result in unique_results:
        try:
            q_id = int(vetor_result['external_id'])
        except:
            continue
            
        # Verifica se o ID vetorial ainda existe no Banco Relacional
        if q_id in mapa_mysql:
            q_sql = mapa_mysql[q_id]
            score = vetor_result['confidence']
            
            response_data.append({
                "id": q_sql.id,
                "enunciado": q_sql.enunciado,
                "alternativas": {
                    "A": q_sql.alternativa_a,
                    "B": q_sql.alternativa_b,
                    "C": q_sql.alternativa_c,
                    "D": q_sql.alternativa_d,
                    "E": q_sql.alternativa_e
                },
                "gabarito": q_sql.gabarito,
                "confidence": score,
                "metadados": {
                    "banca": q_sql.banca,
                    "ano": q_sql.ano
                }
            })
            
            # Garante que atendeu EXATAMENTE à cota exigida, driblando 'buracos' de DB
            if len(response_data) >= qtd_questoes:
                break
        
    return response_data

# --- NOVAS ROTAS DE ESTATÍSTICAS ---

@router.post("/answer")
async def record_answer(request: AnswerRequest, db: Session = Depends(get_db)):
    # Mock user_id = 1
    db_answer = UserAnswer(
        user_id=1,
        question_id=request.question_id,
        selected_option=request.selected_option,
        is_correct=1 if request.is_correct else 0,
        topic=request.topic
    )
    db.add(db_answer)
    db.commit()
    return {"status": "success"}

@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    user_id = 1
    answers = db.query(UserAnswer).filter(UserAnswer.user_id == user_id).all()
    
    total = len(answers)
    if total == 0:
        return {
            "summary": {
                "total_answered": 0,
                "correct_answers": 0,
                "incorrect_answers": 0,
                "overall_accuracy": 0
            },
            "topic_performance": [],
            "recent_activity": []
        }

    correct = sum(1 for a in answers if a.is_correct == 1)
    
    topics = {}
    for a in answers:
        t = a.topic or "Geral"
        if t not in topics: topics[t] = {"total": 0, "correct": 0}
        topics[t]["total"] += 1
        if a.is_correct == 1: topics[t]["correct"] += 1
            
    topic_performance = [{
        "topic": t,
        "accuracy": round((d["correct"] / d["total"]) * 100, 1),
        "total": d["total"]
    } for t, d in topics.items()]
        
    recent = [{
        "date": a.answered_at.strftime("%d/%m"),
        "is_correct": bool(a.is_correct)
    } for a in answers[-10:]]
    
    return {
        "summary": {
            "total_answered": total,
            "correct_answers": correct,
            "incorrect_answers": total - correct,
            "overall_accuracy": round((correct / total) * 100, 1)
        },
        "topic_performance": topic_performance,
        "recent_activity": recent
    }