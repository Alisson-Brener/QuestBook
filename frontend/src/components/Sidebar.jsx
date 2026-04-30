// src/components/Sidebar.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, MessageSquare, Home, BarChart2, LogOut } from "lucide-react";
import logoHistorico from "../assets/logo_historico.png";
import "./Sidebar.css";

export default function Sidebar({ history, onSelectChat, onLogout, onNewChat, activeChatId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const userName = localStorage.getItem("userEmail") || "Usuário";
  const userInitials = userName.substring(0, 2).toUpperCase();

  const filteredHistory = history.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h2>Menu</h2>
        </div>

        <nav className="sidebar-nav">
          <button 
            onClick={() => navigate("/upload")}
            className={`nav-button ${location.pathname === "/upload" ? "active" : ""}`}
          >
            <Home size={18} />
            <span>Início</span>
          </button>
          <button 
            onClick={() => navigate("/student-dashboard")}
            className={`nav-button ${location.pathname === "/student-dashboard" ? "active" : ""}`}
          >
            <BarChart2 size={18} />
            <span>Meu Desempenho</span>
          </button>
        </nav>

        <button onClick={onNewChat} className="new-chat-btn">
          <Plus size={18} />
          <span>Nova Conversa</span>
        </button>

        <div className="sidebar-search">
          <div className="search-wrapper">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder="Pesquisar chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="sidebar-header">
          <h2>Histórico</h2>
        </div>

        <div className="history-container">
          {filteredHistory.length === 0 ? (
            <p className="empty-history">
              {searchQuery ? "Nenhum chat encontrado." : "Nenhum histórico ainda."}
            </p>
          ) : (
            <ul className="history-list">
              {filteredHistory.map((chat) => (
                <li
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`history-item ${activeChatId === chat.id ? "active" : ""}`}
                >
                  <MessageSquare size={18} className="history-icon" />
                  <span>{chat.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{userInitials}</div>
          <div className="user-info">
            <span className="user-name">{userName.split("@")[0]}</span>
          </div>
          <button onClick={onLogout} className="logout-button" title="Sair da conta">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}