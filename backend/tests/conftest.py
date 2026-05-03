import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.core.database import get_db, get_questions_db, Base
from backend.core.deps import get_current_user, get_optional_current_user
from backend.models.all_models import User

# --- Setup in-memory SQLite DB for testing ---
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def setup_database():
    # Cria as tabelas na DB em memória
    Base.metadata.create_all(bind=engine)
    yield
    # Limpa as tabelas
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(setup_database):
    """Fixture para uma sessão de banco de dados isolada para cada teste"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def test_user():
    return User(id=1, name="Test User", email="test@test.com", password_hash="hash")

@pytest.fixture
def client(db_session, test_user):
    """Fixture do TestClient do FastAPI com overrides de dependências"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_questions_db] = override_get_db # Usamos o mesmo db in-memory para simplificar
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[get_optional_current_user] = override_get_current_user

    with TestClient(app) as c:
        yield c
    
    app.dependency_overrides.clear()
