import pytest
from unittest.mock import patch, MagicMock

@pytest.fixture
def mock_ai_services():
    """Mock the AI services (Groq and ChromaDB) for the integration tests"""
    with patch("backend.routers.student.intent_parser") as mock_parser, \
         patch("backend.routers.student.ai_engine") as mock_engine:
        
        # Configure IntentParser mock
        mock_parser.parse_user_prompt.return_value = {
            "topic": "Engenharia de Software",
            "limit": 5,
            "search_query": "questões de engenharia"
        }
        
        # Configure SearchEngine mock
        mock_engine.search_relevant_questions.return_value = [
            {
                "external_id": 101,
                "confidence": 0.85,
                "enunciado": "O que é Engenharia de Requisitos?",
                "metadata": {"banca": "CESPE", "ano": 2021}
            }
        ]
        
        yield mock_parser, mock_engine

def test_chat_questions_no_document(client, mock_ai_services, db_session):
    """Testa a rota de chat sem documento enviado"""
    
    # Inserimos uma questão correspondente no banco relacional Mock
    from backend.models.all_models import QuestaoLegada
    q = QuestaoLegada(id=101, enunciado="O que é Engenharia de Requisitos?", alternativa_a="A", gabarito="A")
    db_session.add(q)
    db_session.commit()

    response = client.post(
        "/student/chat_questions", 
        json={"user_message": "Me dê questões de Engenharia de Software"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert data["topic"] == "Engenharia de Software"
    assert len(data["questions"]) == 1
    assert data["questions"][0]["id"] == 101

def test_chat_questions_with_document_heuristics(client, mock_ai_services, db_session):
    """Testa a rota de chat quando o usuário referencia um documento e a heurística atua"""
    from backend.models.all_models import Document, Chapter
    
    # Prepara o banco com um documento mock
    doc = Document(filename="livro.pdf", user_id=1)
    db_session.add(doc)
    db_session.commit()
    
    # Cria o texto gigante com "capitulo 2" no meio
    text_content = ("Introdução" * 500) + " Início do Capitulo 2: Scrum e Kanban " + ("Fim" * 500)
    chapter = Chapter(document_id=doc.id, title="Teste", text_content=text_content)
    db_session.add(chapter)
    db_session.commit()

    mock_parser, mock_engine = mock_ai_services

    response = client.post(
        "/student/chat_questions", 
        json={
            "user_message": "10 questões do capitulo 2",
            "document_id": doc.id
        }
    )
    
    assert response.status_code == 200
    
    # Verifica se a heurística capturou corretamente e passou o contexto do documento
    # mock_parser.parse_user_prompt.assert_called() foi chamado? O que tinha no kwargs?
    call_kwargs = mock_parser.parse_user_prompt.call_args.kwargs
    assert "document_context" in call_kwargs
    assert call_kwargs["document_context"] is not None
    # Verifica se a fatia capturou a área correta ("Scrum e Kanban")
    assert "Scrum e Kanban" in call_kwargs["document_context"]
