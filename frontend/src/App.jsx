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
import { generateQuestionsPDF } from "./utils/pdfGenerator.js";
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

  // Função para pegar a chave do histórico específica do usuário
  const getHistoryKey = () => {
    const email = localStorage.getItem("userEmail");
    return email ? `chatHistory_${email}` : "chatHistory_guest";
  };

  // Histórico iniciado com função para evitar reset no refresh
  const [chatHistory, setChatHistory] = useState(() => {
    const key = getHistoryKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && !parsed[0].messages) return [];
        return parsed;
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [activeChatId, setActiveChatId] = useState(null);
  const [chatResponse, setChatResponse] = useState(null);

  // Efeito para sincronizar o histórico quando o usuário LOGA ou DESLOGA
  useEffect(() => {
    const key = getHistoryKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChatHistory(parsed);
      } catch (e) {
        setChatHistory([]);
      }
    } else {
      setChatHistory([]);
    }
    setActiveChatId(null);
    setChatResponse(null);
  }, [isAuthenticated]);

  const [isInteracting, setIsInteracting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Salva histórico sempre que mudar (na chave do usuário atual)
  useEffect(() => {
    if (isAuthenticated) {
      const key = getHistoryKey();
      localStorage.setItem(key, JSON.stringify(chatHistory));
    }
  }, [chatHistory, isAuthenticated]);

  // Efeito para rastrear o mouse na Hero Section
  useEffect(() => {
    if (chatResponse) return;

    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [chatResponse]);

  // Adiciona nova pergunta ao chat ativo ou cria um novo
  const handleNewQuestions = (newData) => {
    setChatHistory((prev) => {
      let updatedHistory = [...prev];

      if (activeChatId) {
        // Encontra o chat ativo e anexa a nova interação
        const chatIndex = updatedHistory.findIndex(c => c.id === activeChatId);
        if (chatIndex !== -1) {
          const updatedChat = {
            ...updatedHistory[chatIndex],
            messages: [...updatedHistory[chatIndex].messages, newData]
          };
          updatedHistory[chatIndex] = updatedChat;
          setChatResponse(updatedChat);
        }
      } else {
        // Cria um novo chat
        const newId = Date.now().toString();

        // Título inteligente preferencialmente vindo do backend (topic)
        let chatTitle = "";

        if (newData.topic && newData.topic !== "Geral" && newData.topic !== "INVALIDO") {
          chatTitle = newData.topic;
        } else if (newData.chatMessage && newData.chatMessage.includes("Upload:")) {
          // Limpa o nome do arquivo se for upload
          const fileName = newData.chatMessage.replace("Upload: ", "").split(".")[0];
          chatTitle = `Arquivo: ${fileName}`;
        } else {
          // Fallback para a mensagem truncada
          chatTitle = newData.chatMessage.substring(0, 30) + (newData.chatMessage.length > 30 ? "..." : "");
        }

        const newChat = {
          id: newId,
          title: chatTitle,
          messages: [newData]
        };
        updatedHistory = [newChat, ...updatedHistory];
        setActiveChatId(newId);
        setChatResponse(newChat);
      }

      return updatedHistory;
    });
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setChatResponse(null);
    setIsInteracting(false);
  };

  // Seleciona um item do histórico
  const handleSelectChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setActiveChatId(chat.id);
      setChatResponse(chat);
    }
  };

  const handleDeleteChat = (chatId) => {
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
      setChatResponse(null);
    }
  };

  const handleTogglePin = (chatId) => {
    setChatHistory(prev => prev.map(c =>
      c.id === chatId ? { ...c, pinned: !c.pinned } : c
    ));
  };

  const handleRenameChat = (chatId, newTitle) => {
    setChatHistory(prev => prev.map(c =>
      c.id === chatId ? { ...c, title: newTitle } : c
    ));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");

    // Limpeza crucial dos estados na memória para evitar contaminação
    setChatHistory([]);
    setChatResponse(null);
    setActiveChatId(null);

    setIsAuthenticated(false);
  };

  const handleExportPDF = () => {
    if (!chatResponse) return;

    let allQuestions = [];
    const messages = chatResponse.messages || [chatResponse];

    messages.forEach(msg => {
      if (!msg) return;
      const questions = msg.results || msg.questions || msg.data || [];
      allQuestions = [...allQuestions, ...questions];
    });

    if (allQuestions.length > 0) {
      generateQuestionsPDF(allQuestions, chatResponse.title || "Questões - QuestBook");
    }
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
              <div className="app-container">
                <Sidebar
                  history={chatHistory}
                  onSelectChat={handleSelectChat}
                  onDeleteChat={handleDeleteChat}
                  onTogglePin={handleTogglePin}
                  onRenameChat={handleRenameChat}
                  onLogout={handleLogout}
                  onNewChat={handleNewChat}
                  activeChatId={activeChatId}
                />
                <main className="main-content">
                  <StudentDashboard onLogout={handleLogout} />
                </main>
              </div>
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
                <Sidebar
                  history={chatHistory}
                  onSelectChat={handleSelectChat}
                  onDeleteChat={handleDeleteChat}
                  onTogglePin={handleTogglePin}
                  onRenameChat={handleRenameChat}
                  onLogout={handleLogout}
                  onNewChat={handleNewChat}
                  activeChatId={activeChatId}
                />

                {/* Área principal */}
                <main className="main-content">
                  {!chatResponse && (
                    <div className="hero-waves">
                      <div className="wave wave-1" style={{ transform: `translate(${(mousePos.x - 50) * 0.2}px, ${(mousePos.y - 50) * 0.2}px)` }}></div>
                      <div className="wave wave-2" style={{ transform: `translate(${(mousePos.x - 50) * -0.3}px, ${(mousePos.y - 50) * -0.3}px)` }}></div>
                      <div className="wave wave-3" style={{ transform: `translate(${(mousePos.x - 50) * 0.15}px, ${(mousePos.y - 50) * 0.15}px)` }}></div>
                    </div>
                  )}

                  <header className="header">
                    <div className="logo-title">
                      <img src={logoPrincipal} alt="Logo Principal" className="logo_principal" />
                      <h1 className="login-logo">Quest<span>Book</span></h1>
                    </div>
                    <div className="header-right">
                      <p style={{ color: "rgba(255, 255, 255, 0.6)", marginRight: "10px" }}>Assistente Inteligente de Estudos</p>
                      {chatResponse && (
                        <button
                          onClick={handleExportPDF}
                          className="export-pdf-btn-header"
                          style={{
                            width: "auto",
                            padding: "8px 16px",
                            margin: 0,
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "0.85rem",
                            background: "linear-gradient(135deg, #6b5cff 0%, #9b3dff 100%)",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Exportar Questões
                        </button>
                      )}
                    </div>
                  </header>
                  <div className="content-scroll-area">
                    {/* Tela de Boas-vindas (Hero State) */}
                    {!chatResponse && (
                      <div
                        className={`hero-container ${isInteracting ? "fade-out" : ""}`}
                        style={{
                          "--mouse-x": `${mousePos.x}%`,
                          "--mouse-y": `${mousePos.y}%`
                        }}
                      >
                        <h1 className="hero-title">
                          Olá, {(localStorage.getItem("userEmail") || "Estudante").split("@")[0].split(".")[0].charAt(0).toUpperCase() + (localStorage.getItem("userEmail") || "estudante").split("@")[0].split(".")[0].slice(1)}.
                        </h1>
                        <h2 className="hero-subtitle">Qual conhecimento vamos dominar hoje?</h2>
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
                      activeChatId={activeChatId}
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
