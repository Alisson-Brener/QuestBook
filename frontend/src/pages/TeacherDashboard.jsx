import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoPrincipal from "../assets/logo_principal.png";
import axios from "axios";
import SearchAudit from "../components/SearchAudit";
import { User, ShieldCheck, LogOut, LayoutDashboard, Pencil, Save, X, Plus, MessageSquare, Trash2 } from "lucide-react";
import "../App.css";
import "../components/Sidebar.css";

const API_URL = "http://localhost:8000";

export default function TeacherDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile"); // 'profile' | 'audit'
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Histórico de Auditoria
  const getAuditKey = () => {
    const email = localStorage.getItem("userEmail");
    return email ? `auditHistory_${email}` : "auditHistory_guest";
  };

  const [auditHistory, setAuditHistory] = useState(() => {
    const key = getAuditKey();
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeAuditId, setActiveAuditId] = useState(null);
  const [currentAuditData, setCurrentAuditData] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        const response = await axios.get(`${API_URL}/teachers/me`, {
          params: { email }
        });
        setProfile(response.data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditData({
        name: profile.name,
        instituicao: profile.instituicao,
        formacao: profile.formacao,
        area_atuacao: profile.area_atuacao,
        biografia: profile.biografia
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`${API_URL}/teachers/me`, editData);
      setProfile(response.data);
      setIsEditing(false);
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      alert("Erro ao atualizar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  // Sincroniza histórico com localStorage
  useEffect(() => {
    const key = getAuditKey();
    localStorage.setItem(key, JSON.stringify(auditHistory));
  }, [auditHistory]);

  const handleNewAudit = () => {
    setActiveAuditId(null);
    setCurrentAuditData(null);
    setActiveTab("audit");
  };

  const handleSelectAudit = (auditId) => {
    const audit = auditHistory.find(a => a.id === auditId);
    if (audit) {
      setActiveAuditId(audit.id);
      setCurrentAuditData(audit);
      setActiveTab("audit");
    }
  };

  const handleSaveAuditResults = (results) => {
    setAuditHistory(prev => {
      let updated = [...prev];
      if (activeAuditId) {
        const idx = updated.findIndex(a => a.id === activeAuditId);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], ...results };
          setCurrentAuditData(updated[idx]);
        }
      } else {
        const newId = Date.now().toString();
        const newAudit = {
          id: newId,
          title: results.topic || "Nova Auditoria",
          date: new Date().toLocaleDateString(),
          ...results
        };
        updated = [newAudit, ...updated];
        setActiveAuditId(newId);
        setCurrentAuditData(newAudit);
      }
      return updated;
    });
  };

  const handleDeleteAudit = (e, auditId) => {
    e.stopPropagation();
    if (window.confirm("Apagar este histórico de auditoria?")) {
      setAuditHistory(prev => prev.filter(a => a.id !== auditId));
      if (activeAuditId === auditId) {
        setActiveAuditId(null);
        setCurrentAuditData(null);
      }
    }
  };

  // Efeito para rastrear o mouse (igual ao Student Dashboard)
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogoutLocal = () => {
    if (onLogout) {
      onLogout();
      navigate("/login");
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Carregando painel do professor...</p>
        </div>
      </div>
    );
  }

  const userInitials = profile?.name ? profile.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "PR";

  return (
    <div className="app-container">
      {/* Sidebar do Professor (Harmonizada com a do Aluno) */}
      <aside className="sidebar">
        <div className="sidebar-content">
          <div className="sidebar-header" style={{ paddingBottom: "0" }}>
            <div className="logo-title" style={{ padding: "0" }}>
              <img src={logoPrincipal} alt="Logo" className="logo_principal" style={{ width: "30px" }} />
              <h1 className="login-logo" style={{ fontSize: "1.2rem" }}>Quest<span>Book</span></h1>
            </div>
          </div>

          <div className="sidebar-header" style={{ marginTop: "22px", paddingTop: "0", paddingBottom: "0" }}>
            <h2 style={{ fontSize: "0.78rem", opacity: 0.6, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>PAINEL DO CURADOR</h2>
          </div>

          <nav className="sidebar-nav" style={{ marginTop: "0" }}>
            <button
              className={`nav-button ${activeTab === "profile" ? "active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <User size={18} />
              <span>Meu Perfil</span>
            </button>
            <button
              className={`nav-button ${activeTab === "audit" ? "active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              <ShieldCheck size={18} />
              <span>Auditar Buscas</span>
            </button>
          </nav>

          <button onClick={handleNewAudit} className="new-chat-btn" style={{ marginTop: "10px" }}>
            <Plus size={18} />
            <span>Nova Auditoria</span>
          </button>

          <div className="sidebar-header" style={{ marginTop: "20px" }}>
            <h2 style={{ fontSize: "0.78rem", opacity: 0.6, letterSpacing: "0.05em", whiteSpace: "nowrap" }}>HISTÓRICO DE BUSCAS</h2>
          </div>

          <div className="history-container">
            {auditHistory.length === 0 ? (
              <p className="empty-history" style={{ fontSize: "0.8rem", opacity: 0.5, textAlign: "center", marginTop: "10px" }}>
                Nenhuma auditoria recente.
              </p>
            ) : (
              <ul className="history-list">
                {auditHistory.map((audit) => (
                  <li
                    key={audit.id}
                    className={`history-item ${activeAuditId === audit.id ? "active" : ""}`}
                    onClick={() => handleSelectAudit(audit.id)}
                    style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <div className="history-item-main" style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                      <MessageSquare size={16} className="history-icon" style={{ flexShrink: 0 }} />
                      <span className="history-title" style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: "0.85rem"
                      }}>
                        {audit.title}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteAudit(e, audit.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "5px",
                        width: "30px",
                        height: "30px",
                        margin: 0,
                        color: "rgba(255, 255, 255, 0.3)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s",
                        borderRadius: "6px"
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = "#ff6b6b"}
                      onMouseOut={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.3)"}
                      title="Excluir Auditoria"
                    >
                      <Trash2 size={14} />
                    </button>
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
              <span className="user-name">{profile?.name?.split(" ")[0] || "Professor"}</span>
            </div>
            <button onClick={handleLogoutLocal} className="logout-button" title="Sair">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        {/* Ondas de fundo (Estilo Google AI / Student) */}
        <div className="hero-waves">
          <div className="wave wave-1" style={{ transform: `translate(${(mousePos.x - 50) * 0.2}px, ${(mousePos.y - 50) * 0.2}px)` }}></div>
          <div className="wave wave-2" style={{ transform: `translate(${(mousePos.x - 50) * -0.3}px, ${(mousePos.y - 50) * -0.3}px)` }}></div>
          <div className="wave wave-3" style={{ transform: `translate(${(mousePos.x - 50) * 0.15}px, ${(mousePos.y - 50) * 0.15}px)` }}></div>
        </div>

        <header className="header">
          <div className="logo-title">
            <LayoutDashboard size={24} color="#6b5cff" />
            <h1 className="login-logo" style={{ fontSize: "1.5rem", marginLeft: "8px" }}>
              {activeTab === "profile" ? "Perfil do Curador" : "Auditoria de Sistema"}
            </h1>
          </div>
          <div className="header-right">
            <div className="status-indicator" style={{ background: "rgba(107, 92, 255, 0.1)", border: "1px solid rgba(107, 92, 255, 0.2)" }}>
              <span className="status-dot" style={{ background: "#6b5cff" }}></span>
              <span className="status-text" style={{ color: "#6b5cff" }}>Curador Ativo</span>
            </div>
          </div>
        </header>

        <div className="content-scroll-area">
          <div className="welcome-section" style={{ textAlign: "left", width: "100%", maxWidth: "800px", marginBottom: "30px" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#fff", marginBottom: "10px" }}>
              Olá, {profile?.name?.split(" ")[0] || "Professor"}.
            </h1>
            <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "1.1rem" }}>
              {activeTab === "profile"
                ? "Gerencie suas informações e credenciais de acesso."
                : "Analise a qualidade das respostas da IA e refine o banco de dados."}
            </p>
          </div>

          {activeTab === "profile" && (
            <div className="card" style={{ maxWidth: "800px", padding: "30px" }}>
              <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2 style={{ color: "#6b5cff", fontSize: "1.3rem", fontWeight: "600", margin: 0 }}>Dados Cadastrais</h2>
                {!isEditing ? (
                  <button
                    onClick={handleEditToggle}
                    style={{
                      margin: 0,
                      width: "auto",
                      padding: "8px 16px",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      background: "rgba(107, 92, 255, 0.1)",
                      border: "1px solid rgba(107, 92, 255, 0.2)"
                    }}
                  >
                    <Pencil size={14} /> Editar Perfil
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      style={{
                        margin: 0,
                        width: "auto",
                        padding: "8px 16px",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)"
                      }}
                    >
                      <Save size={14} /> {saving ? "Salvando..." : "Salvar"}
                    </button>
                    <button
                      onClick={handleEditToggle}
                      style={{
                        margin: 0,
                        width: "auto",
                        padding: "8px 16px",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)"
                      }}
                    >
                      <X size={14} /> Cancelar
                    </button>
                  </div>
                )}
              </div>

              {profile && (
                <div className="profile-grid" style={{ gap: "30px" }}>
                  <div className="profile-item">
                    <span className="profile-label">Nome Completo</span>
                    {isEditing ? (
                      <input
                        name="name"
                        value={editData.name}
                        onChange={handleInputChange}
                        className="chat-input"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", borderRadius: "8px" }}
                      />
                    ) : (
                      <span className="profile-value" style={{ fontSize: "1.1rem", fontWeight: "500" }}>{profile.name}</span>
                    )}
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">E-mail Institucional (Não editável)</span>
                    <span className="profile-value" style={{ fontSize: "1.1rem", fontWeight: "500", opacity: 0.7 }}>{profile.email}</span>
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Instituição de Ensino</span>
                    {isEditing ? (
                      <input
                        name="instituicao"
                        value={editData.instituicao}
                        onChange={handleInputChange}
                        className="chat-input"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", borderRadius: "8px" }}
                      />
                    ) : (
                      <span className="profile-value" style={{ fontSize: "1.1rem", fontWeight: "500" }}>{profile.instituicao || "Não informado"}</span>
                    )}
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Formação Acadêmica</span>
                    {isEditing ? (
                      <input
                        name="formacao"
                        value={editData.formacao}
                        onChange={handleInputChange}
                        className="chat-input"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", borderRadius: "8px" }}
                      />
                    ) : (
                      <span className="profile-value" style={{ fontSize: "1.1rem", fontWeight: "500" }}>{profile.formacao || "Não informado"}</span>
                    )}
                  </div>
                  <div className="profile-item">
                    <span className="profile-label">Área de Atuação</span>
                    {isEditing ? (
                      <input
                        name="area_atuacao"
                        value={editData.area_atuacao}
                        onChange={handleInputChange}
                        className="chat-input"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", borderRadius: "8px" }}
                      />
                    ) : (
                      <span className="profile-value" style={{ fontSize: "1.1rem", fontWeight: "500" }}>{profile.area_atuacao || "Não informado"}</span>
                    )}
                  </div>
                  <div className="profile-item full-width">
                    <span className="profile-label">Biografia</span>
                    {isEditing ? (
                      <textarea
                        name="biografia"
                        value={editData.biografia}
                        onChange={handleInputChange}
                        className="chat-input"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "10px", borderRadius: "8px", minHeight: "100px" }}
                      />
                    ) : (
                      <span className="profile-value" style={{ fontSize: "1rem", lineHeight: "1.6", opacity: 0.9 }}>{profile.biografia || "Nenhuma biografia informada."}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div style={{ width: "100%", maxWidth: "900px" }}>
              <SearchAudit
                sessionData={currentAuditData}
                onSaveResults={handleSaveAuditResults}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}