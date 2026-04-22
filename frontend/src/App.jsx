// src/App.jsx
import { useState, useEffect } from "react";
import axios from 'axios'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import logoPrincipal from "./assets/logo_principal.png"
import logoHistorico from "./assets/logo_historico.png"
import ForgotPassword from "./components/ForgotPassword";


//  Componentes
import Sidebar from "./components/Sidebar";
import UploadPDF from "./components/UploadPDF";
import ChatQuestions from "./components/ChatQuestions";
import QuestionList from "./components/QuestionList";
import Login from "./components/Login";
import Register from "./components/Register";
import RegisterTeacher from "./components/RegisterTeacher";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const API_URL = "http://localhost:8000";

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });

          const { access_token, refresh_token } = response.data;
          localStorage.setItem("token", access_token);
          localStorage.setItem("refreshToken", refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userEmail");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

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
  const [isInteracting, setIsInteracting] = useState(false);

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
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
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
          path="/register-teacher"
          element={
            isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterTeacher />
          }
        />

        <Route
          path="/dashboard"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" />
            ) : (
              <TeacherDashboard />
            )
          }
        />

        <Route
          path="/student-dashboard"
          element={
            !isAuthenticated ? (
              <Navigate to="/login" />
            ) : (
              <StudentDashboard />
            )
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
                  <div className="content-scroll-area">
                    {/* Tela de Boas-vindas (Hero State) */}
                    {!chatResponse && (
                      <div className={`hero-container ${isInteracting ? "fade-out" : ""}`}>
                        <h1 className="hero-title">
                          Olá, {(localStorage.getItem("userEmail") || "Estudante").split("@")[0].split(".")[0].charAt(0).toUpperCase() + (localStorage.getItem("userEmail") || "estudante").split("@")[0].split(".")[0].slice(1)}.
                        </h1>
                        <h2 className="hero-subtitle">Por onde começamos hoje?</h2>
                      </div>
                    )}

                    {/* Lista de questões geradas */}
                    <QuestionList chatResponse={chatResponse} />
                  </div>

                  {/* Chat para gerar questões */}
                  <div className="chat-input-container">
                    <ChatQuestions 
                      onNewQuestions={handleNewQuestions} 
                      onInteraction={() => setIsInteracting(true)}
                    />
                  </div>
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
