import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from main import app, get_db, User, Base, get_password_hash, create_access_token
from database import Base
from schemas import UserCreate, UserRole
from httpx import AsyncClient
import pytest_asyncio

# Use an in-memory SQLite database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency to use the test database
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Set environment variables for testing
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"

@pytest.fixture(scope="function")
def test_db():
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop the tables after the test
    Base.metadata.drop_all(bind=engine)

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(base_url="http://test") as ac:
        yield ac

@pytest.fixture
def db_session(test_db):
    db = TestingSessionLocal()
    yield db
    db.close()

@pytest.fixture
def test_user(db_session):
    # Create a test user
    user = User(
        email="testuser@example.com",
        password=get_password_hash("testpassword123"),
        first_name="Test",
        last_name="User",
        role=UserRole.USER
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_admin(db_session):
    # Create a test admin
    admin = User(
        email="admin@example.com",
        password=get_password_hash("adminpassword123"),
        first_name="Admin",
        last_name="User",
        role=UserRole.ADMIN
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

# Test user registration
@pytest.mark.asyncio
async def test_register_user(async_client, db_session):
    user_data = {
        "email": "newuser@example.com",
        "password": "newpassword123",
        "first_name": "New",
        "last_name": "User"
    }
    response = await async_client.post("/api/auth/register", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["first_name"] == user_data["first_name"]
    assert data["last_name"] == user_data["last_name"]
    assert data["role"] == UserRole.USER

    # Verify user exists in the database
    db_user = db_session.query(User).filter(User.email == user_data["email"]).first()
    assert db_user is not None
    assert db_user.role == UserRole.USER

# Test duplicate email registration
@pytest.mark.asyncio
async def test_register_duplicate_email(async_client, test_user):
    user_data = {
        "email": "testuser@example.com",
        "password": "testpassword123",
        "first_name": "Test",
        "last_name": "User"
    }
    response = await async_client.post("/api/auth/register", json=user_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

# Test login with correct credentials
@pytest.mark.asyncio
async def test_login_success(async_client, test_user):
    login_data = {
        "username": "testuser@example.com",
        "password": "testpassword123"
    }
    response = await async_client.post("/api/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

# Test login with incorrect credentials
@pytest.mark.asyncio
async def test_login_failure(async_client, test_user):
    login_data = {
        "username": "testuser@example.com",
        "password": "wrongpassword"
    }
    response = await async_client.post("/api/auth/login", data=login_data)
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

# Test accessing protected endpoint /users/me
@pytest.mark.asyncio
async def test_get_current_user(async_client, test_user):
    token = create_access_token(data={"sub": test_user.email, "role": test_user.role})
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get("/api/users/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["role"] == UserRole.USER

# Test accessing admin-only endpoint with user token
@pytest.mark.asyncio
async def test_get_all_users_as_user(async_client, test_user):
    token = create_access_token(data={"sub": test_user.email, "role": test_user.role})
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get("/api/users", headers=headers)
    assert response.status_code == 403
    assert "Operation not permitted" in response.json()["detail"]

# Test accessing admin-only endpoint with admin token
@pytest.mark.asyncio
async def test_get_all_users_as_admin(async_client, test_admin, test_user):
    token = create_access_token(data={"sub": test_admin.email, "role": test_admin.role})
    headers = {"Authorization": f"Bearer {token}"}
    response = await async_client.get("/api/users", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2  # Should include test_user and test_admin
    emails = [user["email"] for user in data]
    assert test_admin.email in emails
    assert test_user.email in emails

# Test creating an admin as admin
@pytest.mark.asyncio
async def test_create_admin_as_admin(async_client, test_admin):
    token = create_access_token(data={"sub": test_admin.email, "role": test_admin.role})
    headers = {"Authorization": f"Bearer {token}"}
    admin_data = {
        "email": "newadmin@example.com",
        "password": "newadminpass123",
        "first_name": "New",
        "last_name": "Admin"
    }
    response = await async_client.post("/api/admin/create", json=admin_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == admin_data["email"]
    assert data["role"] == UserRole.ADMIN

# Test creating an admin as regular user
@pytest.mark.asyncio
async def test_create_admin_as_user(async_client, test_user):
    token = create_access_token(data={"sub": test_user.email, "role": test_user.role})
    headers = {"Authorization": f"Bearer {token}"}
    admin_data = {
        "email": "newadmin@example.com",
        "password": "newadminpass123",
        "first_name": "New",
        "last_name": "Admin"
    }
    response = await async_client.post("/api/admin/create", json=admin_data, headers=headers)
    assert response.status_code == 403
    assert "Operation not permitted" in response.json()["detail"]