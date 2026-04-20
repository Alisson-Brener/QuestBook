import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import logoPrincipal from "../assets/logo_principal.png"
import axios from "axios";

const API_URL = "http://localhost:8000";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        role: "aluno"
      });

      navigate("/login");
    } catch (error) {
      if (error.response?.status === 400) {
        setError(error.response.data.detail || "E-mail já cadastrado.");
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
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
            Crie sua conta e estude com facilidade, enviando PDFs e reforçando seu aprendizado com questões objetivas.
          </p>
        </div>

        <div className="register-right">
          <h2 className="panel-title">Criar conta</h2>

          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder="Nome"
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
              {loading ? "Criando conta..." : "Registrar"}
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
