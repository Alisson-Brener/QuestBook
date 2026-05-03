from backend.core.database import SessionLocalPG
from sqlalchemy import text

def add_column():
    db = SessionLocalPG()
    try:
        db.execute(text("ALTER TABLE search_evaluations ADD COLUMN is_flawed INTEGER DEFAULT 0;"))
        db.commit()
        print("Coluna 'is_flawed' adicionada com sucesso na tabela 'search_evaluations'!")
    except Exception as e:
        print(f"Erro (talvez a coluna já exista?): {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_column()
