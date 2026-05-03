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

def test_chat_questions_rejects_low_confidence(client, mock_ai_services, db_session):
    """Testa se questões com confiança < 0.65 são rejeitadas"""
    mock_parser, mock_engine = mock_ai_services
    
    # Configura o mock do ChromaDB para retornar uma questão com baixa confiança
    mock_engine.search_relevant_questions.return_value = [
        {
            "external_id": 102,
            "confidence": 0.50, # < 0.65 (Rejeitado)
            "enunciado": "Questão de baixa qualidade",
            "metadata": {"banca": "CESPE", "ano": 2021}
        }
    ]
    
    response = client.post(
        "/student/chat_questions", 
        json={"user_message": "Me dê questões difíceis"}
    )
    
    assert response.status_code == 200
    data = response.json()
    # Deve retornar a mensagem de sistema indicando que não encontrou questões com qualidade
    assert isinstance(data, list)
    assert data[0]["id"] == -1
    assert "qualidade/correlação suficiente" in data[0]["enunciado"]

def test_chat_questions_excludes_answered_questions(client, mock_ai_services, db_session):
    """Testa se questões já respondidas pelo usuário (UserAnswer) não são retornadas"""
    from backend.models.all_models import QuestaoLegada, UserAnswer, User
    mock_parser, mock_engine = mock_ai_services
    
    # Cria o usuário atual (mesmo ID retornado pelo mock do get_optional_current_user: 1)
    # Nota: a fixture test_user já cria o usuário com ID 1, mas não está salva no DB de testes local dessa sessão
    db_user = User(id=1, name="Test User", email="test@test.com", password_hash="hash")
    db_session.add(db_user)
    
    # Adiciona 2 questões
    q1 = QuestaoLegada(id=201, enunciado="Questão Inédita", alternativa_a="A", gabarito="A")
    q2 = QuestaoLegada(id=202, enunciado="Questão Já Respondida", alternativa_a="A", gabarito="B")
    db_session.add_all([q1, q2])
    
    # Registra que o usuário já respondeu a questão 202
    answer = UserAnswer(user_id=1, question_id=202, selected_option="B", is_correct=1, topic="Geral")
    db_session.add(answer)
    db_session.commit()
    
    # Mock do banco vetorial retornando ambas
    mock_engine.search_relevant_questions.return_value = [
        {
            "external_id": 201,
            "confidence": 0.90,
            "enunciado": "Questão Inédita",
            "metadata": {"banca": "FGV", "ano": 2022}
        },
        {
            "external_id": 202,
            "confidence": 0.85,
            "enunciado": "Questão Já Respondida",
            "metadata": {"banca": "FGV", "ano": 2022}
        }
    ]
    
    response = client.post(
        "/student/chat_questions", 
        json={"user_message": "questoes"}
    )
    
    assert response.status_code == 200
    data = response.json()
    questions = data.get("questions", [])
    
    # Só a 201 deve ser retornada!
    assert len(questions) == 1
    assert questions[0]["id"] == 201

