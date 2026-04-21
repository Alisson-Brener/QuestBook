// src/components/Sidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import logoHistorico from "../assets/logo_historico.png"

export default function Sidebar({ history, onSelectChat }) {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logoHistorico} alt="Histórico" className="logo_historico" />
        <h2>Menu</h2>
      </div>
      <nav className="sidebar-nav" style={{ marginBottom: "20px", padding: "0 10px" }}>
        <button 
          onClick={() => navigate("/upload")}
          style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "transparent", border: "none", borderRadius: "8px", color: "inherit", cursor: "pointer", marginBottom: "8px" }}
        >
          Início
        </button>
        <button 
          onClick={() => navigate("/student-dashboard")}
          style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "transparent", border: "none", borderRadius: "8px", color: "inherit", cursor: "pointer" }}
        >
          Meu Desempenho
        </button>
      </nav>
      <div className="sidebar-header" style={{ marginTop: "20px" }}>
        <h2>Histórico</h2>
      </div>
      {history.length === 0 ? (
        <p className="empty-history">Nenhum histórico ainda.</p>
      ) : (
        <ul>
          {history.map((item, index) => {
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