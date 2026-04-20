// src/App.jsx
import { useState, useEffect } from "react";
import axios from 'axios'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import logoPrincipal from "./assets/logo_principal.png"
import logoHistorico from "./assets/logo_historico.png"
import ForgotPassword from "./components/ForgotPassword";


 // Componentes
import Sidebar from "./components/Sidebar";
import UploadPDF from "./components/UploadPDF";
import ChatQuestions from "./components/ChatQuestions";
import QuestionList from "./components/QuestionList";
import Login from "./components/Login";
import Register from "./components/Register";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token;
  });

  // Histórico e resposta selecionada
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });

  const [chatResponse, setChatResponse] = useState(null);

  // Salva histórico sempre que mudar
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Adiciona nova pergunta e resultado da IA ao histórico
  const handleNewQuestions = (newData) => {
    setChatHistory((prev) => [...prev, newData]);
    setChatResponse(newData); // mostra imediatamente na QuestionList
  };

  // Seleciona um item do histórico
  const handleSelectChat = (index) => {
    setChatResponse(chatHistory[index]);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/upload" />
            ) : (
              <Login onLoginSuccess={() => setIsAuthenticated(true)} />
            )
          }
        />

        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/upload" /> : <Register />
          }
        />

        <Route
          path="/forgot-password"
          element={
            isAuthenticated ? <Navigate to="/upload" /> : <ForgotPassword />
          }
        />

        <Route
          path="/upload"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" />
            ) : (
            <div className="app-container">
              {/* Sidebar com histórico */}
              <Sidebar history={chatHistory} onSelectChat={handleSelectChat} />

              {/* Área principal */}
              <main className="main-content">
                <header className="header">
                  <div className="logo-title">
                    <img src={logoPrincipal} alt="Logo Principal" className="logo_principal" />
                    <h1 className="login-logo">Quest<span>Book</span></h1>
                  </div>
                  <div className="header-right">
                    <p>Assistente Inteligente de Estudos</p>
                    <button onClick={handleLogout} className="logout-btn">Sair</button>
                  </div>
                </header>

                {/* Upload de PDFs */}
                <UploadPDF onUploadSuccess={() => console.log("Upload concluído")} />

                {/* Chat para gerar questões */}
                <ChatQuestions onNewQuestions={handleNewQuestions} />

                {/* Lista de questões geradas */}
                <QuestionList chatResponse={chatResponse} />
              </main>
            </div>
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
