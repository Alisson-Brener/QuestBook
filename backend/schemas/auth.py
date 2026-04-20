from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# O que o usuário envia no cadastro
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "aluno"

# O que o sistema devolve (escondendo a senha)
class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# O que o usuário envia no login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Estrutura do Token JWT
class Token(BaseModel):
    access_token: str
    token_type: str