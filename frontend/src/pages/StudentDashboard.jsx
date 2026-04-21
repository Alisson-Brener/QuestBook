import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import { Activity, CheckCircle, XCircle, BarChart3, TrendingUp } from "lucide-react";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("http://localhost:8000/student/stats");
        setStats(response.data);
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Carregando estatísticas...</div>;

  const summaryData = stats?.summary || { total_answered: 0, correct_answers: 0, incorrect_answers: 0, overall_accuracy: 0 };
  
  const pieData = [
    { name: "Corretas", value: summaryData.correct_answers, color: "#2ecc71" },
    { name: "Incorretas", value: summaryData.incorrect_answers, color: "#e74c3c" },
  ];

  return (
    <div className="student-dashboard-container">
      <Sidebar history={[]} onSelectChat={() => {}} />
      
      <main className="student-dashboard-content">
        <header className="student-dashboard-header">
          <h1>Meu Desempenho</h1>
          <p>Acompanhe seu progresso e evolução nos estudos.</p>
        </header>

        {/* Resumo Rápido */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-title"><Activity size={16} /> Total Respondidas</div>
            <div className="stat-value">{summaryData.total_answered}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title"><CheckCircle size={16} color="#2ecc71" /> Acertos</div>
            <div className="stat-value" style={{ color: "#2ecc71" }}>{summaryData.correct_answers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title"><XCircle size={16} color="#e74c3c" /> Erros</div>
            <div className="stat-value" style={{ color: "#e74c3c" }}>{summaryData.incorrect_answers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title"><TrendingUp size={16} color="#6b5cff" /> Precisão Geral</div>
            <div className="stat-value" style={{ color: "#6b5cff" }}>{summaryData.overall_accuracy}%</div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="charts-section">
          {/* Gráfico de Pizza: Acertos vs Erros */}
          <div className="chart-box">
            <h2>Distribuição de Acertos</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Barras: Desempenho por Tópico */}
          <div className="chart-box">
            <h2>Precisão por Tópico</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.topic_performance || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                <XAxis dataKey="topic" stroke="#8b949e" />
                <YAxis stroke="#8b949e" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
                  itemStyle={{ color: "#6b5cff" }}
                />
                <Bar dataKey="accuracy" fill="#6b5cff" radius={[4, 4, 0, 0]} name="Precisão (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="recent-activity">
          <h2>Atividades Recentes</h2>
          <div className="activity-list">
            {stats?.recent_activity?.length > 0 ? (
              stats.recent_activity.map((activity, idx) => (
                <div key={idx} className={`activity-item ${activity.is_correct ? 'correct' : 'incorrect'}`}>
                  <span>Questão respondida em {activity.date}</span>
                  <strong>{activity.is_correct ? "CORRETO" : "INCORRETO"}</strong>
                </div>
              ))
            ) : (
              <p>Nenhuma atividade registrada ainda.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
