import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";
import logoPrincipal from "../assets/logo_principal.png"
import axios from "axios";

const API_URL = "http://localhost:8000";

export default function RegisterTeacher() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [formacao, setFormacao] = useState("");
  const [areaAtuacao, setAreaAtuacao] = useState("");
  const [biografia, setBiografia] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!instituicao || !formacao || !areaAtuacao) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/teachers/register`, {
        name,
        email,
        password,
        role: "curador",
        instituicao,
        formacao,
        area_atuacao: areaAtuacao,
        biografia: biografia || null
      });

      navigate("/login");
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data.detail || "E-mail já cadastrado.");
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Erro ao conectar com o servidor. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container register-mode">
      <div className="register-panel">
        <div className="register-left">
          <div className="brand-container">
            <img src={logoPrincipal} alt="Logo" className="logo_principal" />
            <h1 className="auth-title big">
              Quest<span>Book</span>
            </h1>
          </div>

          <p className="register-description">
            Torne-se um curador e ajude estudantes a vencerem concursos e vestibulares com questões de qualidade.
          </p>
        </div>

        <div className="register-right">
          <h2 className="panel-title">Cadastro de Professor</h2>

          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Instituição de ensino *"
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Formação acadêmica *"
              value={formacao}
              onChange={(e) => setFormacao(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Área de atuação *"
              value={areaAtuacao}
              onChange={(e) => setAreaAtuacao(e.target.value)}
              required
            />

            <textarea
              placeholder="Biografia (opcional)"
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              rows={3}
              style={{ resize: "vertical" }}
            />

            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirmar Senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-btn register-btn" disabled={loading}>
              {loading ? "Criando conta..." : "Cadastrar"}
            </button>
          </form>

          <p className="switch-text">
            Já tem uma conta?
            <Link to="/login"> Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}