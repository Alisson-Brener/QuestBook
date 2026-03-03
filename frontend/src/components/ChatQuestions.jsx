// src/components/ChatQuestions.jsx
import React, { useState } from "react";
import axios from "axios";

export default function ChatQuestions({ onNewQuestions }) {
  const [chatMessage, setChatMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    if (!chatMessage) return alert("Digite sua solicitação.");

    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/chat_questions", {
        user_message: chatMessage,
      });

      onNewQuestions({
        chatMessage,
        results: res.data, // <-- agora pega a lista diretamente
        ai_understanding: null,
      });

      setChatMessage(""); // limpa textarea
    } catch (err) {
      console.error(err);
      alert("Erro ao falar com a IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>2. Pedir Questões</h2>
      <textarea
        placeholder="Ex: Gerar questões sobre capítulo 3..."
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        rows={3}
      />
      <button onClick={handleChat} disabled={loading}>
        {loading ? "IA Pensando..." : "Buscar Questões"}
      </button>
    </section>
  );
}
