import React, { useState } from "react";
import axios from "axios";
import "./SearchAudit.css";

const API_URL = "http://localhost:8000";

export default function SearchAudit({ sessionData, onSaveResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(sessionData?.questions || []);
  const [topic, setTopic] = useState(sessionData?.topic || "");
  const [evaluations, setEvaluations] = useState(sessionData?.evaluations || {});
  const [submitLoading, setSubmitLoading] = useState(false);

  // Sincroniza dados quando a sessão ativa muda no pai
  React.useEffect(() => {
    if (sessionData) {
      setQuestions(sessionData.questions || []);
      setTopic(sessionData.topic || "");
      setEvaluations(sessionData.evaluations || {});
    } else {
      setQuestions([]);
      setTopic("");
      setEvaluations({});
      setQuery("");
    }
  }, [sessionData]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/student/chat_questions`, {
        user_message: query,
        session_id: "audit_session"
      });
      const newQuestions = res.data.questions || [];
      const newTopic = res.data.topic || "";
      
      setQuestions(newQuestions);
      setTopic(newTopic);
      setEvaluations({});

      // Notifica o pai para salvar no histórico
      if (onSaveResults) {
        onSaveResults({ questions: newQuestions, topic: newTopic, evaluations: {} });
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar questões.");
    } finally {
      setLoading(false);
    }
  };

  const handleEvalChange = (qId, field, value) => {
    const updatedEvals = {
      ...evaluations,
      [qId]: {
        ...evaluations[qId],
        [field]: value
      }
    };
    setEvaluations(updatedEvals);
    
    // Notifica o pai para manter as avaliações no histórico
    if (onSaveResults) {
      onSaveResults({ questions, topic, evaluations: updatedEvals });
    }
  };

  const handleEditEvaluation = (qId) => {
    const updatedEvals = {
      ...evaluations,
      [qId]: { ...evaluations[qId], isSaved: false }
    };
    setEvaluations(updatedEvals);
    
    // Notifica o pai para manter a sincronia no histórico
    if (onSaveResults) {
      onSaveResults({ questions, topic, evaluations: updatedEvals });
    }
  };

  const handleSaveSingleEvaluation = async (qId) => {
    const evalData = evaluations[qId];
    if (!evalData || evalData.relevance_score === undefined) {
      alert("Por favor, selecione uma nota de relevância antes de salvar.");
      return;
    }

    const singleEval = {
      query: topic || query,
      question_id: parseInt(qId),
      relevance_score: evalData.relevance_score,
      is_flawed: evalData.is_flawed || false,
      feedback: evalData.feedback || ""
    };

    setSubmitLoading(qId); // Usando o qId para indicar qual está salvando
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/teachers/audit_evaluate`, { evaluations: [singleEval] }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Marca como salvo no estado local
      const updatedEvals = {
        ...evaluations,
        [qId]: { ...evalData, isSaved: true }
      };
      setEvaluations(updatedEvals);

      // Sincroniza com o histórico do pai
      if (onSaveResults) {
        onSaveResults({ questions, topic, evaluations: updatedEvals });
      }
      
      alert("Avaliação da questão salva com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar avaliação.");
    } finally {
      setSubmitLoading(null);
    }
  };

  const handleSubmitEvaluations = async () => {
    // Mantendo para compatibilidade ou salvar pendentes
    const evalList = Object.keys(evaluations)
      .filter(qId => !evaluations[qId].isSaved)
      .map(qId => ({
        query: topic || query,
        question_id: parseInt(qId),
        relevance_score: evaluations[qId].relevance_score || 3,
        is_flawed: evaluations[qId].is_flawed || false,
        feedback: evaluations[qId].feedback || ""
      }));

    if (evalList.length === 0) {
      alert("Nenhuma nova avaliação para salvar.");
      return;
    }

    setSubmitLoading("all");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/teachers/audit_evaluate`, { evaluations: evalList }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedEvals = { ...evaluations };
      evalList.forEach(e => {
        updatedEvals[e.question_id] = { ...updatedEvals[e.question_id], isSaved: true };
      });
      setEvaluations(updatedEvals);

      if (onSaveResults) {
        onSaveResults({ questions, topic, evaluations: updatedEvals });
      }

      alert("Todas as avaliações pendentes foram salvas!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar avaliações.");
    } finally {
      setSubmitLoading(null);
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

                <div className="q-body">
                  <div dangerouslySetInnerHTML={{ __html: q.enunciado || "Sem enunciado" }} />
                  
                  {q.alternativas && Object.keys(q.alternativas).length > 0 && (
                    <div className="audit-alts-container">
                      <strong className="audit-alts-title">Alternativas:</strong>
                      {Object.entries(q.alternativas).filter(([_, texto]) => texto && texto.trim()).map(([letra, texto]) => (
                        <div key={letra} className={`audit-alt-item ${q.gabarito === letra ? "correct" : ""}`}>
                          <div className="audit-alt-content">
                            <strong>{letra}) </strong>
                            <span dangerouslySetInnerHTML={{ __html: texto }} />
                          </div>
                          {q.gabarito === letra && <span className="audit-alt-badge">✓ Gabarito</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {(!q.alternativas || Object.keys(q.alternativas).length === 0) && q.gabarito && (
                    <div className="audit-gabarito-box">
                      <strong>Gabarito: </strong> {q.gabarito}
                    </div>
                  )}
                        <div className={`audit-eval-container ${evaluations[q.id]?.isSaved ? "is-saved" : ""}`}>
                  <div className="audit-eval-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h4 className="audit-eval-title" style={{ margin: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      Sua Avaliação
                    </h4>
                    {evaluations[q.id]?.isSaved && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button 
                          onClick={() => handleEditEvaluation(q.id)}
                          style={{ 
                            background: "rgba(255, 255, 255, 0.05)", 
                            color: "rgba(255, 255, 255, 0.6)", 
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            padding: "4px 12px", 
                            borderRadius: "6px", 
                            fontSize: "0.75rem", 
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            width: "auto",
                            margin: 0
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "rgba(107, 92, 255, 0.1)";
                            e.currentTarget.style.color = "#9b8aff";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                            e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
                          }}
                        >
                          Editar Avaliação
                        </button>
                        <span className="saved-badge" style={{ 
                          background: "rgba(46, 204, 113, 0.2)", 
                          color: "#2ecc71", 
                          padding: "4px 12px", 
                          borderRadius: "20px", 
                          fontSize: "0.75rem", 
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          AVALIAÇÃO SALVA
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="audit-eval-controls">
                    <div className="audit-relevance-wrapper">
                      <label>Relevância da Busca:</label>
                      <select
                        value={evaluations[q.id]?.relevance_score || ""}
                        onChange={(e) => handleEvalChange(q.id, "relevance_score", parseInt(e.target.value))}
                        className="chat-input audit-select"
                        disabled={evaluations[q.id]?.isSaved}
                      >
                        <option value="" disabled>Selecione uma nota...</option>
                        <option value="1">1 - Totalmente Irrelevante</option>
                        <option value="2">2 - Pouco Relevante</option>
                        <option value="3">3 - Neutro</option>
                        <option value="4">4 - Relevante</option>
                        <option value="5">5 - Muito Relevante / Perfeita</option>
                      </select>
                    </div>

                    <div 
                      className={`audit-ban-wrapper ${evaluations[q.id]?.is_flawed ? "banned" : ""} ${evaluations[q.id]?.isSaved ? "disabled" : ""}`} 
                      onClick={() => !evaluations[q.id]?.isSaved && handleEvalChange(q.id, "is_flawed", !evaluations[q.id]?.is_flawed)}
                      style={evaluations[q.id]?.isSaved ? { opacity: 0.6, cursor: "default" } : {}}
                    >
                      <input 
                        type="checkbox" 
                        id={`flawed-${q.id}`}
                        checked={evaluations[q.id]?.is_flawed || false}
                        onChange={(e) => handleEvalChange(q.id, "is_flawed", e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="audit-ban-checkbox"
                        disabled={evaluations[q.id]?.isSaved}
                      />
                      <label htmlFor={`flawed-${q.id}`} className="audit-ban-label">
                        Inativar Questão (Erro de Gabarito / Formatação)
                      </label>
                    </div>
                  </div>

                  <textarea
                    placeholder="Deixe um feedback opcional (ex: Gabarito errado, questão mal formatada, fora do escopo...)"
                    value={evaluations[q.id]?.feedback || ""}
                    onChange={(e) => handleEvalChange(q.id, "feedback", e.target.value)}
                    className="chat-input audit-textarea"
                    disabled={evaluations[q.id]?.isSaved}
                  />

                  {!evaluations[q.id]?.isSaved && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "15px" }}>
                      <button 
                        className="audit-save-btn" 
                        onClick={() => handleSaveSingleEvaluation(q.id)}
                        disabled={submitLoading === q.id || !evaluations[q.id]?.relevance_score}
                        style={{ padding: "10px 24px", fontSize: "0.9rem" }}
                      >
                        {submitLoading === q.id ? "Salvando..." : "Salvar Esta Avaliação"}
                      </button>
                    </div>
                  )}
                </div>

                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {!loading && questions.length === 0 && query && (
        <p className="audit-empty-msg">Nenhuma questão encontrada para esta busca.</p>
      )}
    </div>
  );
}
