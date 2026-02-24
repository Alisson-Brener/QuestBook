import React, { useState } from "react";
import "./auth.css";
import { useNavigate } from "react-router-dom";
import logoPrincipal from "../assets/logo_principal.png"
import { Link } from "react-router-dom";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    // Login de exemplo
    if (email === "user@domain.com" && password === "password123") {
      onLoginSuccess();      // Marca como autenticado
      navigate("/upload");   // Redireciona para upload
    } else {
      setErrorMessage("Email ou senha incorretos. Verifique ou crie uma conta.");
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

          <button type="submit" className="auth-btn login-btn modern-btn">
            Entrar
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
