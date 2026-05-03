import React, { useState } from "react";
import axios from "axios";
import "./SearchAudit.css";

const API_URL = "http://localhost:8000";

export default function SearchAudit() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState("");
  const [evaluations, setEvaluations] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/student/chat_questions`, {
        user_message: query,
        session_id: "audit_session"
      });
      setQuestions(res.data.questions || []);
      setTopic(res.data.topic || "");
      setEvaluations({});
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar questões.");
    } finally {
      setLoading(false);
    }
  };

  const handleEvalChange = (qId, field, value) => {
    setEvaluations(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        [field]: value
      }
    }));
  };

  const handleSubmitEvaluations = async () => {
    const evalList = Object.keys(evaluations).map(qId => ({
      query: topic || query,
      question_id: parseInt(qId),
      relevance_score: evaluations[qId].relevance_score || 3,
      feedback: evaluations[qId].feedback || ""
    }));

    if (evalList.length === 0) {
      alert("Nenhuma avaliação foi preenchida.");
      return;
    }

    setSubmitLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/teachers/audit_evaluate`, { evaluations: evalList }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Avaliações salvas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar avaliações.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="search-audit-container">
      <h2 className="search-audit-title">Auditoria de Buscas</h2>
      <p className="search-audit-desc">
        Simule pesquisas de alunos para testar a qualidade das questões retornadas pela IA. Avalie a relevância de cada questão para aprimorar o banco vetorial.
      </p>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite um tema (ex: 'Engenharia de Requisitos')"
          className="chat-input search-input"
          disabled={loading}
        />
        <button
          type="submit"
          className="search-submit-btn"
          disabled={loading || !query.trim()}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {questions.length > 0 && (
        <div className="audit-results">
          <h3>Resultados para: <span>{topic}</span></h3>

          <div className="questions-list">
            {questions.map((q, idx) => (
              <div key={q.id} className="question-card">
                <div className="q-header">
                  <span className="badge-id">Questão {idx + 1} (ID: {q.id})</span>
                  <span className="badge-banca" style={{ marginLeft: "8px", background: "rgba(107, 92, 255, 0.2)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem" }}>
                    Confiança IA: {(q.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="q-body" dangerouslySetInnerHTML={{ __html: q.enunciado || "Sem enunciado" }} />

                <div className="audit-eval-container">
                  <h4 className="audit-eval-title">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Sua Avaliação
                  </h4>

                  <div className="audit-eval-controls">
                    <label>Relevância:</label>
                    <select
                      value={evaluations[q.id]?.relevance_score || ""}
                      onChange={(e) => handleEvalChange(q.id, "relevance_score", parseInt(e.target.value))}
                      className="chat-input audit-select"
                    >
                      <option value="" disabled>Selecione uma nota...</option>
                      <option value="1">1 - Totalmente Irrelevante</option>
                      <option value="2">2 - Pouco Relevante</option>
                      <option value="3">3 - Neutro</option>
                      <option value="4">4 - Relevante</option>
                      <option value="5">5 - Muito Relevante / Perfeita</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Deixe um feedback opcional (ex: Gabarito errado, questão mal formatada, fora do escopo...)"
                    value={evaluations[q.id]?.feedback || ""}
                    onChange={(e) => handleEvalChange(q.id, "feedback", e.target.value)}
                    className="chat-input audit-textarea"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="audit-save-container">
            <button
              className="audit-save-btn"
              onClick={handleSubmitEvaluations}
              disabled={submitLoading || Object.keys(evaluations).length === 0}
            >
              {submitLoading ? "Salvando..." : "Salvar Avaliações"}
            </button>
          </div>
        </div>
      )}

      {!loading && questions.length === 0 && query && (
        <p className="audit-empty-msg">Nenhuma questão encontrada para esta busca.</p>
      )}
    </div>
  );
}
