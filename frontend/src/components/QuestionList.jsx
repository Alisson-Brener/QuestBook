// src/components/QuestionList.jsx
import { useState } from "react"
import axios from "axios"
export default function QuestionList({ chatResponse }) {
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [submitted, setSubmitted] = useState({})

  if (!chatResponse) return null

  const questions =
    chatResponse.results ||
    chatResponse.questions ||
    chatResponse.data ||
    []

  const handleSelect = (qIndex, letra) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex]: letra,
    }))
  }

  const handleSubmit = async (qIndex, questionData) => {
    const selected = selectedAnswers[qIndex];
    if (!selected) return;

    const isCorrect = selected === questionData.gabarito;
    
    setSubmitted((prev) => ({
      ...prev,
      [qIndex]: true,
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
        {Array.isArray(questions) && questions.length > 0 ? (
          questions.map((q, index) => {
            const alternativas = q.alternativas || {}
            const gabarito = q.gabarito
            const selected = selectedAnswers[index]
            const isSubmitted = submitted[index]

            return (
              <div key={q.id || index} className="question-card">
                
                <div className="q-header">
                  {q.id && (
                    <span className="badge-id">ID: {q.id}</span>
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
                  {Object.entries(alternativas).filter(([_, texto]) => texto && texto.trim()).map(([letra, texto]) => {
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
                        onClick={() => handleSelect(index, letra)}
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
                    onClick={() => handleSubmit(index, q)}
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
    </section>
  )
}