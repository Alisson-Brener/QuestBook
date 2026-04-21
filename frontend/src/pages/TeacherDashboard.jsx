import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logoPrincipal from "../assets/logo_principal.png"
import axios from "axios";

const API_URL = "http://localhost:8000";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <img src={logoPrincipal} alt="Logo" className="logo_principal" />
          <span className="logo-text">QuestBook</span>
        </div>
        <nav className="header-nav">
          <span className="nav-link">Perfil</span>
          <span className="nav-link" onClick={handleLogout}>Sair</span>
        </nav>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h1>Bem-vindo, {profile?.name?.split(" ")[0] || "Professor"}!</h1>
          <p className="welcome-subtitle">
            Este é o seu painel de curador. Gerencie suas informações e acompanhe as atividades.
          </p>
        </div>

        <section className="profile-section">
          <div className="section-header">
            <h2>Informações do Perfil</h2>
          </div>
          
          {profile && (
            <div className="profile-grid">
              <div className="profile-item">
                <span className="profile-label">Nome</span>
                <span className="profile-value">{profile.name}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Email</span>
                <span className="profile-value">{profile.email}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Instituição</span>
                <span className="profile-value">{profile.instituicao || "Não informado"}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Formação</span>
                <span className="profile-value">{profile.formacao || "Não informado"}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Área de atuação</span>
                <span className="profile-value">{profile.area_atuacao || "Não informado"}</span>
              </div>
              {profile.biografia && (
                <div className="profile-item full-width">
                  <span className="profile-label">Biografia</span>
                  <span className="profile-value">{profile.biografia}</span>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="status-indicator">
          <span className="status-dot"></span>
          <span className="status-text">Conta Ativa</span>
        </div>
      </main>
    </div>
  );
}