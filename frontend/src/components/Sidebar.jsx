import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, MessageSquare, Home, BarChart2, LogOut, Pin, Trash2, MoreVertical, Pencil, Check, X } from "lucide-react";
import logoHistorico from "../assets/logo_historico.png";
import "./Sidebar.css";

export default function Sidebar({ history, onSelectChat, onDeleteChat, onTogglePin, onRenameChat, onLogout, onNewChat, activeChatId }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const userName = localStorage.getItem("userEmail") || "Usuário";
  const userInitials = userName.substring(0, 2).toUpperCase();

  // Fecha o menu se clicar fora
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const sortedHistory = [...history].sort((a, b) => {
    if (a.pinned === b.pinned) return 0;
    return a.pinned ? -1 : 1;
  });

  const filteredHistory = sortedHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
    setOpenMenuId(null);
  };

  const saveEdit = (id) => {
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

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

        <button onClick={() => {
          onNewChat();
          if (location.pathname !== "/upload") {
            navigate("/upload");
          }
        }} className="new-chat-btn">
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
                  onClick={() => {
                    if (editingId !== chat.id) {
                      onSelectChat(chat.id);
                      if (location.pathname !== "/upload") {
                        navigate("/upload");
                      }
                    }
                  }}
                  className={`history-item ${activeChatId === chat.id ? "active" : ""} ${chat.pinned ? "pinned" : ""}`}
                >
                  <div className="history-item-main">
                    <MessageSquare size={18} className="history-icon" />

                    {editingId === chat.id ? (
                      <input
                        autoFocus
                        className="edit-history-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveEdit(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(chat.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="history-title">{chat.title}</span>
                    )}
                  </div>

                  {editingId !== chat.id && (
                    <div className="history-options-container">
                      <button
                        className="options-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                        }}
                      >
                        ...
                      </button>

                      {openMenuId === chat.id && (
                        <div className="options-dropdown" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { onTogglePin(chat.id); setOpenMenuId(null); }}>
                            <Pin size={14} /> {chat.pinned ? "Desafixar" : "Fixar"}
                          </button>
                          <button onClick={() => startEditing(chat)}>
                            <Pencil size={14} /> Renomear
                          </button>
                          <button className="delete-opt" onClick={() => {
                            if (window.confirm("Apagar esta conversa?")) onDeleteChat(chat.id);
                            setOpenMenuId(null);
                          }}>
                            <Trash2 size={14} /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {chat.pinned && !openMenuId && editingId !== chat.id && (
                    <Pin size={12} className="pinned-indicator" />
                  )}
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