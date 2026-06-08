import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db

TEST_DB_URL = "sqlite:///./test_zhinan.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def registered_user(client):
    """注册并登录，返回 (token, user_data)"""
    from app.core import verification
    email = "testuser@example.com"
    code = verification.gen_code()
    verification.save_code(email, code)

    client.post("/api/auth/register", json={
        "username": "testuser",
        "email": email,
        "password": "Test1234!",
        "code": code,
    })
    res = client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "Test1234!",
    })
    data = res.json()
    return data["access_token"], data["user"]


@pytest.fixture
def auth_headers(registered_user):
    token, _ = registered_user
    return {"Authorization": f"Bearer {token}"}
