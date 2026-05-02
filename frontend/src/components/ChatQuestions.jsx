// src/components/ChatQuestions.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const MAX_TEXTAREA_HEIGHT = 200;
const EXPANDED_HEIGHT_THRESHOLD = 44;

export default function ChatQuestions({ onNewQuestions, onInteraction, activeChatId }) {
  const [chatMessage, setChatMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState(null);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const fileInputRef = useRef(null);

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${newHeight}px`;

    setIsExpanded(scrollHeight > EXPANDED_HEIGHT_THRESHOLD);
  };

  useEffect(() => {
    autoResize();
  }, [chatMessage]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = async () => {
    if ((!chatMessage.trim() && !selectedFile) || loading) return;
    if (onInteraction) onInteraction();

    setLoading(true);
    try {
      const apiUrl = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000";
      let currentDocumentId = uploadedDocumentId;
      
      // 1. Fazer o upload do arquivo se houver
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        
        const resUpload = await axios.post(`${apiUrl}/student/upload_document`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (resUpload.data.document_id) {
          currentDocumentId = resUpload.data.document_id;
          setUploadedDocumentId(currentDocumentId);
        }
      }

      // 2. Enviar a mensagem para gerar as questões
      let userPrompt = chatMessage.trim();
      if (!userPrompt && selectedFile) {
        userPrompt = "Gere questões com base no documento fornecido.";
      }

      const requestBody = {
        user_message: userPrompt,
        session_id: activeChatId || "anonimo"
      };
      if (currentDocumentId) {
        requestBody.document_id = currentDocumentId;
      }

      const res = await axios.post(`${apiUrl}/student/chat_questions`, requestBody);

      let finalTopic = res.data.topic;
      if (selectedFile && (!finalTopic || finalTopic === "Geral" || finalTopic === "INVALIDO")) {
        finalTopic = selectedFile.name.split(".")[0];
      }

      let displayMessage = chatMessage.trim();
      if (selectedFile) {
        displayMessage = displayMessage ? `${displayMessage} (Anexo: ${selectedFile.name})` : `📄 Upload: ${selectedFile.name}`;
      }

      onNewQuestions({
        chatMessage: displayMessage,
        results: res.data.questions || [],
        topic: finalTopic,
        ai_understanding: null,
      });

      setChatMessage("");
      setSelectedFile(null);
      setIsExpanded(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (err) {
      console.error("Erro na comunicação com a API:", err);
      alert("Erro ao processar sua solicitação. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuOptionClick = () => {
    setIsMenuOpen(false);
  };

  const handleFileUploadClick = () => {
    setIsMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setIsExpanded(true);
    }
    event.target.value = "";
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const isButtonVisible = chatMessage.trim().length > 0 || loading || selectedFile;

  return (
    <div className="chat-input-container">
      <div className={`chat-input-wrapper ${isExpanded ? "expanded" : ""}`}>
        <button
          ref={buttonRef}
          className={`action-menu-button ${isMenuOpen ? "active" : ""} ${isExpanded ? "expanded" : ""}`}
          onClick={toggleMenu}
          aria-label="Abrir menu de ações"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>

        <div
          ref={menuRef}
          className={`action-menu ${isMenuOpen ? "open" : ""} ${isExpanded ? "expanded" : ""}`}
        >
          <button
            className="action-menu-item"
            onClick={handleFileUploadClick}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
            <span>Enviar arquivos</span>
          </button>

          <button
            className="action-menu-item"
            onClick={handleMenuOptionClick}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>Adicionar do Drive</span>
          </button>
        </div>

        {selectedFile && (
            <div className="file-preview" style={{ padding: '8px 12px', margin: '4px', borderRadius: '8px', background: 'var(--surface-color, #f4f4f5)' }}>
              <div className="file-info">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="file-name" style={{ marginLeft: '8px', fontSize: '0.9rem', fontWeight: '500' }}>{selectedFile.name}</span>
              </div>
              <button
                className="remove-file-btn"
                onClick={handleRemoveFile}
                aria-label="Remover arquivo"
                style={{ marginLeft: 'auto' }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
        )}

        <textarea
          ref={textareaRef}
          id="chat-input-textarea"
          className="chat-input"
          placeholder="Busque questões sobre o tema desejado..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          rows={1}
          disabled={loading}
          aria-label="Mensagem para a IA"
        />

        <input
          ref={fileInputRef}
          type="file"
          className="hidden-file-input"
          onChange={handleFileChange}
          accept=".pdf"
        />

        <button
          className={`send-button ${isButtonVisible ? "visible" : ""}`}
          onClick={handleSend}
          disabled={loading || (!chatMessage.trim() && !selectedFile)}
          aria-label={selectedFile ? "Enviar PDF" : "Enviar mensagem"}
        >
          {loading ? (
            <svg
              className="spinner animate-spin"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 11L12 6L17 11M12 18V7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}