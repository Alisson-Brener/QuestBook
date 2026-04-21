from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.all_models import User
from backend.schemas.auth import UserCreate, UserResponse, UserLogin, Token, TokenRefresh
from backend.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Verificar se o e-mail já está cadastrado
    user_exists = db.query(User).filter(User.email == user_data.email).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    
    # 2. Criar o hash da senha
    hashed_pwd = get_password_hash(user_data.password)
    
    # 3. Salvar no banco
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hashed_pwd,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    # 1. Buscar usuário
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # 2. Validar existência e senha
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Gerar Token JWT
    
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    refresh_token = create_refresh_token(data={"sub": user.email})

    return {
        "access_token": access_token, 
        "refresh_token": refresh_token, 
        "token_type": "bearer",
        "role": user.role
    }

@router.post("/refresh", response_model=Token)
def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token de atualização inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Tenta decodificar o refresh token
        payload = jwt.decode(token_data.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    # Verifica se o usuário ainda existe no banco
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    # Se deu tudo certo, gera um novo par de tokens!
    new_access_token = create_access_token(data={"sub": user.email, "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": new_access_token, 
        "refresh_token": new_refresh_token, 
        "token_type": "bearer",
        "role": user.role
    }