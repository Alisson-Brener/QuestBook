import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# --- 1. BANCO DA APLICAÇÃO (PostgreSQL) ---
PG_URL = os.getenv("DATABASE_URL")
if not PG_URL:
    raise ValueError("❌ Erro: Variável DATABASE_URL não encontrada no .env")
engine_pg = create_engine(PG_URL)
SessionLocalPG = sessionmaker(autocommit=False, autoflush=False, bind=engine_pg)

# --- 2. BANCO DE QUESTÕES (MySQL) ---
MYSQL_URL = os.getenv("MYSQL_URL")
if not MYSQL_URL:
    raise ValueError("❌ Erro: Variável MYSQL_URL não encontrada no .env")
engine_mysql = create_engine(MYSQL_URL)
SessionLocalMySQL = sessionmaker(autocommit=False, autoflush=False, bind=engine_mysql)

Base = declarative_base()


def get_db():
    """Entrega conexão com Postgres"""
    db = SessionLocalPG()
    try:
        yield db
    finally:
        db.close()

def get_questions_db():
    """Entrega conexão com MySQL"""
    db = SessionLocalMySQL()
    try:
        yield db
    finally:
        db.close()