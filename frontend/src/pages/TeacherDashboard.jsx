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
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-title">
          <img src={logoPrincipal} alt="Logo" className="logo_principal" />
          <h1>Quest<span>Book</span></h1>
        </div>
        <button onClick={handleLogout} className="logout-btn">Sair</button>
      </header>

      <main className="dashboard-main">
        <section className="profile-card">
          <h2>Meu Perfil</h2>
          
          {profile && (
            <div className="profile-info">
              <div className="info-row">
                <strong>Nome:</strong>
                <span>{profile.name}</span>
              </div>
              <div className="info-row">
                <strong>Email:</strong>
                <span>{profile.email}</span>
              </div>
              <div className="info-row">
                <strong>Instituição:</strong>
                <span>{profile.instituicao || "Não informado"}</span>
              </div>
              <div className="info-row">
                <strong>Formação:</strong>
                <span>{profile.formacao || "Não informado"}</span>
              </div>
              <div className="info-row">
                <strong>Área de atuação:</strong>
                <span>{profile.area_atuacao || "Não informado"}</span>
              </div>
              {profile.biografia && (
                <div className="info-row">
                  <strong>Biografia:</strong>
                  <span>{profile.biografia}</span>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="welcome-card">
          <h2>Bem-vindo, Professor!</h2>
          <p>
            Você está no painel de curador do QuestBook. Aqui você pode gerenciar 
            seu perfil e acompanhar as atividades da plataforma.
          </p>
          <div className="status-badge">
            <span className="status-approved">Conta Ativa</span>
          </div>
        </section>
      </main>
    </div>
  );
}