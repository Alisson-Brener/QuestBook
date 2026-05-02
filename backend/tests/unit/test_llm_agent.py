import pytest
from unittest.mock import MagicMock
from backend.services.llm_agent import IntentParser

@pytest.fixture
def mock_groq(mocker):
    """Mocks the Groq client to avoid actual API calls."""
    mock_client = mocker.patch("backend.services.llm_agent.Groq")
    mock_instance = MagicMock()
    mock_client.return_value = mock_instance
    return mock_instance

def test_parse_user_prompt_basic(mock_groq):
    # Configura o retorno simulado da API
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"topic": "Engenharia de Software", "limit": 5, "search_query": "questões de prova sobre processos, metodologias e conceitos de engenharia de software"}'
    mock_groq.chat.completions.create.return_value = mock_response

    parser = IntentParser()
    
    # Executa a função
    result = parser.parse_user_prompt("Me dê 5 questões de engenharia de software")
    
    # Validações
    assert result.get("topic") == "Engenharia de Software"
    assert result.get("limit") == 5
    assert "engenharia de software" in result.get("search_query").lower()
    
    # Verifica se a API foi chamada
    mock_groq.chat.completions.create.assert_called_once()

def test_parse_user_prompt_invalido(mock_groq):
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"topic": "INVALIDO"}'
    mock_groq.chat.completions.create.return_value = mock_response

    parser = IntentParser()
    result = parser.parse_user_prompt("receita de bolo")
    
    assert result.get("topic") == "INVALIDO"

def test_parse_user_prompt_with_document_context(mock_groq):
    mock_response = MagicMock()
    # Simulando o comportamento esperado quando há contexto do documento (Capítulo 2 = Processos Ágeis)
    mock_response.choices[0].message.content = '{"topic": "Processos Ágeis", "limit": 10, "search_query": "questões sobre metodologias ágeis, scrum e xp"}'
    mock_groq.chat.completions.create.return_value = mock_response

    parser = IntentParser()
    doc_context = "O Capítulo 2 descreve os Processos Ágeis, Scrum e Extreme Programming."
    
    result = parser.parse_user_prompt("10 questões do capítulo 2", document_context=doc_context)
    
    assert result.get("topic") == "Processos Ágeis"
    assert "scrum" in result.get("search_query").lower()
