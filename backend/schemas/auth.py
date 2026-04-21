from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# O que o usuário envia no cadastro
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "aluno"

#cadastro de professor/curador
class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "curador"
    instituicao: str
    formacao: str
    area_atuacao: str
    biografia: Optional[str] = None

# O que o sistema devolve (escondendo a senha)
class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    instituicao: Optional[str] = None
    formacao: Optional[str] = None
    area_atuacao: Optional[str] = None
    biografia: Optional[str] = None
    status: Optional[str] = None
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
    refresh_token: str
    token_type: str
    role: Optional[str] = None

class TokenRefresh(BaseModel):
    refresh_token: str