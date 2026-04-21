// src/components/ChatQuestions.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

// Variáveis de configuração (Evitando "Magic Numbers")
const MAX_TEXTAREA_HEIGHT = 200;
const EXPANDED_HEIGHT_THRESHOLD = 44;

export default function ChatQuestions({ onNewQuestions }) {
  const [chatMessage, setChatMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${newHeight}px`;

    // Muda para "expanded" se o texto ultrapassar o limite de altura
    setIsExpanded(scrollHeight > EXPANDED_HEIGHT_THRESHOLD);
  };

  useEffect(() => {
    autoResize();
  }, [chatMessage]);

  const handleSend = async () => {
    if (!chatMessage.trim() || loading) return;

    setLoading(true);
    try {
      // Correção: Em projetos Vite, usamos import.meta.env em vez de process.env
      const apiUrl = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000";

      const res = await axios.post(`${apiUrl}/chat_questions`, {
        user_message: chatMessage,
      });

      onNewQuestions({
        chatMessage,
        results: res.data,
        ai_understanding: null,
      });

      setChatMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Erro na comunicação com a API:", err);
      // Dica Sênior: Substitua o alert por um componente de Toast (ex: react-toastify ou sonner)
      alert("Erro ao falar com a IA. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isButtonVisible = chatMessage.trim().length > 0 || loading;

  return (
    <div className="chat-input-container">
      <div className={`chat-input-wrapper ${isExpanded ? "expanded" : ""}`}>
        <textarea
          ref={textareaRef}
          id="chat-input-textarea"
          className="chat-input"
          placeholder="Busque questões sobre o tema desejado..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={1}
          disabled={loading}
          aria-label="Mensagem para a IA"
        />

        <button
          className={`send-button ${isButtonVisible ? "visible" : ""}`}
          onClick={handleSend}
          disabled={loading || !chatMessage.trim()}
          aria-label="Enviar mensagem"
        >
          {loading ? (
            /* SVG do Spinner com tamanhos definidos */
            <svg
              className="spinner animate-spin"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
              />
            </svg>
          ) : (
            /* SVG da Seta para cima COM tamanhos definidos para garantir a renderização */
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 11L12 6L17 11M12 18V7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}