import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./auth.css";
import logoPrincipal from "../assets/logo_principal.png"

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = (e) => {
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

    navigate("/login"); // Após registrar → vai para upload
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

            <button type="submit" className="auth-btn register-btn">
              Registrar
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
