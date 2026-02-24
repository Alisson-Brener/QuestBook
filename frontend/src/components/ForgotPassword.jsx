import React, { useState } from "react";
import "./auth.css";
import { useNavigate } from "react-router-dom";
import logoPrincipal from "../assets/logo_principal.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulação de envio
    setMessage("Se este e-mail estiver cadastrado, enviaremos instruções de recuperação.");
  };

  return (
    <div className="auth-container login-mode">
      <div className="login-card">
        <img src={logoPrincipal} alt="Logo" className="logo_principal" />
        <h1 className="login-logo">Quest<span>Book</span></h1>
        <h2 className="login-title">Recuperar senha</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit" className="auth-btn login-btn modern-btn">
            Enviar
          </button>
        </form>

        {message && (
          <p style={{ color: "#7086dc", marginTop: "15px" }}>
            {message}
          </p>
        )}

        <p className="switch-text">
          Lembrou a senha?
          <span
            style={{
              cursor: "pointer",
              color: "#6c63ff",
              marginLeft: "5px",
              fontWeight: "600"
            }}
            onClick={() => navigate("/login")}
          >
            Voltar ao login
          </span>
        </p>
      </div>
    </div>
  );
}