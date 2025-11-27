from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Configuração da Conexão
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:bookquest25@localhost/questbook_eng_soft_db"

# 2. Criar o "Motor" (Engine)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Criar a "Fábrica de Sessões"
# Cada requisição do usuário vai ganhar uma sessão temporária com o banco
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Classe Base para os Modelos
Base = declarative_base()

# 5. Função utilitária para pegar o banco (Dependency Injection)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()