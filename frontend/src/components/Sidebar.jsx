// src/components/Sidebar.jsx
import React from "react";
import logoHistorico from "../assets/logo_historico.png"

export default function Sidebar({ history, onSelectChat }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logoHistorico} alt="Histórico" className="logo_historico" />
        <h2>Histórico</h2>
      </div>
      {history.length === 0 ? (
        <p className="empty-history">Nenhum histórico ainda.</p>
      ) : (
        <ul>
          {history.map((item, index) => {
            // Pega as cinco primeiras palavras da pergunta para exibir no histórico
            const keyword = item.chatMessage.split(" ").slice(0, 5).join(" ");
            return (
              <li
                key={index}
                onClick={() => onSelectChat(index)}
                style={{ cursor: "pointer" }}
              >
                {keyword}...
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
