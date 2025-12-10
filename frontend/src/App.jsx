import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  // Estados para controlar a tela
  const [file, setFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState("")
  const [chatMessage, setChatMessage] = useState("")
  const [chatResponse, setChatResponse] = useState(null)
  const [loading, setLoading] = useState(false)

  // 1. Função de Upload de PDF
  const handleUpload = async () => {
    if (!file) return alert("Selecione um arquivo primeiro!")
    
    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)
    try {
      // Ajuste a URL se sua API estiver em outra porta
      const res = await axios.post("http://127.0.0.1:8000/upload_document", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setUploadStatus(`✅ Sucesso! Documento ID: ${res.data.document_id} processado com IA.`)
    } catch (error) {
      console.error(error)
      setUploadStatus("❌ Erro ao enviar arquivo.")
    } finally {
      setLoading(false)
    }
  }

  // 2. Função de Chat com a IA
  const handleChat = async () => {
    if (!chatMessage) return
    
    setLoading(true)
    setChatResponse(null) // Limpa anterior
    try {
      const res = await axios.post("http://127.0.0.1:8000/chat_questions", {
        user_message: chatMessage
      })
      setChatResponse(res.data)
    } catch (error) {
      console.error(error)
      alert("Erro ao falar com a IA")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>📚 QuestBook <span className="tag">TCC Beta</span></h1>
        <p>Assistente de Estudos Inteligente com IA</p>
      </header>

      {/* BLOCO 1: UPLOAD */}
      <section className="card">
        <h2>1. Carregar Material de Estudo</h2>
        <div className="upload-box">
          <input 
            type="file" 
            accept=".pdf"
            onChange={(e) => setFile(e.target.files[0])} 
          />
          <button onClick={handleUpload} disabled={loading}>
            {loading ? "Processando..." : "📤 Enviar PDF para IA"}
          </button>
        </div>
        {uploadStatus && <p className="status-msg">{uploadStatus}</p>}
      </section>

      {/* BLOCO 2: CHAT */}
      <section className="card">
        <h2>2. Pedir Questões (Chat)</h2>
        <div className="chat-box">
          <textarea
            placeholder="Ex: Quero 5 questões difíceis da banca FGV sobre o capítulo 3..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            rows={3}
          />
          <button className="btn-primary" onClick={handleChat} disabled={loading}>
            {loading ? "🤖 IA Pensando..." : "🔍 Buscar Questões"}
          </button>
        </div>
      </section>

      {/* BLOCO 3: RESULTADOS */}
      {chatResponse && (
        <section className="results-area">
          <h3>🎯 Resultado da IA</h3>
          
          <div className="ai-debug">
            <strong>O que a IA entendeu:</strong> 
            <pre>{JSON.stringify(chatResponse.ai_understanding, null, 2)}</pre>
          </div>

          <div className="questions-list">
            {chatResponse.results.map((q) => (
              <div key={q.external_id} className="question-card">
                <div className="q-header">
                  <span className="badge-id">ID: {q.external_id}</span>
                  <span className="badge-score">Confiança IA: {(q.confidence * 100).toFixed(1)}%</span>
                </div>
                {/* Renderiza HTML que vem do banco (cuidado em produção, mas ok pra TCC) */}
                <div className="q-body" dangerouslySetInnerHTML={{ __html: q.enunciado }} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default App