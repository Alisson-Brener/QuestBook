import React, { useState } from "react";
import "./auth.css";
import { useNavigate } from "react-router-dom";
import logoPrincipal from "../assets/logo_principal.png"
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:8000";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    if (password.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { access_token } = response.data;
      
      localStorage.setItem("token", access_token);
      localStorage.setItem("userEmail", email);
      
      onLoginSuccess();
      navigate("/upload");
    } catch (error) {
      if (error.response?.status === 401) {
        setErrorMessage("E-mail ou senha incorretos.");
      } else if (error.response?.data?.detail) {
        setErrorMessage(error.response.data.detail);
      } else {
        setErrorMessage("Erro ao conectar com o servidor. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container login-mode">
      <div className="login-card">
        <img src={logoPrincipal} alt="Logo" className="logo_principal" />
        <h1 className="login-logo">Quest<span>Book</span></h1>
        <h2 className="login-title">Acessar conta</h2>

        <form onSubmit={handleLogin} className="login-form">
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

          <button type="submit" className="auth-btn login-btn modern-btn" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="forgot-password">
          <Link to="/forgot-password">Esqueceu a senha?</Link>
        </p>

        {errorMessage && <p className="auth-error">{errorMessage}</p>}

        <p className="switch-text">
          Não tem uma conta?
          <a href="/register"> Criar agora</a>
        </p>
      </div>
    </div>
  );
}
