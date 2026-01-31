import { useState } from 'react'
import axios from 'axios'
import './App.css'

// --- COMPONENTE NOVO: CARD DE QUESTÃO INTERATIVO ---
// Ele cuida da lógica de "Clicou -> Ficou Verde/Vermelho"
function QuestionCard({ question }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)

  const handleOptionClick = (letter) => {
    // Se já respondeu, não deixa mudar (opcional)
    if (selectedOption) return 

    setSelectedOption(letter)
    
    // Compara o que clicou com o gabarito que veio do banco
    // Remove espaços extras e garante maiúsculas para evitar erros bobos
    const gabaritoLimpo = question.gabarito?.trim().toUpperCase()
    const clicadoLimpo = letter.trim().toUpperCase()
    
    setIsCorrect(gabaritoLimpo === clicadoLimpo)
  }

  return (
    <div className="question-card">
      <div className="q-header">
        <span className="badge-id">ID: {question.id}</span>
        <span className="badge-banca">{question.metadados?.banca || "Banca Desconhecida"} ({question.metadados?.ano})</span>
        <span className="badge-score">Match IA: {(question.confidence * 100).toFixed(0)}%</span>
      </div>

      {/* ENUNCIADO */}
      <div className="q-body" dangerouslySetInnerHTML={{ __html: question.enunciado }} />

      {/* ALTERNATIVAS */}
      <div className="alternatives-list">
        {Object.entries(question.alternativas).map(([letra, texto]) => {
          // Lógica de cores
          let btnClass = "btn-option"
          if (selectedOption === letra) {
            btnClass += isCorrect ? " correct" : " wrong"
          } else if (selectedOption && letra === question.gabarito) {
            // Mostra a correta se o usuário errou (opcional)
            btnClass += " correct-reveal"
          }

          return (
            <button 
              key={letra} 
              className={btnClass} 
              onClick={() => handleOptionClick(letra)}
              disabled={!!selectedOption} // Desabilita após responder
            >
              <strong className="option-letter">{letra})</strong> 
              <span dangerouslySetInnerHTML={{ __html: texto }} />
            </button>
          )
        })}
      </div>

      {/* FEEDBACK FINAL */}
      {selectedOption && (
        <div className={`feedback-msg ${isCorrect ? "success" : "error"}`}>
          {isCorrect ? "🎉 Parabéns! Resposta Correta." : `❌ Errou! O gabarito é a letra ${question.gabarito}.`}
        </div>
      )}
    </div>
  )
}

// --- APP PRINCIPAL ---
function App() {
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState("")
  const [chatMessage, setChatMessage] = useState("")
  const [questions, setQuestions] = useState([]) // Mudei de chatResponse para questions (array direto)
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => "sessao_" + Math.random().toString(36).substring(2,9));

  // 1. Upload
  const handleUpload = async () => {
    if (!file) return alert("Selecione um arquivo primeiro!")
    const formData = new FormData()
    formData.append("file", file)
    setLoading(true)
    try {
      const res = await axios.post("http://127.0.0.1:8000/upload_document", formData)
      setUploadStatus(`✅ Documento ID: ${res.data.document_id} processado!`)
    } catch (error) {
      console.error(error)
      setUploadStatus("❌ Erro ao enviar arquivo.")
    } finally {
      setLoading(false)
    }
  }

  // 2. Chat (Busca Hidratada)
  const handleChat = async () => {
    if (!chatMessage) return
    setLoading(true)
    setQuestions([]) // Limpa anterior
    try {
      const res = await axios.post("http://127.0.0.1:8000/chat_questions", {
        user_message: chatMessage,
        session_id: sessionId
      })
      // O backend agora retorna uma Lista direta [], não mais um objeto { results: [] }
      setQuestions(res.data) 
    } catch (error) {
      console.error(error)
      alert("Erro ao buscar questões. Verifique se o backend está rodando.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>📚 QuestBook <span className="tag">TCC Demo</span></h1>
        <p>Validação de IA com Banco de Questões Real</p>
      </header>

      {/* ÁREA DE CONTROLES (LADO A LADO SE POSSÍVEL) */}
      <div className="controls-area">
        <section className="card">
          <h2>1. Upload de Contexto</h2>
          <div className="input-group">
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={handleUpload} disabled={loading}>
              {loading ? "..." : "⬆ Enviar PDF"}
            </button>
          </div>
          <small>{uploadStatus}</small>
        </section>

        <section className="card">
          <h2>2. O que você quer estudar?</h2>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Ex: engenharia de requisitos banca fgv" 
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            />
            <button className="btn-primary" onClick={handleChat} disabled={loading}>
              {loading ? "🔍 Buscando..." : "🔍 Buscar"}
            </button>
          </div>
        </section>
      </div>

      {/* ÁREA DE RESULTADOS */}
      <section className="results-area">
        {questions.length > 0 && (
          <h3>Encontramos {questions.length} questões baseadas no seu pedido:</h3>
        )}
        
        <div className="questions-list">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>

        {questions.length === 0 && !loading && chatMessage && (
           <p className="placeholder-text">Nenhuma questão encontrada ou aguardando busca...</p>
        )}
      </section>
    </div>
  )
}

export default App