// src/components/UploadPDF.jsx
import React, { useState } from "react";
import axios from "axios";
import logoPrincipal from "../assets/logo_principal.png"
import logoHistorico from "../assets/logo_historico.png"

export default function UploadPDF({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Selecione um arquivo primeiro!");
    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      await axios.post("http://127.0.0.1:8000/upload_document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatusMsg("Sucesso! Documento processado.");
      setStatusType("success");
      onUploadSuccess(); // opcional, se quiser atualizar o frontend
    } catch (err) {
      console.error(err);
      setStatusMsg("Erro ao enviar arquivo.");
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>1. Carregar Material de Estudo</h2>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Processando..." : "Enviar PDF"}
      </button>
      {statusMsg && (
        <p style={{ color: statusType === "success" ? "green" : "red" }}>
          {statusMsg}
        </p>
      )}
    </section>
  );
}
