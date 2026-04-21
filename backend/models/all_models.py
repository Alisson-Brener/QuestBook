from sqlalchemy import Column, Integer, String, ForeignKey, Text, Numeric, TIMESTAMP, text
from sqlalchemy.orm import relationship
from backend.core.database import Base

# Tabela de Usuários
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # 'aluno' ou 'curador'
    
    # Campos específicos do professor/curador
    instituicao = Column(String)
    formacao = Column(String)
    area_atuacao = Column(String)
    biografia = Column(Text)
    status = Column(String, default="aprovado") # 'aprovado' automaticamente
    
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    
    # Relacionamento com respostas
    answers = relationship("UserAnswer", back_populates="user")

# Tabela de Documentos (PDFs)
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    uploaded_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    # Relacionamento: Um documento tem vários capítulos
    chapters = relationship("Chapter", back_populates="document")

# Tabela de Capítulos
class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    title = Column(String)
    text_content = Column(Text)

    document = relationship("Document", back_populates="chapters")
    questions = relationship("SuggestedQuestion", back_populates="chapter")

# Tabela de Questões Sugeridas (IA)
class SuggestedQuestion(Base):
    __tablename__ = "suggested_questions"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    external_question_id = Column(String) # ID lá do banco de questões
    confidence_score = Column(Numeric(5, 4)) # ex: 0.9850
    status = Column(String) # 'APROVADO_IA', 'PENDENTE', etc.

    chapter = relationship("Chapter", back_populates="questions")

# --- Modelo para o MySQL (Tabela Existente) ---
class QuestaoLegada(Base):
    # Nome exato da tabela no MySQL
    __tablename__ = "questoes_engenharia_software"
    
    # Mapeamento: esquerda = nome no python | direita = nome no banco
    
    # O SQLAlchemy exige uma Primary Key. Usamos questao_id.
    id = Column(Integer, name="questao_id", primary_key=True)
    
    disciplina = Column(String, name="disciplina")
    assunto = Column(String, name="assunto")
    banca = Column(String, name="banca")
    ano = Column(Integer, name="ano")
    
    enunciado = Column(Text, name="enunciado")
    
    # Mapeando alternativaA -> alternativa_a
    alternativa_a = Column(Text, name="alternativaA")
    alternativa_b = Column(Text, name="alternativaB")
    alternativa_c = Column(Text, name="alternativaC")
    alternativa_d = Column(Text, name="alternativaD")
    alternativa_e = Column(Text, name="alternativaE")
    
    gabarito = Column(String, name="gabarito")

# Tabela de Respostas do Usuário
class UserAnswer(Base):
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer) # ID da questão no MySQL (QuestaoLegada)
    selected_option = Column(String(1)) # 'A', 'B', 'C', 'D', 'E'
    is_correct = Column(Integer) # 1 para correto, 0 para incorreto
    topic = Column(String) # Guardar o tópico para facilitar estatísticas
    answered_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="answers")