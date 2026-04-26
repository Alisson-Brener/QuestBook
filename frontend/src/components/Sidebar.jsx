// src/components/Sidebar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoHistorico from "../assets/logo_historico.png"

export default function Sidebar({ history, onSelectChat, onLogout }) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const userName = localStorage.getItem("userEmail") || "Usuário";
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
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
          <ul className="history-list">
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
      </div>

      <div className="profile-section">
        {showProfileMenu && (
          <div className="profile-menu">
            <button 
              onClick={onLogout}
              className="profile-menu-item logout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Sair</span>
            </button>
          </div>
        )}
        
        <div 
          className="profile-trigger"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <div className="profile-avatar">
            {userInitials}
          </div>
          <span className="profile-name">{userName.split("@")[0]}</span>
        </div>
      </div>
    </aside>
  );
}