from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.core.database import engine_pg, Base
from backend.routers import student

# 1. Cria as tabelas do Postgres se não existirem
Base.metadata.create_all(bind=engine_pg)

app = FastAPI(title="QuestBook API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Conecta as rotas do estudante
# SEM PREFIXO para manter compatibilidade com seu frontend atual
app.include_router(student.router, tags=["Student"])

@app.get("/")
def read_root():
    return {"status": "QuestBook API Online"}

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)