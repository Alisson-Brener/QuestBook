// src/components/QuestionList.jsx
import { useState } from "react"
import axios from "axios"

export default function QuestionList({ chatResponse }) {
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submitted, setSubmitted] = useState({})

  if (!chatResponse) return null

  // chatResponse agora é um objeto de Chat: { id, title, messages: [...] }
  // O formato antigo era apenas o objeto da mensagem. Suportamos ambos para compatibilidade.
  const allMessages = chatResponse.messages || [chatResponse];

  const handleSelect = (msgIndex, qIndex, letra) => {
    const key = `${msgIndex}-${qIndex}`;
    setSelectedAnswers((prev) => ({
      ...prev,
      [key]: letra,
    }))
  }

  const handleSubmit = async (msgIndex, qIndex, questionData) => {
    const key = `${msgIndex}-${qIndex}`;
    const selected = selectedAnswers[key];
    if (!selected) return;

    const isCorrect = selected === questionData.gabarito;
    
    setSubmitted((prev) => ({
      ...prev,
      [key]: true,
    }));

    try {
      await axios.post("http://localhost:8000/student/answer", {
        question_id: questionData.id || 0,
        selected_option: selected,
        is_correct: isCorrect,
        topic: questionData.assunto || "Geral"
      });
    } catch (error) {
      console.error("Erro ao salvar resposta:", error);
    }
  }

  return (
    <section className="results-area">
      <div className="questions-list">
        {allMessages.map((msg, msgIndex) => {
          const questions = msg.results || msg.questions || msg.data || [];
          
          return (
            <div key={msgIndex} className="chat-interaction-block" style={{ marginBottom: "40px" }}>
              {allMessages.length > 1 && (
                <div className="interaction-header" style={{ marginBottom: "15px", padding: "10px", borderLeft: "4px solid #6b5cff", background: "rgba(107, 92, 255, 0.05)" }}>
                  <p style={{ margin: 0, fontWeight: "bold", fontSize: "0.9rem" }}>
                    {msg.chatMessage}
                  </p>
                </div>
              )}

              {Array.isArray(questions) && questions.length > 0 ? (
                questions.map((q, qIndex) => {
                  const alternativas = q.alternativas || {}
                  const gabarito = q.gabarito
                  const key = `${msgIndex}-${qIndex}`
                  const selected = selectedAnswers[key]
                  const isSubmitted = submitted[key]

                  return (
                    <div key={q.id || qIndex} className="question-card" style={{ marginBottom: "20px" }}>
                      
                      <div className="q-header">
                        {q.id && (
                          <span className="badge-id">ID: {q.id}</span>
                        )}
                        {q.metadados?.banca && (
                          <span className="badge-banca" style={{ marginLeft: "8px", background: "rgba(107, 92, 255, 0.2)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem" }}>
                            {q.metadados.banca} {q.metadados.ano ? `(${q.metadados.ano})` : ""}
                          </span>
                        )}
                      </div>

                      {/* ENUNCIADO */}
                      <div
                        className="q-body"
                        dangerouslySetInnerHTML={{
                          __html: q.enunciado || "Enunciado não disponível",
                        }}
                      />

                      {/* ALTERNATIVAS */}
                      <div style={{ marginTop: "12px" }}>
                        {Object.entries(alternativas).map(([letra, texto]) => {
                          const isSelected = selected === letra
                          const isCorrect = gabarito === letra

                          let background = "transparent"

                          if (isSubmitted) {
                            if (isCorrect) background = "rgba(46,204,113,0.2)"
                            else if (isSelected && !isCorrect)
                              background = "rgba(231,76,60,0.2)"
                          } else if (isSelected) {
                            background = "rgba(107,92,255,0.2)"
                          }

                          return (
                            <div
                              key={letra}
                              className="option-item"
                              onClick={() => handleSelect(msgIndex, qIndex, letra)}
                              style={{
                                padding: "8px",
                                marginTop: "6px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                transition: "0.2s",
                                backgroundColor: background,
                              }}
                            >
                              <strong>{letra}) </strong>
                              <span
                                dangerouslySetInnerHTML={{ __html: texto }}
                              />
                            </div>
                          )
                        })}
                      </div>

                      {/* BOTÃO ENVIAR */}
                      {!isSubmitted && (
                        <button
                          style={{ marginTop: "12px" }}
                          disabled={!selected}
                          onClick={() => handleSubmit(msgIndex, qIndex, q)}
                        >
                          Enviar Resposta
                        </button>
                      )}

                      {/* RESULTADO */}
                      {isSubmitted && (
                        <div style={{ marginTop: "10px", fontWeight: "bold" }}>
                          {selected === gabarito ? (
                            <span style={{ color: "#2ecc71" }}>
                              Resposta correta!
                            </span>
                          ) : (
                            <span style={{ color: "#e74c3c" }}>
                              Resposta incorreta.  
                              Alternativa correta: {gabarito}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <p>Nenhuma questão encontrada para essa solicitação.</p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}