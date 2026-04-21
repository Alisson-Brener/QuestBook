from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.all_models import User
from backend.schemas.auth import TeacherCreate, UserResponse
from backend.core.security import get_password_hash, create_access_token, create_refresh_token
from backend.core.security import verify_password

router = APIRouter(prefix="/teachers", tags=["teachers"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_teacher(teacher_data: TeacherCreate, db: Session = Depends(get_db)):
    user_exists = db.query(User).filter(User.email == teacher_data.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    hashed_pwd = get_password_hash(teacher_data.password)
    
    new_teacher = User(
        name=teacher_data.name,
        email=teacher_data.email,
        password_hash=hashed_pwd,
        role=teacher_data.role,
        instituicao=teacher_data.instituicao,
        formacao=teacher_data.formacao,
        area_atuacao=teacher_data.area_atuacao,
        biografia=teacher_data.biografia,
        status="aprovado"
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    
    return new_teacher

@router.get("/me", response_model=UserResponse)
def get_my_profile(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user