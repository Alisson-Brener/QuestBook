from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from io import BytesIO
from pypdf import PdfReader # Usando o pypdf moderno que você já usava

# --- Imports da Nova Estrutura ---
from backend.core.database import get_db, get_questions_db
from backend.models.all_models import QuestaoLegada, Document, Chapter, SuggestedQuestion
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

    # 4. Chamar a IA para Sugestões
    questions_found = 0
    if ai_engine:
        print("🧠 Chamando IA para buscar sugestões iniciais...")
        results = ai_engine.search_relevant_questions(full_text, limit=10)
        
        for res in results:
            status = "APROVADO_IA" if res['confidence'] > 0.7 else "PENDENTE"
            
            db_suggestion = SuggestedQuestion(
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
        "questions_found": questions_found,
        "detail": "Upload e processamento concluídos com sucesso!"
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

    # 1. IA define a intenção
    parsed_intent = intent_parser.parse_user_prompt(request.user_message, session_id=request.session_id)
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

    try:
        qtd_questoes = int(parsed_intent.get("limit", 5))
    except:
        qtd_questoes = 5
        
    if qtd_questoes > 30: qtd_questoes = 30

    limite_busca_vertorial = qtd_questoes * 3

    print(f"🤖 Tópico: {topic} | Banca: {banca_detectada}")

    # 2. Filtros e Busca Vetorial
    filtros = {}
    if banca_detectada and banca_detectada.lower() not in ["geral", "todas", "indiferente", "qualquer"]:
        filtros["banca"] = banca_detectada.upper()

    print(f"🔍 Filtros aplicados no Chroma: {filtros}")
    
    vetor_results = ai_engine.search_relevant_questions(
        topic, 
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
    if melhor_score < 0.5:
        print(f"⚠️ Resultados encontrados, mas confiança baixa ({melhor_score}). Descartando.")
        return [{
            "id": -1,
            "enunciado": f"Encontrei alguns resultados sobre '{topic}', mas eles parecem pouco relevantes (Confiança baixa). Tente ser mais específico no tema.",
            "alternativas": {},
            "gabarito": "N/A",
            "confidence": melhor_score,
            "metadados": {"tipo": "AVISO_SISTEMA"}
        }]

    final_results = unique_results[:qtd_questoes]

    # 3. Hidratação via ORM
    ids_encontrados = []
    for r in final_results:
        try:
            ids_encontrados.append(int(r['external_id']))
        except:
            continue
    
    # Busca no MySQL usando a classe QuestaoLegada
    questoes_mysql = db_questoes.query(QuestaoLegada).filter(
        QuestaoLegada.id.in_(ids_encontrados)
    ).all()

    # 4. Montagem da Resposta
    response_data = []
    
    for q_sql in questoes_mysql:
        # Recupera o score do vetor
        match_info = next(
            (item for item in final_results if str(item["external_id"]) == str(q_sql.id)), 
            None
        )
        score = match_info['confidence'] if match_info else 0
        
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
        
    return response_data