from backend.core.database import engine_pg
from backend.models.all_models import Base

try:
    Base.metadata.drop_all(bind=engine_pg)
    print("Todas as tabelas foram apagadas com sucesso!")
except Exception as e:
    print(f"Erro: {e}")