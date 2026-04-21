import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from dotenv import load_dotenv
from sqlalchemy import create_engine
import os

load_dotenv()

PG_URL = os.getenv("DATABASE_URL")
engine = create_engine(PG_URL)

def migrate():
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'instituicao'
        """))
        
        if not result.fetchone():
            conn.execute(text("""
                ALTER TABLE users ADD COLUMN instituicao VARCHAR;
                ALTER TABLE users ADD COLUMN formacao VARCHAR;
                ALTER TABLE users ADD COLUMN area_atuacao VARCHAR;
                ALTER TABLE users ADD COLUMN biografia TEXT;
                ALTER TABLE users ADD COLUMN status VARCHAR DEFAULT 'aprovado';
            """))
            conn.commit()
            print("Colunas adicionadas com sucesso!")
        else:
            print("Colunas já existem.")

if __name__ == "__main__":
    migrate()