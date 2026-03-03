// src/components/QuestionList.jsx
import { useState } from "react"

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

  const handleSubmit = (qIndex, gabarito) => {
    setSubmitted((prev) => ({
      ...prev,
      [qIndex]: true,
    }))
  }

  return (
    <section className="results-area">
      <h3>Resultado da IA</h3>

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
                        onClick={() => handleSelect(index, letra)}
                        style={{
                          padding: "8px",
                          marginTop: "6px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "0.2s",
                          backgroundColor: background,
                          border: "1px solid #333",
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
                    onClick={() => handleSubmit(index, gabarito)}
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